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

Once the server is running, visit:
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

## Phase 1 Status

✅ FastAPI application scaffold  
✅ Health check endpoint  
✅ MCP discovery endpoint  
✅ WebSocket event stream  
✅ All 7 MCP tool contracts defined  
✅ All 7 MCP tools stubbed with mock data  
✅ Pre-commit hooks configured  

## Next Steps (Phase 2)

- Implement real Git analysis logic
- Connect to GitHub API for PR data
- Implement WebSocket event broadcasting
- Add authentication and rate limiting

---

**Made with Bob** 🤖