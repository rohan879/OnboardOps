---
name: "Starter PR Generation"
description: "Generate a bounded, safe first contribution for a new repository onboardee"
auto_activate: false
output_token_cap: 500
bobcoin_target: 2
---

# Starter PR Generation Skill

This skill drives F7 (Starter PR Generator). Bob generates a small, safe diff that serves as the onboardee's first contribution to the repository.

## Constraints

- **Diff size**: ≤30 lines total across all files
- **File scope**: Confined to a single file (or at most two closely related files)
- **Safety**: Must not modify core business logic or critical paths
- **Testability**: Changes must be verifiable by existing test suite
- **Value**: Must provide real improvement (not busywork)

## Task Selection

Select one of three starter task types from `docs/starter-tasks.md`:

1. **Documentation + Test** (DEFAULT): Fix a doc typo + add a missing test case
2. **Error Handler**: Add graceful error handling for an edge case
3. **Code Documentation**: Add docstrings/JSDoc to undocumented functions

The task type is passed as input. If not specified, use type 1 (Documentation + Test).

When asking the onboardee what to work on, use a plain numbered list in chat,
not cramped inline options:

1. Add a new read-only MCP tool.
2. Improve error handling in an existing tool.
3. Add a dashboard visualization component.
4. Write tests for an untested module.

After the onboardee chooses, summarize the selected task in one sentence, then
continue into the Starter PR generation flow.

## Generation Flow

### Step 1: Analyze Repository Context

Read the following to understand the codebase:
- Recent cartography output (dependency graph, conventions)
- Test file patterns (from entry points cartography)
- Documentation style (from conventions cartography)
- Starter task specification from `docs/starter-tasks.md`

### Step 2: Identify Target Files

For the selected task type:
- **Type 1**: Find README.md (or equivalent) + a test file with <100% coverage
- **Type 2**: Find a route handler or API endpoint with missing error handling
- **Type 3**: Find a utility module with undocumented public functions

Prefer files that:
- Are not in the top 3 hotspots (avoid high-churn areas)
- Have clear, simple logic
- Are already tested (for types 1 and 2)

### Step 3: Generate Bounded Diff

Produce a unified diff format with:
- Clear file paths (relative to repo root)
- Line numbers for context
- Minimal, focused changes
- Comments explaining the change

**Diff format:**
```diff
--- path/to/file.py
+++ path/to/file.py
@@ -10,3 +10,8 @@
 existing line
 existing line
+# New line 1
+# New line 2
+# New line 3
 existing line
```

**Validation before emitting:**
- Count total lines changed (additions + deletions)
- Verify ≤30 lines
- Verify single file (or two if doc + test)
- Verify no modifications to imports of core modules

### Step 4: Generate Commit Message

Write a one-paragraph commit message following conventional commits:

```
<type>(<scope>): <subject>

<body>

Onboarded via OnboardOps in <time>
```

Where:
- `type`: docs, test, fix, refactor
- `scope`: module or file name
- `subject`: ≤50 chars, imperative mood
- `body`: 2-3 sentences explaining why this change matters

### Step 5: Emit Progress Events

Call `emit_event` at each substep:
1. `starter_pr_task_selected` - which task type chosen
2. `starter_pr_files_identified` - target files
3. `starter_pr_diff_generated` - the diff (for validation)
4. `starter_pr_commit_message` - the commit message
5. `session_end` - after the PR is opened or the local diff is ready; include
   `status`, `total_duration_ms`, `total_bobcoins_spent`, and `pr_url` when
   available.

## Output Format

Return a JSON object:
```json
{
  "task_type": 1,
  "task_title": "Documentation Fix + Test Case",
  "files": ["README.md", "tests/test_utils.py"],
  "diff": "<unified diff string>",
  "commit_message": "<conventional commit message>",
  "line_count": 18,
  "safety_check": "pass"
}
```

## Safety Checks

Before returning, verify:
- [ ] Diff is valid unified diff format
- [ ] Line count ≤30
- [ ] No modifications to: `__init__.py`, `main.py`, `app.py`, `server.py`
- [ ] No new dependencies added
- [ ] No database schema changes
- [ ] No authentication/authorization changes

If any check fails, regenerate with stricter constraints.

## Anti-Patterns to Avoid

❌ **Don't** generate diffs that:
- Touch multiple unrelated files
- Modify core business logic
- Add new external dependencies
- Change API contracts
- Require manual testing

✅ **Do** generate diffs that:
- Are immediately understandable
- Pass existing tests without modification
- Provide clear value
- Follow project conventions
- Are safe to merge

## Example: Documentation + Test

**Task**: Fix typo in README + add test for empty input handling

**Diff**:
```diff
--- README.md
+++ README.md
@@ -15,1 +15,1 @@
-To install dependancies, run:
+To install dependencies, run:

--- tests/test_utils.py
+++ tests/test_utils.py
@@ -45,0 +46,8 @@
+def test_parse_empty_input():
+    """Test that parse_input handles empty string gracefully."""
+    result = parse_input("")
+    assert result == []
+    
+    result = parse_input(None)
+    assert result == []
```

**Commit Message**:
```
docs(readme): fix typo in installation instructions

test(utils): add test for empty input handling

Fixed "dependancies" → "dependencies" typo in README.
Added test coverage for parse_input() with empty/None inputs,
which was previously untested edge case.

Onboarded via OnboardOps in 9m 12s
```

## Integration with open_starter_pr.py

This skill is invoked by `scripts/open_starter_pr.py` via Bob Shell:

```bash
echo '{"task_type": 1, "repo_path": "/path/to/repo"}' | \
  bob --skill starter-pr --format json
```

The script then:
1. Validates the returned diff
2. Applies it to a new branch
3. Runs the test suite
4. Opens a PR if tests pass
5. Restores checkpoint if anything fails
