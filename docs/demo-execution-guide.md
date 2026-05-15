# OnboardOps Demo Execution Guide

**Purpose:** Step-by-step instructions for executing the 60-second demo recording (T5.8) and capturing materials for slide deck update (T5.9).

**Target:** Phase 2, H+6 to H+7  
**Duration:** 45 minutes (30 min recording + 15 min post-processing)  
**Prerequisites:** All Phase 2 vertical slice features complete

---

## Pre-Recording Checklist (15 minutes)

### 1. Environment Setup

**Run the preparation script:**
```bash
./scripts/prepare_demo_recording.sh
```

This script will:
- ✅ Hide desktop icons
- ✅ Enable Do Not Disturb
- ✅ Close unnecessary applications
- ✅ Check backend/frontend/telemetry status
- ✅ Create recordings directory
- ✅ Generate restore script

**Manual verification:**
- [ ] OBS Studio configured per `docs/demo-recording-setup.md`
- [ ] Demo repository cloned and ready
- [ ] GitHub token set in `.env`
- [ ] All services running (backend, frontend, telemetry)
- [ ] Browser tabs closed except dashboard
- [ ] Terminal cleared and ready

### 2. Service Status Check

**Backend (Port 8765):**
```bash
curl http://localhost:8765/health
# Expected: {"status":"ok"}
```

**Frontend (Port 3000):**
```bash
curl http://localhost:3000
# Expected: HTML response
```

**Telemetry:**
```bash
ps aux | grep telemetry.py
# Expected: Process running
```

### 3. Recording Setup

**OBS Studio:**
- [ ] Scene: "OnboardOps Demo" selected
- [ ] Sources: Bob IDE (left) + Dashboard (right)
- [ ] Resolution: 1920×1080
- [ ] Frame rate: 60fps
- [ ] Audio: Microphone enabled (for narration)
- [ ] Output path: `docs/recordings/phase2/`

**Dashboard:**
- [ ] Open in browser: `http://localhost:3000`
- [ ] Stopwatch visible but not started
- [ ] Event stream panel visible
- [ ] Certification panel ready

**Bob IDE:**
- [ ] Open to demo repository
- [ ] Chat window visible
- [ ] `/onboard` command ready to type
- [ ] No previous chat history

---

## Recording Execution (30 minutes)

### Take 1: Full 60-Second Demo

**Follow the storyboard exactly:** `docs/demo-storyboard.md`

#### Beat 1: Cold Start (0:00-0:03)
**Action:**
- Show terminal with fresh clone
- Show empty Bob IDE chat
- **Narration:** "New repository. 10,000 lines. Zero context. The clock starts now."

#### Beat 2: OnboardOps Activation (0:03-0:08)
**Action:**
- Type `/onboard` in Bob IDE
- Press Enter
- Watch dashboard stopwatch start
- **Narration:** "One command. `/onboard`. Your AI copilot takes over."

#### Beat 3: First Cartography Card (0:08-0:15)
**Action:**
- Watch Bob's greeting render
- Watch Card 1 animate in (Dependency Graph)
- Observe MCP indicator light up
- **Narration:** "Bob maps the codebase in real-time. Dependencies, entry points, conventions—all extracted from git history."

#### Beat 4: Cards 2-4 Stream In (0:15-0:25)
**Action:**
- Watch Cards 2-4 appear
- Scroll through cards in Bob chat
- Observe event stream activity
- **Narration:** "Four cards. Thirty seconds. You now know more than the README could ever tell you."

#### Beat 5: Bootstrap Auto-Recovery (0:25-0:35)
**Action:**
- Show terminal with bootstrap script
- Trigger port conflict error
- Watch auto-recovery
- See green checkmark
- **Narration:** "Setup fails? OnboardOps auto-recovers. Port conflicts, missing dependencies—handled automatically."

#### Beat 6: Certification Quiz (0:35-0:48)
**Action:**
- Watch certification panel slide in
- Answer three questions
- Watch score update
- See "Certified" badge
- **Narration:** "Socratic certification. Three questions. Prove you understand before you commit."

#### Beat 7: Starter PR Generation (0:48-0:55)
**Action:**
- Watch Bob generate PR message
- See test suite run
- Click PR URL
- **Narration:** "Your first PR. Generated, tested, and ready to merge. Nine minutes from clone to contribution."

#### Beat 8: The Payoff (0:55-1:00)
**Action:**
- Show GitHub PR page
- Show stopwatch: 09:12.4
- Pull back to show both monitors
- **Narration:** "Six months of onboarding, compressed into one cup of coffee."

### Take 2: B-Roll Footage (10 minutes)

Capture additional footage for editing:

**Close-ups:**
- [ ] Hands typing `/onboard` command
- [ ] Stopwatch ticking
- [ ] Cards animating in
- [ ] Certification panel interactions
- [ ] PR URL appearing

**Wide shots:**
- [ ] Full desk setup (both monitors)
- [ ] Developer's face (optional)
- [ ] Terminal output scrolling

**Detail shots:**
- [ ] MCP indicator lighting up
- [ ] Event stream scrolling
- [ ] Test suite passing
- [ ] GitHub PR page

