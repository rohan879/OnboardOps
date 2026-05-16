---
name: Repository Cartography
description: Cost-capped four-stage repository map for OnboardOps onboarding
auto_activate: false
output_token_cap: 700
stage1_bobcoin_target: 2
session_bobcoin_cap: 25
remediation_word_cap: 80
max_remediation_attempts: 2
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
    "expected_answer_hint": "Compare fan_in values in the graph nodes.",
    "attempt": 1
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
4. On first wrong answer, apply remediation (see Remediation Loop below).
5. On second wrong answer, reveal the hub in one sentence and continue.

### Remediation Loop (Stage 1)

**State tracking**: Maintain `attempt_count` for this question (1 or 2).

**On first wrong answer** (attempt 1):
1. Emit `question_remediation` event:
   ```json
   {
     "event_type": "question_remediation",
     "event_data": {
       "stage": "dependency-graph",
       "attempt": 1,
       "remediation_text": "<80-word guidance>",
       "hint": "Review the fan-in values in the dependency graph card."
     }
   }
   ```
2. Provide 80-word remediation pointing to the graph card data:
   "The dependency graph card shows fan-in values for each module. Fan-in
   represents how many other modules import this one. Look for the module with
   the highest number in the fan-in column. This module is the hub because many
   other parts of the codebase depend on it. Review the graph visualization or
   the nodes list to find the maximum fan-in value."
3. Re-ask the same question
4. Increment `attempt_count` to 2

**On second wrong answer** (attempt 2):
1. Reveal the correct answer in one sentence:
   "The correct answer is `<module_name>`, which has `<n>` incoming dependencies."
2. Continue to Stage 2 (do not loop further)

**On correct answer** (any attempt):
1. Acknowledge briefly: "Correct."
2. Continue to Stage 2

## Stage 2: Entry Points

Goal: enumerate HTTP routes, CLI entry points, scheduled jobs, and message consumers.

Steps:

1. Search for HTTP routes:
   - FastAPI: `@app.get(`, `@app.post(`, `@app.put(`, `@app.delete(`, `@app.patch(`
   - Flask: `@app.route(`, `@blueprint.route(`
   - Django: `path(`, `re_path(` in urls.py files
   Capture: route path, HTTP method, handler function name, file location
2. Search for CLI entry points:
   - Python: `if __name__ == "__main__":` blocks
   - Click: `@click.command(`, `@click.group(`
   - Argparse: `ArgumentParser()` instantiation
   Capture: script name, entry function, file location
3. Search for scheduled jobs:
   - Celery: `@app.task(`, `@celery.task(`
   - APScheduler: `@scheduler.scheduled_job(`
   - Cron-like decorators
   Capture: task name, schedule if visible, file location
4. Search for message consumers:
   - Kafka: `@consumer.subscribe(`, `Consumer(`
   - RabbitMQ: `@channel.basic_consume(`, `queue_declare(`
   - Redis: `@pubsub.subscribe(`
   Capture: topic/queue name, handler function, file location
5. Build entry points data:
   - `routes`: `[{ path, method, handler, file }]`
   - `cli`: `[{ name, entry_point, file }]`
   - `jobs`: `[{ name, schedule, file }]`
   - `consumers`: `[{ topic, handler, file }]`
6. Call `emit_event` with `event_type: "card_emit"` and `event_data` containing
   `card_type: "entry_points"`, `title: "Entry Points"`, `body_markdown`, and
   entry points `data`.
7. Narrate in one sentence:
   - Routes: "Found `<n>` HTTP routes across `<m>` files."
   - CLI: "Found `<n>` CLI entry points."
   - Jobs: "Found `<n>` scheduled jobs."
   - Mixed: "Entry points span `<n>` routes, `<m>` CLI commands, and `<p>` jobs."

Acceptance:

- If the repo has FastAPI/Flask routes, emit at least 3 routes.
- If the repo has CLI entry points, emit at least 1.
- Dashboard receives `CardEmit` within 30 seconds.
- If discovery fails, emit partial data and continue.

## Stage 2 Question Loop

Before asking in chat, call `emit_event` for the question:

```json
{
  "event_type": "question_ask",
  "event_data": {
    "stage": "entry-points",
    "question": "Which HTTP route would handle a GET request to /api/users?",
    "expected_answer_hint": "Look for GET routes in the entry points data.",
    "attempt": 1
  }
}
```

