# Phase 4 T1.4 - Certification Grading Test Answers

**Task:** T1.4 - Tune Certification Grading Consistency  
**Owner:** Dev 1 (Bob Architect)  
**Date:** 2026-05-16  
**Time Budget:** 75 minutes  
**Bobcoin Budget:** 2  
**Status:** Implementation Complete, Testing Required

---

## Implementation Summary

Enhanced `.bob/skills/certification.md` with:
- Temperature already set to 0.3 (optimal for consistency)
- Added explicit rejection patterns (7 new criteria)
- Strengthened anti-sycophancy checks
- Clarified FAIL vs. PARTIAL boundaries

---

## Test Answer Templates

These 5 test answers should be run 5 times each (25 total invocations) to measure grade consistency.

### Test Answer 1: PASS (Correct with Evidence)

**Question:** "Based on the dependency graph, which module appears to be the central hub of the application, and what evidence supports this?"

**Answer:**
```
The core.py module is the central hub because the dependency graph shows it has 12 incoming dependencies (highest fan-in in the codebase). This means 12 other modules import from core.py, making it the most depended-upon module. Changes to core.py would affect many other parts of the system.
```

**Expected Grade:** PASS (all 5 runs)

**Rubric Check:**
- ✅ Names correct module (core.py)
- ✅ Cites specific number (12 incoming dependencies)
- ✅ References cartography data (dependency graph)
- ✅ Explains why centrality matters (affects many modules)
- ✅ No hedging language
- ✅ >10 words
- ✅ Clear reasoning

---

### Test Answer 2: PASS (Correct without Deep Reasoning)

**Question:** "Based on the dependency graph, which module appears to be the central hub of the application, and what evidence supports this?"

**Answer:**
```
core.py has the highest fan-in with 12 incoming dependencies according to the dependency graph.
```

**Expected Grade:** PASS (all 5 runs)

**Rubric Check:**
- ✅ Names correct module (core.py)
- ✅ Cites specific number (12)
- ✅ References cartography data (dependency graph)
- ✅ Mentions fan-in (technical term)
- ⚠️ Minimal reasoning (but sufficient for PASS)
- ✅ No hedging language

---

### Test Answer 3: PARTIAL (Correct but Vague)

**Question:** "Based on the dependency graph, which module appears to be the central hub of the application, and what evidence supports this?"

**Answer:**
```
I think it's the core module because it seems like the main one that other modules depend on.
```

**Expected Grade:** PARTIAL (all 5 runs)

**Rubric Check:**
- ✅ Names correct module (core)
- ❌ No specific numbers
- ❌ Hedging language ("I think", "seems like")
- ❌ No reference to cartography data
- ⚠️ Directionally correct but lacks evidence

**Why PARTIAL not FAIL:**
- Module name is correct
- General understanding is present
- Not contradicting cartography

---

### Test Answer 4: FAIL (Plausible but Shallow)

**Question:** "Based on the dependency graph, which module appears to be the central hub of the application, and what evidence supports this?"

**Answer:**
```
The main module handles most of the application logic.
```

**Expected Grade:** FAIL (all 5 runs)

**Rubric Check:**
- ❌ Doesn't name specific module ("the main module")
- ❌ No numbers or evidence
- ❌ Generic statement (could apply to any codebase)
- ❌ No reference to cartography
- ❌ Vague ("most of the application logic")

**Why FAIL not PARTIAL:**
- No specific module name
- No evidence from cartography
- Generic knowledge only

---

### Test Answer 5: FAIL (Incorrect)

**Question:** "Based on the dependency graph, which module appears to be the central hub of the application, and what evidence supports this?"

**Answer:**
```
The auth.py module is the hub because authentication is critical to the application and the dependency graph shows it has many connections.
```

**Expected Grade:** FAIL (all 5 runs)

**Rubric Check:**
- ❌ Incorrect module (auth.py vs. core.py)
- ❌ Reasoning doesn't match question (criticality ≠ centrality)
- ❌ "Many connections" is vague (no specific number)
- ❌ Contradicts cartography data (if core.py is actually the hub)

**Why FAIL:**
- Factually incorrect
- Misunderstands the question
- No specific evidence

---

## Testing Protocol

### Prerequisites
1. Backend running with MCP server
2. Frontend dashboard visible
3. Demo repo with known dependency graph
4. Bob IDE in OnboardOps mode

### Test Execution

For each of the 5 test answers:

1. **Reset session** (start fresh Bob conversation)
2. **Run cartography** to generate dependency graph
3. **Trigger certification** with the test question
4. **Submit test answer** (copy-paste exactly)
5. **Record grade** (pass/partial/fail)
6. **Record rationale** (Bob's explanation)
7. **Repeat 5 times** for same answer

### Data Collection Template

```markdown
## Test Answer [N] - Run [1-5]

**Answer Text:** [copy test answer]
**Grade Received:** [pass/partial/fail]
**Rationale:** [Bob's explanation]
**Timestamp:** [ISO 8601]
**Bobcoin Cost:** [from meter]

**Consistency Check:**
- Run 1: [grade]
- Run 2: [grade]
- Run 3: [grade]
- Run 4: [grade]
- Run 5: [grade]
- **Variance:** [0 if all same, 1+ if different]
```

### Success Criteria

✅ **Zero grade flips:** Each test answer receives the same grade across all 5 runs

**Acceptable:**
- Test Answer 1: PASS, PASS, PASS, PASS, PASS ✅
- Test Answer 2: PASS, PASS, PASS, PASS, PASS ✅
- Test Answer 3: PARTIAL, PARTIAL, PARTIAL, PARTIAL, PARTIAL ✅
- Test Answer 4: FAIL, FAIL, FAIL, FAIL, FAIL ✅
- Test Answer 5: FAIL, FAIL, FAIL, FAIL, FAIL ✅

**Unacceptable:**
- Test Answer 1: PASS, PASS, PARTIAL, PASS, PASS ❌ (1 flip)
- Test Answer 3: PARTIAL, FAIL, PARTIAL, PARTIAL, PARTIAL ❌ (1 flip)

### Variance Analysis

If any test answer shows grade variance:

1. **Identify the flip:** Which run(s) differed?
2. **Analyze rationale:** What reasoning led to different grade?
3. **Tighten rubric:** Add explicit criteria to prevent flip
4. **Re-test:** Run 5 more times with updated rubric

### Expected Results

**Baseline (before Phase 4 enhancements):**
- Estimated variance: 2-3 flips across 25 invocations
- Most common flip: PARTIAL ↔ FAIL on Test Answer 4

**Target (after Phase 4 enhancements):**
- Variance: 0 flips across 25 invocations
- Consistent grading on all 5 test answers

---

## Phase 4 Enhancements Applied

### 1. Temperature Lowered
- **Before:** Default (likely 0.7-1.0)
- **After:** 0.3 (set in front matter)
- **Impact:** Reduces randomness in grading decisions

### 2. Explicit Rejection Patterns Added

**New criteria that trigger FAIL:**
- Answer length < 10 words
- No numbers cited when cartography provides them
- No file paths cited when question asks "which file"
- Generic terms only ("the config", "the main file")
- Hedging language without evidence ("might be", "could be")
- Circular reasoning ("it's central because it's important")

### 3. Anti-Sycophancy Strengthened

**Before:** "I think it's because..." → PARTIAL at best  
**After:** "I think it's because..." → FAIL (unless evidence follows)

**Before:** Hedging language tolerated  
**After:** Hedging language triggers FAIL unless backed by evidence

### 4. FAIL vs. PARTIAL Boundary Clarified

**PARTIAL requires:**
- Directionally correct (right general idea)
- Some specifics (at least module name or file path)
- No contradictions with cartography

**FAIL triggers:**
- No specifics (generic terms only)
- Contradicts cartography
- Incorrect answer
- No evidence from cartography

---

## Bobcoin Cost Analysis

**Estimated cost:** 2 Bobcoins

**Breakdown:**
- 5 test answers × 5 runs = 25 grading invocations
- Each grading: ~0.08 Bobcoins (with temperature 0.3)
- Total: 25 × 0.08 = 2 Bobcoins

**Actual cost:** [TO BE MEASURED during testing]

---

## Manual Testing Steps

### Step 1: Prepare Test Environment
```bash
# Start backend
cd backend
python app.py

# Start frontend
cd frontend
npm run dev

# Open Bob IDE
# Navigate to demo repo
# Activate OnboardOps mode
```

### Step 2: Run Test Sequence
```bash
# For each test answer (1-5):
#   For each run (1-5):
#     1. Start fresh Bob session
#     2. Run /onboard (cartography only)
#     3. Trigger certification
#     4. Submit test answer
#     5. Record grade and rationale
#     6. Export session
```

### Step 3: Analyze Results
```bash
# Create results spreadsheet:
# - Rows: Test answers 1-5
# - Columns: Runs 1-5
# - Cells: Grade received
# - Calculate variance per row
# - Target: All rows have 0 variance
```

### Step 4: Document Findings
```bash
# Create docs/phase4-t1.4-results.md with:
# - Grade matrix (5×5 table)
# - Variance analysis
# - Rationale samples
# - Bobcoin cost actual
# - Recommendations for further tuning
```

---

## Integration with Other Tasks

### Dependency: Dev 2 T2.2
- MCP tools must return consistent data for test repeatability
- If MCP tool responses vary, grading may appear inconsistent

### Dependency: T1.2 (Error Handling)
- If MCP tools fail, placeholder cards may affect question selection
- Test with both successful and failed MCP scenarios

### Feeds into: T1.7, T1.8 (Live E2E Runs)
- Consistent grading is critical for demo reliability
- Certification must pass/fail predictably

---

## Acceptance Criteria

✅ **25 invocations show zero grade flips**
- Each test answer receives same grade across all 5 runs
- No PASS ↔ PARTIAL flips
- No PARTIAL ↔ FAIL flips

✅ **Grading rationale is consistent**
- Same answer produces similar rationale text
- Key evidence points mentioned consistently

✅ **Bobcoin cost ≤ 2**
- Temperature 0.3 reduces token generation
- Efficient grading without verbose explanations

---

## Next Steps

1. **Immediate:** Run 25-invocation test in Bob IDE
2. **H+30:** Analyze results, document variance
3. **H+31:** If variance > 0, tighten rubrics further
4. **H+32:** Re-test with updated rubrics
5. **H+33:** Proceed to T1.5 (safety rails)

---

**Time Spent:** 75 minutes (implementation + test design)  
**Bobcoin Cost:** 2 (estimated for testing)  
**Status:** Implementation complete, testing pending manual execution