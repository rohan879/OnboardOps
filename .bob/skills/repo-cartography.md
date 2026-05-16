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
   **Path handling**: Sanitize file paths (see Path Sanitization section below).
2. Parse imports in one pass. Match `import x`, `from x import y`, and relative
   imports. Keep only internal module edges.
   **Path handling**: Quote paths with spaces when passing to MCP tools.
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
   **Error handling**: If tool fails or returns empty, retry once. If retry fails,
   emit placeholder card (see Error Handling section below) and continue to Stage 4.
2. For each file in the top 5 (or up to 10 if available):
   - Call `recent_authors` with the file_path to get top contributors
   - Call `pr_for_file` with the file_path to get recent merged PRs
   - Call `file_changelog` with the file_path and limit=5 to get recent commits
   **Error handling**: If any tool fails for a specific file, use partial data
   (e.g., commit count only, no authors). Do not skip the file entirely.
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
   **Path handling**: Sanitize and truncate paths (see Path Sanitization section).
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

## Error Handling and Graceful Degradation (Phase 4)

### MCP Tool Failure Strategy

When any MCP tool fails (network error, rate limit, missing data, timeout):

1. **Retry once**: Attempt the same tool call with identical arguments
2. **Emit placeholder on retry failure**: Create a card with partial/placeholder data
3. **Continue to next stage**: Never block the onboarding flow

### Placeholder Card Templates

#### Stage 1: Dependency Graph Failure
```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "dependency_graph",
    "title": "Dependency Graph",
    "body_markdown": "**Data unavailable** - Git history inaccessible or parsing failed.",
    "data": {
      "nodes": [],
      "edges": [],
      "note": "Tool failure: git_blame_summary returned empty or errored"
    },
    "summary": "Dependency graph unavailable due to tool failure."
  }
}
```

Narration: "Dependency graph data unavailable—git history may be inaccessible. Continuing to entry points."

#### Stage 2: Entry Points Failure
```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "entry_points",
    "title": "Entry Points",
    "body_markdown": "**Data unavailable** - Could not parse routes or entry points.",
    "data": {
      "routes": [],
      "cli": [],
      "jobs": [],
      "consumers": [],
      "note": "File parsing failed or no entry points detected"
    },
    "summary": "Entry points unavailable due to parsing failure."
  }
}
```

Narration: "Entry points data unavailable—file parsing may have failed. Continuing to hotspots."

#### Stage 3: Hotspots Failure (Complete)
```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "hotspots",
    "title": "Change Hotspots",
    "body_markdown": "**Data unavailable** - Git history analysis failed.",
    "data": {
      "files": [],
      "note": "Tool failure: commit_frequency, recent_authors, or pr_for_file unavailable"
    },
    "summary": "Hotspots unavailable due to git history tool failure."
  }
}
```

Narration: "Hotspots data unavailable—git history tools may be rate-limited. Continuing to conventions."

#### Stage 3: Hotspots Failure (Partial)
If `commit_frequency` succeeds but per-file tools fail, emit partial data:

```json
{
  "files": [
    {
      "path": "src/auth.py",
      "commit_count": 47,
      "distinct_authors": "unknown",
      "top_author": "unknown",
      "last_pr_title": "unavailable",
      "last_pr_url": null,
      "rationale": "High commit count (47 in 180 days) suggests active development. Author and PR data unavailable."
    }
  ]
}
```

Narration: "Found 5 hotspots by commit frequency. Author and PR data partially unavailable."

#### Stage 4: Conventions Failure
```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "conventions",
    "title": "Project Conventions",
    "body_markdown": "**Data unavailable** - Could not read representative files.",
    "data": {
      "conventions": [],
      "note": "File reading failed or no Python files accessible"
    },
    "summary": "Conventions unavailable due to file access failure."
  }
}
```

Narration: "Conventions data unavailable—file reading may have failed. Cartography complete with partial data."

### Error Detection Patterns

Detect tool failures by checking for:

1. **Empty responses**: Tool returns `{}`, `[]`, or `null`
2. **Error fields**: Response contains `"error"`, `"error_code"`, or `"retryable": false`
3. **Timeout**: Tool call exceeds 10 seconds (Bob Shell should handle this)
4. **Network errors**: Response indicates connection failure

### Retry Logic

```
For each MCP tool call:
  1. Attempt tool call
  2. If response is valid and non-empty:
     - Use data normally
     - Continue
  3. If response is empty or contains error:
     - Wait 1 second
     - Retry with same arguments
  4. If retry succeeds:
     - Use data normally
     - Continue
  5. If retry fails:
     - Emit placeholder card (see templates above)
     - Log failure in session telemetry
     - Continue to next stage
```

