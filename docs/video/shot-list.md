# OnboardOps Final Video Shot List

**Task:** Phase 4 T5.3 - Plan the Final Video Shot List  
**Owner:** Dev 5 (Integration Engineer)  
**Date:** 2026-05-16  
**Purpose:** Operational plan for Phase 5 final video recording

---

## Executive Summary

**Total Shots:** 23 shots across 3 categories  
**Recording Approach:** Mix of live demo, replay mode, and B-roll  
**Estimated Takes:** 45-60 total takes (2-3 per shot average)  
**Recording Time:** ~4 hours (including setup and retakes)  
**Operators:** Dev 5 (primary), Dev 1 (Bob operator), Dev 4 (ground crew)

---

## Shot Categories

### Category A: Live Demo Shots (Bobcoin Cost)
Shots that require live Bob inference and MCP server interaction.  
**Total: 8 shots | Estimated Bobcoins: 8-10**

### Category B: Replay Mode Shots (Zero Bobcoin Cost)
Shots captured from replay mode using recorded JSONL sessions.  
**Total: 10 shots | Estimated Bobcoins: 0**

### Category C: B-Roll and Static Shots (Zero Bobcoin Cost)
Supporting footage, reactions, and static elements.  
**Total: 5 shots | Estimated Bobcoins: 0**

---

## Category A: Live Demo Shots

### Shot A1: Full E2E Demo (Hero Take)
**Duration:** 9-10 minutes  
**Recording Approach:** Live demo with Bob  
**Operator:** Dev 5 (keyboard), Dev 1 (Bob monitoring)  
**Camera Angles:** 
- Primary: Over-shoulder showing both monitors
- Secondary: Close-up of hands typing `/onboard`

**Setup Requirements:**
- [ ] Demo machine reset (Dev 4 preflight script)
- [ ] Backend and frontend running
- [ ] Bob authenticated and ready
- [ ] Stopwatch visible on dashboard
- [ ] Screen recording at 1080p60

**Shot Description:**
Complete end-to-end flow from `git clone` to PR opened. This is the primary source footage for the final video. Capture 3-5 takes and select the cleanest one.

**Key Moments to Capture:**
- 0:00 - Git clone completing
- 0:03 - Typing `/onboard` command
- 0:08 - First cartography card appearing
- 0:25 - Bootstrap auto-recovery (if triggered)
- 0:35 - Certification panel appearing
- 0:48 - PR generation starting
- 0:55 - PR URL appearing
- 1:00 - GitHub PR page loading

**Success Criteria:**
- [ ] Complete run in <10 minutes
- [ ] No errors or manual intervention
- [ ] All 8 storyboard beats visible
- [ ] Stopwatch clearly readable
- [ ] Audio clean (no background noise)

**Estimated Takes:** 3-5  
**Bobcoin Cost:** 3-4 per take = 9-16 total  
**Best Take Selection:** Choose based on timing, visual clarity, and narration sync

---

### Shot A2: PR Generation Close-Up
**Duration:** 15-20 seconds  
**Recording Approach:** Live demo, isolated moment  
**Operator:** Dev 5  
**Camera Angles:** Close-up on Bob chat and terminal

**Setup Requirements:**
- [ ] Demo machine reset
- [ ] Fast-forward to certification complete
- [ ] Focus on Bob chat window

**Shot Description:**
Isolated recording of the PR generation moment. Start from "Generating your first contribution..." through PR URL appearing. Capture the terminal showing tests passing.

**Key Moments:**
- Bob message: "Generating your first contribution..."
- Terminal: `Running tests... ✓ All tests pass`
- PR URL appearing with animated arrow
- PR title visible: "Add test case for..."

**Success Criteria:**
- [ ] Clean 15-second clip
- [ ] PR URL clearly visible
- [ ] Tests passing visible in terminal
- [ ] No lag or stuttering

**Estimated Takes:** 2-3  
**Bobcoin Cost:** 2 per take = 4-6 total  
**Usage:** Climax moment in final video (Beat 7)

---

### Shot A3: Certification Interaction Close-Up
**Duration:** 20-25 seconds  
**Recording Approach:** Live demo, isolated moment  
**Operator:** Dev 5  
**Camera Angles:** Close-up on certification panel

