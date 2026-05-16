---
name: Repository Cartography
description: Cost-capped four-stage repository map for OnboardOps onboarding
auto_activate: false
output_token_cap: 700
stage1_bobcoin_target: 2
session_bobcoin_cap: 25
---

# Repository Cartography Skill

Load `.bob/rules/cartography-style.md` once, then keep all chat output terse.
Emit dashboard data through the `emit_event` MCP tool whenever it is available.

## Flow

Produce four cards in order:

1. `graph` - real dependency graph from repository files.
2. `entry` - Phase 2 placeholder.
3. `hotspot` - Phase 2 placeholder.
4. `convention` - Phase 2 placeholder.

After each card, ask exactly one checkable Socratic question. In the Phase 2
vertical slice, only the graph question needs answer validation.

## Stage 1: Dependency Graph

Goal: identify top-level Python modules, internal imports, hubs, and cycles.

Steps:

1. Discover Python files at depth 2 or less. Exclude tests, caches, virtualenvs,
   build output, and generated folders. Prefer `src/`, `app/`, `lib/`, then
   root modules. If more than 20 candidates exist, sample the 20 most recently
   changed.
2. Parse imports in one pass. Match `import x`, `from x import y`, and relative
   imports. Keep only internal module edges.
3. Build graph data:
   - `nodes`: `{ id, label, fan_in, fan_out, is_hub }`
   - `edges`: `{ source, target }`
   - `circular_dependencies`: `{ cycle }`
4. Call `emit_event` with `event_type: "card_emit"` and `event_data` containing
   `card_type: "dependency_graph"`, `title: "Dependency Graph"`,
   `body_markdown`, and graph `data`.
5. Narrate in one sentence:
   - Hub: "`<module>` is the hub with `<n>` incoming dependencies."
   - Flat: "The graph is flat across `<n>` loosely coupled modules."
   - Cycle: "`<n>` circular dependencies indicate tight coupling."

Acceptance:

- If the repo has at least 5 Python files, emit at least 5 nodes.
- If internal imports exist, emit at least 5 edges.
- Dashboard receives `CardEmit` within 30 seconds.
- If discovery or parsing fails, emit a partial or empty graph and continue.

## Stage 1 Question Loop

Before asking in chat, call `emit_event` for the question:

```json
{
  "event_type": "question_ask",
  "event_data": {
    "stage": "dependency-graph",
    "question": "Which module has the highest fan-in?",
    "expected_answer_hint": "Compare fan_in values in the graph nodes."
  }
}
```

Ask: **Which module has the highest fan-in?**

Validation:

1. Find the node with max `fan_in`.
2. Accept case-insensitive matches against that node's `label`, `id`, or base
   filename.
3. If all `fan_in` values are 1 or less, ask which module they would inspect
   first and accept any reasoned answer.
4. On first wrong answer, use the remediation rules and re-ask once.
5. On second wrong answer, reveal the hub in one sentence and continue.

## Stages 2-4: Phase 2 Placeholders

Emit these immediately after the Stage 1 question loop completes:

```json
[
  {
    "card_type": "entry_points",
    "title": "Entry Points",
    "note": "Coming in Phase 3",
    "summary": "Entry point detection will map routes, CLIs, jobs, and consumers."
  },
  {
    "card_type": "hotspots",
    "title": "Change Hotspots",
    "note": "Coming in Phase 3",
    "summary": "Hotspot analysis will use git history and author signals."
  },
  {
    "card_type": "conventions",
    "title": "Project Conventions",
    "note": "Coming in Phase 3",
    "summary": "Convention detection will infer naming, errors, tests, and docs."
  }
]
```

For each placeholder, call `emit_event` with `event_type: "card_emit"` and
`event_data` containing `card_type`, `title`, `body_markdown`, and `data.note`.
Use one short narration sentence, then advance.

## Economy Rules

- Target Stage 1 cost: 2 Bobcoins or less.
- Session cartography cap: 25 Bobcoins.
- Prefer structured payloads over prose.
- Do not paste full schemas or examples into chat.
- Reuse graph data for question validation; do not re-read files after the graph
  is built.
- If budget is exceeded, emit a `cartography curtailed` card with the current
  stage and reason, then return to onboard mode.

## Phase 3 Notes

Entry points, hotspots, and conventions become real implementations in Phase 3.
Until then, placeholders must keep the vertical slice unblocked.