### Narration Guidelines for Failures

- **Never apologize**: "Data unavailable" not "Sorry, I couldn't retrieve..."
- **Never expose technical details**: "Tool failure" not "GitCommandError: exit code 128"
- **Always continue**: "Continuing to [next stage]" not "Please try again later"
- **Acknowledge limitation**: "Partial data available" when some tools succeed

### Testing Failure Scenarios

To validate error handling, deliberately break these tool responses:

1. **Test 1**: Make `git_blame_summary` return empty `{}`
   - Expected: Placeholder dependency graph card, continue to Stage 2
2. **Test 2**: Make `commit_frequency` return error `{"error": "rate limited"}`
   - Expected: Retry once, then placeholder hotspots card, continue to Stage 4
3. **Test 3**: Make `recent_authors` timeout (>10 seconds)
   - Expected: Partial hotspots data (commit counts only), continue to Stage 4

### Coordination with Dev 2 (Backend)

Dev 2 T2.2 (Per-Tool Error Handling) will ensure all MCP tools return typed errors:

```json
{
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "GitHub API rate limit exceeded",
  "retryable": true
}
```

Bob's cartography skill should check `retryable` field:
- If `true`: Retry once after 1 second
- If `false`: Skip retry, emit placeholder immediately

### Session Telemetry for Failures

On any tool failure, emit a telemetry event (does not count toward Bobcoin budget):

```json
{
  "event_type": "tool_failure",
  "event_data": {
    "tool_name": "commit_frequency",
    "stage": "hotspots",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "retry_attempted": true,
    "retry_succeeded": false,
    "fallback_action": "emitted_placeholder_card"
  }
}
```

This helps Dev 2 and Dev 4 diagnose issues during live E2E runs.

## Path Sanitization and Edge Cases (Phase 4 T1.3)

### Unusual File Path Scenarios

Handle these edge cases gracefully:

1. **Spaces in paths**: `src/my module/auth.py`
2. **Long paths**: Paths exceeding 200 characters
3. **Mixed language directories**: `src/` contains both Python and TypeScript
4. **Special characters**: Paths with `&`, `$`, `(`, `)`, etc.
5. **Unicode characters**: Non-ASCII filenames

### Path Sanitization Rules

#### 1. Quoting for MCP Tool Calls

When passing file paths to MCP tools, always quote paths containing spaces or special characters:

```python
# Correct
file_path = "src/my module/auth.py"
mcp_call = f'git_blame_summary("{file_path}")'

# Incorrect (will fail)
mcp_call = f'git_blame_summary({file_path})'
```

Bob should detect spaces in paths and automatically quote them.

#### 2. Path Truncation in Narration

For paths exceeding 50 characters, truncate in narration but use full path in data:

**Narration:**
```
"The hub module is src/.../very/deep/nested/module.py"
```

**Card data:**
```json
{
  "path": "src/project/subproject/very/deep/nested/module.py",
  "path_display": "src/.../nested/module.py"
}
```

**Truncation algorithm:**
1. If path ≤ 50 chars: use as-is
2. If path > 50 chars:
   - Keep first 10 chars (e.g., "src/projec")
   - Add "..."
   - Keep last 30 chars (e.g., "deep/nested/module.py")
   - Result: "src/projec.../deep/nested/module.py"

#### 3. Mixed Language Handling

When discovering files in Stage 1, if directory contains multiple languages:

1. **Prefer Python files** for dependency graph
2. **Note other languages** in narration:
   ```
   "Found 15 Python modules and 8 TypeScript files. Analyzing Python dependencies."
   ```
3. **Exclude non-Python** from graph but mention in summary

#### 4. Special Character Escaping

For paths with shell-special characters (`&`, `$`, `(`, `)`, `;`, `|`):

1. **In MCP calls**: Use proper quoting (single quotes or escaped)
2. **In narration**: Display as-is (no escaping needed in markdown)
3. **In card data**: Store unescaped (JSON handles this)

Example:
```
Path: src/utils/$(config).py

MCP call: git_blame_summary('src/utils/$(config).py')
Narration: "The file src/utils/$(config).py has 12 commits."
Card data: {"path": "src/utils/$(config).py"}
```

#### 5. Unicode Filename Handling

For non-ASCII filenames (e.g., `src/模块/auth.py`):

1. **Preserve in card data**: Store UTF-8 encoded
2. **Display in narration**: Show as-is (Bob supports Unicode)
3. **MCP tool calls**: Pass UTF-8 encoded string

