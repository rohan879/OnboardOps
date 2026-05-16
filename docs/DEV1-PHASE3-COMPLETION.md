# Dev 1 Phase 3 Completion Guide

**Owner:** Dev 1 (Bob Architect)  
**Phase:** 3 (H+10 to H+28)  
**Status:** ✅ Implementation Complete - Ready for E2E Testing  
**Last Updated:** 2026-05-16

---

## Implementation Summary

All 9 Dev 1 tasks for Phase 3 are complete:

### ✅ T1.1: Stage 2 Entry Points Cartography (90 min, 2 Bobcoins)
- **File:** [`.bob/skills/repo-cartography.md`](../.bob/skills/repo-cartography.md) (lines 85-185)
- **Features:**
  - HTTP route enumeration (FastAPI, Flask, Django)
  - CLI entry point detection
  - Scheduled jobs discovery
  - Message consumer identification
  - Socratic question with remediation loop

### ✅ T1.2: Stage 3 Change Hotspots Cartography (105 min, 2.5 Bobcoins)
- **File:** [`.bob/skills/repo-cartography.md`](../.bob/skills/repo-cartography.md) (lines 186-265)
- **Features:**
  - Top 10 high-churn files from last 180 days
  - MCP tool integration (`commit_frequency`, `recent_authors`, `pr_for_file`, `file_changelog`)
  - AI-generated rationales for each hotspot
  - Socratic question with remediation loop

### ✅ T1.3: Stage 4 Project Conventions Cartography (90 min, 2 Bobcoins)
- **File:** [`.bob/skills/repo-cartography.md`](../.bob/skills/repo-cartography.md) (lines 266-345)
- **Features:**
  - Naming convention detection (snake_case, camelCase, PascalCase)
  - Error handling pattern inference
  - Test layout analysis
  - Documentation style detection
  - Socratic question with remediation loop

### ✅ T1.4: Full Certification Skill with 12 Templates (120 min, 1.5 Bobcoins)
- **File:** [`.bob/skills/certification.md`](../.bob/skills/certification.md)
- **Features:**
  - 12 question templates covering all 4 cartography stages
  - Question selection algorithm (3 questions, 2+ stages covered)
  - Parameterization with cartography data
  - Pass threshold: 2 of 3 pass/partial

### ✅ T1.5: Anti-Sycophancy Grader Prompt (60 min, 1 Bobcoin)
- **File:** [`.bob/skills/certification.md`](../.bob/skills/certification.md) (lines 380-480)
- **File:** [`.bob/rules/certification-grading.md`](../.bob/rules/certification-grading.md)
- **Features:**
  - Strict evidence-based grading
  - Penalizes plausible-but-shallow answers
  - Three-tier system (pass/partial/fail)
  - Token-efficient grading templates

### ✅ T1.6: Per-Stage Remediation Loop (75 min, 1 Bobcoin)
- **Files:**
  - [`.bob/skills/repo-cartography.md`](../.bob/skills/repo-cartography.md) (all 4 stages)
  - [`.bob/skills/certification.md`](../.bob/skills/certification.md)
  - [`.bob/rules/remediation-templates.md`](../.bob/rules/remediation-templates.md)
- **Features:**
  - 80-word remediation cap
  - Two-attempt maximum per question
  - State tracking with attempt counters
  - Template-based remediation (token efficient)

### ✅ T1.7: Starter PR Generation Skill (90 min, 2 Bobcoins)
- **File:** [`.bob/skills/starter-pr.md`](../.bob/skills/starter-pr.md)
- **Features:**
  - Three task types (docs+test, error handler, docstrings)
  - 30-line diff cap
  - Single-file constraint
  - Convention-aware generation
  - Progress event emission

### ✅ T1.8: Bobcoin Tuning Round Two (45 min, 1 Bobcoin)
- **File:** [`docs/phase3-bobcoin-tuning.md`](phase3-bobcoin-tuning.md)
- **Files:** [`.bob/rules/certification-grading.md`](../.bob/rules/certification-grading.md), [`.bob/rules/remediation-templates.md`](../.bob/rules/remediation-templates.md)
- **Features:**
  - Target: ≤12 Bobcoins per E2E run
  - 5 tuning strategies documented
  - Rules files created for token efficiency
  - Measurement protocol defined

