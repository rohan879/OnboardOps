# Demo Recording Rehearsal Guide - T5.9

**Task:** Phase 3 T5.9 - Second Demo Recording Rehearsal  
**Owner:** Dev 5 (Integration Engineer)  
**Time Budget:** 60 minutes  
**Bobcoin Cost:** 1  
**Dependencies:** Dev 4 T4.11 (clean demo machine), T5.6 (recording rig setup)

---

## Overview

This guide walks through the complete process of executing the second demo recording rehearsal. The goal is to capture a full 60-second end-to-end demo and catalog every defect for Phase 4 fixes.

**What This Rehearsal Produces:**
1. A 1080p60 recording of the full demo
2. A comprehensive defect catalog in `docs/demo-defects.md`
3. Prioritized list of fixes for Phase 4
4. Timing data for each storyboard beat

---

## Prerequisites

### Required Files
- ✅ `docs/demo-storyboard.md` - The 60-second beat-by-beat script
- ✅ `docs/demo-recording-setup.md` - Recording rig configuration
- ✅ `docs/demo-machine.md` - Reference machine specification
- ✅ `docs/demo-defects.md` - Defect catalog template (created by this task)
- ✅ `scripts/run_demo_rehearsal.sh` - Automated pre-flight checker

### Required Services
- Backend running on `http://localhost:8765`
- Frontend running on `http://localhost:3000`
- Telemetry capture active
- Demo repository cloned and ready

### Required Tools
- OBS Studio or QuickTime Player (macOS)
- Stopwatch (for timing beats)
- Second monitor or printed storyboard
- Do Not Disturb mode enabled

---

## Execution Steps

### Step 1: Pre-Flight Checks (5 minutes)

Run the automated pre-flight checker:

```bash
cd /mnt/data/Projects/OnboardOps
./scripts/run_demo_rehearsal.sh
```

This script verifies:
- ✓ All required documents exist
- ✓ Backend is running and healthy
- ✓ Frontend is accessible
- ✓ Recording software is installed
- ✓ Environment is clean

**If any checks fail:**
- Backend not running: `make dev`
- Frontend not running: `cd frontend && pnpm dev`
- Recording software missing: Install OBS Studio

### Step 2: Environment Preparation (5 minutes)

**Clean the workspace:**
```bash
# Close unnecessary applications
pkill Slack 2>/dev/null || true
pkill Discord 2>/dev/null || true

# Clear terminal history
history -c

# Enable Do Not Disturb
# macOS: Control Center → Focus → Do Not Disturb
# Linux: Settings → Notifications → Do Not Disturb

# Position windows
# - Primary monitor: Bob IDE (full screen or maximized)
# - Secondary monitor: Dashboard at localhost:3000
```

**Verify layout:**
- Bob IDE visible with `/onboard` command ready to type
- Dashboard visible with stopwatch at 00:00.0
- Storyboard visible on third monitor or printed
- Recording software ready to start

### Step 3: Start Recording (1 minute)

**OBS Studio:**
1. Open OBS Studio
2. Select scene: "OnboardOps Demo"
3. Click "Start Recording" (or press hotkey)
4. Wait 2 seconds for recording to stabilize

**QuickTime (macOS):**
1. Open QuickTime Player
2. File → New Screen Recording
3. Select recording area (1920×1080)
4. Click record button
5. Wait 2 seconds

### Step 4: Execute Demo (60 seconds)

Follow the storyboard beat-by-beat. Have a stopwatch running to time each beat.

**Beat 1: The Cold Start (0:00-0:03)**
- Show terminal with `git clone` completing
- Show empty Bob IDE chat
- Narrate: "New repository. 10,000 lines. Zero context. The clock starts now."

**Beat 2: OnboardOps Activation (0:03-0:08)**
- Type `/onboard` in Bob IDE
- Watch dashboard appear
- Watch stopwatch start
- Narrate: "One command. /onboard. Your AI copilot takes over."

**Beat 3: First Cartography Card (0:08-0:15)**
- Watch Bob's greeting render
- Watch Card 1 animate in
- Watch event stream show tool call
- Narrate: "Bob maps the codebase in real-time..."

**Beat 4: Cards 2-4 Stream In (0:15-0:25)**
- Watch Cards 2, 3, 4 appear
- Watch event stream show multiple tool calls
- Narrate: "Four cards. Thirty seconds..."

