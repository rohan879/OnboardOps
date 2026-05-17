"""
Starter issue candidate tool.

Fetches a short list of open GitHub issues that could seed a starter PR.
"""

import os
import re
import subprocess
from datetime import datetime
from typing import Union

import httpx

from mcp.contracts import (
    StarterIssueCandidate,
    StarterIssueCandidatesInput,
    StarterIssueCandidatesOutput,
)
from mcp.errors import MCPToolError, network_error, rate_limit_error, timeout_error
from utils.retry import with_retry


GITHUB_TOKEN = os.getenv("ONBOARDOPS_GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"


def _git_remote_for_path(repo_path: str | None) -> str | None:
    if not repo_path:
        return None

    try:
        return subprocess.check_output(
            ["git", "config", "--get", "remote.origin.url"],
            cwd=repo_path,
            text=True,
            timeout=2,
        ).strip()
    except Exception:
        return None


def _repo_from_candidate(candidate: str | None) -> tuple[str, str] | None:
    if not candidate:
        return None

    candidate = candidate.strip()
    if not candidate:
        return None

    if os.path.exists(candidate):
        return _repo_from_candidate(_git_remote_for_path(candidate))

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


def extract_repo_info(repository: str | None = None) -> tuple[str, str]:
    candidates = [
        repository,
        os.getenv("ONBOARDOPS_DEMO_REPO"),
        os.getenv("NEXT_PUBLIC_REPOSITORY_URL"),
        _git_remote_for_path(os.getenv("ONBOARDOPS_DEMO_REPO_PATH")),
    ]

    candidates.append(
        _git_remote_for_path(
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        )
    )

    for candidate in candidates:
        repo_info = _repo_from_candidate(candidate)
        if repo_info:
            return repo_info

    return "unknown", "repository"


@with_retry(
    max_retries=3,
    backoff_base=1.0,
    log_func=lambda msg: print(f"[starter_issue_candidates] {msg}"),
)
def _fetch_github_data_with_retry(
    client: httpx.Client, url: str, headers: dict, params: dict | None = None
):
    return client.get(url, headers=headers, params=params)


def _issue_score(issue: dict, preferred_labels: list[str]) -> tuple[int, str]:
    label_names = [
        label.get("name", "").strip().lower() for label in issue.get("labels", [])
    ]
    score = sum(2 for label in label_names if label in preferred_labels)

    title = issue.get("title", "").lower()
    body = (issue.get("body") or "").lower()
    keywords = ["docs", "documentation", "test", "error", "typo", "readme"]
    if any(keyword in title or keyword in body for keyword in keywords):
        score += 1

    updated_at = issue.get("updated_at", "")
    return score, updated_at


def starter_issue_candidates(
    input_data: StarterIssueCandidatesInput,
) -> Union[StarterIssueCandidatesOutput, MCPToolError]:
    """
    Return open issues that can seed a bounded starter PR.

    Issues labeled `good first issue`, `help wanted`, or `documentation` are
    ranked first, then recency breaks ties.
    """
    owner, repo = extract_repo_info(
        input_data.repository_url or input_data.repository
    )
    repository = f"{owner}/{repo}"
    preferred_labels = [label.strip().lower() for label in input_data.labels if label]

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    params = {
        "state": "open",
        "sort": "updated",
        "direction": "desc",
        "per_page": max(input_data.limit * 4, 12),
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            response = _fetch_github_data_with_retry(
                client,
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues",
                headers,
                params,
            )

            if response.status_code == 403:
                remaining = response.headers.get("X-RateLimit-Remaining", "0")
                if remaining == "0":
                    retry_after = response.headers.get("X-RateLimit-Reset")
                    return rate_limit_error(int(retry_after) if retry_after else None)

            if response.status_code != 200:
                return StarterIssueCandidatesOutput(repository=repository, issues=[])

            issues = [
                issue
                for issue in response.json()
                if "pull_request" not in issue and issue.get("state") == "open"
            ]

            ranked_issues = sorted(
                issues,
                key=lambda issue: _issue_score(issue, preferred_labels),
                reverse=True,
            )

            candidates = []
            for issue in ranked_issues[: input_data.limit]:
                body = (issue.get("body") or "").strip()
                candidates.append(
                    StarterIssueCandidate(
                        issue_number=issue["number"],
                        title=issue["title"],
                        url=issue["html_url"],
                        labels=[
                            label.get("name", "")
                            for label in issue.get("labels", [])
                            if label.get("name")
                        ],
                        state=issue["state"],
                        updated_at=datetime.fromisoformat(
                            issue["updated_at"].replace("Z", "+00:00")
                        ),
                        body_excerpt=body[:220] if body else None,
                    )
                )

            return StarterIssueCandidatesOutput(
                repository=repository,
                issues=candidates,
            )

    except httpx.TimeoutException:
        return timeout_error(f"GitHub issue lookup for {repository}", 5)
    except httpx.NetworkError as error:
        return network_error(f"GitHub issue lookup for {repository}", str(error))
    except Exception as error:
        print(f"[starter_issue_candidates] Error fetching issues: {error}")
        return StarterIssueCandidatesOutput(repository=repository, issues=[])