### Take 3: Screenshot Capture (10 minutes)

Capture high-resolution screenshots for slides:

**Required Screenshots:**

1. **Slide 4: Demo Timeline**
   - [ ] `/onboard` command typed
   - [ ] First cartography card visible
   - [ ] Bootstrap auto-recovery in action
   - [ ] Certification panel with questions
   - [ ] Generated PR on GitHub

2. **Slide 6: Repo Cartography**
   - [ ] Dependency graph card
   - [ ] Entry points card
   - [ ] Change hotspots heatmap
   - [ ] Project conventions card

3. **Slide 7: Institutional Knowledge**
   - [ ] MCP tool call in event stream
   - [ ] Git history analysis output
   - [ ] Commit analysis example

4. **Slide 8: Bootstrap & Certification**
   - [ ] Bootstrap terminal with auto-recovery
   - [ ] Certification panel with quiz
   - [ ] Passing grade display

5. **Slide 9: Bob-Specific Features**
   - [ ] Custom mode indicator in Bob IDE
   - [ ] `.bob/mcp.json` file
   - [ ] Session export example

6. **Slide 10: Business Value**
   - [ ] Stopwatch showing final time
   - [ ] Dashboard with all cards complete
   - [ ] GitHub PR with "Onboarded: X min Y sec"

**Screenshot Naming Convention:**
```
docs/recordings/phase2/screenshots/
├── 01_onboard_command.png
├── 02_cartography_dependency_graph.png
├── 03_cartography_entry_points.png
├── 04_cartography_hotspots.png
├── 05_cartography_conventions.png
├── 06_bootstrap_auto_recovery.png
├── 07_certification_panel.png
├── 08_certification_passing.png
├── 09_pr_generation.png
├── 10_pr_github_page.png
├── 11_mcp_indicator.png
├── 12_event_stream.png
├── 13_stopwatch_final.png
├── 14_bob_custom_mode.png
└── 15_full_dashboard.png
```

---

## Post-Recording Tasks (15 minutes)

### 1. Save and Organize Files

**Video files:**
```bash
# Move from OBS default location to project
mv ~/Videos/OnboardOps_Demo_*.mp4 docs/recordings/phase2/
```

**Session telemetry:**
```bash
# Copy the JSONL session file
cp .onboardops/sessions/[session-id].jsonl docs/recordings/phase2/demo_session.jsonl
```

**Verify files:**
```bash
ls -lh docs/recordings/phase2/
# Expected:
# - OnboardOps_Demo_Take1.mp4 (~500MB)
# - OnboardOps_Demo_BRoll.mp4 (~300MB)
# - demo_session.jsonl (~50KB)
# - screenshots/ (15 PNG files)
```

### 2. Quick Quality Check

**Video:**
- [ ] Audio is clear and audible
- [ ] Both monitors visible throughout
- [ ] No sensitive information visible
- [ ] Timing matches storyboard (±5 seconds)
- [ ] All 8 beats captured

**Screenshots:**
- [ ] High resolution (1920×1080 minimum)
- [ ] Text is readable
- [ ] No sensitive information visible
- [ ] Proper naming convention followed

**Session JSONL:**
- [ ] File is valid JSON-per-line
- [ ] Contains all expected events
- [ ] Timestamps are sequential
- [ ] No PII or secrets

### 3. Commit to Repository

```bash
# Add recordings (Git LFS recommended for large files)
git add docs/recordings/phase2/

# Commit with descriptive message
git commit -m "Phase 2: Add demo recording and screenshots for T5.8

- 60-second demo video (Take 1)
- B-roll footage for editing
- 15 high-resolution screenshots for slides
- Session telemetry JSONL for replay
- All files verified and PII-scrubbed"

# Push to remote
git push origin main
```

---

## Slide Deck Update (T5.9 - 15 minutes)

### Update `slides/onboardops.md`

**Slide 4: 60-Second Demo**
```markdown
**Visual Elements:**
- Embedded video: `docs/recordings/phase2/OnboardOps_Demo_Take1.mp4`
- Key screenshots:
  - ![Onboard Command](../docs/recordings/phase2/screenshots/01_onboard_command.png)
  - ![Cartography Cards](../docs/recordings/phase2/screenshots/02_cartography_dependency_graph.png)
  - ![Bootstrap Recovery](../docs/recordings/phase2/screenshots/06_bootstrap_auto_recovery.png)
  - ![Certification](../docs/recordings/phase2/screenshots/07_certification_panel.png)
  - ![PR Generated](../docs/recordings/phase2/screenshots/09_pr_generation.png)
```

**Slide 6: Repo Cartography**
```markdown
**Visual Elements:**
- ![Dependency Graph](../docs/recordings/phase2/screenshots/02_cartography_dependency_graph.png)
- ![Entry Points](../docs/recordings/phase2/screenshots/03_cartography_entry_points.png)
- ![Change Hotspots](../docs/recordings/phase2/screenshots/04_cartography_hotspots.png)
- ![Conventions](../docs/recordings/phase2/screenshots/05_cartography_conventions.png)
```

