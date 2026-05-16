# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Product Overview
**OnboardOps** - The 10-Minute Repo Whisperer: An AI-driven engineering onboarding accelerator built on IBM Bob IDE that reduces new hire ramp-up time from months to 10 minutes.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      IBM Bob IDE (Host)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .bob/ Configuration (Project-Scoped)                  │ │
│  │  ├── modes/onboard.md      (Custom /onboard mode)     │ │
│  │  ├── skills/               (Cartography, Cert, etc.)  │ │
│  │  └── mcp.json              (MCP server binding)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ MCP Protocol
┌─────────────────────────────────────────────────────────────┐
│  Backend (FastAPI) - localhost:8765                         │
│  ├── MCP Server (Institutional Knowledge)                   │
│  │   └── 7 tools: git_blame, commit_freq, pr_for_file...  │
│  └── WebSocket Bridge (/events)                             │
└─────────────────────────────────────────────────────────────┘
                              ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js) - localhost:3000                        │
│  └── Live Dashboard (Stopwatch, Cards, Certification)       │
└─────────────────────────────────────────────────────────────┘
```

## Key Directories

- **`.bob/`** - Bob IDE configuration (modes, skills, MCP bindings)
  - `modes/` - Custom Bob modes (onboard.md)
  - `skills/` - Reusable instruction recipes (cartography, certification)
  - `commands/` - Slash command definitions
  - `rules/` - Project-specific rules for Bob
- **`backend/`** - Python FastAPI MCP server + WebSocket bridge
- **`frontend/`** - Next.js dashboard for live onboarding visualization
- **`scripts/`** - Bootstrap and automation scripts (Bob Shell drivers)
- **`docs/`** - SRS, storyboard, architecture diagrams
- **`bob_sessions/`** - Exported Bob task sessions for hackathon judging
- **`notes/`** - Development notes, friction audits

## Non-Obvious Patterns (Discovered by Reading Code)

### Backend Critical Patterns
- **Session-scoped caching**: [`cache_manager.py`](backend/cache_manager.py) uses `(session_id, tool_name, input_hash)` as cache key - cache is NOT global
- **Auto-session creation**: [`emit_event`](backend/tools/emit_event.py) auto-creates session if `session_id` is None - Bob doesn't need to manage sessions explicitly
- **Lazy logger import**: [`session_manager.py`](backend/session_manager.py:20-26) uses lazy import to avoid circular dependency with observability module
- **SIGHUP hot-reload**: [`allowlist_manager.py`](backend/allowlist_manager.py:48-55) reloads config on SIGHUP signal (Unix only) - no restart needed
- **Structured JSON logging**: [`bootstrap.sh`](scripts/bootstrap.sh:29-56) emits JSON to stdout, human-readable to log file - parse stdout for automation

### Frontend Critical Patterns
- **Next.js 16 breaking changes**: [`frontend/AGENTS.md`](frontend/AGENTS.md) warns this is NOT standard Next.js - read `node_modules/next/dist/docs/` before coding
- **IBM Design System colors**: Use `ibm-blue-60`, `ibm-gray-10` etc. in Tailwind classes - NOT standard Tailwind colors
- **Zustand store slicing**: [`events.ts`](frontend/src/store/events.ts:54-80) keeps last 100 events only - older events auto-pruned
- **WebSocket exponential backoff**: Reconnect at 1s, 2s, 4s, 8s intervals - hardcoded, not configurable

### Bob Configuration Critical Patterns
- **Rules loaded once per session**: [`.bob/skills/repo-cartography.md`](.bob/skills/repo-cartography.md:13-18) loads 3 rule files once to save tokens - don't repeat
- **Skill YAML front matter caps**: `output_token_cap: 700`, `session_bobcoin_cap: 25` - enforced by Bob, not suggestions
- **Socratic stance exception**: [`onboard.md`](.bob/modes/onboard.md:23) allows code writing ONLY during Starter PR generation - redirect all other requests
- **Four-part greeting contract**: [`onboard.md`](.bob/modes/onboard.md:25-45) requires exact 4-element structure in first response - not optional

### Testing & Commands
- **Backend tests from root fail**: Must `cd backend && pytest` - pythonpath is relative to backend/
- **Frontend has no test runner**: `npm test` only runs lint + typecheck - no actual tests exist yet
- **Makefile targets are stubs**: Many targets check for file existence and warn if missing - not all features implemented

## Bobcoin Economy (CRITICAL)
- **Total budget: 200 Bobcoins** (40 per team member)
- **Reserve 25% (50 coins) for final demo and video**
- **Target per onboarding session: ≤15 Bobcoins**
- Cartography skill capped at 25 Bobcoins per session
- Export Bob sessions immediately after completion (not retrospectively)

## Development Workflow
1. Phase 1 (H+0 to H+2): Foundation & stubs - **NO production logic**
2. Phase 2+: Feature implementation
3. All Bob sessions must be exported to `bob_sessions/` for judging

## Important Notes
- This is the **team's AGENTS.md** (for working ON OnboardOps)
- The product GENERATES a different AGENTS.md for end users (personalized repo context)
- Bob's `/init` command loads this file as persistent context
- Pre-commit hooks enforce: gitleaks (secrets), ruff (Python), formatting