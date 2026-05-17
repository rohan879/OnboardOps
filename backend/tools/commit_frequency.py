"""
Commit Frequency Tool - Real Implementation using GitPython
Returns commit frequency statistics for files
"""

import os
import re
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Tuple, Union
import git
import httpx
from mcp.contracts import (
    CommitFrequencyInput,
    CommitFrequencyOutput,
    FileCommitFrequency,
)
from mcp.errors import (
    MCPToolError,
    git_command_error,
    file_not_found_error,
    network_error,
    rate_limit_error,
    repo_not_configured_error,
    timeout_error,
    unknown_error,
)

# In-session cache for commit frequency results
_frequency_cache: Dict[Tuple[str, str, int], CommitFrequencyOutput] = {}
GITHUB_TOKEN = os.getenv("ONBOARDOPS_GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"
GIT_LOG_TIMEOUT_SECONDS = 25
GIT_LOG_MAX_COMMITS = 5000
GIT_LOG_MARKER = "__ONBOARDOPS_COMMIT__"


def _commit_buckets(commits, cutoff_date: datetime, days: int, bucket_count: int = 12):
    """Return chronological commit counts split into fixed-width time buckets."""
    buckets = [0] * bucket_count
    if days <= 0 or bucket_count <= 0:
        return buckets

    bucket_seconds = (days * 24 * 60 * 60) / bucket_count
    if bucket_seconds <= 0:
        return buckets

    for commit in commits:
        committed_at = datetime.fromtimestamp(commit.committed_date)
        if committed_at < cutoff_date:
            continue

        offset_seconds = (committed_at - cutoff_date).total_seconds()
        bucket_index = int(offset_seconds // bucket_seconds)
        bucket_index = max(0, min(bucket_count - 1, bucket_index))
        buckets[bucket_index] += 1

    return buckets


def _date_buckets(dates: list[datetime], cutoff_date: datetime, days: int):
    class DateCommit:
        def __init__(self, committed_at: datetime):
            self.committed_date = int(committed_at.timestamp())

    return _commit_buckets(
        [DateCommit(committed_at) for committed_at in dates], cutoff_date, days
    )


def _run_git_log(
    repo_path: str, days: int, file_path: str | None = None
) -> tuple[int, dict[str, dict[str, object]]]:
    """Read recent file activity with one native git process."""
    command = [
        "git",
        "-C",
        repo_path,
        "log",
        f"--since={days} days ago",
        f"--max-count={GIT_LOG_MAX_COMMITS}",
        "--name-only",
        f"--pretty=format:{GIT_LOG_MARKER}%x1f%H%x1f%an%x1f%ae%x1f%ct",
    ]
    if file_path:
        command.extend(["--", file_path])

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=GIT_LOG_TIMEOUT_SECONDS,
        check=True,
        encoding="utf-8",
        errors="replace",
    )

    current_author = "unknown"
    current_date = datetime.now()
    total_commits = 0
    activity: dict[str, dict[str, object]] = {}

    for raw_line in completed.stdout.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if line.startswith(GIT_LOG_MARKER):
            total_commits += 1
            parts = line.split("\x1f")
            current_author = parts[3] if len(parts) > 3 and parts[3] else parts[2]
            timestamp = int(parts[4]) if len(parts) > 4 and parts[4].isdigit() else 0
            current_date = (
                datetime.fromtimestamp(timestamp) if timestamp else datetime.now()
            )
            continue

        file_activity = activity.setdefault(
            line, {"count": 0, "authors": set(), "dates": []}
        )
        file_activity["count"] = int(file_activity["count"]) + 1
        file_activity["authors"].add(current_author)
        file_activity["dates"].append(current_date)

    return total_commits, activity


def _file_frequency_from_activity(
    file_path: str, activity: dict[str, object], cutoff_date: datetime, days: int
) -> FileCommitFrequency:
    dates = activity["dates"]
    authors = activity["authors"]

    return FileCommitFrequency(
        file_path=file_path,
        commit_count=int(activity["count"]),
        distinct_authors=len(authors),
        first_commit=min(dates) if dates else datetime.now(),
        last_commit=max(dates) if dates else datetime.now(),
        commit_frequency=_date_buckets(dates, cutoff_date, days),
    )


def _extract_repo_info(repository: str | None) -> tuple[str, str] | None:
    if not repository:
        return None

    candidate = repository.strip()
    match = re.search(
        r"github\.com[:/](?P<owner>[^/\s]+)/(?P<repo>[^/\s]+?)(?:\.git)?/?$",
        candidate,
    )
    if match:
        return match.group("owner"), match.group("repo")

    parts = candidate.removesuffix(".git").split("/")
    if len(parts) == 2 and all(parts):
        return parts[0], parts[1]

    return None


def _github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def _parse_github_commit_date(commit: dict) -> datetime:
    raw_date = (
        commit.get("commit", {})
        .get("author", {})
        .get("date", datetime.now().isoformat())
    )
    return datetime.fromisoformat(raw_date.replace("Z", "+00:00")).replace(tzinfo=None)


def _github_author_key(commit: dict) -> str:
    author = commit.get("author") or {}
    commit_author = commit.get("commit", {}).get("author", {})
    return (
        author.get("login")
        or commit_author.get("email")
        or commit_author.get("name")
        or "unknown"
    )


def _commit_frequency_from_github(
    input_data: CommitFrequencyInput,
) -> Union[CommitFrequencyOutput, MCPToolError]:
    repo_info = _extract_repo_info(input_data.repository)
    if not repo_info:
        return repo_not_configured_error()

    owner, repo_name = repo_info
    cutoff_date = datetime.now() - timedelta(days=input_data.days)
    headers = _github_headers()

    try:
        with httpx.Client(timeout=8.0) as client:
            commits_response = client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo_name}/commits",
                headers=headers,
                params={
                    "since": cutoff_date.isoformat() + "Z",
                    "per_page": 100 if input_data.file_path else 30,
                    **({"path": input_data.file_path} if input_data.file_path else {}),
                },
            )

            if commits_response.status_code == 403:
                remaining = commits_response.headers.get("X-RateLimit-Remaining", "1")
                if remaining == "0":
                    retry_after = commits_response.headers.get("X-RateLimit-Reset")
                    return rate_limit_error(int(retry_after) if retry_after else None)

            if commits_response.status_code != 200:
                return network_error(
                    f"GitHub commit lookup for {owner}/{repo_name}",
                    f"HTTP {commits_response.status_code}",
                )

            commits = commits_response.json()

            if input_data.file_path:
                dates = [_parse_github_commit_date(commit) for commit in commits]
                authors = {_github_author_key(commit) for commit in commits}
                first_commit = min(dates) if dates else datetime.now()
                last_commit = max(dates) if dates else datetime.now()
                file_result = FileCommitFrequency(
                    file_path=input_data.file_path,
                    commit_count=len(commits),
                    distinct_authors=len(authors),
                    first_commit=first_commit,
                    last_commit=last_commit,
                    commit_frequency=_date_buckets(
                        dates, cutoff_date, input_data.days
                    ),
                )
                return CommitFrequencyOutput(
                    files=[file_result],
                    total_commits=len(commits),
                    date_range_days=input_data.days,
                )

            file_activity: dict[str, dict[str, object]] = {}
            for commit in commits:
                detail_response = client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo_name}/commits/{commit['sha']}",
                    headers=headers,
                )
                if detail_response.status_code != 200:
                    continue

                detail = detail_response.json()
                committed_at = _parse_github_commit_date(detail)
                author = _github_author_key(detail)
                for file_info in detail.get("files", []):
                    file_path = file_info.get("filename")
                    if not file_path:
                        continue

                    activity = file_activity.setdefault(
                        file_path,
                        {"dates": [], "authors": set(), "count": 0},
                    )
                    activity["count"] = int(activity["count"]) + 1
                    activity["dates"].append(committed_at)
                    activity["authors"].add(author)

            files = []
            for file_path, activity in sorted(
                file_activity.items(),
                key=lambda item: int(item[1]["count"]),
                reverse=True,
            )[:5]:
                dates = activity["dates"]
                authors = activity["authors"]
                files.append(
                    FileCommitFrequency(
                        file_path=file_path,
                        commit_count=int(activity["count"]),
                        distinct_authors=len(authors),
                        first_commit=min(dates) if dates else datetime.now(),
                        last_commit=max(dates) if dates else datetime.now(),
                        commit_frequency=_date_buckets(
                            dates, cutoff_date, input_data.days
                        ),
                    )
                )

            return CommitFrequencyOutput(
                files=files,
                total_commits=len(commits),
                date_range_days=input_data.days,
            )
    except httpx.TimeoutException:
        return timeout_error(f"GitHub commit lookup for {owner}/{repo_name}", 8)
    except httpx.NetworkError as error:
        return network_error(f"GitHub commit lookup for {owner}/{repo_name}", str(error))


