# Dev 3 Remaining Manual Tasks

## Overview

Three tasks remain for Phase 3 completion. These are primarily **manual testing and documentation tasks** that require human judgment and cannot be fully automated.

---

## T3.10: Replay Mode Polish (45 min, 0 BC)

### Status: OPTIONAL - Can be deferred

**Objective:** Add playback controls to replay recorded sessions.

### Why This Can Be Deferred:
- Replay mode is a **nice-to-have** feature for post-demo analysis
- Core demo flow doesn't require replay functionality
- Time better spent on T3.11 (E2E testing) and T3.12 (documentation)

### If You Choose to Implement:

1. **Create `/replay` route:**
   ```bash
   mkdir -p frontend/src/app/replay
   touch frontend/src/app/replay/page.tsx
   ```

2. **Add playback speed controls:**
   - Buttons for 1x, 2x, 5x, 10x speed
   - URL parameter: `?speed=2`
   - Multiply all animation durations by `1/speed`

3. **Add timeline scrubber:**
   - Horizontal slider showing session progress
   - Click to jump to any point in timeline
   - Display current timestamp

4. **Add screenshot capture:**
   ```bash
   npm install html2canvas
   ```
   - Button to capture current frame
   - Downloads as PNG (1920×1080)
   - Filename: `onboardops-replay-{timestamp}.png`

### Acceptance Criteria:
- [ ] Replay route loads recorded session
- [ ] Speed controls work (1x, 2x, 5x, 10x)
- [ ] Scrubber allows timeline navigation
- [ ] Screenshot button captures frame

**Recommendation:** **SKIP** this task and focus on T3.11 and T3.12.

---

## T3.11: End-to-End Visual Test (60 min, 0.5 BC)

### Status: REQUIRED - Critical for demo quality

**Objective:** Run full onboarding pipeline 3 times and fix visual defects.

### Prerequisites:
1. Backend running on port 8765
2. Frontend running on port 3000
3. Demo repository selected and seeded
4. Bob IDE connected to hackathon team

### Test Protocol:

#### Run 1: Baseline Test
1. **Start fresh session:**
   ```bash
   cd frontend && pnpm dev
   cd backend && uvicorn app:app --port 8765
   ```

2. **Open dashboard:**
   - Navigate to `http://localhost:3000`
   - Verify stopwatch starts automatically
   - Check all four regions render

3. **Trigger cartography:**
   - In Bob IDE, run `/onboard` command
   - Watch dashboard update in real-time
   - Verify all four stages complete

4. **Answer certification questions:**
   - Wait for three questions to appear
   - Type answers in textareas
   - Verify grade badges animate correctly

5. **Document defects:**
   - Screenshot any visual issues
   - Note timestamp when issue occurred
   - Record browser console errors

#### Run 2: Stress Test
1. **Rapid state changes:**
   - Manually trigger step transitions quickly
   - Verify no animation jank
   - Check for race conditions

2. **Long session test:**
   - Let session run for 10+ minutes
   - Verify stopwatch doesn't drift
   - Check memory usage (DevTools)

3. **Recovery test:**
   - Trigger auto-recovery banner (test buttons)
   - Verify banner appears and dismisses
   - Check no layout shift

#### Run 3: Polish Pass
1. **Fix top 3 defects from Run 1 and Run 2**
2. **Re-run full pipeline**
3. **Verify fixes work**
4. **Document remaining known issues**

### Common Defects to Watch For:

| Defect | Symptom | Fix |
|--------|---------|-----|
| **Animation jank** | Cards stutter during transition | Reduce animation complexity |
| **Layout shift** | Content jumps when loading | Add min-height to containers |
| **Text overflow** | Long file paths break layout | Add `overflow: hidden` and ellipsis |
| **Color mismatch** | Colors don't match IBM palette | Update to exact hex values |
| **Spacing inconsistency** | Gaps not on 8px grid | Adjust padding/margin |
| **Focus state missing** | No outline on keyboard focus | Add focus-visible styles |

### Deliverables:
1. **Test report:** `docs/e2e-test-report.md`
   - Run 1 results
   - Run 2 results
   - Run 3 results
   - Top 3 defects fixed
   - Remaining known issues

2. **Screenshots:** `docs/screenshots/e2e-test/`
   - Before/after for each fix
   - Final clean run

### Acceptance Criteria:
- [ ] Three full runs completed
- [ ] Top 3 visual defects identified and fixed
- [ ] Test report documents all findings
- [ ] Screenshots show before/after

**Time Estimate:** 60 minutes (20 min per run)

---

## T3.12: Session Export + Screenshots (30 min, 0.5 BC)

### Status: REQUIRED - Critical for hackathon judging

**Objective:** Export Bob sessions and capture high-quality screenshots for submission.

### Part 1: Export Bob Sessions (15 min)

#### What to Export:
Export **3 representative Bob sessions** from your Phase 3 work:

1. **Session 1:** T3.4 (Certification Panel)
   - Shows complex component creation
   - Demonstrates state management
   - Highlights animation work

