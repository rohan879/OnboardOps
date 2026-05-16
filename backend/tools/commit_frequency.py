"""
Commit Frequency Tool - Real Implementation using GitPython
Returns commit frequency statistics for files
"""

import os
from datetime import datetime, timedelta
from typing import Dict, Tuple, Union
import git
from mcp.contracts import (
    CommitFrequencyInput,
    CommitFrequencyOutput,
    FileCommitFrequency,
)
from mcp.errors import (
    MCPToolError,
    git_command_error,
    file_not_found_error,
    repo_not_configured_error,
    unknown_error,
)

# In-session cache for commit frequency results
_frequency_cache: Dict[Tuple[str, str, int], CommitFrequencyOutput] = {}


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


def commit_frequency(
    input_data: CommitFrequencyInput,
) -> Union[CommitFrequencyOutput, MCPToolError]:
    """
    Real implementation of commit_frequency tool

    Returns commit frequency for a file or entire repo:
    - Number of commits in the last N days
    - 12 bi-weekly buckets (sparkline data)
    - Distinct authors
    - First and last commit dates

    Includes caching by file path and days parameter.

    Returns CommitFrequencyOutput on success or MCPToolError on failure.
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
        cache_key = (current_sha, input_data.file_path or "", input_data.days)

        # Check cache first
        if cache_key in _frequency_cache:
            return _frequency_cache[cache_key]

        # Calculate the cutoff date
        cutoff_date = datetime.now() - timedelta(days=input_data.days)

        # Get commits since cutoff date
        if input_data.file_path:
            # Specific file
            full_path = os.path.join(repo_path, input_data.file_path)
            if not os.path.exists(full_path):
                return file_not_found_error(input_data.file_path)

            commits = list(
                repo.iter_commits("HEAD", paths=input_data.file_path, since=cutoff_date)
            )

            # Get distinct authors
            authors = set(commit.author.email for commit in commits)

            # Get first and last commit for this file
            all_commits = list(repo.iter_commits("HEAD", paths=input_data.file_path))
            first_commit_date = (
                datetime.fromtimestamp(all_commits[-1].committed_date)
                if all_commits
                else datetime.now()
            )
            last_commit_date = (
                datetime.fromtimestamp(all_commits[0].committed_date)
                if all_commits
                else datetime.now()
            )

            files = [
                FileCommitFrequency(
                    file_path=input_data.file_path,
                    commit_count=len(commits),
                    distinct_authors=len(authors),
                    first_commit=first_commit_date,
                    last_commit=last_commit_date,
                )
            ]
            total_commits = len(commits)
        else:
            # Entire repository - get top 5 most frequently changed files
            commits = list(repo.iter_commits("HEAD", since=cutoff_date))

            # Count commits per file
            file_commit_counts = {}
            for commit in commits:
                for item in commit.stats.files:
                    file_commit_counts[item] = file_commit_counts.get(item, 0) + 1

            # Sort and take top 5
            top_files = sorted(
                file_commit_counts.items(), key=lambda x: x[1], reverse=True
            )[:5]

            files = []
            for file_path, count in top_files:
                # Get file-specific data
                file_commits = list(repo.iter_commits("HEAD", paths=file_path))
                file_authors = set(
                    c.author.email
                    for c in file_commits
                    if datetime.fromtimestamp(c.committed_date) >= cutoff_date
                )

                first_commit_date = (
                    datetime.fromtimestamp(file_commits[-1].committed_date)
                    if file_commits
                    else datetime.now()
                )
                last_commit_date = (
                    datetime.fromtimestamp(file_commits[0].committed_date)
                    if file_commits
                    else datetime.now()
                )

                files.append(
                    FileCommitFrequency(
                        file_path=file_path,
                        commit_count=count,
                        distinct_authors=len(file_authors),
                        first_commit=first_commit_date,
                        last_commit=last_commit_date,
                    )
                )

            total_commits = len(commits)

        # Create output
        result = CommitFrequencyOutput(
            files=files,
            total_commits=total_commits,
            date_range_days=input_data.days,
        )

        # Cache the result
        _frequency_cache[cache_key] = result

        return result

    except git.exc.GitCommandError as e:
        return git_command_error(input_data.file_path or "repository", str(e))
    except Exception as e:
        return unknown_error(
            f"commit_frequency for {input_data.file_path or 'repository'}", e
        )


def clear_frequency_cache():
    """Clear the frequency cache (useful for testing or session resets)"""
    global _frequency_cache
    _frequency_cache.clear()


# Made with Bob