**Slide 7: Institutional Knowledge**
```markdown
**Visual Elements:**
- ![MCP Indicator](../docs/recordings/phase2/screenshots/11_mcp_indicator.png)
- ![Event Stream](../docs/recordings/phase2/screenshots/12_event_stream.png)
```

**Slide 8: Bootstrap & Certification**
```markdown
**Visual Elements:**
- ![Bootstrap Auto-Recovery](../docs/recordings/phase2/screenshots/06_bootstrap_auto_recovery.png)
- ![Certification Panel](../docs/recordings/phase2/screenshots/07_certification_panel.png)
- ![Passing Grade](../docs/recordings/phase2/screenshots/08_certification_passing.png)
```

**Slide 9: Bob-Specific Features**
```markdown
**Visual Elements:**
- ![Bob Custom Mode](../docs/recordings/phase2/screenshots/14_bob_custom_mode.png)
- ![MCP Configuration](../docs/recordings/phase2/screenshots/11_mcp_indicator.png)
```

**Slide 10: Business Value**
```markdown
**Visual Elements:**
- ![Final Stopwatch](../docs/recordings/phase2/screenshots/13_stopwatch_final.png)
- ![Complete Dashboard](../docs/recordings/phase2/screenshots/15_full_dashboard.png)
- ![GitHub PR](../docs/recordings/phase2/screenshots/10_pr_github_page.png)

**Actual Metrics from Demo:**
- Time to first PR: **9 min 12 sec** (actual recorded time)
- Bobcoins used: **[X]** (from session telemetry)
- Cards generated: **4** (dependency graph, entry points, hotspots, conventions)
- Certification score: **3/3 (100%)**
```

**Slide 11: Tech Stack**
```markdown
**Stats (Updated from Phase 2):**
- **Lines of Code:** ~3,500
- **MCP Tools:** 7
- **Bob Sessions Exported:** 55+
- **Test Coverage:** 80%+
- **Demo Time:** 9 min 12 sec (actual)
- **Bobcoins Used:** [X] (actual from telemetry)
```

### Commit Slide Updates

```bash
git add slides/onboardops.md
git commit -m "Phase 2: Update slide deck with demo screenshots (T5.9)

- Added 15 high-resolution screenshots to slides
- Updated metrics with actual demo data
- Embedded video link in Slide 4
- All placeholder content replaced with real data"
git push origin main
```

---

## Troubleshooting

### Recording Issues

**Problem:** OBS not capturing both monitors
**Solution:** Check Scene sources, ensure both Bob IDE and Dashboard are added

**Problem:** Audio not recording
**Solution:** Check OBS Audio Mixer, ensure microphone is enabled and not muted

**Problem:** Video is choppy/laggy
**Solution:** Lower frame rate to 30fps, or close other applications

### Demo Execution Issues

**Problem:** Backend not responding
**Solution:** Restart backend: `cd backend && uvicorn app:app --port 8765 --reload`

**Problem:** Dashboard not connecting
**Solution:** Check WebSocket connection, restart telemetry service

**Problem:** Certification questions not appearing
**Solution:** Verify Bob custom mode is active, check MCP server connection

**Problem:** PR generation fails
**Solution:** Check GitHub token in `.env`, verify demo repo permissions

### Post-Recording Issues

**Problem:** Video file too large for Git
**Solution:** Use Git LFS: `git lfs track "*.mp4"` or upload to external hosting

**Problem:** Screenshots have sensitive information
**Solution:** Re-capture with clean environment, or blur sensitive areas

**Problem:** Session JSONL contains secrets
**Solution:** Run PII scrubber: `./scripts/scrub.py docs/recordings/phase2/demo_session.jsonl`

---

## Success Criteria

T5.8 is complete when:
- ✅ 60-second demo video recorded (Take 1)
- ✅ B-roll footage captured for editing
- ✅ 15 high-resolution screenshots captured
- ✅ Session telemetry JSONL saved
- ✅ All files committed to repository
- ✅ Video quality verified (audio clear, both monitors visible)
- ✅ No sensitive information in any recording

T5.9 is complete when:
- ✅ All placeholder images in slides replaced with real screenshots
- ✅ Actual metrics from demo added to slides
- ✅ Video link embedded in Slide 4
- ✅ Slide deck renders correctly with all images
- ✅ Changes committed to repository

---

## Next Steps After T5.8 & T5.9

1. **Video Editing (Phase 5):**
   - Trim to exactly 60 seconds
   - Add background music
   - Add sound effects (whoosh, ding, chime)
   - Add captions/subtitles
   - Export final version

2. **Slide Deck Finalization (Phase 5):**
   - Convert markdown to Google Slides or PowerPoint
   - Apply IBM Design System styling
   - Add animations and transitions
   - Practice presentation timing

3. **Submission Preparation (Phase 5):**
   - Upload video to YouTube
   - Update README with video link
   - Prepare Lablab.ai submission
   - Export final Bob sessions

---

**Last Updated:** Phase 2, H+6  
**Status:** Ready for execution  
**Owner:** Dev 5 (Integration Engineer)  
**Coordination Required:** All team members for vertical slice demo