**Beat 5: Bootstrap Auto-Recovery (0:25-0:35)**
- Show terminal with bootstrap running
- Show error appearing
- Show auto-recovery kicking in
- Show success checkmark
- Narrate: "Setup fails? OnboardOps auto-recovers..."

**Beat 6: Certification Quiz (0:35-0:48)**
- Watch certification panel slide in
- Type answer to Question 1
- Type answer to Question 2
- Type answer to Question 3
- Watch score update to 3/3
- Watch panel turn green
- Narrate: "Socratic certification. Three questions..."

**Beat 7: Starter PR Generation (0:48-0:55)**
- Watch Bob message appear
- Watch terminal show tests running
- Watch PR URL appear
- Narrate: "Your first PR. Generated, tested..."

**Beat 8: The Payoff (0:55-1:00)**
- Click PR URL
- Show GitHub PR page
- Show stopwatch time
- Pull back to show both monitors
- Cut to wordmark
- Narrate: "Six months of onboarding, compressed..."

### Step 5: Stop Recording (1 minute)

**OBS Studio:**
- Click "Stop Recording"
- File saved to `~/Videos/` by default

**QuickTime:**
- Press `Cmd+Ctrl+Esc`
- File → Save
- Save to `~/Desktop/onboardops-rehearsal-02.mov`

**Move recording to project:**
```bash
mkdir -p docs/recordings/phase3
cp ~/Videos/onboardops-*.mp4 docs/recordings/phase3/onboardops-rehearsal-02.mp4
# or
cp ~/Desktop/onboardops-rehearsal-02.mov docs/recordings/phase3/
```

### Step 6: Immediate Playback Review (10 minutes)

