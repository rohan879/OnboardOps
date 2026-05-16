---
name: "Starter PR Generator"
description: "Generate a bounded, safe first PR for the onboardee"
auto_activate: false
output_token_cap: 500
max_diff_lines: 30
---

# Starter PR Generator Skill

This skill drives F7 (Starter PR Generator) by selecting a starter task, generating
a bounded diff, and preparing it for PR creation. The skill is invoked by Dev 5's
[`open_starter_pr.py`](../../scripts/open_starter_pr.py) script after certification passes.

## Objective

Generate a meaningful, safe, ~20-line code change that:
- Demonstrates understanding of the repository
- Follows project conventions (from cartography)
- Passes all tests
- Provides real value (not a trivial change)
- Is confined to a single file (for safety and clarity)

## Task Selection

Select one of three starter task types from [`docs/starter-tasks.md`](../../docs/starter-tasks.md):

### Task 1: Documentation + Test (DEFAULT)
- Fix a typo or improve clarity in README/docs
- Add a missing test case for an edge condition
- **Lines:** ~18 (10 docs + 8 test)
- **Risk:** Low
- **Visibility:** High

### Task 2: Add Error Handler
- Add try/except or error handling for an edge case
- Improve error messages or logging
- **Lines:** ~22
- **Risk:** Medium
- **Visibility:** Medium

### Task 3: Improve Code Documentation
- Add docstrings/JSDoc to undocumented functions
- Follow project documentation standards
- **Lines:** ~15
- **Risk:** Zero (pure documentation)
- **Visibility:** Medium

## Selection Algorithm

```
1. Review cartography output:
   - Conventions: What's the documentation style?
   - Entry Points: Which files are most central?
   - Hotspots: Which files are actively maintained?

2. Scan for opportunities:
   - Task 1: Look for typos in README, missing test coverage
   - Task 2: Look for bare function calls that could fail
   - Task 3: Look for undocumented public functions

3. Select task with highest confidence:
   - If README has obvious typo AND tests have <80% coverage → Task 1
   - If error handling is inconsistent → Task 2
   - If many functions lack docstrings → Task 3

4. Fallback: Task 1 (safest, always applicable)
```

## Diff Generation

Once a task is selected, generate the diff following these rules:

### Constraints

- **Single file only**: All changes in one file (or two if Task 1 spans README + test)
- **Line cap**: ≤30 lines total (additions + deletions)
- **No deletions of logic**: Only add or modify, don't remove working code
- **Follow conventions**: Match naming, formatting, error handling from cartography
- **Testable**: Change must be verifiable by running tests

### Diff Format

Generate a unified diff format:

```diff
--- path/to/file.py
+++ path/to/file.py
@@ -10,6 +10,14 @@
 def existing_function():
     """Existing docstring."""
+    # New error handling
+    try:
+        result = operation()
+    except ValueError as e:
+        logger.error(f"Operation failed: {e}")
+        return None
+
     return result
```

### Quality Checks

Before emitting the diff, verify:

1. **Syntax valid**: Diff applies cleanly, no syntax errors
2. **Conventions followed**: Matches project style from cartography
3. **Line count**: Within 30-line cap
4. **Single responsibility**: Change does one thing well
5. **No breaking changes**: Existing tests should still pass

## Commit Message

Generate a one-paragraph commit message following this template:

```
<type>: <brief description>

<detailed explanation>

Generated during OnboardOps onboarding session.
Onboardee: <name>
Session time: <MM:SS>
Certification: <pass/partial/fail grades>
```

**Type options:**
- `docs:` for documentation changes
- `test:` for test additions
- `fix:` for bug fixes or error handling
- `refactor:` for code improvements without behavior change

**Example:**

```
docs: Fix typo in installation instructions and add edge case test

Corrected "runing" to "running" in README.md installation section.
Added test_empty_input() to verify graceful handling of empty strings.

Generated during OnboardOps onboarding session.
Onboardee: Alice Chen
Session time: 09:42
Certification: pass, partial, pass
```

## Progress Events

Emit progress events at each substep for dashboard visibility:

### Event 1: Task Selected
```json
{
  "event_type": "starter_pr_progress",
  "event_data": {
    "step": "task_selected",
    "task_type": "documentation_test",
    "task_description": "Fix README typo and add test case",
    "estimated_lines": 18
  }
}
```

### Event 2: Diff Generated
```json
{
  "event_type": "starter_pr_progress",
  "event_data": {
    "step": "diff_generated",
    "files_changed": ["README.md", "tests/test_main.py"],
    "lines_added": 12,
    "lines_deleted": 1,
    "diff_preview": "<first 200 chars of diff>"
  }
}
```

### Event 3: Tests Running
```json
{
  "event_type": "starter_pr_progress",
  "event_data": {
    "step": "tests_running",
    "test_command": "pytest tests/",
    "status": "in_progress"
  }
}
```

### Event 4: Ready for PR
```json
{
  "event_type": "starter_pr_ready",
  "event_data": {
    "step": "ready",
    "diff_path": "/tmp/starter-pr.diff",
    "commit_message": "<full commit message>",
    "tests_passed": true,
    "branch_name": "onboardops/alice-1234567890"
  }
}
```

## Integration with open_starter_pr.py

The skill outputs a structured response that [`open_starter_pr.py`](../../scripts/open_starter_pr.py) consumes:

```json
{
  "task_type": "documentation_test",
  "diff": "<unified diff content>",
  "commit_message": "<full message>",
  "files_changed": ["README.md", "tests/test_main.py"],
  "line_count": 18,
  "tests_passed": true
}
```

The script then:
1. Applies the diff under a checkpoint
2. Runs the test suite
3. On green, opens the PR via GitHub API
4. On red, restores the checkpoint and reports failure

## Error Handling

If diff generation fails:

1. **Syntax error**: Retry with simpler change (e.g., docs-only)
2. **Line cap exceeded**: Trim to essential changes only
3. **No suitable task found**: Fall back to Task 3 (add docstring to any function)
4. **Tests fail**: Restore checkpoint, emit failure event, do not open PR

## Token Economy

- **Target cost**: 2 Bobcoins per invocation
- **Breakdown**:
  - Task selection: 0.5 Bobcoins
  - Diff generation: 1 Bobcoin
  - Commit message: 0.3 Bobcoins
  - Quality checks: 0.2 Bobcoins
- **Cap**: If cost exceeds 3 Bobcoins, abort and use pre-recorded fallback diff

## Example Invocation

From Bob Shell or [`open_starter_pr.py`](../../scripts/open_starter_pr.py):

```bash
bob --skill starter-pr --context cartography_output.json --output starter_pr.json
```

The skill reads cartography output, selects a task, generates the diff, and writes
the structured response to `starter_pr.json` for the script to consume.

## Phase 3 Notes

This skill is implemented in Phase 3 (T1.7) and consumed by Dev 5's F7 implementation
(T5.1-T5.4). The skill must be tested with at least three different demo repositories
to ensure it generalizes beyond a single codebase.