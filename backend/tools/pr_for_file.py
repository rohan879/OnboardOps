"""
PR for File Tool - Mock Implementation
Returns deterministic mock data for pull requests affecting a file
"""

from datetime import datetime, timedelta
from backend.mcp.contracts import PrForFileInput, PrForFileOutput, PullRequestInfo


def pr_for_file(input_data: PrForFileInput) -> PrForFileOutput:
    """
    Mock implementation of pr_for_file tool
    Returns plausible PR data for any file
    """
    # Generate deterministic PRs based on file path
    file_hash = hash(input_data.file_path) % 1000

    pr_templates = [
        ("feat: Add new feature to {}", "Alice Chen", "merged"),
        ("fix: Resolve bug in {}", "Bob Martinez", "merged"),
        ("refactor: Improve code structure in {}", "Carol Johnson", "merged"),
        ("docs: Update documentation for {}", "David Kim", "merged"),
        ("test: Add tests for {}", "Emma Wilson", "closed"),
    ]

    num_prs = min(input_data.limit, len(pr_templates))
    pull_requests = []

    for i in range(num_prs):
        template_idx = (file_hash + i) % len(pr_templates)
        title_template, author, state = pr_templates[template_idx]

        pr_number = 1000 + file_hash + i
        created_date = datetime.now() - timedelta(days=60 - (i * 10))
        merged_date = created_date + timedelta(days=2) if state == "merged" else None

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
