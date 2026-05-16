    # AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Plan Mode Purpose

Plan mode is for designing, strategizing, and breaking down complex problems before implementation.

## Non-Obvious Architectural Constraints

### Hidden Coupling
- **Session IDs propagate everywhere**: [`emit_event`](../../backend/tools/emit_event.py:66-77) auto-creates sessions - all downstream code assumes this
- **Cache is session-scoped**: [`cache_manager.py`](../../backend/cache_manager.py:46-48) keys on `(session_id, tool_name, input_hash)` - not global
- **WebSocket broadcasts are session-filtered**: Events only go to clients subscribed to that `session_id` - no cross-session leakage
- **Lazy imports break circular deps**: [`session_manager.py`](../../backend/session_manager.py:20-26) imports observability lazily - pattern required for cross-module dependencies

### Undocumented Architectural Decisions
- **MCP tools are read-only by design**: All 7 git analysis tools in `backend/tools/` never mutate repository - enforced by allowlist
- **Bootstrap is idempotent by requirement**: All 5 stages in [`bootstrap.sh`](../../scripts/bootstrap.sh) must be re-runnable - auto-recovery depends on this
- **Frontend is observer-only**: Dashboard receives events via WebSocket but never sends commands back - one-way data flow
- **Bob Shell piping is non-interactive**: Scripts emit JSON to stdout for Bob to parse - no interactive prompts allowed

### Non-Standard Patterns
- **Pydantic models are API contracts**: [`mcp/contracts.py`](../../backend/mcp/contracts.py) defines MCP tool I/O - changes break Bob integration
- **YAML front matter is enforced**: [`.bob/modes/onboard.md`](../../.bob/modes/onboard.md) and skills have strict schema - Bob validates on load
- **Rules loaded once for token economy**: [`.bob/skills/repo-cartography.md`](../../.bob/skills/repo-cartography.md:13-18) loads 3 rule files once - don't duplicate
- **Socratic stance is mandatory**: [`onboard.md`](../../.bob/modes/onboard.md:23) forbids code writing except during Starter PR - architectural constraint, not preference

### Performance Bottlenecks
- **Zustand auto-prunes at 100 events**: [`events.ts`](../../frontend/src/store/events.ts:70) keeps last 100 only - older events lost
- **LRU cache evicts at 1000 entries**: [`cache_manager.py`](../../backend/cache_manager.py:22) per-session limit - high-frequency tools may thrash
- **WebSocket reconnect is exponential**: Hardcoded 1s, 2s, 4s, 8s backoff - not configurable
- **Session timeout is 30 minutes**: [`session_manager.py`](../../backend/session_manager.py:44) inactivity timeout - no extension mechanism

### Integration Constraints
- **Port 8765 is hardcoded**: Backend MCP server port - conflicts require code changes, not config
- **CORS allows localhost only**: [`app.py`](../../backend/app.py:65-71) restricts to `localhost:3000` - no remote dashboard access
- **SIGHUP reload is Unix-only**: [`allowlist_manager.py`](../../backend/allowlist_manager.py:48-55) hot-reload doesn't work on Windows
- **Next.js 16 has breaking changes**: [`frontend/AGENTS.md`](../../frontend/AGENTS.md) warns APIs differ from training data - read docs first

## Architectural Principles

1. **Token economy drives design**: 200 Bobcoin budget shapes all cartography and certification flows
2. **Auto-recovery is first-class**: Bootstrap engine designed for self-healing, not manual intervention
3. **Socratic over imperative**: Onboard mode guides discovery, doesn't provide answers (except Starter PR)
4. **Session isolation**: All state (cache, events, WebSocket) scoped to session_id - no global state
5. **Idempotence everywhere**: All mutations (bootstrap, file writes) must be safely re-runnable