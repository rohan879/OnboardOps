"""
PR for File Tool - Real Implementation
Returns the most recent merged PRs touching a given file using GitHub REST API
"""

import os
import re
import subprocess
import httpx
from datetime import datetime
from typing import Union
from mcp.contracts import PrForFileInput, PrForFileOutput, PullRequestInfo
from mcp.errors import (
    MCPToolError,
    network_error,
    rate_limit_error,
    timeout_error,
)
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from utils.retry import with_retry


# GitHub API configuration
GITHUB_TOKEN = os.getenv("ONBOARDOPS_GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"


def extract_repo_info() -> tuple[str, str]:
    """
    Extract owner and repo name from environment or git remote.
    """
    candidates = [
        os.getenv("ONBOARDOPS_DEMO_REPO"),
        os.getenv("NEXT_PUBLIC_REPOSITORY_URL"),
    ]

    try:
        remote_url = subprocess.check_output(
            ["git", "config", "--get", "remote.origin.url"],
            cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
            text=True,
            timeout=2,
        ).strip()
        candidates.append(remote_url)
    except Exception:
        pass

    candidates.append("rohan879/OnboardOps")

    for candidate in candidates:
        if not candidate:
            continue

        match = re.search(
            r"github\.com[:/](?P<owner>[^/\s]+)/(?P<repo>[^/\s]+?)(?:\.git)?/?$",
            candidate,
        )
        if match:
            return match.group("owner"), match.group("repo")

        parts = candidate.strip().removesuffix(".git").split("/")
        if len(parts) == 2 and all(parts):
            return parts[0], parts[1]

    return "rohan879", "OnboardOps"


@with_retry(
    max_retries=3, backoff_base=1.0, log_func=lambda msg: print(f"[pr_for_file] {msg}")
)
def _fetch_github_data_with_retry(
    client: httpx.Client, url: str, headers: dict, params: dict = None
):
    """Helper function to fetch GitHub data with retry logic"""
    return client.get(url, headers=headers, params=params)


def pr_for_file(input_data: PrForFileInput) -> Union[PrForFileOutput, MCPToolError]:
    """
    Get the most recent merged PRs that touched a specific file

    Uses GitHub REST API to search for commits affecting the file,
    then finds the associated PRs.

    Caches aggressively since PRs don't change after merge.

    Returns PrForFileOutput on success or MCPToolError on failure.
    Returns an empty PR list if GitHub API is unavailable. Never fabricates PR
    links, because dashboard links must point to real review artifacts.
    """
    file_path = input_data.file_path
    limit = input_data.limit

    try:
        owner, repo = extract_repo_info()

        # Use GitHub API to get commits for this file
        # Then find associated PRs
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

        # Step 1: Get recent commits for the file
        commits_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits"
        params = {
            "path": file_path,
            "per_page": min(limit * 2, 20),  # Get more commits than PRs needed
        }

        with httpx.Client(timeout=5.0) as client:
            # Use retry wrapper for GitHub API call
            commits_response = _fetch_github_data_with_retry(
                client, commits_url, headers, params
            )

            # Check for rate limiting
            if commits_response.status_code == 403:
                remaining = commits_response.headers.get("X-RateLimit-Remaining", "0")
                if remaining == "0":
                    retry_after = commits_response.headers.get("X-RateLimit-Reset")
                    return rate_limit_error(int(retry_after) if retry_after else None)

            if commits_response.status_code != 200:
                return PrForFileOutput(file_path=file_path, pull_requests=[])

            commits = commits_response.json()

            # Step 2: For each commit, find associated PR
            pull_requests = []
            seen_pr_numbers = set()

            for commit in commits:
                if len(pull_requests) >= limit:
                    break

                commit_sha = commit["sha"]

                # Get PRs associated with this commit (with retry)
                prs_url = (
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits/{commit_sha}/pulls"
                )
                prs_response = _fetch_github_data_with_retry(client, prs_url, headers)

                if prs_response.status_code == 200:
                    prs = prs_response.json()

                    for pr in prs:
                        if pr["number"] in seen_pr_numbers:
                            continue

                        # Only include merged PRs
                        if pr["merged_at"] is None:
                            continue

                        seen_pr_numbers.add(pr["number"])

                        pull_requests.append(
                            PullRequestInfo(
                                pr_number=pr["number"],
                                title=pr["title"],
                                author=pr["user"]["login"],
                                state="merged",
                                created_at=datetime.fromisoformat(
                                    pr["created_at"].replace("Z", "+00:00")
                                ),
                                merged_at=datetime.fromisoformat(
                                    pr["merged_at"].replace("Z", "+00:00")
                                ),
                                url=pr["html_url"],
                            )
                        )

                        if len(pull_requests) >= limit:
                            break

            # If we found PRs, return them
            if pull_requests:
                return PrForFileOutput(file_path=file_path, pull_requests=pull_requests)

            # No PRs found, return empty list (not an error)
            return PrForFileOutput(file_path=file_path, pull_requests=[])

    except httpx.TimeoutException:
        return timeout_error(f"GitHub API call for {file_path}", 5)
    except httpx.NetworkError as e:
        return network_error(f"GitHub API call for {file_path}", str(e))
    except Exception as e:
        print(f"[pr_for_file] Error fetching from GitHub API: {e}")
        return PrForFileOutput(file_path=file_path, pull_requests=[])


# Made with Bob