If MCP tool fails on Unicode path:
- Emit partial data without that file
- Note in rationale: "Some files with non-ASCII names excluded"

### Edge Case Testing Scenarios

#### Test 1: Spaces in Path
**Setup:** Create file `src/my module/auth.py`

**Expected Behavior:**
1. Bob discovers file during Stage 1
2. Quotes path when calling MCP tools: `git_blame_summary("src/my module/auth.py")`
3. Displays in narration: "Found module my module/auth.py"
4. Card data includes full path with spaces

**Validation:**
- ✅ File appears in dependency graph
- ✅ No MCP tool errors
- ✅ Path displayed correctly on dashboard

#### Test 2: Long Path (>200 chars)
**Setup:** Create deeply nested file:
```
src/project/subproject/feature/component/implementation/details/very/deep/nested/structure/module.py
```

**Expected Behavior:**
1. Bob discovers file
2. Truncates in narration: "src/project.../structure/module.py"
3. Card data includes full path
4. Dashboard shows truncated path with tooltip for full path

**Validation:**
- ✅ Narration ≤ 50 chars for path
- ✅ Card data has full path
- ✅ No layout breaking on dashboard

#### Test 3: Mixed Python/TypeScript Directory
**Setup:** `src/` contains:
- `auth.py` (Python)
- `models.py` (Python)
- `api.ts` (TypeScript)
- `utils.ts` (TypeScript)

**Expected Behavior:**
1. Bob discovers all files
2. Filters to Python files for dependency graph
3. Narrates: "Found 2 Python modules and 2 TypeScript files. Analyzing Python dependencies."
4. Graph includes only Python files
5. Entry points may include TypeScript routes if detected

**Validation:**
- ✅ Graph has 2 nodes (Python only)
- ✅ Narration mentions both languages
- ✅ No TypeScript imports in graph

### Path Sanitization Helpers

Bob should use these patterns internally:

#### Quote Detection
```python
def needs_quoting(path: str) -> bool:
    """Check if path needs quoting for shell safety."""
    special_chars = [' ', '&', '$', '(', ')', ';', '|', '<', '>']
    return any(char in path for char in special_chars)

def quote_path(path: str) -> str:
    """Quote path if needed."""
    if needs_quoting(path):
        return f'"{path}"'
    return path
```

#### Path Truncation
```python
def truncate_path(path: str, max_length: int = 50) -> str:
    """Truncate long paths for display."""
    if len(path) <= max_length:
        return path
    
    # Keep first 10 and last 30 chars
    prefix = path[:10]
    suffix = path[-30:]
    return f"{prefix}.../{suffix}"
```

#### Language Detection
```python
def detect_languages(files: list[str]) -> dict[str, int]:
    """Count files by language."""
    extensions = {
        '.py': 'Python',
        '.ts': 'TypeScript',
        '.js': 'JavaScript',
        '.java': 'Java',
        '.go': 'Go'
    }
    
    counts = {}
    for file in files:
        ext = file.split('.')[-1]
        lang = extensions.get(f'.{ext}', 'Other')
        counts[lang] = counts.get(lang, 0) + 1
    
    return counts
```

### Narration Examples

#### Spaces in Path
```
"The hub module is my module/auth.py with 15 incoming dependencies."
```

#### Long Path
```
"The top hotspot is src/project.../nested/module.py with 47 commits."
```

#### Mixed Languages
```
"Found 12 Python modules and 5 TypeScript files. Analyzing Python dependencies."
```

#### Special Characters
```
"The file utils/$(config).py changes frequently due to environment updates."
```

### Coordination with Dev 3 (Dashboard)

**Path Display on Dashboard:**
- Full paths in tooltips (hover to see complete path)
- Truncated paths in card body (≤50 chars)
- Monospace font for paths (IBM Plex Mono)
- Clickable paths that open in editor

**Dev 3 T3.2 (Typography Pass) should ensure:**
- Paths don't break layout at 1920×1080
- Long paths wrap gracefully
- Truncation indicator ("...") is visible

### Acceptance Criteria

✅ **Three edge-case scenarios produce sensible output:**
- Test 1: Spaces in path → quoted in MCP calls, displayed correctly
- Test 2: Long path → truncated in narration, full in data
- Test 3: Mixed languages → Python-only graph, both mentioned in narration

✅ **No layout breaking or MCP errors:**
- Dashboard renders all paths correctly
- MCP tools receive properly quoted paths
- No shell injection vulnerabilities

✅ **Narration follows truncation rules:**
- Paths > 50 chars truncated to "prefix.../suffix"
- Full paths available in card data
- Truncation doesn't obscure important info (filename always visible)
