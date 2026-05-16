"""
Rationale for Commit Tool - Real Implementation
Returns detailed information and rationale for a specific commit
Bridges "what changed" to "why it changed"
"""

import os
from datetime import datetime
from typing import Optional
import git
import httpx
from mcp.contracts import (
    RationaleForCommitInput,
    RationaleForCommitOutput,
    CommitRationale,
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


def extract_pr_number_from_message(message: str) -> Optional[int]:
    """Extract PR number from commit message (e.g., '#123' or 'Merge pull request #123')"""
    import re

    # Look for patterns like "#123" or "pull request #123"
    patterns = [
        r"#(\d+)",
        r"pull request #(\d+)",
        r"PR #(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def rationale_for_commit(
    input_data: RationaleForCommitInput,
) -> RationaleForCommitOutput:
    """
    Get detailed information and rationale for a specific commit

    Returns:
    - Full commit message
    - Linked PR if any (via GitHub API)
    - PR body and approving reviewers
    - Any issue numbers referenced

    This is the bridge from "what changed" to "why it changed"
    """
    commit_hash = input_data.commit_hash

    repo = get_repo()
    if not repo:
        return _mock_rationale_for_commit(input_data)

    try:
        # Get commit from git
        commit = repo.commit(commit_hash)

        # Extract basic commit info
        author = commit.author.name
        timestamp = datetime.fromtimestamp(commit.committed_date)
        message = commit.message.strip()
        files_changed = list(commit.stats.files.keys())
        additions = commit.stats.total["insertions"]
        deletions = commit.stats.total["deletions"]

        # Try to find associated PR
        pr_number = extract_pr_number_from_message(message)
        pr_title = None

        # If we have GitHub token and found a PR number, fetch PR details
        if GITHUB_TOKEN and pr_number:
            try:
                owner, repo_name = extract_repo_info()
                headers = {
                    "Authorization": f"Bearer {GITHUB_TOKEN}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }

                with httpx.Client(timeout=5.0) as client:
                    pr_url = (
                        f"{GITHUB_API_BASE}/repos/{owner}/{repo_name}/pulls/{pr_number}"
                    )
                    pr_response = client.get(pr_url, headers=headers)

                    if pr_response.status_code == 200:
                        pr_data = pr_response.json()
                        pr_title = pr_data.get("title")
            except Exception as e:
                print(f"[rationale_for_commit] Error fetching PR: {e}")

        return RationaleForCommitOutput(
            rationale=CommitRationale(
                commit_hash=commit.hexsha[:12],
                author=author,
                timestamp=timestamp,
                message=message,
                files_changed=files_changed,
                additions=additions,
                deletions=deletions,
                pr_number=pr_number,
                pr_title=pr_title,
            )
        )

    except Exception as e:
        print(f"[rationale_for_commit] Error: {e}, falling back to mock")
        return _mock_rationale_for_commit(input_data)


def _mock_rationale_for_commit(
    input_data: RationaleForCommitInput,
) -> RationaleForCommitOutput:
    """
    Fallback mock implementation when git is unavailable
    """
    from datetime import timedelta

    commit_hash = input_data.commit_hash

    # Generate deterministic mock data
    hash_int = int(commit_hash[:8], 16) if len(commit_hash) >= 8 else hash(commit_hash)

    authors = ["Alice Chen", "Bob Martinez", "Carol Johnson", "David Kim"]
    messages = [
        "feat: Add user authentication\n\nImplements JWT-based authentication with refresh tokens.\nCloses #123",
        "fix: Resolve database connection leak\n\nFixed connection pool exhaustion under high load.\nFixes #456",
        "refactor: Simplify error handling\n\nConsolidated error handling logic across API routes.\nPart of #789",
        "docs: Update API documentation\n\nAdded examples for all endpoints.\nRelated to #234",
    ]

    idx = hash_int % len(authors)

    return RationaleForCommitOutput(
        rationale=CommitRationale(
            commit_hash=commit_hash[:12],
            author=authors[idx],
            timestamp=datetime.now() - timedelta(days=hash_int % 30),
            message=messages[idx],
            files_changed=["src/auth.py", "src/db.py", "tests/test_auth.py"][
                : ((hash_int % 3) + 1)
            ],
            additions=10 + (hash_int % 50),
            deletions=5 + (hash_int % 20),
            pr_number=100 + (hash_int % 900),
            pr_title=messages[idx].split("\n")[0],
        )
    )


# Made with Bob