**Setup Requirements:**
- [ ] Demo machine reset
- [ ] Fast-forward to cartography complete
- [ ] Focus on certification panel (right side of dashboard)

**Shot Description:**
Isolated recording of certification interaction. Show all three questions, typing answers, green checkmarks, and final "Certified" badge.

**Key Moments:**
- Question 1 appearing
- Typing answer (speed up 2x in edit)
- Green checkmark + "ding" sound
- Questions 2-3 (same pattern)
- Score updating: 1/3, 2/3, 3/3
- Panel turning green
- "Certified" badge appearing

**Success Criteria:**
- [ ] All 3 questions visible
- [ ] Typing smooth and deliberate
- [ ] Score updates in real-time
- [ ] "Certified" badge prominent

**Estimated Takes:** 2-3  
**Bobcoin Cost:** 1.5 per take = 3-4.5 total  
**Usage:** Beat 6 in final video

---

### Shot A4: Bob Greeting and First Card
**Duration:** 10-12 seconds  
**Recording Approach:** Live demo, isolated moment  
**Operator:** Dev 5  
**Camera Angles:** Split screen (Bob chat left, dashboard right)

**Setup Requirements:**
- [ ] Demo machine reset
- [ ] Focus on Bob chat and dashboard
- [ ] Slow down card animation to 350ms (demo mode)

**Shot Description:**
Capture Bob's greeting message and the first cartography card (Dependency Graph) animating in. Show MCP server indicator turning green and event stream updating.

**Key Moments:**
- Bob's greeting: "Let's explore this repository together..."
- Card 1 animating in (350ms)
- MCP indicator: green
- Event stream: `ToolCall: git_blame_summary`

**Success Criteria:**
- [ ] Card animation smooth (350ms)
- [ ] MCP indicator visible
- [ ] Event stream updates visible
- [ ] No lag between Bob message and card

**Estimated Takes:** 2-3  
**Bobcoin Cost:** 1 per take = 2-3 total  
**Usage:** Beat 3 in final video

---

### Shot A5: Bootstrap Auto-Recovery (Port Conflict)
**Duration:** 8-10 seconds  
**Recording Approach:** Live demo with deliberate failure  
**Operator:** Dev 4 (bootstrap expert)  
**Camera Angles:** Full screen terminal

**Setup Requirements:**
- [ ] Deliberately block port 8000 before demo
- [ ] Terminal font size 16pt
- [ ] Focus on terminal output

**Shot Description:**
Trigger port conflict error and capture auto-recovery. Show error appearing, Bob Shell detecting it, killing the blocking process, and retrying successfully.

**Key Moments:**
- Error: `Error: Port 8000 already in use`
- Detection: `Detecting port conflict...`
- Recovery: `Killing process 12345... Retrying...`
- Success: `✓ Health check passed`

**Success Criteria:**
- [ ] Error message clearly visible
- [ ] Recovery steps visible
- [ ] Success checkmark prominent
- [ ] Dashboard banner shows "Bootstrap: Complete"

**Estimated Takes:** 2-3  
**Bobcoin Cost:** 0.5 per take = 1-1.5 total  
**Usage:** Beat 5 in final video

---

### Shot A6: AGENTS.md Generation
**Duration:** 5-8 seconds  
**Recording Approach:** Live demo, isolated moment  
**Operator:** Dev 5  
**Camera Angles:** Close-up on file system and Bob chat

**Shot Description:**
Capture AGENTS.md file being generated. Show Bob message "Generating personalized AGENTS.md...", file appearing in file tree, and quick preview of content.

**Key Moments:**
- Bob message about AGENTS.md
- File appearing in file tree
- Opening file to show 5 sections
- Token count visible: ~2200/4000

**Success Criteria:**
- [ ] File generation visible
- [ ] Content preview clear
- [ ] Token count shown
- [ ] /init compatibility mentioned

**Estimated Takes:** 2  
**Bobcoin Cost:** 0.5 per take = 1 total  
**Usage:** Architecture section (Act 3)

---

### Shot A7: Bob Shell Error Pipe
**Duration:** 5-8 seconds  
**Recording Approach:** Live demo with deliberate error  
**Operator:** Dev 4  
**Camera Angles:** Terminal close-up

