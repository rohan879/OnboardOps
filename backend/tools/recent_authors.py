"""
Recent Authors Tool
Summarizes real author activity from the configured onboarding repository.
"""

import os
from collections import defaultdict
from datetime import datetime, timezone
from typing import Union

import git

from mcp.contracts import AuthorActivity, RecentAuthorsInput, RecentAuthorsOutput
from mcp.errors import MCPToolError, repo_not_configured_error, unknown_error


MAX_COMMITS_TO_SCAN = 2000
BOT_AUTHOR_MARKERS = ("[bot]", "bot@", "github-actions", "dependabot", "renovate")


def is_bot_author(name: str | None, email: str | None = None) -> bool:
    normalized = f"{name or ''} {email or ''}".strip().lower()
    return any(marker in normalized for marker in BOT_AUTHOR_MARKERS)


def get_repo() -> git.Repo | None:
    """Open the configured onboarding repository."""
    repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
    if not repo_path or not os.path.exists(repo_path):
        return None

    return git.Repo(repo_path)


def recent_authors(
    input_data: RecentAuthorsInput,
) -> Union[RecentAuthorsOutput, MCPToolError]:
    """
    Return recent author activity from git history.

    The result is intentionally source-of-truth only: if the onboarding
    repository is not configured or git cannot be read, the tool returns a
    structured MCP error instead of synthetic author data.
    """
    try:
        repo = get_repo()
        if repo is None:
            return repo_not_configured_error()

        since = f"{max(1, input_data.days)} days ago"
        stats: dict[str, dict[str, object]] = defaultdict(
            lambda: {
                "name": "",
                "email": "",
                "commit_count": 0,
                "files_touched": set(),
                "last_commit": None,
            }
        )

        for commit in repo.iter_commits(
            paths=input_data.file_path,
            since=since,
            max_count=MAX_COMMITS_TO_SCAN,
        ):
            email = commit.author.email or "unknown"
            key = email.lower()
            entry = stats[key]
            entry["name"] = commit.author.name or email
            entry["email"] = email
            entry["commit_count"] = int(entry["commit_count"]) + 1

            files_touched = entry["files_touched"]
            if isinstance(files_touched, set):
                if input_data.file_path:
                    files_touched.add(input_data.file_path)
                else:
                    files_touched.update(commit.stats.files.keys())

            committed_at = datetime.fromtimestamp(
                commit.committed_date, tz=timezone.utc
            )
            last_commit = entry["last_commit"]
            if not isinstance(last_commit, datetime) or committed_at > last_commit:
                entry["last_commit"] = committed_at

        ranked_authors = sorted(
            stats.values(),
            key=lambda item: (
                int(item["commit_count"]),
                item["last_commit"]
                if isinstance(item["last_commit"], datetime)
                else datetime.min.replace(tzinfo=timezone.utc),
            ),
            reverse=True,
        )
        human_authors = [
            author
            for author in ranked_authors
            if not is_bot_author(str(author["name"]), str(author["email"]))
        ]
        authors = (human_authors or ranked_authors)[: max(0, input_data.limit)]

        return RecentAuthorsOutput(
            authors=[
                AuthorActivity(
                    name=str(author["name"]),
                    email=str(author["email"]),
                    commit_count=int(author["commit_count"]),
                    files_touched=len(author["files_touched"])
                    if isinstance(author["files_touched"], set)
                    else 0,
                    last_commit=author["last_commit"]
                    if isinstance(author["last_commit"], datetime)
                    else datetime.now(timezone.utc),
                )
                for author in authors
            ],
            date_range_days=input_data.days,
        )
    except Exception as exc:
        return unknown_error("recent_authors", exc)


# Made with Bob
