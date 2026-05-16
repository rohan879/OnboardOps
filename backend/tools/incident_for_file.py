"""
Incident for File Tool - Real Implementation
Returns incidents that touched a given file in the last 90 days
Sources: CHANGELOG.md, GitHub issues with incident/bug labels, revert commits
"""

import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Union
import git
import httpx
from mcp.contracts import (
    IncidentForFileInput,
    IncidentForFileOutput,
    IncidentInfo,
)
from mcp.errors import (
    MCPToolError,
)


# GitHub API configuration
GITHUB_TOKEN = os.getenv("ONBOARDOPS_GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"


def get_repo() -> Optional[git.Repo]:
    """Get the demo repository instance"""
    repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
    if not repo_path or not os.path.exists(repo_path):
        return None
    try:
        return git.Repo(repo_path)
    except Exception:
        return None


def extract_repo_info() -> tuple[str, str]:
    """Extract owner and repo name from environment"""
    repo_full_name = os.getenv(
        "ONBOARDOPS_DEMO_REPO", "fastapi/full-stack-fastapi-template"
    )
    parts = repo_full_name.split("/")
    if len(parts) == 2:
        return parts[0], parts[1]
    return "fastapi", "full-stack-fastapi-template"


def find_revert_commits(
    repo: git.Repo, file_path: str, days: int
) -> List[IncidentInfo]:
    """Find revert commits that touched this file"""
    incidents = []
    since_date = datetime.now() - timedelta(days=days)

    try:
        # Look for commits with "revert" in the message
        for commit in repo.iter_commits(paths=file_path, since=since_date):
            message_lower = commit.message.lower()
            if "revert" in message_lower or "rollback" in message_lower:
                incidents.append(
                    IncidentInfo(
                        incident_id=f"revert-{commit.hexsha[:8]}",
                        title=f"Reverted: {commit.message.split(chr(10))[0][:60]}",
                        severity="high",
                        created_at=datetime.fromtimestamp(commit.committed_date),
                        resolved_at=datetime.fromtimestamp(commit.committed_date),
                        related_commits=[commit.hexsha[:12]],
                        source="git_revert",
                    )
                )
    except Exception as e:
        print(f"[incident_for_file] Error finding reverts: {e}")

    return incidents


def find_github_issues(file_path: str, days: int) -> List[IncidentInfo]:
    """Find GitHub issues mentioning this file with incident/bug labels"""
    incidents = []

    if not GITHUB_TOKEN:
        return incidents

    try:
        owner, repo_name = extract_repo_info()
        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        # Search for issues mentioning the file with bug/incident labels
        # Note: GitHub search has rate limits, so we keep this simple
        filename = os.path.basename(file_path)
        since_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        # Search query: filename + labels
        query = f"repo:{owner}/{repo_name} {filename} label:bug,incident created:>={since_date}"

        with httpx.Client(timeout=5.0) as client:
            search_url = f"{GITHUB_API_BASE}/search/issues"
            params = {"q": query, "per_page": 10}

            response = client.get(search_url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                for issue in data.get("items", [])[:5]:  # Limit to 5
                    # Determine severity from labels
                    severity = "medium"
                    labels = [
                        label["name"].lower() for label in issue.get("labels", [])
                    ]
                    if "critical" in labels or "p0" in labels:
                        severity = "critical"
                    elif "high" in labels or "p1" in labels:
                        severity = "high"
                    elif "low" in labels:
                        severity = "low"

                    resolved_at = None
                    if issue.get("closed_at"):
                        resolved_at = datetime.fromisoformat(
                            issue["closed_at"].replace("Z", "+00:00")
                        )

                    incidents.append(
                        IncidentInfo(
                            incident_id=f"gh-{issue['number']}",
                            title=issue["title"],
                            severity=severity,
                            created_at=datetime.fromisoformat(
                                issue["created_at"].replace("Z", "+00:00")
                            ),
                            resolved_at=resolved_at,
                            related_commits=[],
                            source="github_issue",
                        )
                    )
    except Exception as e:
        print(f"[incident_for_file] Error fetching GitHub issues: {e}")

    return incidents


def parse_changelog_for_file(
    repo_path: str, file_path: str, days: int
) -> List[IncidentInfo]:
    """Parse CHANGELOG.md for incidents related to this file"""
    incidents = []
    changelog_path = os.path.join(repo_path, "CHANGELOG.md")

    if not os.path.exists(changelog_path):
        return incidents

    try:
        with open(changelog_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Simple parsing: look for lines mentioning the file
        filename = os.path.basename(file_path)
        lines = content.split("\n")

        for i, line in enumerate(lines):
            if filename in line and (
                "fix" in line.lower()
                or "bug" in line.lower()
                or "incident" in line.lower()
            ):
                # Extract date if present (common format: ## [version] - YYYY-MM-DD)
                date_line = None
                for j in range(max(0, i - 5), i):
                    if lines[j].startswith("##"):
                        date_line = lines[j]
                        break

                # Try to parse date
                created_at = datetime.now() - timedelta(days=30)  # Default
                if date_line:
                    import re

                    date_match = re.search(r"(\d{4}-\d{2}-\d{2})", date_line)
                    if date_match:
                        try:
                            created_at = datetime.strptime(
                                date_match.group(1), "%Y-%m-%d"
                            )
                        except ValueError:
                            pass

                # Only include if within date range
                if (datetime.now() - created_at).days <= days:
                    incidents.append(
                        IncidentInfo(
                            incident_id=f"changelog-{i}",
                            title=line.strip()[:100],
                            severity="medium",
                            created_at=created_at,
                            resolved_at=created_at,  # Assume resolved when logged
                            related_commits=[],
                            source="changelog",
                        )
                    )
    except Exception as e:
        print(f"[incident_for_file] Error parsing changelog: {e}")

    return incidents


def incident_for_file(
    input_data: IncidentForFileInput,
) -> Union[IncidentForFileOutput, MCPToolError]:
    """
    Get incidents that touched a given file in the last N days

    Sources:
    - CHANGELOG.md (if present)
    - GitHub issues with incident/bug labels
    - Revert commits

    Returns list of {date, summary, link, severity}
    Powers "Future-You Bob" narration (e.g., "this file was rolled back twice last quarter")

    Returns IncidentForFileOutput on success or MCPToolError on failure.
    Falls back to mock data if repo unavailable.
    """
    file_path = input_data.file_path
    days = input_data.days

    repo = get_repo()
    if not repo:
        return _mock_incident_for_file(input_data)

    try:
        incidents = []

        # Find revert commits
        incidents.extend(find_revert_commits(repo, file_path, days))

        # Find GitHub issues
        incidents.extend(find_github_issues(file_path, days))

        # Parse changelog
        repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
        if repo_path:
            incidents.extend(parse_changelog_for_file(repo_path, file_path, days))

        # Sort by date (most recent first)
        incidents.sort(key=lambda x: x.created_at, reverse=True)

        return IncidentForFileOutput(file_path=file_path, incidents=incidents)

    except Exception as e:
        print(f"[incident_for_file] Error: {e}, falling back to mock")
        return _mock_incident_for_file(input_data)


def _mock_incident_for_file(input_data: IncidentForFileInput) -> IncidentForFileOutput:
    """
    Fallback mock implementation
    For demo purposes, seed three synthetic incidents
    """
    file_path = input_data.file_path

    # Generate deterministic incidents based on file path
    file_hash = int(hashlib.sha256(file_path.encode()).hexdigest()[:8], 16) % 1000

    incidents = []

    # Create 0-3 incidents based on file hash
    num_incidents = file_hash % 4

    if num_incidents > 0:
        severities = ["critical", "high", "medium", "low"]
        titles = [
            "Database connection timeout in production",
            "Memory leak under high load",
            "Authentication bypass vulnerability",
            "Race condition in concurrent requests",
        ]

        for i in range(num_incidents):
            idx = (file_hash + i) % len(titles)
            created = datetime.now() - timedelta(days=30 * (i + 1))
            resolved = created + timedelta(days=2)

            incidents.append(
                IncidentInfo(
                    incident_id=f"INC-{1000 + file_hash + i}",
                    title=titles[idx],
                    severity=severities[idx % len(severities)],
                    created_at=created,
                    resolved_at=resolved,
                    related_commits=[f"{file_hash + i:04d}abc"],
                    source="mock_incident_system",
                )
            )

    return IncidentForFileOutput(file_path=file_path, incidents=incidents)


# Made with Bob