**Shot Description:**
Show Bob Shell catching an error and auto-recovering. Pipe a failing command through Bob Shell and capture the diagnosis and fix.

**Key Moments:**
- Command failing with error
- Bob Shell analyzing stderr
- Bob suggesting fix
- Retry succeeding

**Success Criteria:**
- [ ] Error clearly visible
- [ ] Bob's diagnosis clear
- [ ] Fix applied automatically
- [ ] Success on retry

**Estimated Takes:** 2  
**Bobcoin Cost:** 0.5 per take = 1 total  
**Usage:** Bob mastery proof points (Act 3)

---

### Shot A8: /init Command with AGENTS.md
**Duration:** 5 seconds  
**Recording Approach:** Live demo  
**Operator:** Dev 1  
**Camera Angles:** Bob IDE close-up

**Shot Description:**
Show Bob's `/init` command loading the generated AGENTS.md. Demonstrate that Bob now has repository context.

**Key Moments:**
- Typing `/init` in Bob chat
- Bob loading AGENTS.md
- Bob responding with repository-specific context

**Success Criteria:**
- [ ] `/init` command visible
- [ ] AGENTS.md loading confirmed
- [ ] Bob's response shows repo knowledge

**Estimated Takes:** 2  
**Bobcoin Cost:** 0.5 per take = 1 total  
**Usage:** Bob mastery proof points (Act 3)

---

## Category B: Replay Mode Shots (Zero Bobcoin Cost)

### Shot B1: Cartography Cards 2-4 Streaming
**Duration:** 10 seconds  
**Recording Approach:** Replay mode from hero session  
**Operator:** Dev 5  
**Camera Angles:** Dashboard focus

**Setup Requirements:**
- [ ] Load hero session JSONL into replay mode
- [ ] Set `?demo=true` for slowed animations
- [ ] Focus on dashboard main panel

**Shot Description:**
Capture cards 2-4 (Entry Points, Change Hotspots, Project Conventions) streaming in with 350ms animations. Show event stream updating in sync.

**Key Moments:**
- Card 2: Entry Points (main.py, routes/, tests/)
- Card 3: Change Hotspots (heatmap visible)
- Card 4: Project Conventions (bullet list)
- Event stream showing tool calls

**Success Criteria:**
- [ ] All 3 cards visible
- [ ] Animations smooth (350ms)
- [ ] Event stream in sync
- [ ] No visual glitches

**Estimated Takes:** 1-2 (replay is deterministic)  
**Bobcoin Cost:** 0  
**Usage:** Beat 4 in final video

---

### Shot B2: Stopwatch Progression
**Duration:** 60 seconds (time-lapse)  
**Recording Approach:** Replay mode, focus on stopwatch  
**Operator:** Dev 5  
**Camera Angles:** Close-up on stopwatch

**Shot Description:**
Capture stopwatch from 00:00.0 to 09:12.4 using replay mode. Create time-lapse by speeding up 10x in post-production.

**Key Moments:**
- 00:00.0 - Start
- 00:08.0 - First card
- 00:25.0 - Bootstrap
- 00:35.0 - Certification
- 00:48.0 - PR generation
- 09:12.4 - Final time

**Success Criteria:**
- [ ] Stopwatch always visible
- [ ] Time progression smooth
- [ ] Final time clearly readable

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Throughout video, especially Beat 8

---

### Shot B3: Event Stream Activity
**Duration:** 15 seconds  
**Recording Approach:** Replay mode, focus on event stream  
**Operator:** Dev 5  
**Camera Angles:** Close-up on footer event stream

**Shot Description:**
Capture event stream showing rapid tool calls during cartography. Show color-coded events (tool calls, card emissions, certification grades).

**Key Moments:**
- Tool calls appearing (blue)
- Card emissions (green)
- Certification grades (yellow)
- Rapid scrolling during cartography

**Success Criteria:**
- [ ] Color coding visible
- [ ] Events readable
- [ ] Scrolling smooth
- [ ] No lag

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Technical detail shots throughout video

---

