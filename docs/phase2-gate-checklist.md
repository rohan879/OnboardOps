# Phase 2 Gate Checklist

**Gate**: H+10 vertical-slice review
**Last updated**: 2026-05-16
**Owner**: Dev 1  
**Current state**: Code complete and locally verified; live Bob IDE/demo evidence still must be captured on the demo machine.

## How To Read This

- **Code status** means the repo contains the implementation or supporting artifact.
- **Local verification** means the implementation was tested without a live Bob IDE session.
- **Demo evidence** means screenshots, Bob session exports, Bobcoin numbers, and video captured from the real `/onboard` flow. These cannot be honestly filled in from local repo inspection alone.

## P0 Gate Criteria

| Gate | Owner | Code status | Local verification | Demo evidence |
| --- | --- | --- | --- | --- |
| G2.1 Socratic `/onboard` greeting | Dev 1 | Complete | Config validated | Pending Bob IDE screenshot |
| G2.2 Real MCP tool call | Dev 2 | Complete | JSON-RPC `/mcp` smoke ready | Pending Bob log from demo repo |
| G2.3 Dashboard dependency graph card | Dev 3 | Complete | Frontend build/lint and WS smoke ready | Pending dashboard screenshot |
| G2.4 Four-stage cartography flow | Dev 1 | Complete | Stage payloads defined | Pending full Bob session export |
| G2.5 Socratic question loop | Dev 1 | Complete | `question_ask` event path added | Pending correct/wrong-answer transcript |
| G2.6 Bobcoin spend measured | Dev 1 | Template and tuning doc complete | Prompt compression measured | Pending real Bobcoin screenshot |
| G2.7 Bob session exports | Dev 5 plus all devs | Export pipeline present | Session folders indexed | Pending real exports from at least two devs |

## Developer Completion Status

| Dev | Phase 2 scope | Status | Remaining evidence |
| --- | --- | --- | --- |
| Dev 1 | Bob mode, cartography, `/onboard`, T1.3/T1.4 | Code complete | Real Bob IDE `/onboard` run, Bobcoin screenshot, final exported transcript |
| Dev 2 | MCP tools, caching, metrics, WebSocket bridge | Code complete | Backend logs from live Bob tool calls |
| Dev 3 | Dashboard, card rendering, replay-facing UI | Code complete | Browser screenshot from live event stream |
| Dev 4 | Bootstrap, demo repo selection, recovery scripts | Code complete | Timed bootstrap run on selected demo repo |
| Dev 5 | Telemetry, scrub/export, replay, AGENTS.md, starter PR | Code complete | Captured demo recording and slide screenshots |

## Deliverables Present

### Code Artifacts

- [x] `.bob/modes/onboard.md` - Socratic mentor mode
- [x] `.bob/commands/onboard.md` - Bob slash command fallback
- [x] `.bob/custom_modes.yaml` - Bob custom mode registration
- [x] `.bob/skills/repo-cartography.md` - Stage 1 real path plus Stages 2-4 stubs
- [x] `.bob/skills/repo-cartography/SKILL.md` - Bob-compatible skill folder
- [x] `.bob/skills/certification.md` - certification templates
- [x] `.bob/skills/certification/SKILL.md` - Bob-compatible skill folder
- [x] `.bob/rules/cartography-style.md` - token-economy style rules
- [x] `.bob/mcp.json` - streamable HTTP MCP binding for IBM Bob
- [x] `backend/app.py` - FastAPI MCP server and JSON-RPC compatibility
- [x] `backend/mcp/contracts.py` - Pydantic tool contracts
- [x] `backend/tools/*.py` - MCP tool implementations
- [x] `backend/ws/events.py` - WebSocket event bridge
- [x] `frontend/src/app/page.tsx` - live dashboard
- [x] `frontend/src/app/replay/page.tsx` - replay mode
- [x] `frontend/src/hooks/useEvents.ts` - WebSocket client
- [x] `scripts/bootstrap.sh` - bootstrap script
- [x] `scripts/start-integration-test.sh` - Unix startup automation
- [x] `scripts/stop-integration-test.sh` - Unix shutdown automation
- [x] `scripts/start-integration-test.ps1` - Windows startup automation
- [x] `scripts/stop-integration-test.ps1` - Windows shutdown automation
- [x] `scripts/telemetry.py` - JSONL telemetry capture
- [x] `scripts/export_bob_sessions.py` - session export/index pipeline
- [x] `scripts/generate_agents_md.py` - AGENTS.md generator
- [x] `scripts/open_starter_pr.py` - starter PR opener

### Documentation

- [x] `AGENTS.md` - team context file
- [x] `README.md` - project overview and setup
- [x] `docs/bob-contracts.md` - MCP/event contracts
- [x] `docs/prompt-patterns.md` - prompt engineering patterns
- [x] `docs/phase2-integration-test-plan.md` - T1.3 plan
- [x] `docs/bobcoin-tracking-t1.3.md` - Bobcoin capture template
- [x] `docs/bobcoin-tuning.md` - T1.4 compression results
- [x] `docs/T1.3-QUICK-START.md` - integration quick start
- [x] `docs/T1.3-IMMEDIATE-STEPS.md` - `/onboard` troubleshooting
- [x] `docs/phase2-gate-checklist.md` - this gate sheet
- [x] `notes/demo-repo-friction.md` - demo repo friction audit
- [x] `bob_sessions/dev1/README.md` - Dev 1 export guidelines
- [x] `bob_sessions/dev2/README.md` - Dev 2 status/export notes
- [x] `bob_sessions/dev3/README.md` - Dev 3 status/export notes
- [x] `bob_sessions/dev4/README.md` - Dev 4 status/export notes
- [x] `bob_sessions/dev5/README.md` - Dev 5 status/export notes

## Manual Evidence To Capture

1. Open the selected demo repository in IBM Bob.
2. Copy or sync the current `.bob/` directory into that demo repository.
3. Start backend and frontend with `scripts/start-integration-test.ps1` on Windows or `scripts/start-integration-test.sh` on Unix.
4. Run `/onboard` in Bob. If Bob does not list the command, follow `docs/T1.3-IMMEDIATE-STEPS.md` and use the manual invocation fallback only for flow validation.
5. Record the full flow:
   - Bob greeting and four-stage cartography transcript.
   - Backend log showing `git_blame_summary` and `emit_event`.
   - Dashboard graph card with at least 5 nodes and 5 edges.
   - Socratic question, one wrong answer remediation, and one correct answer.
   - Bobcoin usage screenshot.
6. Export Bob sessions into `bob_sessions/devN/`.
7. Run `make export-bob-sessions` or `python scripts/export_bob_sessions.py` to scrub and regenerate the session index.

## Gate Decision

The repository is ready for the Phase 2 gate from a code and local-integration standpoint. The only remaining Phase 2 blockers are physical/demo artifacts that require a real Bob IDE run on the demo repository: screenshots, Bobcoin spend, live transcript export, and the first captured demo recording.
