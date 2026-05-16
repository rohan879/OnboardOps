"""
Allow-List Manager for OnboardOps MCP Server
Loads and enforces resource access restrictions
Hot-reloads on SIGHUP
"""

import os
import yaml
import signal
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import fnmatch
import re
import time


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AllowListViolation(Exception):
    """Raised when a tool call violates the allow-list"""

    pass


class AllowListManager:
    """
    Manages allow-list configuration and enforcement

    Features:
    - Load from .onboardops/allowlist.yaml
    - Validate resource access
    - Hot-reload on SIGHUP
    - Rate limiting per tool
    - Security restrictions
    """

    def __init__(self, config_path: str = ".onboardops/allowlist.yaml"):
        self.config_path = config_path
        self.config: Dict[str, Any] = {}
        self.last_loaded: Optional[datetime] = None
        self._rate_limit_windows: Dict[str, list[float]] = {}

        # Load initial configuration
        self.reload()

        # Set up SIGHUP handler for hot-reload (Unix only)
        if hasattr(signal, "SIGHUP"):
            signal.signal(signal.SIGHUP, self._handle_sighup)

    def _handle_sighup(self, signum, frame):
        """Handle SIGHUP signal for hot-reload"""
        print("[ALLOWLIST] Received SIGHUP, reloading configuration...")
        self.reload()

    def reload(self):
        """Reload configuration from disk"""
        try:
            if not os.path.exists(self.config_path):
                print(
                    f"[ALLOWLIST] Warning: {self.config_path} not found, using permissive defaults"
                )
                self.config = self._get_default_config()
                return

            with open(self.config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)

            self.last_loaded = utc_now()
            print(f"[ALLOWLIST] Loaded configuration from {self.config_path}")

            # Validate configuration
            self._validate_config()

        except Exception as e:
            print(f"[ALLOWLIST] Error loading configuration: {e}")
            print("[ALLOWLIST] Falling back to permissive defaults")
            self.config = self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default permissive configuration"""
        return {
            "version": "1.0",
            "allowed_repositories": ["*"],  # Allow all
            "allowed_github_orgs": ["*"],
            "blocked_paths": [".env*", "*.key", "*.pem", "secrets/*", ".ssh/*"],
            "rate_limits": {},
            "security": {
                "require_auth": False,
                "max_file_size": 1048576,
                "max_changelog_commits": 100,
                "max_search_results": 50,
            },
            "logging": {"log_violations": True, "log_tool_calls": True},
        }

    def _validate_config(self):
        """Validate configuration structure"""
        required_keys = ["version", "allowed_repositories"]
        for key in required_keys:
            if key not in self.config:
                raise ValueError(f"Missing required key in allowlist: {key}")

    def is_repository_allowed(self, repo_identifier: str) -> bool:
        """
        Check if a repository is allowed

        Args:
            repo_identifier: owner/repo or full git URL
        """
        allowed = self.config.get("allowed_repositories", [])

        # Wildcard allows all
        if "*" in allowed:
            return True

        # Normalize identifier
        normalized = repo_identifier.lower()
        if normalized.startswith("https://github.com/"):
            normalized = normalized.replace("https://github.com/", "").replace(
                ".git", ""
            )

        # Check exact match or pattern match
        for allowed_repo in allowed:
            if allowed_repo.lower() == normalized:
                return True
            if fnmatch.fnmatch(normalized, allowed_repo.lower()):
                return True

        return False

    def is_github_org_allowed(self, org: str) -> bool:
        """Check if a GitHub organization is allowed"""
        allowed = self.config.get("allowed_github_orgs", [])

        if "*" in allowed:
            return True

        return org.lower() in [o.lower() for o in allowed]

    def is_path_blocked(self, file_path: str) -> bool:
        """Check if a file path is blocked"""
        blocked = self.config.get("blocked_paths", [])
        normalized = self._normalize_file_path(file_path)

        for pattern in blocked:
            if fnmatch.fnmatch(normalized, pattern):
                return True
            # Also check basename
            if fnmatch.fnmatch(os.path.basename(normalized), pattern):
                return True

        return False

    def _normalize_file_path(self, file_path: str) -> str:
        """Validate and normalize user-provided repo-relative paths."""
        if not isinstance(file_path, str) or not file_path.strip():
            raise AllowListViolation("file_path must be a non-empty string")

        normalized = file_path.replace("\\", "/").strip()
        if (
            os.path.isabs(file_path)
            or normalized.startswith("/")
            or re.match(r"^[A-Za-z]:", normalized)
            or any(part == ".." for part in normalized.split("/"))
        ):
            raise AllowListViolation(
                f"Access to file path '{file_path}' is blocked by allow-list"
            )

        return normalized

    def get_rate_limit(self, tool_name: str) -> Optional[int]:
        """Get rate limit for a tool (calls per minute)"""
        rate_limits = self.config.get("rate_limits", {})
        return rate_limits.get(tool_name)

    def get_security_setting(self, setting: str, default: Any = None) -> Any:
        """Get a security setting"""
        security = self.config.get("security", {})
        return security.get(setting, default)

    def validate_tool_call(self, tool_name: str, arguments: Dict[str, Any]):
        """
        Validate a tool call against the allow-list

        Raises:
            AllowListViolation: If the call violates the allow-list
        """
        # Check file path if present
        if "file_path" in arguments:
            file_path = self._normalize_file_path(arguments["file_path"])
            if self.is_path_blocked(file_path):
                self._log_violation(tool_name, f"Blocked file path: {file_path}")
                raise AllowListViolation(
                    f"Access to file path '{file_path}' is blocked by allow-list"
                )
            arguments["file_path"] = file_path

        # Check repository if present
        if "repository" in arguments:
            repo = arguments["repository"]
            if not self.is_repository_allowed(repo):
                self._log_violation(tool_name, f"Disallowed repository: {repo}")
                raise AllowListViolation(
                    f"Repository '{repo}' is not in the allow-list"
                )

        # Tool-specific validations
        if tool_name in ["pr_for_file", "incident_for_file", "rationale_for_commit"]:
            # These tools use GitHub API - check org
            repo_env = os.getenv("ONBOARDOPS_DEMO_REPO", "")
            if "/" in repo_env:
                org = repo_env.split("/")[0]
                if not self.is_github_org_allowed(org):
                    self._log_violation(tool_name, f"Disallowed GitHub org: {org}")
                raise AllowListViolation(
                    f"GitHub organization '{org}' is not in the allow-list"
                )

        self._enforce_rate_limit(tool_name)

        # Log successful validation if configured
        if self.config.get("logging", {}).get("log_tool_calls", False):
            print(
                f"[ALLOWLIST] Validated: {tool_name} with args {list(arguments.keys())}"
            )

    def _enforce_rate_limit(self, tool_name: str):
        """Apply simple in-process per-tool calls-per-minute rate limits."""
        limit = self.get_rate_limit(tool_name)
        if not limit:
            return

        now = time.monotonic()
        window_start = now - 60
        calls = [
            timestamp
            for timestamp in self._rate_limit_windows.get(tool_name, [])
            if timestamp >= window_start
        ]

        if len(calls) >= limit:
            self._rate_limit_windows[tool_name] = calls
            raise AllowListViolation(
                f"Rate limit exceeded for '{tool_name}' ({limit} calls/minute)"
            )

        calls.append(now)
        self._rate_limit_windows[tool_name] = calls

    def _log_violation(self, tool_name: str, reason: str):
        """Log an allow-list violation"""
        if self.config.get("logging", {}).get("log_violations", True):
            print(f"[ALLOWLIST VIOLATION] Tool: {tool_name}, Reason: {reason}")


# Global allow-list manager instance
allowlist_manager = AllowListManager()


# Made with Bob
