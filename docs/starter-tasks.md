# Starter PR Candidates for Demo

**Purpose:** This document identifies three ~20-line changes suitable for F7 (Starter PR Generator) to demonstrate OnboardOps' ability to create a meaningful first contribution.

**Status:** ⚠️ PENDING - Waiting for Dev 4 to select and fork demo repository (Task T4.2)

---

## Selection Criteria

Each candidate must meet these requirements:
- **Size:** ~20 lines of code changed (±5 lines acceptable)
- **Difficulty:** Easy to Medium (suitable for a new contributor)
- **Safety:** Low risk of breaking existing functionality
- **Visibility:** Changes are easy to verify and demonstrate
- **Value:** Provides real improvement to the project

---

## Candidate 1: Documentation Fix + Test Case (DEFAULT)

**Status:** 🔄 Template - To be filled after demo repo selection

**Files:**
- `README.md` (or equivalent documentation file)
- `tests/test_*.py` (or equivalent test file)

**Lines Changed:** ~18

**Difficulty:** Easy

**Changes:**
1. **Documentation:** Fix typo or improve clarity in installation/setup section
2. **Test:** Add missing test case for an edge condition

**Example Diff Outline:**
```diff
--- README.md
+++ README.md
@@ -XX +XX
-[Typo or unclear instruction]
+[Corrected text or clearer instruction]

--- tests/test_main.py
+++ tests/test_main.py
@@ +XX,8
+def test_edge_case():
+    """Test [specific edge condition]"""
+    # Test implementation
+    assert expected_behavior
```

**Why This Works:**
- Combines documentation improvement (easy win) with code contribution
- Tests existing functionality (low risk)
- Demonstrates understanding of both docs and test patterns
- Easy to verify: typo is fixed, test passes

**Verification Steps:**
1. Documentation renders correctly
2. Test suite passes with new test
3. New test actually tests the intended behavior

---

## Candidate 2: Add Missing Error Handler

**Status:** 🔄 Template - To be filled after demo repo selection

**Files:**
- `[main application file]` (e.g., `app/main.py`, `src/index.ts`)

**Lines Changed:** ~22

**Difficulty:** Medium

**Changes:**
Add error handling for a specific edge case that currently causes an unhandled exception

**Example Diff Outline:**
```diff
--- app/main.py
+++ app/main.py
@@ +XX,12
+try:
+    # Existing code that might fail
+    result = potentially_failing_operation()
+except SpecificException as e:
+    logger.error(f"Operation failed: {e}")
+    return error_response(
+        status_code=400,
+        message="Helpful error message"
+    )
```

**Why This Works:**
- Improves robustness without changing core logic
- Easy to test (trigger the error condition)
- Shows understanding of error handling patterns
- Provides real value (better user experience)

**Verification Steps:**
1. Trigger the error condition
2. Verify graceful error handling
3. Check that error message is helpful
4. Ensure existing functionality unchanged

---

## Candidate 3: Improve Code Documentation

**Status:** 🔄 Template - To be filled after demo repo selection

**Files:**
- `[core module file]` (e.g., `src/utils.py`, `lib/helpers.ts`)

**Lines Changed:** ~15

**Difficulty:** Easy

**Changes:**
Add docstrings/JSDoc comments to undocumented functions

**Example Diff Outline:**
```diff
--- src/utils.py
+++ src/utils.py
@@ +XX,10
+def existing_function(param1: str, param2: int) -> dict:
+    """
+    Brief description of what the function does.
+    
+    Args:
+        param1: Description of param1
+        param2: Description of param2
+    
+    Returns:
+        Description of return value
+    
+    Raises:
+        ValueError: When invalid input provided
+    """
     # Existing function body
```

**Why This Works:**
- Pure documentation improvement (zero risk)
- Shows understanding of code purpose
- Follows project documentation standards
- Easy to verify (docs render correctly)

**Verification Steps:**
1. Documentation follows project style guide
2. Descriptions are accurate and helpful
3. All parameters and return values documented
4. No code behavior changed

---

## Demo Default Selection

**Selected:** Candidate 1 (Documentation + Test)

**Rationale:**
- Best balance of visibility and safety for live demo
- Combines two types of contributions (docs + code)
- Easy to explain in 60-second demo
- Low risk of demo failure
- Shows both understanding and contribution

---

## Implementation Notes for F7 (Starter PR Generator)

When implementing the Starter PR Generator, use this workflow:

1. **Analyze Repository:**
   - Run repo cartography to understand structure
   - Identify test patterns and documentation style
   - Find files with missing tests or unclear docs

2. **Select Task:**
   - Use one of the three candidates above
   - Adapt to the specific repository structure
   - Ensure the change is actually needed (not already done)

3. **Generate Code:**
   - Follow project conventions (from cartography)
   - Match existing code style
   - Include appropriate comments

4. **Create PR:**
   - Write clear PR title and description
   - Reference the onboarding session
   - Include "Onboarded: X min Y sec" timestamp
   - Add appropriate labels (if repository uses them)

5. **Verify:**
   - Run test suite
   - Check linting passes
   - Ensure CI would pass

---

## Actual Candidates (To Be Filled by Dev 5)

Once Dev 4 selects the demo repository, fill in this section with actual file paths, line numbers, and specific changes.

### Demo Repository: [PENDING]

**Repository URL:** [To be filled after T4.2]

**Fork URL:** [To be filled after T4.2]

**Selected Candidates:**

#### Actual Candidate 1: [Title]
- **Files:** [Actual file paths]
- **Lines:** [Actual line numbers]
- **Changes:** [Specific changes to make]
- **Diff:** [Actual diff]

#### Actual Candidate 2: [Title]
- **Files:** [Actual file paths]
- **Lines:** [Actual line numbers]
- **Changes:** [Specific changes to make]
- **Diff:** [Actual diff]

#### Actual Candidate 3: [Title]
- **Files:** [Actual file paths]
- **Lines:** [Actual line numbers]
- **Changes:** [Specific changes to make]
- **Diff:** [Actual diff]

---

## Next Steps

1. ⏳ **Wait for Dev 4** to complete T4.2 (demo repo selection)
2. 📋 **Analyze the selected repository** for actual starter task opportunities
3. ✍️ **Fill in the "Actual Candidates" section** with specific details
4. ✅ **Validate** that each candidate meets the criteria
5. 🎯 **Designate one as the demo default** for the 60-second video

---

**Last Updated:** Phase 1, H+0  
**Status:** Template ready, awaiting demo repo selection  
**Owner:** Dev 5 (Integration Engineer)  
**Depends On:** Dev 4's T4.2 (Demo Repository Selection)