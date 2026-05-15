"""
Incident for File Tool - Mock Implementation
Returns deterministic mock data for incidents related to a file
"""

from datetime import datetime, timedelta
from backend.mcp.contracts import (
    IncidentForFileInput,
    IncidentForFileOutput,
    IncidentInfo,
)


def incident_for_file(input_data: IncidentForFileInput) -> IncidentForFileOutput:
    """
    Mock implementation of incident_for_file tool
    Returns plausible incident data for any file
    """
    # Generate deterministic incidents based on file path
    file_hash = hash(input_data.file_path) % 1000

    incident_templates = [
        ("Memory leak in production", "critical", ["abc123", "def456"], "github_issue"),
        ("Performance degradation under load", "high", ["ghi789"], "linear"),
        ("Incorrect validation logic", "medium", ["jkl012", "mno345"], "github_issue"),
        ("UI rendering issue on mobile", "medium", ["pqr678"], "slack"),
        ("Intermittent test failures", "low", ["stu901"], "github_issue"),
    ]

    # Determine number of incidents (0-3 based on file hash)
    num_incidents = min(3, (file_hash % 4))
    incidents = []

    for i in range(num_incidents):
        template_idx = (file_hash + i) % len(incident_templates)
        title, severity, commits, source = incident_templates[template_idx]

        created_date = datetime.now() - timedelta(days=input_data.days - (i * 30))

        # Some incidents are resolved, some are not
        is_resolved = (file_hash + i) % 2 == 0
        resolved_date = (
            created_date + timedelta(days=7 + (i * 3)) if is_resolved else None
        )

        incidents.append(
            IncidentInfo(
                incident_id=f"INC-{file_hash + i:04d}",
                title=title,
                severity=severity,
                created_at=created_date,
                resolved_at=resolved_date,
                related_commits=commits,
                source=source,
            )
        )

    return IncidentForFileOutput(file_path=input_data.file_path, incidents=incidents)


# Made with Bob
