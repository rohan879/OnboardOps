# Phase 3 Bobcoin Tuning - Round Two

**Owner:** Dev 1 (Bob Architect)  
**Phase:** 3 (H+10 to H+28)  
**Target:** ≤12 Bobcoins per full E2E run  
**Status:** 🔄 In Progress

---

## Overview

Phase 2 established the baseline with Stage 1 cartography at ~2 Bobcoins. Phase 3 adds three more cartography stages, full certification, and starter PR generation. Without tuning, the full pipeline would cost ~20 Bobcoins. This document tracks the compression strategies to hit the ≤12 Bobcoin target.

---

## Cost Breakdown (Pre-Tuning)

| Feature | Estimated Cost | Notes |
|---------|---------------|-------|
| Stage 1: Dependency Graph | 2.0 | Already tuned in Phase 2 |
| Stage 2: Entry Points | 2.5 | New in Phase 3, untuned |
| Stage 3: Change Hotspots | 3.0 | Most expensive (multiple MCP calls) |
| Stage 4: Project Conventions | 2.0 | File reading + analysis |
| Certification (3 questions) | 4.5 | 1.5 per question with grading |
| Starter PR Generation | 2.5 | Diff generation + commit message |
| **Total (untuned)** | **16.5** | **Exceeds 12 Bobcoin target by 37%** |

---

## Tuning Strategies

### Strategy 1: Move Repeating Instructions to Rules

**Target savings:** 1.5 Bobcoins

**Implementation:**
- Cartography style rules already in [`.bob/rules/cartography-style.md`](../.bob/rules/cartography-style.md)
- Add certification grading rules to a new file: `.bob/rules/certification-grading.md`
- Move anti-sycophancy prompt from skill to rules (loaded once per session)
- Move remediation templates to rules

**Files to create:**
```
.bob/rules/certification-grading.md  (anti-sycophancy prompt)
.bob/rules/remediation-templates.md  (80-word templates for each stage)
```

**Expected impact:**
- Certification: 4.5 → 3.5 Bobcoins (-1.0)
- Cartography: 9.5 → 9.0 Bobcoins (-0.5)

### Strategy 2: Reduce Verbose Examples

**Target savings:** 1.0 Bobcoins

**Implementation:**
- Remove full JSON examples from skill files (Bob can infer structure)
- Replace multi-line examples with pattern references
- Use "see contract" instead of repeating schemas

**Example transformation:**

**Before (verbose):**
```markdown
Emit this event:
```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "hotspots",
    "title": "Change Hotspots",
    "body_markdown": "...",
    "data": {
      "files": [
        {
          "path": "src/auth.py",
          "commit_count": 47,
          "distinct_authors": 5,
          "top_author": "Alice Chen",
          "last_pr_title": "feat: Add JWT refresh",
          "last_pr_url": "https://...",
          "rationale": "..."
        }
      ]
    }
  }
}
```
```

**After (compressed):**
```markdown
Emit `card_emit` event with `card_type: "hotspots"` and hotspots data (see contract).
```

**Expected impact:**
- All stages: -0.8 Bobcoins
- Certification: -0.2 Bobcoins

### Strategy 3: Cap Output Tokens

**Target savings:** 1.5 Bobcoins

**Implementation:**
- Add `output_token_cap` to skill front matter
- Cartography stages: 700 tokens max (already set)
- Certification questions: 400 tokens max
- Starter PR: 500 tokens max
- Enforce in Bob's response generation

**Front matter additions:**
```yaml
output_token_cap: 400  # for certification
output_token_cap: 500  # for starter-pr
```

**Expected impact:**
- Prevents verbose responses that inflate cost
- Certification: -0.5 Bobcoins
- Starter PR: -0.3 Bobcoins
- Cartography narration: -0.7 Bobcoins

### Strategy 4: Batch MCP Tool Calls

**Target savings:** 0.5 Bobcoins

**Implementation:**
- Stage 3 currently calls MCP tools sequentially per file
- Batch calls where possible (e.g., get all authors in one call)
- Cache aggressively (already implemented in backend)

**Optimization:**
```python
# Before: 5 separate calls
for file in hotspots:
    authors = call_mcp("recent_authors", file)
    prs = call_mcp("pr_for_file", file)

# After: 2 batched calls
all_authors = call_mcp("recent_authors", files=hotspots)
all_prs = call_mcp("pr_for_file", files=hotspots)
```

**Expected impact:**
- Stage 3: 3.0 → 2.5 Bobcoins (-0.5)

### Strategy 5: Compress Remediation Text

**Target savings:** 0.5 Bobcoins

**Implementation:**
- 80-word remediation cap already set in front matter
- Pre-write remediation templates in rules file
- Bob fills in placeholders rather than generating from scratch

**Template example:**
```
The [STAGE] card shows [DATA_TYPE]. Look for [SPECIFIC_METRIC] to find [ANSWER_TYPE]. Review the [CARD_LOCATION] to identify [CORRECT_ANSWER].
```

