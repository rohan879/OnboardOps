# Phase 4 Dev 1 Defect Triage - T1.1

**Task:** T1.1 - Defect Triage From H+28 Sync  
**Owner:** Dev 1 (Bob Architect)  
**Date:** 2026-05-16  
**Time Budget:** 30 minutes  
**Bobcoin Budget:** 0  
**Status:** Complete

---

## Defect Analysis from H+28 Sync

Based on review of `docs/demo-defects.md` and Phase 3 completion status, identifying Bob-related defects that need remediation in Phase 4.

---

## Bob-Related Defects Identified

### P0 - Critical (Must Fix)

#### D1: MCP Tool Failure Handling
**Severity:** P0  
**Impact:** Demo-breaking if any MCP tool fails  
**Current State:** Skills assume MCP tools always return valid data  
**Remediation:** T1.2 - Add graceful degradation for empty/errored MCP responses

**Evidence:**
- `.bob/skills/repo-cartography.md` Stage 3 calls `commit_frequency`, `recent_authors`, `pr_for_file`, `file_changelog` without error handling
- If any tool returns empty or errors, cartography narration will be malformed
- No fallback path for tool failures

**Resolution Plan:**
1. Add try-catch pattern in cartography skill for all MCP tool calls
2. Emit placeholder cards with "Data unavailable" on tool failure
3. Continue to next stage without blocking
4. Test by deliberately breaking 3 tool responses

---

#### D2: Malformed Bob Output
**Severity:** P0  
**Impact:** Dashboard crashes or shows corrupted data  
**Current State:** No validation of Bob's JSON output in `emit_event` calls  
**Remediation:** T1.5 - Add safety rails against malformed output

**Evidence:**
- Bob occasionally returns malformed JSON in `emit_event` payloads
- No JSON schema validation in MCP server
- No retry mechanism if Bob produces invalid structure

**Resolution Plan:**
1. Add JSON validation in MCP `emit_event` handler (coordinate with Dev 2)
2. Add fallback path in skills that re-asks Bob with stricter format
3. Cap output tokens explicitly in mode metadata
4. Test with 3 deliberate malformed-output scenarios

---

#### D3: Certification Grading Inconsistency
**Severity:** P0  
**Impact:** Same answer gets different grades across runs (demo unreliability)  
**Current State:** Grading rubric not tight enough, temperature too high  
**Remediation:** T1.4 - Tune certification grading for consistency

**Evidence:**
- `.bob/skills/certification.md` uses default temperature (likely 0.7-1.0)
- Rubric has subjective criteria ("plausible guess")
- No explicit rejection patterns for shallow answers

**Resolution Plan:**
1. Lower grading temperature to 0.3 in skill front matter
2. Add explicit rejection criteria to rubric
3. Require evidence in specific format
4. Test: 5 answers × 5 runs = 25 invocations, target zero grade flips

---

### P1 - High (Should Fix)

#### D4: Edge Case File Paths
**Severity:** P1  
**Impact:** Cartography fails on repos with unusual file paths  
**Current State:** No handling for spaces, long paths, mixed languages  
**Remediation:** T1.3 - Add edge case handling for unusual file paths

**Evidence:**
- Cartography assumes clean file paths (no spaces, reasonable length)
- No truncation in narration for long paths
- No safe-quoting in MCP calls

**Resolution Plan:**
1. Test 3 edge cases: spaces in path, >200 char path, mixed Python/TypeScript
2. Add truncation in narration (show first 50 chars + "...")
3. Add safe-quoting in MCP tool calls
4. Verify sensible output for all 3 scenarios

---

#### D5: Bobcoin Budget Overrun Risk
**Severity:** P1  
**Impact:** Dev 1 exceeds personal 40-coin cap, blocks Phase 5  
**Current State:** Phase 3 spent 24/40 coins, Phase 4 target 13, leaves only 3 for Phase 5  
**Remediation:** T1.6 - Final Bobcoin compression pass

**Evidence:**
- Current E2E run costs 11-12 Bobcoins (Phase 3 measurement)
- Phase 4 target: 9-10 Bobcoins per run
- Need 1.5-2 Bobcoin reduction