**Watch the full recording:**
1. Open the recording file
2. Watch at normal speed (don't skip)
3. Have `docs/demo-defects.md` open for notes
4. Have a stopwatch ready to time each beat

**What to look for:**
- ✓ Resolution is 1080p (1920×1080)
- ✓ Frame rate is smooth (60 FPS preferred, 30 FPS acceptable)
- ✓ All text is legible at 100% zoom
- ✓ No dropped frames or stuttering
- ✓ Audio is clear (if recorded)
- ✓ Both monitors visible in frame

**Time each beat:**
- Beat 1: Expected 3s, Actual: ___s
- Beat 2: Expected 5s, Actual: ___s
- Beat 3: Expected 7s, Actual: ___s
- Beat 4: Expected 10s, Actual: ___s
- Beat 5: Expected 10s, Actual: ___s
- Beat 6: Expected 13s, Actual: ___s
- Beat 7: Expected 7s, Actual: ___s
- Beat 8: Expected 5s, Actual: ___s
- **Total: Expected 60s, Actual: ___s**

### Step 7: Defect Cataloging (30 minutes)

Open `docs/demo-defects.md` and fill out:

**For each beat:**
1. Mark status: NOT TESTED / PASS / FAIL
2. List all defects found
3. Categorize: Timing / Visual / Technical / Content
4. Add detailed notes

**Overall recording quality:**
1. Check technical quality checklist
2. Check content quality checklist
3. Check production quality checklist

**Prioritize defects:**
1. **P0 - Critical:** Demo-breaking issues (backend crash, dashboard not loading)
2. **P1 - High:** Significant quality issues (timing way off, text unreadable)
3. **P2 - Medium:** Noticeable but not critical (animations could be smoother)
4. **P3 - Low:** Polish items (cursor movements, narration energy)

**Write recommendations:**
1. Immediate actions for Phase 4
2. Script changes needed
3. Technical improvements required
4. Production improvements

### Step 8: Commit and Share (5 minutes)

```bash
# Commit the defects catalog
git add docs/demo-defects.md
git commit -m "Phase 3 T5.9: Demo rehearsal defects catalog"
git push

# Post summary in team channel
# Example:
# "Demo rehearsal complete! Found 12 defects:
#  - 2 P0 (backend timing, dashboard layout)
#  - 5 P1 (text size, card animations)
#  - 3 P2 (event stream lag)
#  - 2 P3 (cursor movements)
# Full catalog: docs/demo-defects.md"
```

---

## Common Issues and Solutions

### Issue: Backend Not Responding

**Symptoms:**
- `/onboard` command doesn't trigger cartography
- Cards don't appear
- Event stream empty

**Solutions:**
1. Check backend health: `curl localhost:8765/health`
2. Restart backend: `cd backend && uvicorn app:app --port 8765`
3. Check logs for errors
4. Verify MCP server is running

### Issue: Dashboard Not Loading

**Symptoms:**
- Port 3000 shows blank page
- WebSocket connection fails
- Stopwatch doesn't start

**Solutions:**
1. Check frontend: `curl localhost:3000`
2. Restart frontend: `cd frontend && pnpm dev`
3. Check browser console for errors
4. Clear browser cache

### Issue: Recording Quality Poor

**Symptoms:**
- Text blurry or pixelated
- Dropped frames
- Audio desync

**Solutions:**
1. Increase recording bitrate in OBS
2. Lower frame rate to 30 FPS if CPU overloaded
3. Close background applications
4. Use hardware encoder if available
5. Record audio separately

### Issue: Timing Way Off

**Symptoms:**
- Demo takes 90 seconds instead of 60
- Beats are too slow
- Long pauses between actions

**Solutions:**
1. Practice the demo 2-3 times before recording
2. Use replay mode with pre-recorded session for consistent timing
3. Speed up card animations in code
4. Reduce narration length
5. Cut unnecessary pauses

### Issue: Demo Machine Not Clean

**Symptoms:**
- Notifications appearing during recording
- Desktop clutter visible
- Other applications in frame

**Solutions:**
1. Run pre-flight script: `./scripts/run_demo_rehearsal.sh`
2. Enable Do Not Disturb mode
3. Close all unnecessary applications
4. Hide desktop icons (macOS): `defaults write com.apple.finder CreateDesktop false && killall Finder`
5. Use clean user profile for recording

---

## Acceptance Criteria

This task (T5.9) is complete when:

- ✅ Full 60-second demo recorded at 1080p60
- ✅ Recording file saved to `docs/recordings/phase3/`
- ✅ Recording watched and analyzed
- ✅ All 8 beats evaluated in `docs/demo-defects.md`
- ✅ All defects cataloged with categories
- ✅ Defects prioritized (P0-P3)
- ✅ Recommendations written for Phase 4
- ✅ Defects document committed to repo
- ✅ Team notified of results

---

## Next Steps

After completing this task:

1. **Immediate:** Share defects catalog with team
2. **Phase 4:** Fix P0 and P1 defects
3. **Phase 5:** Record final video with all fixes applied
4. **Phase 5:** Edit and polish final video for submission

---

## Time Breakdown

| Step | Duration | Description |
|------|----------|-------------|
| 1 | 5 min | Pre-flight checks |
| 2 | 5 min | Environment preparation |
| 3 | 1 min | Start recording |
| 4 | 1 min | Execute demo (60 seconds) |
| 5 | 1 min | Stop recording |
| 6 | 10 min | Immediate playback review |
| 7 | 30 min | Defect cataloging |
| 8 | 5 min | Commit and share |
| **Total** | **58 min** | **(2 min buffer)** |

---

## Manual Steps Required

**You (the user) need to:**

1. **Run the pre-flight script:**
   ```bash
   ./scripts/run_demo_rehearsal.sh
   ```

2. **Fix any environment issues** (backend/frontend not running)

3. **Start your recording software** (OBS or QuickTime)

4. **Execute the 60-second demo** following the storyboard

5. **Watch the recording** and time each beat

6. **Fill out `docs/demo-defects.md`** with all defects found

7. **Commit the defects catalog:**
   ```bash
   git add docs/demo-defects.md
   git commit -m "Phase 3 T5.9: Demo rehearsal defects"
   git push
   ```

8. **Share results with team** in your communication channel

---

## Files Created by This Task

- ✅ `docs/demo-defects.md` - Comprehensive defect catalog template
- ✅ `scripts/run_demo_rehearsal.sh` - Automated pre-flight checker
- ✅ `docs/demo-rehearsal-guide.md` - This guide
- 📹 `docs/recordings/phase3/onboardops-rehearsal-02.mp4` - The recording (you create this)

---

**Status:** Infrastructure complete, ready for execution when demo machine is available  
**Blocker:** Waiting for Dev 4 T4.11 (clean demo machine handover)  
**Workaround:** Can execute with current environment if backend/frontend are functional