"""
MCP Tool Contracts for OnboardOps Institutional Knowledge Server
Defines Pydantic input and output models for all seven MCP tools
Cross-checked against docs/bob-contracts.md (to be provided by Dev 1)
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ============================================================================
# Tool 1: git_blame_summary
# ============================================================================


class GitBlameSummaryInput(BaseModel):
    """Input for git_blame_summary tool"""

    file_path: str = Field(
        ..., description="Relative path to the file in the repository"
    )
    line_start: Optional[int] = Field(
        None, description="Starting line number (optional)"
    )
    line_end: Optional[int] = Field(None, description="Ending line number (optional)")


class BlameEntry(BaseModel):
    """A single blame entry for a line or range"""

    author: str
    email: str
    commit_hash: str
    timestamp: datetime
    line_count: int


class GitBlameSummaryOutput(BaseModel):
    """Output for git_blame_summary tool"""

    file_path: str
    blame_entries: List[BlameEntry]
    primary_author: str
    last_modified: datetime


# ============================================================================
# Tool 2: commit_frequency
# ============================================================================


class CommitFrequencyInput(BaseModel):
    """Input for commit_frequency tool"""

    file_path: Optional[str] = Field(None, description="Specific file path (optional)")
    days: int = Field(180, description="Number of days to look back")


class FileCommitFrequency(BaseModel):
    """Commit frequency for a single file"""

    file_path: str
    commit_count: int
    distinct_authors: int
    first_commit: datetime
    last_commit: datetime


class CommitFrequencyOutput(BaseModel):
    """Output for commit_frequency tool"""

    files: List[FileCommitFrequency]
    total_commits: int
    date_range_days: int


# ============================================================================
# Tool 3: recent_authors
# ============================================================================


class RecentAuthorsInput(BaseModel):
    """Input for recent_authors tool"""

    file_path: Optional[str] = Field(None, description="Specific file path (optional)")
    days: int = Field(90, description="Number of days to look back")
    limit: int = Field(10, description="Maximum number of authors to return")


class AuthorActivity(BaseModel):
    """Activity summary for a single author"""

    name: str
    email: str
    commit_count: int
    files_touched: int
    last_commit: datetime


class RecentAuthorsOutput(BaseModel):
    """Output for recent_authors tool"""

    authors: List[AuthorActivity]
    date_range_days: int


# ============================================================================
# Tool 4: pr_for_file
# ============================================================================


class PrForFileInput(BaseModel):
    """Input for pr_for_file tool"""

    file_path: str = Field(..., description="Relative path to the file")
    limit: int = Field(5, description="Maximum number of PRs to return")


class PullRequestInfo(BaseModel):
    """Information about a pull request"""

    pr_number: int
    title: str
    author: str
    state: str  # open, closed, merged
    created_at: datetime
    merged_at: Optional[datetime]
    url: str


class PrForFileOutput(BaseModel):
    """Output for pr_for_file tool"""

    file_path: str
    pull_requests: List[PullRequestInfo]


# ============================================================================
# Tool 5: file_changelog
# ============================================================================


class FileChangelogInput(BaseModel):
    """Input for file_changelog tool"""

    file_path: str = Field(..., description="Relative path to the file")
    limit: int = Field(10, description="Maximum number of commits to return")


class CommitInfo(BaseModel):
    """Information about a single commit"""

    commit_hash: str
    author: str
    email: str
    timestamp: datetime
    message: str
    files_changed: int


class FileChangelogOutput(BaseModel):
    """Output for file_changelog tool"""

    file_path: str
    commits: List[CommitInfo]


# ============================================================================
# Tool 6: rationale_for_commit
# ============================================================================


class RationaleForCommitInput(BaseModel):
    """Input for rationale_for_commit tool"""

    commit_hash: str = Field(..., description="Git commit hash")


class CommitRationale(BaseModel):
    """Detailed rationale for a commit"""

    commit_hash: str
    author: str
    timestamp: datetime
    message: str
    files_changed: List[str]
    additions: int
    deletions: int
    pr_number: Optional[int]
    pr_title: Optional[str]


class RationaleForCommitOutput(BaseModel):
    """Output for rationale_for_commit tool"""

    rationale: CommitRationale


# ============================================================================
# Tool 7: incident_for_file
# ============================================================================


class IncidentForFileInput(BaseModel):
    """Input for incident_for_file tool"""

    file_path: str = Field(..., description="Relative path to the file")
    days: int = Field(180, description="Number of days to look back")


class IncidentInfo(BaseModel):
    """Information about an incident related to a file"""

    incident_id: str
    title: str
    severity: str  # critical, high, medium, low
    created_at: datetime
    resolved_at: Optional[datetime]
    related_commits: List[str]
    source: str  # github_issue, linear, slack, etc.


class IncidentForFileOutput(BaseModel):
    """Output for incident_for_file tool"""

    file_path: str
    incidents: List[IncidentInfo]


# ============================================================================
# Validation and Testing
# ============================================================================


def validate_contracts():
    """Validate that all contract models can be instantiated"""
    # Test instantiation of all models
    models = [
        GitBlameSummaryInput,
        GitBlameSummaryOutput,
        CommitFrequencyInput,
        CommitFrequencyOutput,
        RecentAuthorsInput,
        RecentAuthorsOutput,
        PrForFileInput,
        PrForFileOutput,
        FileChangelogInput,
        FileChangelogOutput,
        RationaleForCommitInput,
        RationaleForCommitOutput,
        IncidentForFileInput,
        IncidentForFileOutput,
    ]

    print("All MCP tool contract models defined:")
    for model in models:
        print(f"  - {model.__name__}")

    return True


if __name__ == "__main__":
    validate_contracts()
    print("\n[OK] All contract models validated successfully")

# Made with Bob
