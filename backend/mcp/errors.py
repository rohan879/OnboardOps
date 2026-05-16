"""
MCP Tool Error Types for OnboardOps
Structured error responses for graceful degradation
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel


class MCPToolError(BaseModel):
    """
    Structured error response for MCP tool failures

    Allows Bob's cartography skill to degrade gracefully when tools fail.
    All errors include a retryable flag to guide retry logic.
    """

    error_code: str
    message: str
    retryable: bool
    details: Optional[Dict[str, Any]] = None


# Error code constants
ERROR_GIT_COMMAND = "GIT_COMMAND_ERROR"
ERROR_FILE_NOT_FOUND = "FILE_NOT_FOUND"
ERROR_NETWORK = "NETWORK_ERROR"
ERROR_RATE_LIMIT = "RATE_LIMIT"
ERROR_TIMEOUT = "TIMEOUT"
ERROR_UNKNOWN = "UNKNOWN_ERROR"
ERROR_REPO_NOT_CONFIGURED = "REPO_NOT_CONFIGURED"


def git_command_error(file_path: str, git_error: str) -> MCPToolError:
    """Git command failed (e.g., file not in git history)"""
    return MCPToolError(
        error_code=ERROR_GIT_COMMAND,
        message=f"Git operation failed for {file_path}",
        retryable=True,
        details={"file_path": file_path, "git_error": str(git_error)},
    )


def file_not_found_error(file_path: str) -> MCPToolError:
    """File does not exist in the repository"""
    return MCPToolError(
        error_code=ERROR_FILE_NOT_FOUND,
        message=f"File not found: {file_path}",
        retryable=False,
        details={"file_path": file_path},
    )


def network_error(operation: str, error: str) -> MCPToolError:
    """Network operation failed (e.g., GitHub API unreachable)"""
    return MCPToolError(
        error_code=ERROR_NETWORK,
        message=f"Network error during {operation}",
        retryable=True,
        details={"operation": operation, "error": str(error)},
    )


def rate_limit_error(retry_after: Optional[int] = None) -> MCPToolError:
    """GitHub API rate limit exceeded"""
    details = {}
    if retry_after:
        details["retry_after_seconds"] = retry_after

    return MCPToolError(
        error_code=ERROR_RATE_LIMIT,
        message="GitHub API rate limit exceeded",
        retryable=True,
        details=details if details else None,
    )


def timeout_error(operation: str, timeout_seconds: int) -> MCPToolError:
    """Operation exceeded timeout"""
    return MCPToolError(
        error_code=ERROR_TIMEOUT,
        message=f"Operation timed out after {timeout_seconds}s: {operation}",
        retryable=True,
        details={"operation": operation, "timeout_seconds": timeout_seconds},
    )


def unknown_error(operation: str, error: Exception) -> MCPToolError:
    """Unexpected error occurred"""
    return MCPToolError(
        error_code=ERROR_UNKNOWN,
        message=f"Unexpected error during {operation}: {type(error).__name__}",
        retryable=False,
        details={
            "operation": operation,
            "error_type": type(error).__name__,
            "error": str(error),
        },
    )


def repo_not_configured_error() -> MCPToolError:
    """Demo repository path not configured"""
    return MCPToolError(
        error_code=ERROR_REPO_NOT_CONFIGURED,
        message="ONBOARDOPS_DEMO_REPO_PATH environment variable not set",
        retryable=False,
        details={"env_var": "ONBOARDOPS_DEMO_REPO_PATH"},
    )


# Made with Bob