### Shot B4: Dashboard Idle State
**Duration:** 3 seconds  
**Recording Approach:** Replay mode, start of session  
**Operator:** Dev 5  
**Camera Angles:** Full dashboard

**Shot Description:**
Capture dashboard in "Waiting for onboarding to begin..." state with pulsing animation. Show clean, intentional idle state.

**Key Moments:**
- Centered message
- OnboardOps wordmark
- Pulsing animation
- Clean layout

**Success Criteria:**
- [ ] Message centered
- [ ] Animation smooth
- [ ] Professional appearance

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Transition between beats

---

### Shot B5: Dependency Graph Visualization
**Duration:** 5 seconds  
**Recording Approach:** Replay mode, focus on card  
**Operator:** Dev 5  
**Camera Angles:** Close-up on dependency graph card

**Shot Description:**
Capture dependency graph card with visual tree showing module relationships. Zoom in to show detail.

**Key Moments:**
- Graph rendering
- Nodes and edges visible
- Module names readable
- Fan-in/fan-out indicators

**Success Criteria:**
- [ ] Graph clear and readable
- [ ] Relationships visible
- [ ] Professional appearance

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 3 detail shot

---

### Shot B6: Entry Points Card Detail
**Duration:** 5 seconds  
**Recording Approach:** Replay mode  
**Operator:** Dev 5  
**Camera Angles:** Close-up on entry points card

**Shot Description:**
Show entry points card with highlighted files: main.py, app/api/routes/, tests/.

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 4 detail shot

---

### Shot B7: Change Hotspots Heatmap
**Duration:** 5 seconds  
**Recording Approach:** Replay mode  
**Operator:** Dev 5  
**Camera Angles:** Close-up on hotspots card

**Shot Description:**
Show change hotspots card with heatmap visualization. Highlight most-changed file.

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 4 detail shot

---

### Shot B8: Project Conventions List
**Duration:** 5 seconds  
**Recording Approach:** Replay mode  
**Operator:** Dev 5  
**Camera Angles:** Close-up on conventions card

**Shot Description:**
Show project conventions card with bullet list of detected patterns.

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 4 detail shot

---

### Shot B9: Certification Score Progression
**Duration:** 8 seconds  
**Recording Approach:** Replay mode  
**Operator:** Dev 5  
**Camera Angles:** Close-up on score indicator

**Shot Description:**
Show certification score updating from 0/3 to 1/3 to 2/3 to 3/3 with animations.

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 6 detail shot

---

### Shot B10: "Certified" Badge Animation
**Duration:** 3 seconds  
**Recording Approach:** Replay mode, slow motion  
**Operator:** Dev 5  
**Camera Angles:** Close-up on certification panel

**Shot Description:**
Capture "Certified" badge appearing with confetti animation. Slow to 0.5x speed for emphasis.

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 6 climax moment

---

## Category C: B-Roll and Static Shots

### Shot C1: Developer Reactions
**Duration:** 3-5 seconds each  
**Recording Approach:** B-roll with team member  
**Operator:** Dev 5 (camera)  
**Camera Angles:** Medium shot, face visible

**Shot Description:**
Capture 3 reaction shots:
1. Confused look (at cold start)
2. Nodding/understanding (during cartography)
3. Satisfied smile (at PR generation)

**Setup Requirements:**
- [ ] Good lighting
- [ ] Clean background
- [ ] Team member available

**Success Criteria:**
- [ ] Reactions natural
- [ ] Face clearly visible
- [ ] Professional appearance

**Estimated Takes:** 2-3 per reaction = 6-9 total  
**Bobcoin Cost:** 0  
**Usage:** Transitions and emotional beats

---

### Shot C2: Coffee Cup Progression
**Duration:** 2 seconds each  
**Recording Approach:** B-roll, static shots  
**Operator:** Dev 5  
**Camera Angles:** Close-up on coffee cup

**Shot Description:**
Capture 3 coffee cup states:
1. Full, steaming
2. Half-empty
3. Empty

**Setup Requirements:**
- [ ] Coffee cup with OnboardOps logo (optional)
- [ ] Steam visible (use hot water)
- [ ] Clean desk surface

**Success Criteria:**
- [ ] Steam visible in shot 1
- [ ] Progression clear
- [ ] Professional appearance

