# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Advanced Mode Capabilities

Advanced mode has access to MCP and Browser tools in addition to standard coding tools.

## Non-Obvious Coding Rules

### Backend (Python)
- **Cache keys are session-scoped**: [`cache_manager.py`](../../backend/cache_manager.py:46-48) uses `(session_id, tool_name, input_hash)` - never assume global cache
- **Lazy imports for circular deps**: [`session_manager.py`](../../backend/session_manager.py:20-26) imports observability lazily - use same pattern if adding cross-module dependencies
- **Pydantic models are contracts**: All MCP tool I/O in [`mcp/contracts.py`](../../backend/mcp/contracts.py) - changes break Bob integration
- **Tests must run from backend/**: `cd backend && pytest` - pythonpath is relative, running from root fails

### Frontend (Next.js 16)
- **This is NOT standard Next.js**: Read `node_modules/next/dist/docs/` before coding - APIs changed significantly
- **IBM colors only**: Use `ibm-blue-60`, `ibm-gray-10` etc. - standard Tailwind colors (`blue-500`) won't match design system
- **Zustand auto-prunes**: [`events.ts`](../../frontend/src/store/events.ts:70) keeps last 100 events only - don't rely on full history
- **No test runner exists**: `npm test` only runs lint + typecheck - actual tests not implemented yet

### Bob Configuration
- **YAML front matter is enforced**: Skills/modes must have exact fields - Bob validates on load
- **Rules loaded once**: [`.bob/skills/repo-cartography.md`](../../.bob/skills/repo-cartography.md:13-18) loads 3 rule files once - don't duplicate content
- **Socratic stance is mandatory**: [`onboard.md`](../../.bob/modes/onboard.md:23) forbids code writing except during Starter PR - redirect to discovery

### MCP Integration
- **emit_event session IDs**: [`emit_event.py`](../../backend/tools/emit_event.py:66-92) creates a fresh session for `session_start`; Bob should reuse the returned `session_id` on every later dashboard event
- **WebSocket broadcasts are session-scoped**: Events only go to clients subscribed to that session_id
- **SIGHUP reloads allowlist**: [`allowlist_manager.py`](../../backend/allowlist_manager.py:52-55) hot-reloads on SIGHUP (Unix only) - no restart needed

### Scripts
- **JSON to stdout, human to log**: [`bootstrap.sh`](../../scripts/bootstrap.sh:29-56) emits structured JSON to stdout for parsing - don't mix formats
- **Idempotence required**: All bootstrap stages must be re-runnable without side effects

## Build/Test Commands

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest                      # Must run from backend/ directory

# Frontend  
cd frontend
npm install
npm run dev                 # Development server
npm run build              # Production build
npm test                   # Lint + typecheck only (no actual tests)

# Both
make install               # Install all dependencies
make dev                   # Start both servers
make test                  # Run all tests
```

## Critical Gotchas

1. **Port 8765 must be free**: Backend MCP server fails silently if port in use - check with `lsof -i :8765`
2. **Session IDs must propagate**: [`emit_event`](../../backend/tools/emit_event.py:66-92) has a fallback for omitted IDs, but Bob should pass the `session_start` ID to every later event
3. **Cache is NOT global**: [`cache_manager.py`](../../backend/cache_manager.py:46-48) scopes cache to `(session_id, tool_name, input_hash)`
4. **Makefile targets are stubs**: Many targets warn if files missing - not all features implemented yet