Ask: **Which HTTP route would handle a GET request to [SPECIFIC_PATH]?**
(Parameterize [SPECIFIC_PATH] with an actual route from the discovered data)

Validation:

1. Find the route matching the path and GET method.
2. Accept case-insensitive matches against the handler function name or file.
3. If no exact match, accept the closest route or file.
4. On first wrong answer, apply remediation (see below).
5. On second wrong answer, reveal the correct route and continue.

### Remediation Loop (Stage 2)

**On first wrong answer** (attempt 1):
1. Emit `question_remediation` event with 80-word guidance
2. Provide remediation:
   "The Entry Points card lists all HTTP routes discovered in the codebase. Each
   route shows the HTTP method (GET, POST, etc.), the path pattern, and the
   handler function. Look for the route that matches the path `[SPECIFIC_PATH]`
   with method GET. The handler function name or file location will tell you
   which code handles this request. Review the routes list in the card."
3. Re-ask the same question
4. Increment `attempt` to 2

**On second wrong answer** (attempt 2):
1. Reveal: "The correct answer is `<handler_function>` in `<file_path>`, which
   handles GET requests to `<path>`."
2. Continue to Stage 3

## Stage 3: Change Hotspots

Goal: identify high-churn files using git history, rank by change frequency, and
provide rationales for why each file changes often.

Steps:

1. Call `commit_frequency` MCP tool with no file_path (repo-wide) and days=180.
   This returns the top 5 most frequently changed files.
2. For each file in the top 5 (or up to 10 if available):
   - Call `recent_authors` with the file_path to get top contributors
   - Call `pr_for_file` with the file_path to get recent merged PRs
   - Call `file_changelog` with the file_path and limit=5 to get recent commits
3. For each hotspot file, generate a one-sentence rationale explaining why it
   changes frequently. Use evidence from:
   - File role (config, auth, core business logic)
   - Recent PR titles (feature additions, bug fixes)
   - Number of distinct authors (shared ownership vs. single owner)
   Example: "This file changes often because it owns authentication logic, and
   recent PRs touched the JWT handler."
4. Build hotspots data:
   - `files`: `[{ path, commit_count, distinct_authors, top_author, last_pr_title, last_pr_url, rationale }]`
   - Rank by `commit_count` descending
5. Call `emit_event` with `event_type: "card_emit"` and `event_data` containing
   `card_type: "hotspots"`, `title: "Change Hotspots"`, `body_markdown`, and
   hotspots `data`.
6. Narrate in one sentence:
   - "`<file>` is the top hotspot with `<n>` commits in 180 days."
   - "The top 5 hotspots account for `<n>%` of recent changes."
   - "`<n>` files show high churn, indicating active development areas."

Acceptance:

- Emit at least 5 hotspot files with real commit counts.
- Each file has a rationale grounded in MCP tool data.
- Dashboard receives `CardEmit` within 45 seconds.
- If MCP tools fail, emit partial data with available information.

## Stage 3 Question Loop

Before asking in chat, call `emit_event` for the question:

```json
{
  "event_type": "question_ask",
  "event_data": {
    "stage": "hotspots",
    "question": "Which file is the top hotspot, and why does it change so frequently?",
    "expected_answer_hint": "Look at commit counts and rationales in the hotspots data.",
    "attempt": 1
  }
}
```

Ask: **Which file is the top hotspot, and why does it change so frequently?**

Validation:

1. Find the file with the highest `commit_count`.
2. Accept answers that name the correct file (case-insensitive, with or without path).
3. For "why" part, accept answers that reference the rationale or related concepts
   (e.g., "config file" if rationale mentions configuration).
4. On first wrong answer, apply remediation (see below).
5. On second wrong answer, reveal the top hotspot and rationale, then continue.

### Remediation Loop (Stage 3)

**On first wrong answer** (attempt 1):
1. Emit `question_remediation` event with 80-word guidance
2. Provide remediation:
   "The Change Hotspots card ranks files by commit frequency over the last 180
   days. The top hotspot has the highest commit count. Each file also has a
   rationale explaining why it changes frequently—this might reference its role
   (config, auth, core logic), recent PR activity, or the number of contributors.
   Review the hotspots table and look for the file with the most commits, then
   read its rationale."