**Estimated Takes:** 1 per state = 3 total  
**Bobcoin Cost:** 0  
**Usage:** Time progression metaphor throughout video

---

### Shot C3: Dual Monitor Setup (Wide Shot)
**Duration:** 5 seconds  
**Recording Approach:** B-roll, static shot  
**Operator:** Dev 5  
**Camera Angles:** Wide shot showing both monitors

**Shot Description:**
Capture complete dual-monitor setup with Bob IDE on left, dashboard on right. Show clean desk, no clutter.

**Setup Requirements:**
- [ ] Both monitors visible
- [ ] Screens readable
- [ ] Clean desk
- [ ] Good lighting

**Success Criteria:**
- [ ] Both monitors in frame
- [ ] Content readable
- [ ] Professional appearance

**Estimated Takes:** 2-3  
**Bobcoin Cost:** 0  
**Usage:** Establishing shots, Beat 8 pull-back

---

### Shot C4: Hands Typing (Close-Up)
**Duration:** 3-5 seconds  
**Recording Approach:** B-roll  
**Operator:** Dev 5 (camera)  
**Camera Angles:** Close-up on keyboard and hands

**Shot Description:**
Capture hands typing `/onboard` command. Slow, deliberate keystrokes.

**Setup Requirements:**
- [ ] Good lighting on keyboard
- [ ] Clean keyboard
- [ ] Hands visible

**Success Criteria:**
- [ ] Keystrokes visible
- [ ] Typing deliberate
- [ ] Professional appearance

**Estimated Takes:** 2-3  
**Bobcoin Cost:** 0  
**Usage:** Beat 2 transition

---

### Shot C5: GitHub PR Page (Static)
**Duration:** 5 seconds  
**Recording Approach:** Screen recording, static page  
**Operator:** Dev 5  
**Camera Angles:** Full screen

**Shot Description:**
Capture GitHub PR page showing the generated PR. Highlight PR title, description with "Onboarded: 9 min 12 sec", and green "Open" status.

**Setup Requirements:**
- [ ] PR already opened from live demo
- [ ] Page fully loaded
- [ ] No notifications or distractions

**Success Criteria:**
- [ ] PR title visible
- [ ] "Onboarded: 9 min 12 sec" prominent
- [ ] Green "Open" status visible

**Estimated Takes:** 1  
**Bobcoin Cost:** 0  
**Usage:** Beat 8 payoff moment

---

## Recording Schedule

### Session 1: Live Demo Shots (H+31 - H+33)
**Duration:** 2 hours  
**Shots:** A1, A2, A3, A4  
**Bobcoin Budget:** 6-8 coins  
**Operator:** Dev 5 + Dev 1

**Order:**
1. Shot A1 (hero take) - 3-5 takes
2. Shot A2 (PR close-up) - 2-3 takes
3. Shot A3 (certification) - 2-3 takes
4. Shot A4 (first card) - 2-3 takes

**Break:** 15 minutes between A1 and A2

---

### Session 2: Bootstrap and Bob Shell Shots (H+33 - H+34)
**Duration:** 1 hour  
**Shots:** A5, A6, A7, A8  
**Bobcoin Budget:** 2-3 coins  
**Operator:** Dev 4 + Dev 5

**Order:**
1. Shot A5 (bootstrap) - 2-3 takes
2. Shot A6 (AGENTS.md) - 2 takes
3. Shot A7 (error pipe) - 2 takes
4. Shot A8 (/init) - 2 takes

---

### Session 3: Replay Mode Shots (H+34 - H+35)
**Duration:** 1 hour  
**Shots:** B1-B10  
**Bobcoin Budget:** 0 coins  
**Operator:** Dev 5 solo

**Order:**
1. Load hero session JSONL
2. Record all B shots sequentially
3. Verify each shot before moving to next

---

### Session 4: B-Roll Shots (H+35 - H+36)
**Duration:** 1 hour  
**Shots:** C1-C5  
**Bobcoin Budget:** 0 coins  
**Operator:** Dev 5 + team member

