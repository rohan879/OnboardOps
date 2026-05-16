"""
Recent Authors Tool - Mock Implementation
Returns deterministic mock data for recent author activity
"""

from datetime import datetime, timedelta
import hashlib
from typing import Union
from mcp.contracts import (
    RecentAuthorsInput,
    RecentAuthorsOutput,
    AuthorActivity,
)
from mcp.errors import MCPToolError


def recent_authors(
    input_data: RecentAuthorsInput,
) -> Union[RecentAuthorsOutput, MCPToolError]:
    """
    Mock implementation of recent_authors tool
    Returns plausible author activity data
    """
    # Generate deterministic authors based on input
    seed = (
        int(
            hashlib.sha256((input_data.file_path or "repo").encode()).hexdigest()[:8],
            16,
        )
        % 100
    )

    authors_pool = [
        ("Alice Chen", "alice.chen@example.com", 45, 23),
        ("Bob Martinez", "bob.martinez@example.com", 38, 19),
        ("Carol Johnson", "carol.j@example.com", 31, 15),
        ("David Kim", "david.kim@example.com", 27, 12),
        ("Emma Wilson", "emma.w@example.com", 22, 10),
        ("Frank Zhang", "frank.zhang@example.com", 18, 8),
        ("Grace Lee", "grace.lee@example.com", 14, 6),
        ("Henry Brown", "henry.b@example.com", 11, 5),
        ("Iris Patel", "iris.patel@example.com", 8, 4),
        ("Jack Smith", "jack.smith@example.com", 5, 3),
    ]

    # Select authors based on limit
    num_authors = min(input_data.limit, len(authors_pool))
    authors = []

    for i in range(num_authors):
        idx = (seed + i) % len(authors_pool)
        name, email, base_commits, base_files = authors_pool[idx]

        # Adjust based on whether it's file-specific or repo-wide
        if input_data.file_path:
            commit_count = max(1, base_commits // 5)
            files_touched = 1
        else:
            commit_count = base_commits
            files_touched = base_files

        authors.append(
            AuthorActivity(
                name=name,
                email=email,
                commit_count=commit_count,
                files_touched=files_touched,
                last_commit=datetime.now() - timedelta(days=i * 3 + 1),
            )
        )

    return RecentAuthorsOutput(authors=authors, date_range_days=input_data.days)


# Made with Bob
