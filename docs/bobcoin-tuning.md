# Bobcoin Tuning - T1.4

Date: 2026-05-15
Owner: Dev 1
Status: Prompt compressed; local MCP/WS slice verified; Bob IDE re-run pending

## Change Summary

The cartography prompt was compressed for the Phase 2 vertical slice.

| Artifact | Before | After | Change |
| --- | ---: | ---: | ---: |
| `.bob/skills/repo-cartography.md` lines | 338 | 131 | -61.2% |
| `.bob/skills/repo-cartography.md` chars | 12,117 | 4,289 | -64.6% |

## What Moved

- Repeated narration, remediation, and token-economy rules now live in
  `.bob/rules/cartography-style.md`, which Bob should load once per session.
- Verbose import examples and full repeated event payloads were replaced with
  concise schemas and pattern descriptions.
- Front matter now includes `output_token_cap`, `stage1_bobcoin_target`, and
  `session_bobcoin_cap` hints for the onboarding prompt.
- Bob-compatible skill folders were added at `.bob/skills/*/SKILL.md` so the
  current IBM Bob skill loader can discover the workflows.

## Re-Run Checklist

1. Open the demo repository in IBM Bob, not the OnboardOps implementation repo.
2. Copy the updated `.bob/` directory into the demo repository.
3. Restart or reload Bob so it reads `.bob/custom_modes.yaml`.
4. Start backend and frontend services.
5. Run `/onboard`.
6. Record Stage 1 Bobcoin spend below.

## Measurement

| Run | Stage 1 Bobcoins | Notes |
| --- | ---: | --- |
| Before T1.4 | _pending from T1.3 export_ | Use `bob_sessions/dev1/01_vertical-slice.md` once exported. |
| After T1.4 | _pending re-run_ | Target is at most 2 Bobcoins for Stage 1. |

## Local Verification

- Bob MCP config validates as JSON and uses `type: streamable-http`.
- Backend accepts JSON-RPC `initialize`, `tools/list`, and `tools/call` at `/mcp`.
- `tools/list` returns 8 tools, including `emit_event`.
- A JSON-RPC `tools/call` to `emit_event` successfully emits a
  `card_emit/dependency_graph` event.
- A WebSocket subscriber on `/events?session_id=t1-3-local-smoke` receives the
  dependency graph card.
- Frontend lint and production build pass.

## Acceptance

- Target: Stage 1 consumes at most 2 Bobcoins.
- Current state: ready to record the actual Bobcoin number in Bob IDE after
  `/onboard` runs.
