"""
Commit Frequency Tool - Mock Implementation
Returns deterministic mock data for commit frequency analysis
"""

from datetime import datetime, timedelta
from backend.mcp.contracts import (
    CommitFrequencyInput,
    CommitFrequencyOutput,
    FileCommitFrequency,
)


def commit_frequency(input_data: CommitFrequencyInput) -> CommitFrequencyOutput:
    """
    Mock implementation of commit_frequency tool
    Returns plausible commit frequency data
    """
    # If specific file requested, return data for that file only
    if input_data.file_path:
        file_hash = hash(input_data.file_path) % 100
        files = [
            FileCommitFrequency(
                file_path=input_data.file_path,
                commit_count=20 + file_hash,
                distinct_authors=3 + (file_hash % 5),
                first_commit=datetime.now() - timedelta(days=input_data.days),
                last_commit=datetime.now() - timedelta(days=2),
            )
        ]
        total_commits = files[0].commit_count
    else:
        # Return data for multiple hot files
        hot_files = [
            "src/main.py",
            "src/utils/helpers.py",
            "tests/test_main.py",
            "README.md",
            "src/config.py",
        ]

        files = []
        total_commits = 0

        for i, file_path in enumerate(hot_files):
            commit_count = 50 - (i * 8)
            total_commits += commit_count

            files.append(
                FileCommitFrequency(
                    file_path=file_path,
                    commit_count=commit_count,
                    distinct_authors=4 - (i % 3),
                    first_commit=datetime.now()
                    - timedelta(days=input_data.days - (i * 10)),
                    last_commit=datetime.now() - timedelta(days=1 + i),
                )
            )

    return CommitFrequencyOutput(
        files=files, total_commits=total_commits, date_range_days=input_data.days
    )


# Made with Bob
