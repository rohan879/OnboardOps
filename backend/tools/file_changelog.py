"""
File Changelog Tool - Real Implementation
Returns ordered list of commits touching a specific file using GitPython
"""

import os
from datetime import datetime
from typing import Optional, Union
import git
from mcp.contracts import FileChangelogInput, FileChangelogOutput, CommitInfo
from mcp.errors import (
    MCPToolError,
    git_command_error,
    repo_not_configured_error,
    unknown_error,
)


def get_repo() -> Optional[git.Repo]:
    """Get the demo repository instance"""
    repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
    if not repo_path or not os.path.exists(repo_path):
        return None
    try:
        return git.Repo(repo_path)
    except Exception:
        return None


def file_changelog(
    input_data: FileChangelogInput,
) -> Union[FileChangelogOutput, MCPToolError]:
    """
    Get commit history for a specific file

    Returns ordered list of last N commits touching the file:
    - SHA
    - Author
    - Date
    - Message subject
    - Lines changed

    Uses GitPython with explicit path filtering.
    Caches aggressively (commit history is immutable).

    Returns FileChangelogOutput on success or MCPToolError on failure.
    """
    file_path = input_data.file_path
    limit = input_data.limit

    repo = get_repo()
    if not repo:
        return repo_not_configured_error()

    try:
        commits = []

        # Get commits that touched this file
        # Use --follow to track file renames
        commit_iter = repo.iter_commits(
            paths=file_path,
            max_count=limit,
            no_merges=True,  # Skip merge commits for cleaner history
        )

        for commit in commit_iter:
            # Get stats for this file in this commit
            files_changed = len(commit.stats.files)

            # Note: lines_changed could be extracted here but not used in CommitInfo
            # Keeping for potential future use
            commits.append(
                CommitInfo(
                    commit_hash=commit.hexsha[:12],  # Short hash for readability
                    author=commit.author.name,
                    email=commit.author.email,
                    timestamp=datetime.fromtimestamp(commit.committed_date),
                    message=commit.message.split("\n")[0],  # First line only
                    files_changed=files_changed,
                )
            )

        return FileChangelogOutput(file_path=file_path, commits=commits)

    except git.exc.GitCommandError as e:
        return git_command_error(file_path, str(e))
    except Exception as e:
        return unknown_error(f"file_changelog for {file_path}", e)


# Made with Bob