### 🔄 T1.9: Full E2E Run + Session Curation (45 min, 3 Bobcoins)
- **Status:** Ready to execute
- **This document:** Implementation guide

---

## E2E Testing Protocol

### Prerequisites

1. **Demo repository selected and forked** (Dev 4's T4.2)
2. **Backend and frontend running** (use `scripts/start-integration-test.ps1` or `.sh`)
3. **Bob IDE configured** with `.bob/` directory synced to demo repo
4. **Clean state:** Run `scripts/reset-demo-machine.sh` (if available) or manually:
   ```powershell
   # Stop all services
   .\scripts\stop-integration-test.ps1
   
   # Clear session data
   Remove-Item -Recurse -Force .\logs\*
   Remove-Item -Recurse -Force .\bob_sessions\dev1\phase3-*
   
   # Restart services
   .\scripts\start-integration-test.ps1
   ```

### Test Run 1: Fresh Session (Cold Cache)

**Objective:** Measure baseline cost with no caching

**Steps:**
1. Open demo repository in Bob IDE
2. Ensure `.bob/` directory is present in demo repo
3. Run `/onboard` command
4. Respond to all 4 cartography questions (mix of correct/wrong answers to test remediation)
5. Complete certification (3 questions)
6. Allow starter PR generation to complete
7. **Capture:**
   - Screenshot of Bobcoin meter at end
   - Full Bob task session export
   - Dashboard screenshot showing all 4 cards
   - Certification panel screenshot

**Expected duration:** 10-12 minutes  
**Expected cost:** 12-14 Bobcoins (first run, cold cache)

### Test Run 2: Warm Cache

**Objective:** Measure cost with MCP tool caching active

**Steps:**
1. **Do not reset** - keep backend running
2. Run `/onboard` again in Bob IDE (new task)
3. Same demo repository
4. Respond to questions (different answers than Run 1)
5. **Capture:**
   - Bobcoin meter screenshot
   - Session export
   - Note any performance improvements

**Expected duration:** 8-10 minutes  
**Expected cost:** 10-12 Bobcoins (warm cache)

### Test Run 3: Variation Test

**Objective:** Test with different onboardee name and answer patterns

**Steps:**
1. Reset backend (clear cache): `.\scripts\stop-integration-test.ps1` then `.\scripts\start-integration-test.ps1`
2. Run `/onboard` with different onboardee name
3. Intentionally trigger remediation loops (wrong answers)
4. **Capture:**
   - Bobcoin meter screenshot
   - Session export
   - Remediation flow screenshots

**Expected duration:** 12-15 minutes (with remediations)  
**Expected cost:** 13-15 Bobcoins (includes remediation overhead)

---

## Session Curation Guidelines

### Selection Criteria

Choose 5 sessions from `bob_sessions/dev1/` that tell a coherent story:

1. **Stage Authoring Session** - Shows implementation of one cartography stage
2. **Prompt Compression Session** - Shows tuning work (removing verbose examples)
3. **Certification Grading Session** - Shows anti-sycophancy grader implementation
4. **Starter PR Generation Session** - Shows starter-pr skill authoring
5. **Debugging Arc Session** - Shows fixing a prompt or skill issue

### Curation Process

For each selected session:

1. **Export from Bob IDE:**
   - Use Bob's built-in export feature
   - Save as markdown to `bob_sessions/dev1/phase3-<session-name>.md`

2. **Add consumption screenshot:**
   - Screenshot of the session in Bob IDE
   - Save as `bob_sessions/dev1/phase3-<session-name>.png`
   - Show key moments: tool use, Bob's response, outcome

3. **Write session summary:**
   - Add to `bob_sessions/dev1/README.md`
   - Include: session name, duration, Bobcoin cost, key learnings

### Session Naming Convention

```
phase3-01-stage2-entry-points.md
phase3-02-stage3-hotspots.md
phase3-03-certification-grading.md
phase3-04-starter-pr-skill.md
phase3-05-remediation-debugging.md
```

---

## Bobcoin Tracking

### Cost Breakdown Template

Fill this in after each test run:

```markdown
## Test Run 1: Fresh Session

- Stage 1 (Dependency Graph): ___ Bobcoins
- Stage 2 (Entry Points): ___ Bobcoins
- Stage 3 (Change Hotspots): ___ Bobcoins
- Stage 4 (Project Conventions): ___ Bobcoins
- Certification (3 questions): ___ Bobcoins
- Starter PR Generation: ___ Bobcoins
- **Total:** ___ Bobcoins

## Test Run 2: Warm Cache

- Total: ___ Bobcoins
- Improvement: ___ Bobcoins saved

## Test Run 3: With Remediation

- Total: ___ Bobcoins
- Remediation overhead: ___ Bobcoins
```

### Target Validation

- ✅ **Pass:** Mean ≤12 Bobcoins
- ⚠️ **Warning:** Mean 12-14 Bobcoins (acceptable but tight)
- ❌ **Fail:** Mean >14 Bobcoins (requires additional tuning)

If target not met, activate fallback plans from [`phase3-bobcoin-tuning.md`](phase3-bobcoin-tuning.md):
- Option A: Reduce certification to 2 questions (-1.5 Bobcoins)
- Option B: Simplify Stage 3 to 5 hotspots (-0.8 Bobcoins)
- Option C: Skip starter PR in demo (-2.5 Bobcoins)

---

## Manual Tasks for User

Since you are Dev 1, here are the manual steps you need to perform:

### Step 1: Verify Demo Repository Setup
```bash
# Check if demo repo is selected
cat notes/demo-repo-choice.md

# If not selected, coordinate with Dev 4 or select one:
# Recommended: fastapi/full-stack-fastapi-template
```

### Step 2: Sync .bob/ Directory to Demo Repo
```bash
# Copy .bob/ directory to demo repository
# (Adjust path based on where demo repo is located)
cp -r .bob/ /path/to/demo-repo/.bob/
```

### Step 3: Start Integration Test Environment
```powershell
# Windows
.\scripts\start-integration-test.ps1

# Unix/Mac
./scripts/start-integration-test.sh
```

### Step 4: Run E2E Tests in Bob IDE

1. Open demo repository in Bob IDE
2. Run `/onboard` command
3. Follow the test protocol above for all 3 runs
4. Capture screenshots and export sessions

### Step 5: Curate Sessions

1. Select 5 best sessions from Bob IDE
2. Export each to `bob_sessions/dev1/`
3. Add screenshots
4. Update `bob_sessions/dev1/README.md`

### Step 6: Document Results

Fill in the cost breakdown in [`phase3-bobcoin-tuning.md`](phase3-bobcoin-tuning.md) with actual numbers from your test runs.

---

## Success Criteria

Phase 3 Dev 1 tasks are complete when:

- ✅ All 4 cartography stages emit real cards with data
- ✅ All 4 stages have Socratic questions with remediation
- ✅ Certification skill selects 3 questions and grades them
- ✅ Anti-sycophancy grader rejects shallow answers
- ✅ Starter PR skill generates bounded diffs
- ✅ 3 E2E runs complete successfully
- ✅ Mean Bobcoin cost ≤12 (or fallback plan activated)
- ✅ 5 curated sessions exported to `bob_sessions/dev1/`

---

## Handoff to Phase 4

After completing T1.9, provide these artifacts to the team:

1. **Cost report:** Actual Bobcoin spend from 3 E2E runs
2. **Curated sessions:** 5 sessions in `bob_sessions/dev1/`
3. **Known issues:** Any bugs or edge cases discovered
4. **Tuning recommendations:** Any additional optimizations for Phase 4

---

## Next Steps

1. **Immediate:** Run the 3 E2E tests following the protocol above
2. **Curation:** Select and export 5 sessions
3. **Documentation:** Fill in cost data in tuning document
4. **Handoff:** Brief Dev 3 (Frontend) on any dashboard issues observed
5. **Handoff:** Brief Dev 5 (Integration) on starter PR skill usage

---

**Estimated Time:** 45 minutes (as per T1.9)  
**Estimated Cost:** 3 Bobcoins (for running 3 E2E tests)  
**Cumulative Dev 1 Spend:** 24 / 40 Bobcoins (60% of personal budget)  
**Phase 4 Headroom:** 16 Bobcoins remaining