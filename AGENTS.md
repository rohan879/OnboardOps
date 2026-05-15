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

## Coding Conventions

### Bob Configuration Files
- All `.bob/` files are **markdown with YAML front matter**
- Mode files must declare: `name`, `slug`, `description`, `skills`, `mcp_servers`
- Skill files must declare: `name`, `description`, `auto_activate`
- Keep Socratic stance: guide, don't code (except in explicit PR generation)

### Backend (Python)
- FastAPI for MCP server and WebSocket bridge
- Pydantic models for all MCP tool contracts
- Port 8765 for MCP server (configurable via `ONBOARDOPS_MCP_PORT`)
- All tools must be **read-only** (no git mutations)

### Frontend (Next.js)
- Port 3000 for dashboard
- IBM Design System (IBM Plex Sans, IBM Blue #0F62FE)
- WebSocket client with exponential backoff (1s, 2s, 4s, 8s)
- Must work at 1440×900 without horizontal scroll

### General
- **No secrets in repo** - use `.env.example`, never commit `.env`
- **Bobcoin economy** - 200 total budget (40 per dev), reserve 25% for demo
- **Checkpoint-wrapped mutations** - all file writes must be rollback-safe
- **MIT License** - all dependencies must be compatible

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