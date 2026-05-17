# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Ask Mode Purpose

Ask mode is for explanations, documentation, and answering questions without making code changes.

## Non-Obvious Documentation Context

### Project Structure Gotchas
- **`.bob/` contains Bob IDE config**: Not a typo for `.bob` - this is the standard Bob IDE configuration directory
- **`bob_sessions/` are exported sessions**: These are NOT logs - they're exported Bob IDE task sessions for hackathon judging
- **`scripts/` drives Bob Shell**: These scripts are designed to be piped through Bob Shell for auto-recovery, not run directly
- **`docs/` has LaTeX sources**: Phase documents are `.tex` files that compile to PDF - not markdown

### Hidden Documentation
- **MCP contracts in code**: [`backend/mcp/contracts.py`](../../backend/mcp/contracts.py) is the canonical API reference - not in docs/
- **Bob mode behavior in YAML**: [`.bob/modes/onboard.md`](../../.bob/modes/onboard.md) front matter defines mode constraints - not just metadata
- **Cartography rules are templates**: [`.bob/rules/remediation-templates.md`](../../.bob/rules/remediation-templates.md) contains pre-written text to save tokens - not examples

### Counterintuitive Organization
- **Backend is MCP server**: `backend/` is NOT a web API - it's an MCP server that Bob IDE connects to
- **Frontend is dashboard**: `frontend/` is NOT the main UI - it's a live monitoring dashboard for onboarding sessions
- **Scripts are automation**: `scripts/` contains Bob Shell drivers and bootstrap automation - not one-off utilities

### Important Context Not in README
- **Bobcoin economy is real**: 200 Bobcoin budget is enforced by IBM - not a suggestion
- **Session IDs must propagate**: [`emit_event`](../../backend/tools/emit_event.py:66-92) creates a fresh `session_start`; Bob should reuse that returned ID for later dashboard events
- **Cache is session-scoped**: [`cache_manager.py`](../../backend/cache_manager.py:46-48) uses `(session_id, tool_name, input_hash)` - not global
- **Rules loaded once**: [`.bob/skills/repo-cartography.md`](../../.bob/skills/repo-cartography.md:13-18) loads 3 rule files once to save tokens

### Architecture Clarifications
- **Three separate processes**: Bob IDE (host) + Backend MCP server (localhost:8765) + Frontend dashboard (localhost:3000)
- **MCP is the protocol**: Model Context Protocol connects Bob to the backend - not a custom API
- **WebSocket is one-way**: Backend broadcasts to frontend - frontend doesn't send commands back
- **Bootstrap is idempotent**: All stages can be re-run safely - designed for auto-recovery

## Key Files for Understanding

- **Architecture**: [`docs/architecture.svg`](../../docs/architecture.svg) - visual system diagram
- **MCP API**: [`docs/mcp-api.md`](../../docs/mcp-api.md) - tool signatures and examples
- **Bob contracts**: [`docs/bob-contracts.md`](../../docs/bob-contracts.md) - integration points
- **Demo storyboard**: [`docs/demo-storyboard.md`](../../docs/demo-storyboard.md) - 60-second demo script
