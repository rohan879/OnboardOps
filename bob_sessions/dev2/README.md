# Dev 2 - Backend / MCP Sessions

**Developer:** Dev 2  
**Role:** Backend / MCP Engineer  
**Primary Ownership:** Institutional Knowledge MCP server, WebSocket bridge, GitHub integration

## Focus Areas

### Phase 1 (H+0 to H+2)
- Backend directory setup and virtualenv
- MCP tool contract definitions (7 tools)
- FastAPI application scaffolding
- WebSocket event schema
- GitHub authentication setup
- Mock MCP tool implementations
- Pre-commit hooks configuration

### Phase 2 (H+2 to H+10)
- Institutional Knowledge MCP server implementation
- First 3 MCP tools: `git_blame_summary`, `commit_frequency`, `recent_authors`
- WebSocket bridge for real-time events
- Integration with Bob's custom mode

### Phase 3 (H+10 to H+20)
- Remaining 4 MCP tools: `pr_for_file`, `file_changelog`, `rationale_for_commit`, `incident_for_file`
- Event emission pipeline
- Checkpoint/restore mechanism
- Performance optimization

### Phase 4 (H+20 to H+32)
- GitHub API integration for PR generation
- Telemetry and logging
- Production hardening

## Session Exports

### Phase 1 Sessions
1. `01_backend-setup.md` - Virtualenv and dependency installation
2. `02_mcp-contracts.md` - Defining Pydantic models for 7 MCP tools
3. `03_fastapi-scaffold.md` - Basic FastAPI app with health endpoint
4. `04_websocket-events.md` - Event schema design
5. `05_github-auth.md` - Personal access token setup
6. `06_mock-tools.md` - Mock implementations for frontend development
7. `07_precommit-hooks.md` - Secret scanning and linting setup

### Phase 2+ Sessions
(To be added as development progresses)

## Key Deliverables

- `backend/app.py` - FastAPI application entry point
- `backend/mcp/contracts.py` - Pydantic models for all MCP tools
- `backend/mcp/server.py` - MCP server implementation
- `backend/tools/` - Individual tool implementations (7 modules)
- `backend/ws/events.py` - WebSocket event schema
- `backend/ws/bridge.py` - WebSocket bridge for real-time updates
- `backend/requirements.txt` - Python dependencies

## MCP Tools Implemented

1. **git_blame_summary** - Aggregate authorship statistics
2. **commit_frequency** - Temporal activity patterns
3. **recent_authors** - Active contributor identification
4. **pr_for_file** - Pull request history per file
5. **file_changelog** - Detailed change history
6. **rationale_for_commit** - Commit message analysis
7. **incident_for_file** - Bug/incident correlation

## Notes

- All tools return deterministic mock data in Phase 1
- Real implementations use GitPython for repository analysis
- WebSocket events follow a discriminated union pattern
- GitHub token is stored in `.env` (never committed)
- Pre-commit hooks prevent secret leakage