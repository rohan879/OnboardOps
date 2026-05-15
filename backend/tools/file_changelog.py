"""
File Changelog Tool - Mock Implementation
Returns deterministic mock data for file commit history
"""

from datetime import datetime, timedelta
from mcp.contracts import FileChangelogInput, FileChangelogOutput, CommitInfo


def file_changelog(input_data: FileChangelogInput) -> FileChangelogOutput:
    """
    Mock implementation of file_changelog tool
    Returns plausible commit history for any file
    """
    # Generate deterministic commits based on file path
    file_hash = hash(input_data.file_path) % 1000

    commit_templates = [
        ("feat: Implement new functionality", "Alice Chen", "alice.chen@example.com"),
        ("fix: Resolve critical bug", "Bob Martinez", "bob.martinez@example.com"),
        ("refactor: Improve code quality", "Carol Johnson", "carol.j@example.com"),
        ("docs: Update inline documentation", "David Kim", "david.kim@example.com"),
        ("test: Add comprehensive tests", "Emma Wilson", "emma.w@example.com"),
        ("perf: Optimize performance", "Frank Zhang", "frank.zhang@example.com"),
        ("style: Format code", "Grace Lee", "grace.lee@example.com"),
        ("chore: Update dependencies", "Henry Brown", "henry.b@example.com"),
    ]

    num_commits = min(input_data.limit, len(commit_templates))
    commits = []

    for i in range(num_commits):
        template_idx = (file_hash + i) % len(commit_templates)
        message, author, email = commit_templates[template_idx]

        commits.append(
            CommitInfo(
                commit_hash=f"{file_hash + i:04d}abc{i:03d}def",
                author=author,
                email=email,
                timestamp=datetime.now() - timedelta(days=7 * (i + 1)),
                message=message,
                files_changed=1 + (i % 3),
            )
        )

    return FileChangelogOutput(file_path=input_data.file_path, commits=commits)


# Made with Bob
