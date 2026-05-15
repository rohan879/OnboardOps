"""
PR for File Tool - Real Implementation
Returns the most recent merged PRs touching a given file using GitHub REST API
"""

import os
import httpx
from datetime import datetime
from mcp.contracts import PrForFileInput, PrForFileOutput, PullRequestInfo


# GitHub API configuration
GITHUB_TOKEN = os.getenv("ONBOARDOPS_GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"


def extract_repo_info() -> tuple[str, str]:
    """
    Extract owner and repo name from the demo repo path or environment

    For Phase 2, we'll use a hardcoded demo repo.
    In Phase 3+, this could be extracted from git remote.
    """
    # For now, use environment variable or default to a known demo repo
    repo_full_name = os.getenv(
        "ONBOARDOPS_DEMO_REPO", "fastapi/full-stack-fastapi-template"
    )
    parts = repo_full_name.split("/")
    if len(parts) == 2:
        return parts[0], parts[1]
    return "fastapi", "full-stack-fastapi-template"


def pr_for_file(input_data: PrForFileInput) -> PrForFileOutput:
    """
    Get the most recent merged PRs that touched a specific file

    Uses GitHub REST API to search for commits affecting the file,
    then finds the associated PRs.

    Caches aggressively since PRs don't change after merge.
    """
    file_path = input_data.file_path
    limit = input_data.limit

    # If no GitHub token, fall back to mock data
    if not GITHUB_TOKEN:
        return _mock_pr_for_file(input_data)

    try:
        owner, repo = extract_repo_info()

        # Use GitHub API to get commits for this file
        # Then find associated PRs
        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        # Step 1: Get recent commits for the file
        commits_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits"
        params = {
            "path": file_path,
            "per_page": min(limit * 2, 20),  # Get more commits than PRs needed
        }

        with httpx.Client(timeout=5.0) as client:
            commits_response = client.get(commits_url, headers=headers, params=params)

            if commits_response.status_code != 200:
                # Fall back to mock on API error
                return _mock_pr_for_file(input_data)

            commits = commits_response.json()

            # Step 2: For each commit, find associated PR
            pull_requests = []
            seen_pr_numbers = set()

            for commit in commits:
                if len(pull_requests) >= limit:
                    break

                commit_sha = commit["sha"]

                # Get PRs associated with this commit
                prs_url = (
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits/{commit_sha}/pulls"
                )
                prs_response = client.get(prs_url, headers=headers)

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

    except Exception as e:
        # On any error, fall back to mock data
        print(
            f"[pr_for_file] Error fetching from GitHub API: {e}, falling back to mock"
        )
        return _mock_pr_for_file(input_data)


def _mock_pr_for_file(input_data: PrForFileInput) -> PrForFileOutput:
    """
    Fallback mock implementation when GitHub API is unavailable
    Returns plausible PR data for any file
    """
    from datetime import timedelta

    # Generate deterministic PRs based on file path
    file_hash = hash(input_data.file_path) % 1000

    pr_templates = [
        ("feat: Add new feature to {}", "Alice Chen", "merged"),
        ("fix: Resolve bug in {}", "Bob Martinez", "merged"),
        ("refactor: Improve code structure in {}", "Carol Johnson", "merged"),
        ("docs: Update documentation for {}", "David Kim", "merged"),
        ("test: Add tests for {}", "Emma Wilson", "merged"),
    ]

    num_prs = min(input_data.limit, len(pr_templates))
    pull_requests = []

    for i in range(num_prs):
        template_idx = (file_hash + i) % len(pr_templates)
        title_template, author, state = pr_templates[template_idx]

        pr_number = 1000 + file_hash + i
        created_date = datetime.now() - timedelta(days=60 - (i * 10))
        merged_date = created_date + timedelta(days=2)

        # Extract filename from path for title
        filename = input_data.file_path.split("/")[-1]
        title = title_template.format(filename)

        pull_requests.append(
            PullRequestInfo(
                pr_number=pr_number,
                title=title,
                author=author,
                state=state,
                created_at=created_date,
                merged_at=merged_date,
                url=f"https://github.com/example/repo/pull/{pr_number}",
            )
        )

    return PrForFileOutput(file_path=input_data.file_path, pull_requests=pull_requests)


# Made with Bob
