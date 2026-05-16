---
name: Repository Cartography
description: Cost-capped four-stage repository map for OnboardOps onboarding
auto_activate: false
output_token_cap: 700
stage1_bobcoin_target: 2
session_bobcoin_cap: 25
---

# Repository Cartography Skill

Load `.bob/rules/cartography-style.md` once, then keep chat output terse. Emit
dashboard data through the `institutional-knowledge` MCP server's `emit_event`
tool whenever it is available.

## Contract

Produce four real cards in order:

1. `dependency_graph` - repository module relationships.
2. `entry_points` - HTTP routes, CLI commands, jobs, and consumers.
3. `hotspots` - high-churn files from git history.
4. `conventions` - naming, error handling, test layout, and documentation
   conventions with evidence from files.

Do not emit Phase 2 placeholder cards during normal onboarding. Emit a
`Data unavailable` fallback card only when a specific stage fails after one
retry, then continue so the onboardee is not blocked.

After every card, emit one `question_ask` event with a stable `question_id`, ask
the same question in chat, and validate the answer against the card data.

## Event Shapes

Use exact backend card types:

```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "dependency_graph",
    "title": "Dependency Graph",
    "body_markdown": "One-sentence summary",
    "data": {},
    "summary": "One-sentence summary"
  }
}
```

Question events:

```json
{
  "event_type": "question_ask",
  "event_data": {
    "question_id": "stage-key-q1",
    "stage": "dependency_graph",
    "topic": "Architecture",
    "question": "Which module has the highest fan-in?",
    "expected_answer_hint": "Compare fan_in values in the graph nodes."
  }
}
```

## Stage 1: Dependency Graph

Discover source files, parse internal imports, and emit:

- `nodes`: `{ id, label, fan_in, fan_out, is_hub }`
- `edges`: `{ source, target }`
- `circular_dependencies`: array of cycles, or `[]`

Prefer source directories such as `backend/`, `frontend/src/`, `src/`, `app/`,
and `lib/`. Exclude caches, virtualenvs, `node_modules`, build output, and test
fixtures unless no source files are available.

Question: ask which module has the highest fan-in. Accept the node `id`,
`label`, or filename.

## Stage 2: Entry Points

Search repository files for real entry points:

- FastAPI/Flask/Django routes.
- Next.js app routes and API handlers.
- Python `if __name__ == "__main__"` blocks, Click, Typer, and argparse CLIs.
- Scheduled jobs such as Celery, APScheduler, cron-like scripts.
- Message consumers such as Kafka, RabbitMQ, Redis, or queue workers.

Emit:

- `routes`: `{ type, name, method, path, handler, file }`
- `cli`: `{ type, name, entry_point, file }`
- `jobs`: `{ type, name, schedule, file }`
- `consumers`: `{ type, name, topic, handler, file }`

When a GitHub file URL is known, include `github_url` or `file_url` for each
entry. Otherwise include the repository-relative `file` path; the dashboard will
construct a GitHub file link from its repository configuration.

Question: pick a discovered route or CLI and ask which file/function handles it.

## Stage 3: Change Hotspots

Use MCP tools first, then file/git inspection if needed:

1. Call `commit_frequency` repo-wide for the last 180 days.
2. For the top files, call `recent_authors` and `pr_for_file`.
3. Emit at most five hotspots, ranked by commit count.

Emit:

- `files`: `{ path, commit_count, distinct_authors, top_author,
  last_pr_title, last_pr_url, rationale, commit_frequency }`

`commit_frequency` must be an array of numbers for the dashboard sparkline, for
example `[0, 2, 1, 4, 3, 5, 2, 1, 0, 3, 4, 2]`. If only a human-readable rate is
known, put it in the rationale or omit `commit_frequency`; do not send strings
such as `"0.79 commits/day"` in that field.

Use full author names from `recent_authors` in `top_author`; do not abbreviate
to initials. If no author is known, omit `top_author` or use `null`.

Use only real PR URLs returned by `pr_for_file`. Do not fabricate links such as
`https://github.com/example/repo/pull/...`. If no real PR is available, set
`last_pr_title` and `last_pr_url` to `null`.

Rationales must be one sentence and grounded in file role, commit count, author
signals, or PR title. If author/PR data is unavailable, still emit commit-count
data and mark missing fields as `"unknown"` or `null`.

Question: ask which file is the top hotspot and why.

## Stage 4: Project Conventions

Read representative backend, frontend, script, and test files. Infer at least
three conventions when possible:

- Function/class/file naming.
- Error handling.
- Test layout and naming.
- State management or API-contract style.
- Formatting/tooling expectations.

Emit:

- `conventions`: `{ name, pattern, evidence, consistency }`

Evidence must include a real file path and, when useful, a short example.

Question: ask about one detected convention, such as function naming or where to
add a test.

## Fallbacks

Fallback cards must still use the real card type for the failed stage and data
objects with the correct top-level keys:

- `entry_points`: `routes`, `cli`, `jobs`, `consumers`
- `hotspots`: `files`
- `conventions`: `conventions`

Use "Data unavailable" only for genuine failures, not as a planned stage.

## Economy Rules

- Target full cartography cost: <=25 Bobcoins.
- Prefer structured data over prose.
- Do not paste full file contents into chat.
- Reuse already gathered data for question validation.
- Keep narration to one sentence per card.
