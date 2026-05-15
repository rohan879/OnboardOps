"""
Git Blame Summary Tool - Mock Implementation
Returns deterministic mock data for git blame analysis
"""

from datetime import datetime, timedelta
from backend.mcp.contracts import (
    GitBlameSummaryInput,
    GitBlameSummaryOutput,
    BlameEntry,
)


def git_blame_summary(input_data: GitBlameSummaryInput) -> GitBlameSummaryOutput:
    """
    Mock implementation of git_blame_summary tool
    Returns plausible-looking blame data for any file path
    """
    # Generate deterministic mock data based on file path
    file_hash = hash(input_data.file_path) % 1000

    # Create 3-5 blame entries with different authors
    authors = [
        ("Alice Chen", "alice.chen@example.com"),
        ("Bob Martinez", "bob.martinez@example.com"),
        ("Carol Johnson", "carol.j@example.com"),
        ("David Kim", "david.kim@example.com"),
    ]

    num_entries = 3 + (file_hash % 3)  # 3-5 entries
    blame_entries = []

    for i in range(num_entries):
        author_idx = (file_hash + i) % len(authors)
        author_name, author_email = authors[author_idx]

        blame_entries.append(
            BlameEntry(
                author=author_name,
                email=author_email,
                commit_hash=f"abc{file_hash + i:04d}def",
                timestamp=datetime.now() - timedelta(days=30 * (i + 1)),
                line_count=15 + (file_hash % 20) + i * 5,
            )
        )

    # Primary author is the one with most lines
    primary_author = max(blame_entries, key=lambda x: x.line_count).author
    last_modified = max(blame_entries, key=lambda x: x.timestamp).timestamp

    return GitBlameSummaryOutput(
        file_path=input_data.file_path,
        blame_entries=blame_entries,
        primary_author=primary_author,
        last_modified=last_modified,
    )


# Made with Bob
