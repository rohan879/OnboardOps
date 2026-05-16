# Demo Recording Defects Catalog - T5.9

**Task:** Phase 3 T5.9 - Second Demo Recording Rehearsal  
**Owner:** Dev 5 (Integration Engineer)  
**Date:** 2026-05-16  
**Purpose:** Catalog every weak moment in the demo recording for Phase 4 fixes

---

## Recording Metadata

**Recording Date:** [TO BE FILLED]  
**Recording Duration:** [TO BE FILLED] seconds  
**Target Duration:** 60 seconds (±5 seconds)  
**Recording File:** `docs/recordings/phase3/onboardops-rehearsal-02.mp4`  
**Storyboard Version:** v1.0 (from `docs/demo-storyboard.md`)

---

## Defect Categories

### 🎬 Timing Issues
Beats that are too fast, too slow, or poorly paced

### 🐌 Slow Stretches
Moments where nothing visible happens or progress stalls

### 👁️ Visual Confusion
UI elements that are unclear, text that's illegible, or layout problems

### 🔊 Audio Issues
Narration problems, background noise, or audio sync issues

### 🐛 Technical Failures
Services not responding, errors appearing, or features not working

### 📝 Content Gaps
Missing information or unclear messaging

---

## Defect Log

### Beat 1: The Cold Start (0:00 - 0:03)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Notes:**
[TO BE FILLED after recording]

---

### Beat 2: OnboardOps Activation (0:03 - 0:08)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] `/onboard` command typing too slow
- [ ] Dashboard takes too long to appear
- [ ] Stopwatch doesn't start immediately

**Visual Issues:**
- [ ] Custom mode indicator not visible
- [ ] Dashboard layout broken
- [ ] Stopwatch too small to read

**Technical Issues:**
- [ ] `/onboard` command not recognized
- [ ] Dashboard fails to load
- [ ] WebSocket connection fails

**Notes:**
[TO BE FILLED after recording]

---

### Beat 3: First Cartography Card - Dependency Graph (0:08 - 0:15)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] Card animation too slow
- [ ] Bob's greeting too long
- [ ] MCP tool call takes too long

**Visual Issues:**
- [ ] Dependency graph not visible
- [ ] Card text too small
- [ ] Event stream not showing tool calls
- [ ] MCP indicator not green

**Technical Issues:**
- [ ] `git_blame_summary` tool fails
- [ ] Card doesn't render
- [ ] Event stream not updating

**Notes:**
[TO BE FILLED after recording]

---

### Beat 4: Cartography Cards 2-4 Stream In (0:15 - 0:25)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] Cards appear too slowly (>3 seconds each)
- [ ] Too much time between cards
- [ ] Event stream updates lag behind cards

**Visual Issues:**
- [ ] Entry Points card unclear
- [ ] Change Hotspots heatmap not visible
- [ ] Project Conventions text too dense
- [ ] Cards overlap or misalign

**Technical Issues:**
- [ ] `commit_frequency` tool fails
- [ ] `recent_authors` tool fails
- [ ] `file_changelog` tool fails
- [ ] Cards render out of order

**Content Issues:**
- [ ] Conventions list too generic
- [ ] Hotspots don't match actual repo
- [ ] Entry points missing key files

**Notes:**
[TO BE FILLED after recording]

---

### Beat 5: Bootstrap Auto-Recovery (0:25 - 0:35)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] Auto-recovery takes too long (>5 seconds)
- [ ] Error message appears too briefly
- [ ] Success checkmark not visible long enough

**Visual Issues:**
- [ ] Terminal output too small to read
- [ ] Error message not highlighted
- [ ] Recovery steps not clear
- [ ] Dashboard status not updating

**Technical Issues:**
- [ ] Bootstrap script doesn't run
- [ ] Port conflict not detected
- [ ] Auto-recovery doesn't trigger
- [ ] Health check fails after recovery

**Content Issues:**
- [ ] Error message too technical
- [ ] Recovery steps not explained
- [ ] Success criteria unclear

**Notes:**
[TO BE FILLED after recording]

---

### Beat 6: Certification Quiz (0:35 - 0:48)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] Questions appear too slowly
- [ ] Typing answers takes too long
- [ ] Grading feedback delayed
- [ ] Panel animation too slow

**Visual Issues:**
- [ ] Certification panel not visible
- [ ] Questions text too small
- [ ] Score not updating in real-time
- [ ] "Certified" badge not prominent
- [ ] Panel doesn't turn green on completion

**Technical Issues:**
- [ ] Questions don't load
- [ ] Answers not accepted
- [ ] Grading fails
- [ ] Score calculation wrong

**Content Issues:**
- [ ] Questions too easy/hard
- [ ] Questions don't match cartography data
- [ ] Feedback not helpful

**Notes:**
[TO BE FILLED after recording]

---

### Beat 7: Starter PR Generation (0:48 - 0:55)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] PR generation takes too long
- [ ] Test execution not visible
- [ ] PR URL appears too late

**Visual Issues:**
- [ ] Bob message not clear
- [ ] Terminal test output too small
- [ ] PR URL not clickable/visible
- [ ] PR title/description not shown

**Technical Issues:**
- [ ] PR generation fails
- [ ] Tests don't run
- [ ] GitHub API fails
- [ ] PR URL invalid

**Content Issues:**
- [ ] PR title not descriptive
- [ ] PR description missing onboarding time
- [ ] Test results not shown

**Notes:**
[TO BE FILLED after recording]

---