3. Re-ask the same question
4. Increment `attempt` to 2

**On second wrong answer** (attempt 2):
1. Reveal: "The top hotspot is `<file_path>` with `<n>` commits. It changes
   frequently because `<rationale>`."
2. Continue to Stage 4

## Stage 4: Project Conventions

Goal: infer project conventions by reading representative files and identifying
patterns in naming, error handling, and test layout.

Steps:

1. Select 3 representative files automatically:
   - One model/entity file (look for `models/`, `entities/`, `schemas/`)
   - One route/handler file (look for `routes/`, `api/`, `handlers/`, `views/`)
   - One test file (look for `tests/`, `test_`, `*_test.py`)
   If categories overlap or don't exist, select the 3 most recently modified
   Python files at depth 2 or less.
2. Read each file and analyze:
   - **Naming convention**: snake_case, camelCase, PascalCase for functions/classes
   - **Error handling**: raises exceptions, returns Result types, returns error codes
   - **Test layout**: co-located (next to source), separate tests/ directory
   - **Documentation**: docstrings present, type hints, inline comments
3. For each convention, provide:
   - `name`: Convention category (e.g., "Function Naming")
   - `pattern`: Detected pattern (e.g., "snake_case")
   - `evidence`: File path and example (e.g., "src/models/user.py: def get_user_by_id()")
   - `consistency`: "consistent" if all files follow, "mixed" if varies
4. Build conventions data:
   - `conventions`: `[{ name, pattern, evidence, consistency }]`
   - Include at least 3 conventions (naming, error handling, test layout)
5. Call `emit_event` with `event_type: "card_emit"` and `event_data` containing
   `card_type: "conventions"`, `title: "Project Conventions"`, `body_markdown`,
   and conventions `data`.
6. Narrate in one sentence:
   - "The codebase follows `<n>` consistent conventions."
   - "Functions use snake_case; tests live in a separate directory."
   - "Conventions are mixed: `<n>` consistent, `<m>` inconsistent."

Acceptance:

- Emit at least 3 conventions with evidence from real files.
- Each convention has a specific example (file path + code snippet).
- Dashboard receives `CardEmit` within 30 seconds.
- If file reading fails, emit partial data with available conventions.

## Stage 4 Question Loop

Before asking in chat, call `emit_event` for the question:

```json
{
  "event_type": "question_ask",
  "event_data": {
    "stage": "conventions",
    "question": "What naming convention is used for functions in this codebase?",
    "expected_answer_hint": "Look at the naming convention in the conventions data.",
    "attempt": 1
  }
}
```

Ask: **What naming convention is used for [ENTITY_TYPE] in this codebase?**
(Parameterize [ENTITY_TYPE] with "functions", "classes", or "files" based on
what was detected)

Validation:

1. Find the naming convention in the conventions data.
2. Accept case-insensitive matches: "snake_case", "snake case", "underscores", etc.
3. Accept answers that reference the evidence file or example.
4. On first wrong answer, apply remediation (see below).
5. On second wrong answer, reveal the convention with evidence, then continue.

### Remediation Loop (Stage 4)

**On first wrong answer** (attempt 1):
1. Emit `question_remediation` event with 80-word guidance
2. Provide remediation:
   "The Project Conventions card lists detected patterns in the codebase, each
   with evidence from specific files. Look for the naming convention entry—it
   will show the pattern (e.g., snake_case, camelCase) and provide an example
   from a real file. The evidence field shows the file path and a sample function
   or class name. Review the conventions list to find the naming pattern."
3. Re-ask the same question
4. Increment `attempt` to 2

**On second wrong answer** (attempt 2):
1. Reveal: "The naming convention is `<pattern>`, as shown in `<evidence_file>`:
   `<example>`."
2. Continue to cartography completion

## End of Cartography

After Stage 4 question loop completes, emit a final summary event:

```json
{
  "event_type": "cartography_complete",
  "event_data": {
    "stages_completed": 4,
    "total_questions_asked": 4,
    "session_time_seconds": <elapsed>,
    "bobcoin_estimate": <estimated_cost>
  }
}
```

Narrate: "Cartography complete. You've explored the dependency graph, entry points,
change hotspots, and project conventions."

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