def get_repo_path(repo_path_override: str | None = None) -> str:
    """Get the demo repository path from environment variable"""
    repo_path = repo_path_override or os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
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
        repo_path = get_repo_path(input_data.repo_path)
    except ValueError:
        if input_data.repository:
            return _commit_frequency_from_github(input_data)
        return repo_not_configured_error()
    except FileNotFoundError as e:
        if input_data.repository:
            return _commit_frequency_from_github(input_data)
        return unknown_error("get_repo_path", e)

    try:
        # Get current commit SHA for cache key
        current_sha = subprocess.run(
            ["git", "-C", repo_path, "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        ).stdout.strip()
        cache_key = (current_sha, input_data.file_path or "", input_data.days)

        # Check cache first
        if cache_key in _frequency_cache:
            return _frequency_cache[cache_key]

        # Calculate the cutoff date
        cutoff_date = datetime.now() - timedelta(days=input_data.days)

        total_commits, activity = _run_git_log(
            repo_path, input_data.days, input_data.file_path
        )

        if input_data.file_path:
            full_path = os.path.join(repo_path, input_data.file_path)
            if not os.path.exists(full_path):
                return file_not_found_error(input_data.file_path)

            file_activity = activity.get(
                input_data.file_path,
                {"count": 0, "authors": set(), "dates": []},
            )
            files = [
                _file_frequency_from_activity(
                    input_data.file_path, file_activity, cutoff_date, input_data.days
                )
            ]
        else:
            top_files = sorted(
                activity.items(),
                key=lambda item: int(item[1]["count"]),
                reverse=True,
            )[:5]

            files = [
                _file_frequency_from_activity(
                    file_path, file_activity, cutoff_date, input_data.days
                )
                for file_path, file_activity in top_files
            ]

        # Create output
        result = CommitFrequencyOutput(
            files=files,
            total_commits=total_commits,
            date_range_days=input_data.days,
        )

        # Cache the result
        _frequency_cache[cache_key] = result

        return result

    except subprocess.TimeoutExpired:
        return timeout_error(
            f"commit_frequency for {input_data.file_path or 'repository'}",
            GIT_LOG_TIMEOUT_SECONDS,
        )
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.strip() if e.stderr else str(e)
        return git_command_error(input_data.file_path or "repository", stderr)
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
