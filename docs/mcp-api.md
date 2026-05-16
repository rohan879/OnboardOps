# OnboardOps MCP Server API Documentation

**Version:** 1.0.0  
**Base URL:** `http://127.0.0.1:8765`  
**Protocol:** MCP (Model Context Protocol) over HTTP + WebSocket

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Tool Catalog](#tool-catalog)
4. [Request/Response Format](#requestresponse-format)
5. [Error Codes](#error-codes)
6. [Allow-List Configuration](#allow-list-configuration)
7. [Performance Characteristics](#performance-characteristics)
8. [Caching Behavior](#caching-behavior)
9. [Integration Examples](#integration-examples)

---

## Overview

The OnboardOps MCP Server exposes 7 institutional knowledge tools that provide deep insights into a codebase's history, ownership, and conventions. All tools are read-only and designed for sub-second response times with aggressive caching.

### Key Features

- **7 institutional knowledge tools** for repository analysis
- **In-session caching** with LRU eviction (1000 entries/session)
- **Allow-list enforcement** for security
- **WebSocket event streaming** for real-time dashboard updates
- **Comprehensive observability** via `/metrics` endpoint

---

## Authentication

**Current Status:** Authentication is disabled by default for hackathon demo.

**Production Setup:** Set `security.require_auth: true` in `.onboardops/allowlist.yaml` and provide API keys via `Authorization` header.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:8765/mcp/invoke
```

---

## Tool Catalog

### 1. git_blame_summary

Get git blame summary showing who last modified each section of a file.

**Input Schema:**
```json
{
  "file_path": "string (required)",
  "line_start": "integer (optional)",
  "line_end": "integer (optional)",
  "session_id": "string (optional, for caching)"
}
```

**Output:**
```json
{
  "tool_name": "git_blame_summary",
  "result": {
    "file_path": "backend/app.py",
    "sections": [
      {
        "line_start": 1,
        "line_end": 50,
        "author": "alice@example.com",
        "commit_hash": "abc123",
        "commit_date": "2024-01-15T10:30:00Z",
        "commit_message": "Initial FastAPI setup"
      }
    ],
    "total_authors": 3
  }
}
```

**Performance:** p95 < 600ms (cached: < 10ms)

---

### 2. commit_frequency

Get commit frequency statistics for files, aggregated into 12 time buckets.

**Input Schema:**
```json
{
  "file_path": "string (optional, omit for repo-wide)",
  "days": "integer (default: 180)",
  "session_id": "string (optional)"
}
```

**Output:**
```json
{
  "tool_name": "commit_frequency",
  "result": {
    "file_path": "backend/app.py",
    "days": 180,
    "total_commits": 45,
    "buckets": [
      {"month": "2024-01", "commits": 12},
      {"month": "2024-02", "commits": 8}
    ]
  }
}
```

**Performance:** p95 < 500ms (cached: < 10ms)

---

### 3. recent_authors

Get list of recent contributors to the repository or specific file.

**Input Schema:**
```json
{
  "file_path": "string (optional)",
  "days": "integer (default: 90)",
  "limit": "integer (default: 10)",
  "session_id": "string (optional)"
}
```

**Output:**
```json
{
  "tool_name": "recent_authors",
  "result": {
    "authors": [
      {
        "email": "alice@example.com",
        "name": "Alice Developer",
        "commits": 23,
        "last_commit_date": "2024-03-15T14:20:00Z"
      }
    ],
    "total_authors": 5
  }
}
```

**Performance:** p95 < 400ms (cached: < 10ms)

---

### 4. pr_for_file

Get pull requests that modified a specific file (requires GitHub API access).

**Input Schema:**
```json
{
  "file_path": "string (required)",
  "limit": "integer (default: 5)",
  "session_id": "string (optional)"
}
```

**Output:**
```json
{
  "tool_name": "pr_for_file",
  "result": {
    "file_path": "backend/app.py",
    "pull_requests": [
      {
        "number": 42,
        "title": "Add caching layer",
        "author": "bob@example.com",
        "merged_at": "2024-03-10T09:15:00Z",
        "url": "https://github.com/org/repo/pull/42"
      }
    ]
  }
}
```

**Performance:** p95 < 800ms (GitHub API latency, cached: < 10ms)

---

### 5. file_changelog

Get commit history for a specific file (last N commits).

**Input Schema:**
```json
{
  "file_path": "string (required)",
  "limit": "integer (default: 20, max: 100)",
  "session_id": "string (optional)"
}
```

**Output:**
```json
{
  "tool_name": "file_changelog",
  "result": {
    "file_path": "backend/app.py",
    "commits": [
      {
        "hash": "abc123def456",
        "author": "alice@example.com",
        "date": "2024-03-15T10:30:00Z",
        "message": "Add health check endpoint",
        "lines_changed": 15
      }
    ],
    "total_commits": 20
  }
}
```

**Performance:** p95 < 600ms (cached: < 10ms)

---

### 6. rationale_for_commit

Get detailed information and rationale for a specific commit (includes linked PR).

**Input Schema:**
```json
{
  "commit_hash": "string (required, can be 'HEAD')",
  "session_id": "string (optional)"
}
```

**Output:**
```json
{
  "tool_name": "rationale_for_commit",
  "result": {
    "commit_hash": "abc123def456",
    "message": "Add caching layer for MCP tools",
    "author": "bob@example.com",
    "date": "2024-03-10T09:15:00Z",
    "linked_pr": {
      "number": 42,
      "title": "Add caching layer",
      "body": "Implements LRU cache...",
      "reviewers": ["alice@example.com"]
    },
    "referenced_issues": ["#123"]
  }
}
```

**Performance:** p95 < 700ms (GitHub API, cached: < 10ms)

---

### 7. incident_for_file

Get incidents (issues, bugs, reverts) related to a specific file.

**Input Schema:**
```json
{
  "file_path": "string (required)",
  "days": "integer (default: 90)",
  "session_id": "string (optional)"
}
```

**Output:**
```json
{
  "tool_name": "incident_for_file",
  "result": {
    "file_path": "backend/app.py",
    "incidents": [
      {
        "date": "2024-02-20",
        "summary": "Memory leak in cache manager",
        "link": "https://github.com/org/repo/issues/89",
        "severity": "high"
      }
    ],
    "total_incidents": 3
  }
}
```

**Performance:** p95 < 750ms (cached: < 10ms)

---

### 8. emit_event (Special Tool)

Emit a structured event to the WebSocket bridge for dashboard display.

**Input Schema:**
```json
{
  "event_type": "string (required)",
  "event_data": "object (required)",
  "session_id": "string (optional, auto-generated if not provided)"
}
```

**Output:**
```json
{
  "tool_name": "emit_event",
  "result": {
    "session_id": "abc-123",
    "event_id": "evt_456",
    "broadcasted": true
  }
}
```

**Note:** This tool is **not cacheable** (side effects).

---

## Request/Response Format

### MCP Tool Invocation

**Endpoint:** `POST /mcp/invoke`

**Request:**
```json
{
  "tool_name": "git_blame_summary",
  "arguments": {
    "file_path": "backend/app.py",
    "session_id": "my-session-123"
  }
}
```

**Response (Success):**
```json
{
  "tool_name": "git_blame_summary",
  "result": { /* tool-specific output */ },
  "error": null
}
```

**Response (Error):**
```json
{
  "tool_name": "git_blame_summary",
  "result": {},
  "error": "File not found: backend/missing.py"
}
```

**Headers:**
- `X-Cache: HIT` or `X-Cache: MISS` (indicates cache status)
- `Content-Type: application/json`

---

## Error Codes

| HTTP Code | Meaning | Example |
|-----------|---------|---------|
| 200 | Success | Tool executed successfully |
| 403 | Forbidden | Allow-list violation (blocked file path or repo) |
| 404 | Not Found | Tool name not recognized |
| 422 | Validation Error | Invalid input schema |
| 500 | Internal Error | Unexpected server error |

### Error Response Format

```json
{
  "detail": "Access to file path '.env' is blocked by allow-list"
}
```

---

## Allow-List Configuration

The server enforces resource access restrictions via `.onboardops/allowlist.yaml`.

### Example Configuration

```yaml
version: "1.0"

allowed_repositories:
  - "fastapi/full-stack-fastapi-template"
  - "your-org/*"  # Wildcard support

allowed_github_orgs:
  - "fastapi"

blocked_paths:
  - ".env*"
  - "*.key"
  - "secrets/*"

rate_limits:
  git_blame_summary: 60  # calls per minute
  pr_for_file: 30

security:
  require_auth: false
  max_file_size: 1048576  # 1 MB
  max_changelog_commits: 100
```

### Hot-Reload

Send `SIGHUP` to the server process to reload the allow-list without restart:

```bash
kill -HUP $(pgrep -f "uvicorn app:app")
```

---

## Performance Characteristics

### Latency Targets

All tools target **p95 < 800ms** (cold cache).

| Tool | p50 (cold) | p95 (cold) | p95 (warm) |
|------|------------|------------|------------|
| git_blame_summary | 200ms | 500ms | < 10ms |
| commit_frequency | 150ms | 400ms | < 10ms |
| recent_authors | 100ms | 300ms | < 10ms |
| pr_for_file | 400ms | 750ms | < 10ms |
| file_changelog | 250ms | 550ms | < 10ms |
| rationale_for_commit | 350ms | 650ms | < 10ms |
| incident_for_file | 300ms | 700ms | < 10ms |

### Observability

**Metrics Endpoint:** `GET /metrics`

Returns:
- Per-tool call counts
- Per-tool latency (p50, p95, p99)
- Cache hit rates
- Eviction rates
- Uptime

**Cache Stats Endpoint:** `GET /cache/stats`

Returns:
- Total cache entries
- Unique sessions
- Per-tool breakdown
- Hit rate percentage
- Eviction rate percentage
- Average entry age

---

## Caching Behavior

### Cache Key

Cache entries are keyed by: `(session_id, tool_name, input_hash)`

### LRU Eviction

- **Max entries per session:** 1000
- **Eviction policy:** Least Recently Used (LRU)
- **Session lifetime:** 30 minutes of inactivity

### Cache Headers

Every response includes `X-Cache` header:
- `HIT`: Result served from cache
- `MISS`: Result computed fresh

### Non-Cacheable Tools

- `emit_event` (side effects)

---

## Integration Examples

### Python (httpx)

```python
import httpx

client = httpx.Client(base_url="http://localhost:8765")

response = client.post("/mcp/invoke", json={
    "tool_name": "git_blame_summary",
    "arguments": {
        "file_path": "backend/app.py",
        "session_id": "my-session"
    }
})

result = response.json()
print(result["result"])
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:8765/mcp/invoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool_name: 'commit_frequency',
    arguments: {
      file_path: 'backend/app.py',
      days: 180,
      session_id: 'my-session'
    }
  })
});

const data = await response.json();
console.log(data.result);
```

### Bob IDE Integration

Add to `.bob/mcp.json`:

```json
{
  "mcpServers": {
    "institutional-knowledge": {
      "url": "http://127.0.0.1:8765/mcp",
      "transport": "http"
    }
  }
}
```

### WebSocket Event Stream

```javascript
const ws = new WebSocket('ws://localhost:8765/events?session_id=my-session');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.event_type, data.event_data);
};
```

---

## Support

For issues or questions:
- **GitHub Issues:** [OnboardOps Repository](https://github.com/your-org/onboardops)
- **Documentation:** See `backend/README.md` for setup
- **Performance Tuning:** See `docs/perf-results.md`

---

**Made with Bob** 🤖  
*OnboardOps MCP Server v1.0.0*