### Beat 8: The Payoff (0:55 - 1:00)

**Status:** [NOT TESTED / PASS / FAIL]

**Defects Found:**
- [ ] None

**Timing Issues:**
- [ ] GitHub page loads too slowly
- [ ] Stopwatch not visible long enough
- [ ] Transition to wordmark too abrupt

**Visual Issues:**
- [ ] GitHub PR page not clear
- [ ] Stopwatch time not prominent
- [ ] Both monitors not visible in frame
- [ ] Wordmark/tagline not clear

**Technical Issues:**
- [ ] GitHub page doesn't load
- [ ] Stopwatch shows wrong time
- [ ] Recording cuts off early

**Content Issues:**
- [ ] Final message not impactful
- [ ] Time savings not clear

**Notes:**
[TO BE FILLED after recording]

---

## Overall Recording Quality

### Technical Quality
- [ ] **Resolution:** 1920×1080 (1080p) ✓
- [ ] **Frame Rate:** 60 FPS ✓
- [ ] **Audio Quality:** Clear narration, no background noise ✓
- [ ] **No Dropped Frames:** Smooth playback throughout ✓

### Content Quality
- [ ] **All 8 Beats Present:** Every storyboard beat is included ✓
- [ ] **Timing Accurate:** Total duration 60±5 seconds ✓
- [ ] **Features Showcased:** All 9 core features visible ✓
- [ ] **Narration Matches:** Voice-over aligns with visuals ✓

### Production Quality
- [ ] **Text Legible:** All text readable at 100% zoom ✓
- [ ] **Cursor Visible:** Mouse movements clear and deliberate ✓
- [ ] **No Desktop Clutter:** Clean workspace, no distractions ✓
- [ ] **Professional Polish:** Smooth transitions, good pacing ✓

---

## Priority Defects for Phase 4

### P0 - Critical (Must Fix Before Final Video)
[TO BE FILLED - List defects that completely break the demo]

**Example:**
- Backend not responding during cartography
- Dashboard doesn't load
- PR generation fails

### P1 - High (Should Fix Before Final Video)
[TO BE FILLED - List defects that significantly hurt demo quality]

**Example:**
- Timing too slow in Beat 4 (cards take 15 seconds instead of 10)
- Certification panel not visible
- Text too small to read

### P2 - Medium (Nice to Fix)
[TO BE FILLED - List defects that are noticeable but not critical]

**Example:**
- Card animation could be smoother
- Event stream updates lag slightly
- Terminal output could be larger

### P3 - Low (Polish Items)
[TO BE FILLED - List minor cosmetic issues]

**Example:**
- Cursor movements could be more deliberate
- Narration could be more energetic
- Background music volume adjustment

---

## Recommendations for Phase 4

### Immediate Actions
[TO BE FILLED - What needs to be done right away]

**Example:**
1. Fix backend startup issues
2. Increase dashboard font sizes
3. Speed up card animations

### Script Changes
[TO BE FILLED - Modifications to demo script or storyboard]

**Example:**
1. Reduce Beat 4 from 10 seconds to 8 seconds
2. Add 2-second pause after PR generation
3. Simplify certification questions

### Technical Improvements
[TO BE FILLED - Code or infrastructure changes needed]

**Example:**
1. Pre-warm MCP server before demo
2. Use replay mode for consistent timing
3. Increase WebSocket reconnect speed

### Production Improvements
[TO BE FILLED - Recording or editing changes]

**Example:**
1. Use dual-monitor capture instead of screen switching
2. Add cursor highlighting for visibility
3. Record narration separately for better audio quality

---

## Rehearsal Checklist

Before running the rehearsal, verify:

- [ ] Demo machine clean and reset (per `docs/demo-machine.md`)
- [ ] Backend running on port 8765 (`curl localhost:8765/health` returns 200)
- [ ] Frontend running on port 3000 (dashboard visible in browser)
- [ ] Recording rig configured (per `docs/demo-recording-setup.md`)
- [ ] Demo repo cloned and ready
- [ ] Storyboard printed or on second screen
- [ ] Stopwatch ready to time each beat
- [ ] Do Not Disturb mode enabled
- [ ] Desktop clean, no notifications

---

## Post-Rehearsal Actions

After completing the rehearsal:

1. **Watch Full Recording**
   - Play back at normal speed
   - Take notes on every defect
   - Time each beat with stopwatch

2. **Fill Out This Document**
   - Mark each beat as PASS/FAIL
   - List all defects found
   - Prioritize defects (P0-P3)
   - Write recommendations

3. **Share with Team**
   - Commit this document to repo
   - Post summary in team channel
   - Schedule Phase 4 fixes

4. **Archive Recording**
   ```bash
   mkdir -p docs/recordings/phase3
   cp ~/Videos/onboardops-rehearsal-02.mp4 docs/recordings/phase3/
   ```

---

## Acceptance Criteria

This task (T5.9) is complete when:

- ✅ Full 60-second demo recorded at 1080p60
- ✅ Recording watched and analyzed
- ✅ All 8 beats evaluated (PASS/FAIL)
- ✅ All defects cataloged in this document
- ✅ Defects prioritized (P0-P3)
- ✅ Recommendations written for Phase 4
- ✅ Document committed to repo

---

**Bobcoin Cost:** 1 (for any Bob-assisted analysis)  
**Time Budget:** 60 minutes  
**Dependencies:** Dev 4 T4.11 (clean demo machine), T5.6 (recording rig setup)  
**Next Task:** T5.10 (Slide Deck Second Pass)