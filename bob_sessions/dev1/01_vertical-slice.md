# T1.3 Vertical Slice Session

Date: 2026-05-15
Owner: Dev 1
Status: Local MCP/WebSocket vertical slice passed; Bob IDE export pending

## Scope

This file records the Phase 2 T1.3 local integration verification for the
OnboardOps `/onboard` path.

The actual IBM Bob task-history export should replace or append to this file
immediately after running `/onboard` inside Bob IDE.

## Local Verification Performed

1. Validated `.bob/mcp.json` as JSON using the current IBM Bob
   `streamable-http` MCP config shape.
2. Validated Bob command/mode/skill front matter.
3. Exercised backend MCP JSON-RPC compatibility at `/mcp`:
   - `initialize`
   - `tools/list`
   - `tools/call`
4. Confirmed `tools/list` returns 8 tools, including `emit_event`.
5. Called `emit_event` through JSON-RPC `tools/call` with a
   `card_emit/dependency_graph` payload.
6. Connected a WebSocket subscriber to `/events?session_id=t1-3-local-smoke`.
7. Confirmed the subscriber received the dependency graph card.
8. Ran frontend lint and production build.

## Local Smoke Output

```text
initialize 200 {'name': 'institutional-knowledge', 'version': '1.0.0'}
tools/list 200 8
has_emit_event True
tools/call 200 True
question/call 200 True
websocket card received Dependency Graph dependency_graph
```

## Verification Commands

```powershell
npm.cmd run lint
npm.cmd run build
```

Both commands passed.

## Bob IDE Export Checklist

After Bob recognizes `/onboard`:

1. Open the demo repository in Bob.
2. Confirm `.bob/commands/onboard.md`, `.bob/custom_modes.yaml`, and
   `.bob/mcp.json` exist in that open repository.
3. Start backend on `http://127.0.0.1:8765`.
4. Start dashboard on `http://localhost:3000`.
5. Run `/onboard`.
6. Confirm the dashboard shows the dependency graph card within 30 seconds.
7. Export the Bob task session and paste or replace this file with the export.
8. Record Bobcoin usage in `docs/bobcoin-tuning.md`.

## Known Limitation

This is not yet the official Bob task-history export. It is the local vertical
slice proof that the MCP, WebSocket bridge, and dashboard card path are ready
for the Bob IDE run.