**Resolution Plan:**
1. Re-measure spend across 2 full E2E runs
2. Identify 2 highest-cost prompts
3. Apply targeted compression: shorter examples, tighter schemas, removed-on-reload rules
4. Target: ≤10 Bobcoins per E2E run

---

### P2 - Medium (Nice to Fix)

#### D6: Prompt Pattern Documentation Incomplete
**Severity:** P2  
**Impact:** Team lacks reference for Phase 5 work  
**Current State:** `docs/prompt-patterns.md` has 10 patterns but needs expansion  
**Remediation:** T1.9 - Final prompt-patterns write-up

**Evidence:**
- Current doc is 313 lines, ~1200 words
- Target: ≥1500 words with 6+ concrete examples
- Missing: Phase 3 patterns (remediation loops, certification grading)

**Resolution Plan:**
1. Add 2-3 new patterns from Phase 3 work
2. Expand existing patterns with code examples from OnboardOps
3. Add cross-references to actual skill files
4. Target: 1500+ words, judge-ready artifact

---

## Defect Prioritization

### Immediate Actions (H+28 to H+30)
1. **T1.2** - MCP tool failure handling (60 min, 1 Bobcoin)
2. **T1.3** - Edge case file paths (45 min, 1 Bobcoin)
3. **T1.4** - Certification grading consistency (75 min, 2 Bobcoins)

### Secondary Actions (H+30 to H+34)
4. **T1.5** - Malformed output safety rails (60 min, 1 Bobcoin)
5. **T1.6** - Bobcoin compression (60 min, 1.5 Bobcoins)

### Polish Actions (H+34 to H+40)
6. **T1.9** - Prompt patterns write-up (30 min, 0 Bobcoins)
7. **T1.10** - Session curation (45 min, 0 Bobcoins)

---

## Cross-Team Dependencies

### Dev 2 (Backend/MCP)
- **D2 Resolution**: Need JSON validation in `emit_event` handler
- **Coordination Point**: T1.5 (Safety Rails) requires Dev 2 T2.2 (Per-Tool Error Handling)
- **Timeline**: Dev 2 T2.2 completes by H+30, unblocks Dev 1 T1.5

### Dev 3 (Frontend/Dashboard)
- **D2 Impact**: Dashboard must handle placeholder cards gracefully
- **Coordination Point**: T1.2 (MCP failures) may surface new card states
- **Timeline**: Dev 3 T3.4 (Empty State Polish) should handle "Data unavailable" cards

### Dev 4 (Infra/Bob Shell)
- **No direct dependencies** for defect remediation
- **Coordination Point**: T1.7/T1.8 (Live E2E runs) require Dev 4 T4.5 (Preflight script)

---

## Success Criteria

This triage is complete when:

- ✅ All P0 defects have resolution plans with task assignments
- ✅ All P1 defects have resolution plans with task assignments
- ✅ Cross-team dependencies identified and communicated
- ✅ Task ordering optimized for critical path
- ✅ Bobcoin budget validated against Phase 4 target (13 coins)

**Actual Bobcoin Allocation:**
- T1.2: 1 coin
- T1.3: 1 coin
- T1.4: 2 coins
- T1.5: 1 coin
- T1.6: 1.5 coins
- T1.7: 3 coins
- T1.8: 3 coins
- T1.11: 0.5 coins
- **Total: 13 coins** ✅ (matches Phase 4 target)

---

## Next Steps

1. **Immediate**: Begin T1.2 (MCP tool failure handling)
2. **H+29**: Complete T1.2, begin T1.3 (edge cases)
3. **H+30**: Complete T1.3, begin T1.4 (grading consistency)
4. **H+31**: Complete T1.4, begin T1.5 (safety rails)
5. **H+32**: Complete T1.5, begin T1.6 (compression)
6. **H+33**: Complete T1.6, begin T1.7 (first live E2E run)

---

**Acceptance Criteria Met:**
- ✅ Top three Bob-related defects have remediation plans with effort estimates
- ✅ Defects ordered by severity and demo impact
- ✅ Cross-team coordination points identified
- ✅ Bobcoin budget validated

**Time Spent:** 30 minutes  
**Bobcoin Cost:** 0 (analysis only, no Bob invocations)