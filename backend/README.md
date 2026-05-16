# OnboardOps Backend

FastAPI-based Institutional Knowledge MCP Server with WebSocket bridge for real-time event streaming.

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Git

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd onboardops
   ```

2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Create and activate a virtual environment**:
   
   **Windows (PowerShell):**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   
   **macOS/Linux:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables** (optional for Phase 1):
   ```bash
   cp .env.example .env
   # Edit .env and add your GitHub token if needed
   ```

### Running the Server

Start the FastAPI development server:

```bash
uvicorn app:app --port 8765 --reload
```

The server will start on `http://127.0.0.1:8765`

### Verify Installation

**Health Check:**
```bash
curl http://localhost:8765/health
```

Expected response:
```json
{"status":"ok","service":"onboardops-mcp-server","version":"1.0.0"}
```

**MCP Discovery (list available tools):**
```bash
curl -X POST http://localhost:8765/mcp
```

**Test a specific MCP tool:**
```bash
curl -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "git_blame_summary",
    "arguments": {
      "file_path": "src/main.py"
    }
  }'
```

### WebSocket Connection

The WebSocket endpoint for real-time events is available at:
```
ws://localhost:8765/events
```

Test with a WebSocket client or use the frontend dashboard (see `../frontend/README.md`).

## Project Structure

```
backend/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── mcp/                  # MCP contracts and schemas
│   ├── __init__.py
│   └── contracts.py      # Pydantic models for all 7 tools
├── tools/                # MCP tool implementations
│   ├── __init__.py
│   ├── git_blame_summary.py
│   ├── commit_frequency.py
│   ├── recent_authors.py
│   ├── pr_for_file.py
│   ├── file_changelog.py
│   ├── rationale_for_commit.py
│   └── incident_for_file.py
└── ws/                   # WebSocket event schemas
    ├── __init__.py
    └── events.py
```

## Available MCP Tools

The server exposes 7 institutional knowledge tools:

1. **git_blame_summary** - Get git blame summary for a file
2. **commit_frequency** - Get commit frequency statistics
3. **recent_authors** - Get recent contributors
4. **pr_for_file** - Get pull requests that modified a file
5. **file_changelog** - Get commit history for a file
6. **rationale_for_commit** - Get detailed commit information
7. **incident_for_file** - Get incidents related to a file

All tools currently return deterministic mock data for Phase 1 development.

## Development

### Running Tests

```bash
pytest
```

### Code Quality

The project uses pre-commit hooks for code quality:

```bash
# Install hooks (one time)
pre-commit install

# Run manually
pre-commit run --all-files
```

### API Documentation

**Comprehensive MCP API Documentation:** See [`docs/mcp-api.md`](../docs/mcp-api.md) for:
- Full tool catalog with request/response examples
- Error code reference
- Allow-list configuration guide
- Performance characteristics
- Integration examples for Python, JavaScript, and Bob IDE

**Interactive API Docs:** Once the server is running, visit:
- Swagger UI: http://localhost:8765/docs
- ReDoc: http://localhost:8765/redoc

## Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8765
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8765 | xargs kill -9
```

**Import errors:**
Make sure your virtual environment is activated and dependencies are installed.

**WebSocket connection fails:**
Ensure the backend server is running and CORS is properly configured for your frontend origin.

## Error Handling

All MCP tools return structured errors instead of raising exceptions. This enables graceful degradation in Bob skills.

### Error Response Format

```python
{
    "error_code": "GIT_COMMAND_ERROR",
    "message": "Failed to execute git blame: file not found",
    "retryable": false,
    "details": {
        "file_path": "src/missing.py",
        "command": "git blame"
    }
}
```

### Error Codes

| Code | Description | Retryable | Common Causes |
|------|-------------|-----------|---------------|
| `GIT_COMMAND_ERROR` | Git operation failed | No | File not found, invalid repo |
| `FILE_NOT_FOUND` | Requested file doesn't exist | No | Typo, deleted file |
| `NETWORK_ERROR` | Network request failed | Yes | Connection timeout, DNS failure |
| `RATE_LIMIT` | API rate limit exceeded | Yes | Too many requests |
| `TIMEOUT` | Operation timed out | Yes | Slow network, large file |
| `REPO_NOT_CONFIGURED` | Demo repo not set | No | Missing DEMO_REPO_PATH |
| `UNKNOWN_ERROR` | Unexpected error | No | Internal server error |

### Retry Semantics

Network operations (GitHub API calls) automatically retry with exponential backoff:
- **Retry delays:** 1s, 2s, 4s (max 3 attempts)
- **Retryable errors:** Network errors, timeouts, rate limits (503)
- **Non-retryable errors:** 404 Not Found, 401 Unauthorized, 400 Bad Request

Example retry behavior:
```python
# First attempt fails with 503 → wait 1s → retry
# Second attempt fails with 503 → wait 2s → retry
# Third attempt fails with 503 → wait 4s → retry
# Fourth attempt fails → return structured error
```

### Health Check Endpoints

Each tool has a self-test endpoint for preflight verification:

```bash
# Check if git_blame_summary is healthy
curl http://localhost:8765/tools/git_blame_summary/healthz

# Response on success (200 OK):
{"status": "healthy", "tool": "git_blame_summary"}

# Response on failure (503 Service Unavailable):
{
    "status": "unhealthy",
    "tool": "git_blame_summary",
    "error": "Demo repo not configured"
}
```

**Available health check endpoints:**
- `/tools/git_blame_summary/healthz`
- `/tools/commit_frequency/healthz`
- `/tools/recent_authors/healthz`
- `/tools/pr_for_file/healthz`
- `/tools/file_changelog/healthz`
- `/tools/rationale_for_commit/healthz`
- `/tools/incident_for_file/healthz`

**Preflight script integration:**
```bash
# scripts/preflight.sh checks all 7 health endpoints
for tool in git_blame_summary commit_frequency recent_authors pr_for_file file_changelog rationale_for_commit incident_for_file; do
    curl -f http://localhost:8765/tools/$tool/healthz || exit 1
done
```

## Phase 3 Status (T2.4 - T2.7 Complete)

✅ All 7 MCP tools fully implemented with real data
✅ Allow-list configuration with hot-reload (T2.4)
✅ Performance tuning - all tools p95 < 800ms (T2.5)
✅ LRU cache eviction + observability (T2.6)
✅ Comprehensive API documentation (T2.7)
✅ WebSocket event broadcasting
✅ Session management with 30-minute timeout
✅ Structured logging and metrics

## Phase 4 Status (T2.1 - T2.6 Complete)

✅ Structured error handling for all 7 tools (T2.2)
✅ Stress test infrastructure - 50 sessions × 20 tools (T2.3)
✅ GitHub API retry with exponential backoff (T2.4)
✅ Health check endpoints for preflight verification (T2.5)
✅ Comprehensive error documentation (T2.6)

## Stretch Goals (T2.8 - T2.9)

⏳ Slack integration (`slack_thread_for_topic`)
⏳ Linear integration (`linear_issue_for_file`)

---

**Made with Bob** 🤖