2. **Session 2:** T3.6 + T3.7 (Animation Polish)
   - Shows refactoring for shared animations
   - Demonstrates design system thinking
   - Highlights attention to detail

3. **Session 3:** T3.11 (E2E Testing)
   - Shows debugging process
   - Demonstrates quality assurance
   - Highlights problem-solving

#### How to Export:
1. **In Bob IDE:**
   - Open the task/conversation you want to export
   - Click "Export" button (top-right)
   - Choose "Markdown" format
   - Save to `bob_sessions/dev3/`

2. **Naming convention:**
   ```
   bob_sessions/dev3/
   ├── 16_phase3-certification-panel.md
   ├── 17_phase3-animation-polish.md
   └── 18_phase3-e2e-testing.md
   ```

3. **Include screenshot:**
   - Take screenshot of Bob IDE showing the session
   - Save as `{number}_phase3-{task-name}.png`
   - Place in same directory

### Part 2: Capture Screenshots (15 min)

#### What to Capture:
Capture **5 high-quality screenshots** at 1920×1080:

1. **Dashboard Overview (Complete State)**
   - All four cartography stages complete
   - Certification panel showing "Certified" state
   - Stopwatch showing ~10:00 time
   - All cards visible

2. **Dependency Graph (Zoomed)**
   - Focus on the dependency graph card
   - Show node labels clearly
   - Highlight hub nodes

3. **Three Card Variants (Grid View)**
   - Entry Points, Hotspots, Conventions
   - All three visible in grid layout
   - Show data populated

4. **Certification Panel (Graded)**
   - All three questions answered
   - Grade badges visible (mix of pass/partial/fail)
   - Rationale sections expanded

5. **Auto-Recovery Banner (In Action)**
   - Banner visible at top
   - Show "success" state
   - Demonstrate recovery pattern

#### How to Capture:

**Option 1: Browser DevTools (Recommended)**
```bash
# In Chrome DevTools:
1. Press F12
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Set dimensions to 1920×1080
4. Click "Capture screenshot" (⋮ menu)
5. Save to docs/screenshots/phase3/
```

**Option 2: macOS Screenshot**
```bash
# Full screen:
Cmd+Shift+3

# Selected area:
Cmd+Shift+4
# Then drag to select 1920×1080 area
```

**Option 3: Screenshot Tool**
```bash
# Install if needed:
brew install --cask shottr

# Capture and annotate
```

#### Naming Convention:
```
docs/screenshots/phase3/
├── 01-dashboard-overview.png
├── 02-dependency-graph.png
├── 03-card-variants-grid.png
├── 04-certification-panel.png
└── 05-auto-recovery-banner.png
```

### Quality Checklist:
- [ ] All screenshots are exactly 1920×1080
- [ ] No browser chrome visible (address bar, bookmarks)
- [ ] No personal information visible
- [ ] Colors are accurate (not washed out)
- [ ] Text is crisp and readable
- [ ] All UI elements are visible

### Deliverables:
1. **3 Bob session exports** in `bob_sessions/dev3/`
2. **5 screenshots** in `docs/screenshots/phase3/`
3. **README** in `bob_sessions/dev3/README.md` explaining each session

### Acceptance Criteria:
- [ ] 3 Bob sessions exported as markdown
- [ ] 5 screenshots captured at 1920×1080
- [ ] All files follow naming convention
- [ ] README documents each session's purpose

**Time Estimate:** 30 minutes (15 min exports + 15 min screenshots)

---

## Summary Checklist

### T3.10: Replay Mode Polish
- [ ] **OPTIONAL** - Can be skipped
- [ ] If implemented: Playback controls work
- [ ] If implemented: Screenshot capture works

### T3.11: End-to-End Visual Test
- [x] **REQUIRED** - Must complete
- [ ] Run 1: Baseline test completed
- [ ] Run 2: Stress test completed
- [ ] Run 3: Polish pass completed
- [ ] Top 3 defects fixed
- [ ] Test report written
- [ ] Screenshots captured

### T3.12: Session Export + Screenshots
- [x] **REQUIRED** - Must complete
- [ ] 3 Bob sessions exported
- [ ] 5 screenshots captured at 1920×1080
- [ ] README written
- [ ] All files committed and pushed

---

## Time Budget

| Task | Time | Bobcoins | Priority |
|------|------|----------|----------|
| T3.10 | 45 min | 0 | OPTIONAL |
| T3.11 | 60 min | 0.5 | REQUIRED |
| T3.12 | 30 min | 0.5 | REQUIRED |
| **Total** | **135 min** | **1.0** | - |

**Recommendation:** Skip T3.10, focus on T3.11 and T3.12 (90 minutes total).

---

## Next Steps

1. **Immediately:** Run T3.11 (E2E Visual Test)
2. **After fixes:** Run T3.12 (Session Export + Screenshots)
3. **Finally:** Push all changes and mark Phase 3 complete

---

**Last Updated:** 2026-05-16  
**Status:** Ready for manual execution  
**Owner:** Dev 3 (Frontend/Dashboard)