**Expected impact:**
- Remediation loops: -0.5 Bobcoins across all stages

---

## Tuning Implementation Checklist

- [x] Create `.bob/rules/certification-grading.md` with anti-sycophancy prompt
- [x] Create `.bob/rules/remediation-templates.md` with 80-word templates
- [ ] Remove verbose JSON examples from all skill files
- [ ] Add `output_token_cap` to certification and starter-pr skills
- [ ] Test batched MCP calls in Stage 3 (coordinate with Dev 2)
- [ ] Measure cost of 3 back-to-back E2E runs
- [ ] Adjust caps if still over 12 Bobcoins

---

## Measurement Protocol

### Test Setup

1. Reset demo machine to clean state
2. Run full E2E pipeline 3 times:
   - Run 1: Fresh session (cold cache)
   - Run 2: Warm cache (same repo)
   - Run 3: Different onboardee name (session variation)
3. Capture Bobcoin spend from each run
4. Calculate mean and p95

### Success Criteria

- **Mean cost:** ≤12 Bobcoins
- **P95 cost:** ≤14 Bobcoins (allows for variation)
- **No stage exceeds:** 3 Bobcoins individually

### Measurement Commands

```bash
# Run 1: Fresh
./scripts/reset-demo-machine.sh
bob /onboard --track-cost > run1.log

# Run 2: Warm cache
bob /onboard --track-cost > run2.log

# Run 3: Variation
bob /onboard --onboardee "Bob Martinez" --track-cost > run3.log

# Extract costs
grep "Bobcoin" run*.log | awk '{sum+=$NF} END {print "Mean:", sum/3}'
```

---

## Tuning Results (To Be Filled After Testing)

### Run 1: Fresh Session
- Stage 1: ___ Bobcoins
- Stage 2: ___ Bobcoins
- Stage 3: ___ Bobcoins
- Stage 4: ___ Bobcoins
- Certification: ___ Bobcoins
- Starter PR: ___ Bobcoins
- **Total:** ___ Bobcoins

### Run 2: Warm Cache
- Stage 1: ___ Bobcoins
- Stage 2: ___ Bobcoins
- Stage 3: ___ Bobcoins
- Stage 4: ___ Bobcoins
- Certification: ___ Bobcoins
- Starter PR: ___ Bobcoins
- **Total:** ___ Bobcoins

### Run 3: Variation
- Stage 1: ___ Bobcoins
- Stage 2: ___ Bobcoins
- Stage 3: ___ Bobcoins
- Stage 4: ___ Bobcoins
- Certification: ___ Bobcoins
- Starter PR: ___ Bobcoins
- **Total:** ___ Bobcoins

### Summary Statistics
- **Mean:** ___ Bobcoins
- **P95:** ___ Bobcoins
- **Target met:** ☐ Yes ☐ No
- **Savings achieved:** ___ Bobcoins (from 16.5 baseline)

---

## Fallback Plan (If Target Not Met)

If tuning doesn't reach ≤12 Bobcoins:

### Option A: Reduce Certification Questions
- Drop from 3 questions to 2
- Savings: ~1.5 Bobcoins
- Trade-off: Less thorough validation

### Option B: Simplify Stage 3
- Reduce hotspots from 10 files to 5
- Skip rationale generation for bottom 5
- Savings: ~0.8 Bobcoins
- Trade-off: Less comprehensive hotspot analysis

### Option C: Skip Starter PR in Demo
- Move starter PR to post-demo manual step
- Savings: ~2.5 Bobcoins
- Trade-off: Less impressive demo, but certification still works

---

## Integration with Phase 4

Phase 4 will add:
- Demo recording rehearsals (~5 Bobcoins per rehearsal)
- Final video capture (~10 Bobcoins for multiple takes)
- Polish iterations (~3 Bobcoins per iteration)

With Phase 3 tuned to 12 Bobcoins, Dev 1's remaining budget:
- Phase 3 spend: 14 Bobcoins (12 target + 2 buffer)
- Cumulative: 24 / 40 Bobcoins
- Phase 4 headroom: 16 Bobcoins

This allows for:
- 3 demo rehearsals (15 Bobcoins)
- 1 Bobcoin buffer for fixes

---

## Next Steps

1. **Immediate (T1.8):**
   - Create rules files for certification and remediation
   - Remove verbose examples from skills
   - Add output token caps

2. **Testing (T1.9):**
   - Run 3 E2E tests
   - Measure and document costs
   - Adjust if needed

3. **Handoff to Phase 4:**
   - Document final tuning parameters
   - Provide cost breakdown for demo planning
   - Flag any remaining optimization opportunities

---

**Last Updated:** Phase 3, H+20  
**Status:** Tuning strategies defined, implementation in progress  
**Next Milestone:** T1.9 (Full E2E Run + Session Curation)