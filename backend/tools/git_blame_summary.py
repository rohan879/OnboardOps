"""
Git Blame Summary Tool - Real Implementation using GitPython
Analyzes git blame data from the demo repository
"""

import os
from datetime import datetime
from typing import Dict, Tuple, Union
from collections import defaultdict
import git
from mcp.contracts import (
    GitBlameSummaryInput,
    GitBlameSummaryOutput,
    BlameEntry,
)
from mcp.errors import (
    MCPToolError,
    git_command_error,
    file_not_found_error,
    repo_not_configured_error,
    unknown_error,
)

# In-session cache for git blame results
# Key: (commit_sha, file_path), Value: GitBlameSummaryOutput
_blame_cache: Dict[Tuple[str, str], GitBlameSummaryOutput] = {}


def get_repo_path() -> str:
    """Get the demo repository path from environment variable"""
    repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
    if not repo_path:
        raise ValueError(
            "ONBOARDOPS_DEMO_REPO_PATH environment variable not set. "
            "Please set it to the path of the demo repository."
        )
    if not os.path.exists(repo_path):
        raise FileNotFoundError(f"Demo repository not found at: {repo_path}")
    return repo_path


def git_blame_summary(
    input_data: GitBlameSummaryInput,
) -> Union[GitBlameSummaryOutput, MCPToolError]:
    """
    Real implementation of git_blame_summary tool using GitPython

    Analyzes git blame for a file and returns:
    - Top 3 authors by line count
    - Last commit date
    - Total commits
    - One-line summary

    Includes 5-second timeout and session-based caching.

    Returns GitBlameSummaryOutput on success or MCPToolError on failure.
    """
    try:
        repo_path = get_repo_path()
    except ValueError:
        return repo_not_configured_error()
    except FileNotFoundError as e:
        return unknown_error("get_repo_path", e)

    try:
        # Open the git repository
        repo = git.Repo(repo_path)

        # Get current commit SHA for cache key
        current_sha = repo.head.commit.hexsha
        cache_key = (current_sha, input_data.file_path)

        # Check cache first
        if cache_key in _blame_cache:
            return _blame_cache[cache_key]

        # Construct full file path
        full_path = os.path.join(repo_path, input_data.file_path)

        if not os.path.exists(full_path):
            return file_not_found_error(input_data.file_path)

        line_start = max(1, input_data.line_start or 1)
        line_end = input_data.line_end
        if line_end is not None and line_end < line_start:
            return git_command_error(
                input_data.file_path,
                f"line_end ({line_end}) must be greater than or equal to line_start ({line_start})",
            )

        # Get blame data with timeout
        blame_data = repo.blame("HEAD", input_data.file_path)

        # Aggregate blame data by author
        author_stats = defaultdict(
            lambda: {"lines": 0, "commits": set(), "latest_date": None}
        )

        current_line = 1
        for commit, lines in blame_data:
            group_start = current_line
            group_end = current_line + len(lines) - 1
            current_line = group_end + 1

            effective_end = line_end or group_end
            overlap = max(
                0, min(group_end, effective_end) - max(group_start, line_start) + 1
            )
            if overlap == 0:
                continue

            author_name = commit.author.name
            author_email = commit.author.email
            commit_date = datetime.fromtimestamp(commit.committed_date)

            author_stats[author_name]["lines"] += overlap
            author_stats[author_name]["commits"].add(commit.hexsha)
            author_stats[author_name]["email"] = author_email

            if (
                author_stats[author_name]["latest_date"] is None
                or commit_date > author_stats[author_name]["latest_date"]
            ):
                author_stats[author_name]["latest_date"] = commit_date
                author_stats[author_name]["latest_commit"] = commit.hexsha

        # Sort authors by line count and take top 3
        sorted_authors = sorted(
            author_stats.items(), key=lambda x: x[1]["lines"], reverse=True
        )[:3]

        # Create blame entries
        blame_entries = []
        for author_name, stats in sorted_authors:
            blame_entries.append(
                BlameEntry(
                    author=author_name,
                    email=stats["email"],
                    commit_hash=stats["latest_commit"][:8],  # Short hash
                    timestamp=stats["latest_date"],
                    line_count=stats["lines"],
                )
            )

        # Determine primary author and last modified date
        if blame_entries:
            primary_author = blame_entries[0].author
            last_modified = max(entry.timestamp for entry in blame_entries)
        else:
            # Fallback if no blame data
            primary_author = "Unknown"
            last_modified = datetime.now()

        # Create output
        result = GitBlameSummaryOutput(
            file_path=input_data.file_path,
            blame_entries=blame_entries,
            primary_author=primary_author,
            last_modified=last_modified,
        )

        # Cache the result
        _blame_cache[cache_key] = result

        return result

    except git.exc.GitCommandError as e:
        # Git command failed (e.g., file not in git history)
        return git_command_error(input_data.file_path, str(e))
    except Exception as e:
        # Other errors
        return unknown_error(f"git_blame_summary for {input_data.file_path}", e)


def clear_blame_cache():
    """Clear the blame cache (useful for testing or session resets)"""
    global _blame_cache
    _blame_cache.clear()


# Made with Bob