**Order:**
1. Shot C1 (reactions) - 6-9 takes
2. Shot C2 (coffee) - 3 takes
3. Shot C3 (wide shot) - 2-3 takes
4. Shot C4 (hands) - 2-3 takes
5. Shot C5 (GitHub) - 1 take

---

## Shot List Summary

| Category | Shots | Takes | Bobcoins | Duration |
|----------|-------|-------|----------|----------|
| A: Live Demo | 8 | 18-25 | 8-10 | 2 hours |
| B: Replay Mode | 10 | 10 | 0 | 1 hour |
| C: B-Roll | 5 | 15-20 | 0 | 1 hour |
| **Total** | **23** | **43-55** | **8-10** | **4 hours** |

---

## Pre-Recording Checklist

Before each recording session:

### Technical Setup
- [ ] Demo machine reset (Dev 4 preflight script)
- [ ] Backend running on port 8765
- [ ] Frontend running on port 3000
- [ ] Bob authenticated and ready
- [ ] Screen recording software configured (1080p60)
- [ ] Audio recording configured (if narrating live)

### Environment Setup
- [ ] Desktop clean, no clutter
- [ ] Notifications disabled (Do Not Disturb)
- [ ] Browser tabs closed except necessary ones
- [ ] Terminal font size 16pt
- [ ] Dashboard in demo mode (`?demo=true`)

### Camera Setup (for B-roll)
- [ ] Camera charged and ready
- [ ] Lighting adequate
- [ ] Background clean
- [ ] Tripod stable

### Team Coordination
- [ ] Operators confirmed and available
- [ ] Roles clear (keyboard, Bob monitoring, ground crew)
- [ ] Communication channel open (Slack/Discord)
- [ ] Backup plan if primary operator unavailable

---

## Post-Recording Checklist

After each shot:

- [ ] Review footage immediately
- [ ] Verify technical quality (resolution, frame rate, audio)
- [ ] Verify content quality (all key moments captured)
- [ ] Mark best take in file name
- [ ] Back up footage to two locations
- [ ] Update shot list with actual take count and Bobcoin spend
- [ ] Note any issues for retakes

---

## Contingency Plans

### If Live Demo Fails
- **Backup:** Use replay mode with pre-recorded session
- **Risk:** Loses authenticity but saves Bobcoins
- **Decision:** Dev 5 + Dev 1 decide based on failure severity

### If Bobcoin Budget Exceeded
- **Backup:** Switch remaining live shots to replay mode
- **Risk:** Less variety in footage
- **Decision:** Prioritize hero take (A1) and PR close-up (A2)

### If Time Runs Short
- **Priority order:**
  1. Shot A1 (hero take) - MUST HAVE
  2. Shot A2 (PR close-up) - MUST HAVE
  3. Shot A3 (certification) - MUST HAVE
  4. All replay shots (zero cost) - SHOULD HAVE
  5. B-roll shots - NICE TO HAVE

### If Equipment Fails
- **Screen recording:** Use OBS Studio backup
- **Camera:** Use phone camera for B-roll
- **Audio:** Record narration separately in post

---

## Acceptance Criteria

This task (T5.3) is complete when:

- ✅ All 23 shots are defined with clear descriptions
- ✅ Recording approach specified for each shot (live/replay/B-roll)
- ✅ Operators assigned for each shot
- ✅ Estimated takes and Bobcoin costs calculated
- ✅ Recording schedule created (4 sessions over 5 hours)
- ✅ Pre-recording and post-recording checklists complete
- ✅ Contingency plans documented
- ✅ Team can execute Phase 5 recording from this shot list

---

**Bobcoin Cost:** 0 (planning only)  
**Time Budget:** 45 minutes  
**Dependencies:** T5.2 (rough cut plan)  
**Next Task:** T5.4 (First Fresh Recording Session: Full Demo)

---

## Notes for Phase 5

- **Hero take (A1) is critical:** Allocate 3-5 takes and choose the best
- **Replay mode saves Bobcoins:** Use extensively for detail shots
- **B-roll adds polish:** Don't skip if time allows
- **Backup plans are essential:** Equipment and demo failures are likely
- **Review footage immediately:** Don't discover issues in post-production

**Total Bobcoin Budget for Recording:** 8-10 coins (well within Dev 5's 10-coin Phase 4 budget)