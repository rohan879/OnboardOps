"""
Rationale for Commit Tool - Mock Implementation
Returns deterministic mock data for commit rationale
"""

from datetime import datetime, timedelta
from mcp.contracts import (
    RationaleForCommitInput,
    RationaleForCommitOutput,
    CommitRationale,
)


def rationale_for_commit(
    input_data: RationaleForCommitInput,
) -> RationaleForCommitOutput:
    """
    Mock implementation of rationale_for_commit tool
    Returns plausible detailed commit information
    """
    # Generate deterministic data based on commit hash
    commit_hash = input_data.commit_hash
    hash_value = hash(commit_hash) % 1000

    authors = [
        "Alice Chen",
        "Bob Martinez",
        "Carol Johnson",
        "David Kim",
        "Emma Wilson",
    ]

    messages = [
        "feat: Implement user authentication system\n\nAdded JWT-based authentication with refresh tokens. Includes middleware for protected routes and session management.",
        "fix: Resolve memory leak in data processing\n\nFixed issue where large datasets weren't being properly garbage collected. Added proper cleanup in finally blocks.",
        "refactor: Modernize API endpoint structure\n\nMigrated from class-based views to functional endpoints. Improved type hints and error handling throughout.",
        "perf: Optimize database queries\n\nReduced N+1 queries by implementing eager loading. Added database indexes on frequently queried fields.",
        "docs: Add comprehensive API documentation\n\nDocumented all endpoints with request/response examples. Added authentication flow diagrams.",
    ]

    file_sets = [
        ["src/auth/jwt.py", "src/auth/middleware.py", "src/models/user.py"],
        ["src/processing/pipeline.py", "src/utils/memory.py"],
        ["src/api/endpoints.py", "src/api/handlers.py", "src/api/validators.py"],
        ["src/db/queries.py", "src/db/models.py", "migrations/001_add_indexes.sql"],
        ["docs/api.md", "docs/auth.md", "README.md"],
    ]

    author_idx = hash_value % len(authors)
    message_idx = hash_value % len(messages)
    files_idx = hash_value % len(file_sets)

    # Determine if this commit has an associated PR
    has_pr = hash_value % 3 == 0  # ~33% of commits have PRs
    pr_number = 1000 + hash_value if has_pr else None
    # Extract first line of message for PR title (f-strings can't contain backslashes)
    first_line = messages[message_idx].split('\n')[0]
    pr_title = f"PR: {first_line}" if has_pr else None

    rationale = CommitRationale(
        commit_hash=commit_hash,
        author=authors[author_idx],
        timestamp=datetime.now() - timedelta(days=hash_value % 180),
        message=messages[message_idx],
        files_changed=file_sets[files_idx],
        additions=50 + (hash_value % 200),
        deletions=20 + (hash_value % 100),
        pr_number=pr_number,
        pr_title=pr_title,
    )

    return RationaleForCommitOutput(rationale=rationale)


# Made with Bob
