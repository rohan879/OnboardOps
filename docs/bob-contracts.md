# Bob ↔ Backend Contracts

This document defines the data shapes that the **onboard mode** and **cartography skill** will request from the **Institutional Knowledge MCP Server**. These contracts serve as the interface specification between Dev 1 (Bob Architect) and Dev 2 (Backend/MCP).

**Version**: 1.0 (Phase 1 Stub)  
**Last Updated**: 2026-05-15  
**Status**: Draft for T2.3 implementation

---

## MCP Tool Contracts

All tools return JSON responses. All tools are **read-only** (no mutations to git, GitHub, or external systems).

### 1. `git_blame_summary`

**Purpose**: Get aggregated blame data for a file to identify primary contributors.

**Input**:
```json
{
  "file_path": "string (required) - Relative path from repo root",
  "repo_path": "string (optional) - Absolute path to repo, defaults to current workspace"
}
```

**Output**:
```json
{
  "file_path": "string",
  "total_lines": "integer",
  "contributors": [
    {
      "author": "string - Name or email",
      "lines_owned": "integer",
      "percentage": "float - 0.0 to 100.0",
      "last_modified": "string - ISO 8601 timestamp"
    }
  ],
  "last_modified_overall": "string - ISO 8601 timestamp"
}
```

**Usage**: Cartography Stage 3 (Hotspots) - identify file owners.

---

### 2. `commit_frequency`

**Purpose**: Get commit counts per file over a time window, sorted by frequency.

**Input**:
```json
{
  "days": "integer (optional) - Default 180",
  "limit": "integer (optional) - Max files to return, default 10",
  "repo_path": "string (optional)"
}
```

**Output**:
```json
{
  "time_window_days": "integer",
  "files": [
    {
      "file_path": "string",
      "commit_count": "integer",
      "distinct_authors": "integer",
      "first_commit": "string - ISO 8601",
      "last_commit": "string - ISO 8601"
    }
  ]
}
```

**Usage**: Cartography Stage 3 (Hotspots) - identify high-churn files.

---

### 3. `recent_authors`

**Purpose**: Get list of distinct authors who modified a file recently.

**Input**:
```json
{
  "file_path": "string (required)",
  "days": "integer (optional) - Default 90",
  "repo_path": "string (optional)"
}
```

**Output**:
```json
{
  "file_path": "string",
  "time_window_days": "integer",
  "authors": [
    {
      "author": "string",
      "commit_count": "integer",
      "last_commit": "string - ISO 8601"
    }
  ]
}
```

**Usage**: Cartography Stage 3 (Hotspots) - identify who to ask about a file.

---

### 4. `pr_for_file`

**Purpose**: Get the most recent pull request that modified a given file.

**Input**:
```json
{
  "file_path": "string (required)",
  "repo_path": "string (optional)"
}
```

**Output**:
```json
{
  "file_path": "string",
  "pr": {
    "number": "integer",
    "title": "string",
    "author": "string",
    "merged_at": "string - ISO 8601",
    "url": "string - GitHub PR URL",
    "description": "string - First 500 chars of PR body"
  }
}
```

**Usage**: Certification questions - "Why was this file changed?"

---

### 5. `file_changelog`

**Purpose**: Get chronological list of commits affecting a file.

**Input**:
```json
{
  "file_path": "string (required)",
  "limit": "integer (optional) - Default 10",
  "repo_path": "string (optional)"
}
```

**Output**:
```json
{
  "file_path": "string",
  "commits": [
    {
      "sha": "string - Short SHA (7 chars)",
      "message": "string - First line of commit message",
      "author": "string",
      "date": "string - ISO 8601",
      "files_changed": "integer - Total files in commit"
    }
  ]
}
```

**Usage**: Cartography Stage 3 (Hotspots) - understand file evolution.

---

### 6. `rationale_for_commit`

**Purpose**: Get commit message and PR description for a given commit SHA.

**Input**:
```json
{
  "commit_sha": "string (required) - Full or short SHA",
  "repo_path": "string (optional)"
}
```

**Output**:
```json
{
  "commit_sha": "string - Full SHA",
  "message": "string - Full commit message",
  "author": "string",
  "date": "string - ISO 8601",
  "pr": {
    "number": "integer or null",
    "title": "string or null",
    "description": "string or null"
  }
}
```

**Usage**: Certification questions - "Why was this change made?"

---

### 7. `incident_for_file`

**Purpose**: Get linked incidents or issues that mention the file.

**Input**:
```json
{
  "file_path": "string (required)",
  "sources": "array of strings (optional) - ['github', 'linear', 'jira'], default ['github']",
  "limit": "integer (optional) - Default 5",
  "repo_path": "string (optional)"
}
```

**Output**:
```json
{
  "file_path": "string",
  "incidents": [
    {
      "source": "string - 'github', 'linear', or 'jira'",
      "id": "string - Issue number or ID",
      "title": "string",
      "url": "string",
      "status": "string - 'open', 'closed', etc.",
      "created_at": "string - ISO 8601"
    }
  ]
}
```

**Usage**: Cartography Stage 3 (Hotspots) - understand why files are problematic.

---

## Error Handling

All tools **must** return a consistent error format when they fail:

```json
{
  "error": {
    "code": "string - ERROR_CODE",
    "message": "string - Human-readable error",
    "details": "object or null - Additional context"
  }
}
```

**Error codes**:
- `FILE_NOT_FOUND` - File doesn't exist in repo
- `REPO_NOT_FOUND` - Repository path invalid
- `GITHUB_AUTH_FAILED` - GitHub token invalid or expired
- `RATE_LIMIT_EXCEEDED` - GitHub API rate limit hit
- `INVALID_INPUT` - Input validation failed
- `INTERNAL_ERROR` - Unexpected server error

---

## Performance Requirements

From SRS NFR-4.6:
- Each MCP tool call **must** return in under **800ms** at the 95th percentile
- Server **must** cache responses for 10 minutes (600s TTL)
- Server **must** refuse to start if `ONBOARDOPS_GITHUB_TOKEN` is missing

---

## Authentication

- Server authenticates to GitHub via `ONBOARDOPS_GITHUB_TOKEN` environment variable
- Bob does **not** authenticate to the MCP server (localhost trust model)
- Token must be fine-grained PAT with scopes: `contents:read`, `metadata:read`, `pull-requests:read`

---

## Phase 2 Implementation Notes for Dev 2

1. **T2.3**: Define these contracts as Pydantic models in `backend/mcp/contracts.py`
2. **T2.4**: Stub FastAPI `/mcp` endpoint to return mock data matching these schemas
3. **T2.7**: Implement mock data generators for each tool (plausible-looking data)
4. **Phase 2**: Replace mocks with real git/GitHub queries

---

## Handoff Checklist

- [x] Seven tool contracts defined with input/output schemas
- [x] Error format specified
- [x] Performance requirements documented
- [x] Authentication model clarified
- [ ] Dev 2 acknowledges and confirms alignment with T2.3

**Dev 2**: Please confirm you've reviewed this document and the contracts align with your T2.3 implementation plan.