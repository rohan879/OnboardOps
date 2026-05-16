# OnboardOps Rough Cut v1 - Video Editing Plan

**Task:** Phase 4 T5.2 - First Rough Video Cut From Existing Footage  
**Owner:** Dev 5 (Integration Engineer)  
**Date:** 2026-05-16  
**Purpose:** Blueprint for assembling the first rough cut of the final video

---

## Executive Summary

**Target Duration:** 4-5 minutes (extended from 60-second storyboard for hackathon submission)  
**Structure:** 8 beats from storyboard + intro/outro + feature deep-dives  
**Format:** 1920×1080, 60fps, MP4 (H.264)  
**Audio:** Narration + background music + sound effects  
**Status:** PLAN READY - Awaiting actual recordings from Phase 4 T5.4-T5.6

---

## Video Structure Overview

### Act 1: The Problem (0:00 - 0:45)
- **Beat 1:** Cold start (0:00 - 0:03)
- **Extended:** Problem statement and traditional onboarding pain (0:03 - 0:30)
- **Transition:** "There's a better way..." (0:30 - 0:45)

### Act 2: The Solution (0:45 - 3:30)
- **Beat 2:** OnboardOps activation (0:45 - 0:55)
- **Beat 3-4:** Cartography in action (0:55 - 1:35)
- **Beat 5:** Bootstrap auto-recovery (1:35 - 2:00)
- **Beat 6:** Certification (2:00 - 2:35)
- **Beat 7:** Starter PR generation (2:35 - 3:00)
- **Beat 8:** The payoff (3:00 - 3:30)

### Act 3: The Impact (3:30 - 4:30)
- **Architecture overview** (3:30 - 3:50)
- **Bob mastery proof points** (3:50 - 4:10)
- **Business value** (4:10 - 4:30)

### Outro: Call to Action (4:30 - 4:45)
- **GitHub link, team credits, thank you** (4:30 - 4:45)

---

## Detailed Beat-by-Beat Editing Plan

### Beat 1: The Cold Start (0:00 - 0:03)
**Source Footage Needed:**
- [ ] Screen recording: `git clone` command completing
- [ ] Screen recording: Empty Bob IDE window
- [ ] B-roll: Developer looking confused at screen

**Editing Notes:**
- Split screen: terminal left, Bob IDE right
- Zoom in on repository name
- Add text overlay: "10,000 lines of code"
- Fade in from black

**Narration Script:**
> "New repository. 10,000 lines. Zero context. The clock starts now."

**Music:** Tense, building

**Transitions:** Hard cut to Beat 2

---

### Extended Problem Statement (0:03 - 0:30)
**Source Footage Needed:**
- [ ] B-roll: Developer scrolling through README
- [ ] B-roll: Developer opening multiple files
- [ ] B-roll: Developer looking frustrated
- [ ] Screen recording: Slack messages asking for help
- [ ] Screen recording: Calendar showing "Onboarding Week 1, 2, 3..."

**Editing Notes:**
- Montage of traditional onboarding pain points
- Quick cuts (2-3 seconds each)
- Add text overlays with statistics:
  - "Average onboarding: 6 months"
  - "Cost per developer: $30,000"
  - "Time to first PR: 3-4 weeks"

**Narration Script:**
> "Traditional onboarding is broken. Six months to productivity. Thirty thousand dollars per developer. Weeks before your first contribution. Documentation goes stale. Tribal knowledge stays tribal. And your best engineers spend their time answering the same questions over and over."

**Music:** Continues tense, adds urgency

**Transitions:** Fade to black, pause for effect

---

### Transition: "There's a better way..." (0:30 - 0:45)
**Source Footage Needed:**
- [ ] OnboardOps logo animation
- [ ] Text animation: "The 10-Minute Repo Whisperer"

**Editing Notes:**
- Fade in OnboardOps wordmark
- Animate tagline
- Add subtle glow effect

**Narration Script:**
> "What if you could compress six months into ten minutes? What if your AI copilot could read the entire git history, understand the architecture, and guide you to your first contribution—all before your coffee gets cold? Meet OnboardOps."

**Music:** Shift to hopeful, energetic

**Transitions:** Wipe to Beat 2

---

### Beat 2: OnboardOps Activation (0:45 - 0:55)
**Source Footage Needed:**
- [ ] Screen recording: Typing `/onboard` in Bob IDE
- [ ] Screen recording: Dashboard appearing on second monitor
- [ ] Screen recording: Stopwatch starting at 00:00.0
- [ ] Screen recording: "Onboard Mode" indicator

**Editing Notes:**
- Close-up on hands typing `/onboard`
- Pull back to show both monitors
- Highlight stopwatch with circle overlay
- Add "whoosh" sound effect on dashboard appearance

**Narration Script:**
> "One command. `/onboard`. Your AI copilot takes over."

**Music:** Energetic, tech-forward

**Transitions:** Smooth zoom to dashboard

---

### Beat 3-4: Cartography in Action (0:55 - 1:35)
**Source Footage Needed:**
- [ ] Screen recording: Bob's greeting message
- [ ] Screen recording: Card 1 (Dependency Graph) animating in
- [ ] Screen recording: MCP server indicator turning green
- [ ] Screen recording: Event stream showing tool calls
- [ ] Screen recording: Cards 2-4 streaming in
- [ ] B-roll: Developer reading cards, nodding

**Editing Notes:**
- Split screen: Bob chat left, dashboard right
- Slow down card animations to 350ms (per defect D-004)
- Add glow effect on dependency graph completion
- Picture-in-picture: event stream in corner
- Add text overlays explaining each card:
  - "Dependency Graph: Who depends on what"
  - "Entry Points: Where to start reading"
  - "Change Hotspots: What changes most often"
  - "Project Conventions: How the team codes"

**Narration Script:**
> "Bob maps the codebase in real-time. Dependencies, entry points, conventions—all extracted from git history. Four cards. Forty seconds. You now know more than the README could ever tell you. This isn't documentation. This is institutional knowledge, automatically extracted from every commit, every PR, every code review."

**Music:** Building momentum

**Transitions:** Crossfade to terminal

---

### Beat 5: Bootstrap Auto-Recovery (1:35 - 2:00)
**Source Footage Needed:**
- [ ] Screen recording: Bootstrap script running
- [ ] Screen recording: Error appearing (port conflict)
- [ ] Screen recording: Auto-recovery detecting and fixing
- [ ] Screen recording: Green checkmark on success
- [ ] Screen recording: Dashboard showing "Bootstrap: Complete"
- [ ] B-roll clips: Each of 5 auto-recovery patterns (from Dev 4 T4.6)

**Editing Notes:**
- Full screen terminal for error
- Add red highlight on error message
- Add green highlight on recovery action
- Show dashboard banner (AutoRecoveryBanner component)
- Quick montage of 5 recovery patterns (3 seconds each)

**Narration Script:**
> "Setup fails? OnboardOps auto-recovers. Port conflicts, missing dependencies, wrong Node version—handled automatically. Bob Shell watches every command, catches every error, and fixes it before you even notice. Five common failure modes, zero manual intervention."

**Music:** Triumphant

**Transitions:** Wipe to certification panel

---

### Beat 6: Certification (2:00 - 2:35)
**Source Footage Needed:**
- [ ] Screen recording: Certification panel sliding in
- [ ] Screen recording: Question 1 appearing
- [ ] Screen recording: User typing answer
- [ ] Screen recording: Green checkmark on correct answer
- [ ] Screen recording: Questions 2-3 (same pattern)
- [ ] Screen recording: Score updating (1/3, 2/3, 3/3)
- [ ] Screen recording: Panel turning green with "Certified" badge
- [ ] B-roll: Developer smiling at certification

**Editing Notes:**
- Focus on certification panel (right side of dashboard)
- Speed up typing (2x) for pacing
- Add "ding" sound effect on each correct answer
- Add confetti animation on certification completion
- Slow-motion on "Certified" badge appearing

**Narration Script:**
> "Socratic certification. Three questions. Prove you understand before you commit. This isn't a quiz—it's a conversation. Bob asks, you answer, and the grading is instant. Pass, and you're certified. Fail, and Bob explains why, then asks again. No judgment, just learning."

**Music:** Uplifting

**Transitions:** Zoom to Bob chat

---

### Beat 7: Starter PR Generation (2:35 - 3:00)
**Source Footage Needed:**
- [ ] Screen recording: Bob message "Generating your first contribution..."
- [ ] Screen recording: Terminal showing test execution
- [ ] Screen recording: Tests passing (green checkmarks)
- [ ] Screen recording: PR URL appearing in Bob chat
- [ ] Screen recording: Clicking PR URL
- [ ] Screen recording: GitHub PR page loading
- [ ] Screen recording: PR title and description visible
- [ ] Close-up: "Onboarded: 9 min 12 sec" in PR description

**Editing Notes:**
- Split screen: Bob chat left, terminal right
- Highlight PR URL with glow effect
- Add animated arrow pointing to PR URL
- Zoom in on "Onboarded: 9 min 12 sec" timestamp
- Add "success chime" sound effect

**Narration Script:**
> "Your first PR. Generated, tested, and ready to merge. Nine minutes from clone to contribution. The PR includes your onboarding time, proving you went from zero to productive in less time than it takes to make a sandwich."

**Music:** Climactic

**Transitions:** Pull back to show both monitors

---

### Beat 8: The Payoff (3:00 - 3:30)
**Source Footage Needed:**
- [ ] Screen recording: GitHub PR page (full view)
- [ ] Screen recording: Stopwatch showing 09:12.4
- [ ] Wide shot: Both monitors visible
- [ ] B-roll: Developer leaning back, satisfied
- [ ] B-roll: Coffee cup still steaming

**Editing Notes:**
- Wide shot showing complete setup
- Circle overlay on stopwatch
- Add text overlay: "9 minutes, 12 seconds"
- Add comparison text: "Traditional onboarding: 6 months"
- Slow zoom out

**Narration Script:**
> "Six months of onboarding, compressed into one cup of coffee. From git clone to merged PR in under ten minutes. This is what AI-powered onboarding looks like."

**Music:** Triumphant resolution

**Transitions:** Fade to architecture diagram

---

### Architecture Overview (3:30 - 3:50)
**Source Footage Needed:**
- [ ] Architecture diagram (from Dev 5 T5.10)
- [ ] Animated arrows showing data flow
- [ ] Highlight each component as it's mentioned

**Editing Notes:**
- Full screen architecture diagram
- Animate components appearing one by one
- Add labels and callouts
- Highlight Bob in runtime path (critical judging point)

**Narration Script:**
> "How does it work? Bob IDE hosts a custom onboard mode with two skills: cartography and certification. The mode calls our MCP server—seven tools that extract institutional knowledge from git history. The dashboard shows everything in real-time over WebSockets. And Bob Shell orchestrates the bootstrap, catching errors and auto-recovering. Bob isn't just in the build—Bob is in the runtime."

**Music:** Technical, precise

**Transitions:** Crossfade to code snippets

---

### Bob Mastery Proof Points (3:50 - 4:10)
**Source Footage Needed:**
- [ ] Screen recording: `.bob/modes/onboard.md` file
- [ ] Screen recording: `.bob/skills/repo-cartography.md` file
- [ ] Screen recording: MCP server code
- [ ] Screen recording: Bob Shell error-pipe loop
- [ ] Screen recording: AGENTS.md with `/init` command

**Editing Notes:**
- Quick cuts between code files (3 seconds each)
- Highlight key sections with zoom
- Add text overlays:
  - "Custom Mode: onboard.md"
  - "Custom Skills: cartography, certification"
  - "MCP Server: 7 institutional knowledge tools"
  - "Bob Shell: Error-pipe auto-recovery"
  - "AGENTS.md: /init compatible"

**Narration Script:**
> "This is deep Bob mastery. Custom modes and skills, not just prompts. An MCP server we built from scratch. Bob Shell driving auto-recovery through error pipes. And a personalized AGENTS.md that works with Bob's /init command. Every feature is Bob-native, not bolted on."

**Music:** Confident, technical

**Transitions:** Fade to business value slide

---

### Business Value (4:10 - 4:30)
**Source Footage Needed:**
- [ ] Animated infographic: Cost comparison
- [ ] Animated infographic: Time comparison
- [ ] Animated infographic: ROI calculation

**Editing Notes:**
- Full screen infographics
- Animate numbers counting up
- Add comparison bars (traditional vs OnboardOps)
- Show ROI calculation: $30K → $300

**Narration Script:**
> "The business case is simple. Traditional onboarding costs thirty thousand dollars per developer. OnboardOps costs three hundred. That's a 99% reduction. At scale—one hundred developers per year—that's three million dollars saved annually. And your senior engineers get their time back to build, not babysit."

**Music:** Confident, closing

**Transitions:** Fade to outro

---

### Outro: Call to Action (4:30 - 4:45)
**Source Footage Needed:**
- [ ] OnboardOps logo
- [ ] GitHub repository URL
- [ ] Team member names and photos
- [ ] "Built with IBM Bob" badge

**Editing Notes:**
- Center logo
- Fade in GitHub URL: `github.com/[team]/OnboardOps`
- Scroll team credits
- Add "Built with IBM Bob" badge
- Fade to black

**Narration Script:**
> "OnboardOps. The ten-minute repo whisperer. Open source. Built with IBM Bob. Try it on your repository today."

**Music:** Fade out

**Transitions:** Fade to black, hold 2 seconds

---

## Source Footage Inventory

### Phase 2 Recordings (Existing)
- [ ] Dashboard component demos (from Dev 3 Phase 2 work)
- [ ] MCP tool smoke tests (from Dev 2 Phase 2 work)
- [ ] Bootstrap script runs (from Dev 4 Phase 2 work)

### Phase 3 Recordings (Existing)
- [ ] Demo rehearsal footage (from Dev 5 T5.9)
- [ ] Individual feature demos (from all devs)
- [ ] Bob session screen recordings

### Phase 4 Recordings (To Be Captured)
- [ ] **T5.4:** Full E2E demo (hero take)
- [ ] **T5.5:** PR generation moment (isolated)
- [ ] **T5.6:** Certification moment (isolated)
- [ ] **Dev 4 T4.6:** Auto-recovery B-roll (5 patterns)

### Additional B-Roll Needed
- [ ] Developer reactions (confused, satisfied, smiling)
- [ ] Coffee cup (steaming, half-empty, empty)
- [ ] Hands typing
- [ ] Wide shots of dual-monitor setup
- [ ] OnboardOps logo animations

---

## Footage Gaps and TODOs

### Critical Gaps (Must Have for Final Video)
1. **Full E2E run with clean timing** - T5.4 will provide
2. **PR generation close-up** - T5.5 will provide
3. **Certification panel interaction** - T5.6 will provide
4. **Auto-recovery B-roll** - Dev 4 T4.6 will provide

### Nice-to-Have Gaps (Can Use Placeholders)
1. **Developer reactions** - Can use stock footage or skip
2. **Coffee cup B-roll** - Can use stock footage
3. **Wide shots** - Can composite from existing footage

### Placeholder Strategy
For rough cut v1, use:
- **Black screens with text** for missing footage
- **Freeze frames** from existing recordings
- **Animated text overlays** to explain what will be shown
- **Storyboard sketches** for complex sequences

---

## Audio Plan

### Narration
- **Voice:** Professional, energetic, clear diction
- **Tone:** Confident but not arrogant, technical but accessible
- **Pacing:** 150-160 words per minute
- **Recording:** Separate from video (easier to edit)
- **Format:** WAV, 48kHz, 24-bit

### Background Music
- **Track 1 (0:00-0:45):** Tense, building - "The Problem"
- **Track 2 (0:45-3:30):** Energetic, tech-forward - "The Solution"
- **Track 3 (3:30-4:30):** Confident, triumphant - "The Impact"
- **Track 4 (4:30-4:45):** Fade out - "Outro"
- **Volume:** -20dB to -25dB (under narration)
- **License:** Royalty-free or Creative Commons

### Sound Effects
- **Stopwatch tick:** Subtle, every 5 seconds
- **Card emission whoosh:** On each cartography card
- **Certification ding:** On each correct answer
- **Success chime:** On PR generation
- **Error buzz:** On bootstrap failure (brief)
- **Recovery beep:** On auto-recovery success

---

## Editing Software and Workflow

### Recommended Tools
- **Primary:** DaVinci Resolve (free, professional)
- **Alternative:** Adobe Premiere Pro
- **Screen recording:** OBS Studio
- **Audio editing:** Audacity

### Project Settings
- **Resolution:** 1920×1080 (1080p)
- **Frame rate:** 60fps
- **Codec:** H.264
- **Bitrate:** 10-15 Mbps (high quality)
- **Audio:** AAC, 192 kbps, stereo

### Editing Workflow
1. **Import all source footage** into project
2. **Create rough assembly** following this plan
3. **Add placeholder cards** for missing footage
4. **Sync narration** to video
5. **Add music tracks** and adjust levels
6. **Add sound effects** at key moments
7. **Color grade** for consistency
8. **Add text overlays** and graphics
9. **Export rough cut v1** for team review
10. **Iterate based on feedback**

---

## Review Checklist

Before marking rough cut v1 complete:

### Structure
- [ ] All 8 storyboard beats are represented
- [ ] Total duration is 4-5 minutes
- [ ] Act structure (Problem → Solution → Impact) is clear
- [ ] Pacing feels right (not too fast, not too slow)

### Content
- [ ] All 9 core features are showcased
- [ ] Bob mastery proof points are explicit
- [ ] Business value is quantified
- [ ] Call to action is clear

### Technical
- [ ] Resolution is 1920×1080
- [ ] Frame rate is 60fps
- [ ] Audio is clear and balanced
- [ ] No jarring cuts or transitions
- [ ] Text overlays are legible

### Gaps
- [ ] Every missing footage segment is marked with placeholder
- [ ] TODOs are documented for Phase 5
- [ ] Team knows what additional recordings are needed

---

## Next Steps After Rough Cut v1

1. **Team review** (H+34 mid-phase sync)
   - Watch rough cut together
   - Note weak moments
   - Identify re-shoot needs

2. **Capture missing footage** (T5.4-T5.6)
   - Full E2E demo
   - PR generation close-up
   - Certification interaction

3. **Iterate to rough cut v2** (Phase 5)
   - Replace placeholders with real footage
   - Refine timing and pacing
   - Polish audio mix

4. **Final cut** (Phase 5)
   - Professional narration
   - Final color grading
   - Export for submission

---

## Acceptance Criteria

This task (T5.2) is complete when:

- ✅ Rough cut v1 plan is comprehensive and actionable
- ✅ All 8 storyboard beats are mapped to footage needs
- ✅ Footage gaps are identified and documented
- ✅ Audio plan (narration, music, SFX) is specified
- ✅ Editing workflow is defined
- ✅ Placeholder strategy is clear for missing footage
- ✅ Team can execute Phase 5 video production from this plan

---

**Bobcoin Cost:** 0 (planning only, no actual editing yet)  
**Time Budget:** 90 minutes  
**Dependencies:** T5.1 (defect triage), demo storyboard  
**Next Task:** T5.3 (Plan the Final Video Shot List)

---

## Appendix: Narration Full Script

### Act 1: The Problem (0:00 - 0:45)

> "New repository. 10,000 lines. Zero context. The clock starts now.
>
> Traditional onboarding is broken. Six months to productivity. Thirty thousand dollars per developer. Weeks before your first contribution. Documentation goes stale. Tribal knowledge stays tribal. And your best engineers spend their time answering the same questions over and over.
>
> What if you could compress six months into ten minutes? What if your AI copilot could read the entire git history, understand the architecture, and guide you to your first contribution—all before your coffee gets cold? Meet OnboardOps."

### Act 2: The Solution (0:45 - 3:30)

> "One command. `/onboard`. Your AI copilot takes over.
>
> Bob maps the codebase in real-time. Dependencies, entry points, conventions—all extracted from git history. Four cards. Forty seconds. You now know more than the README could ever tell you. This isn't documentation. This is institutional knowledge, automatically extracted from every commit, every PR, every code review.
>
> Setup fails? OnboardOps auto-recovers. Port conflicts, missing dependencies, wrong Node version—handled automatically. Bob Shell watches every command, catches every error, and fixes it before you even notice. Five common failure modes, zero manual intervention.
>
> Socratic certification. Three questions. Prove you understand before you commit. This isn't a quiz—it's a conversation. Bob asks, you answer, and the grading is instant. Pass, and you're certified. Fail, and Bob explains why, then asks again. No judgment, just learning.
>
> Your first PR. Generated, tested, and ready to merge. Nine minutes from clone to contribution. The PR includes your onboarding time, proving you went from zero to productive in less time than it takes to make a sandwich.
>
> Six months of onboarding, compressed into one cup of coffee. From git clone to merged PR in under ten minutes. This is what AI-powered onboarding looks like."

### Act 3: The Impact (3:30 - 4:30)

> "How does it work? Bob IDE hosts a custom onboard mode with two skills: cartography and certification. The mode calls our MCP server—seven tools that extract institutional knowledge from git history. The dashboard shows everything in real-time over WebSockets. And Bob Shell orchestrates the bootstrap, catching errors and auto-recovering. Bob isn't just in the build—Bob is in the runtime.
>
> This is deep Bob mastery. Custom modes and skills, not just prompts. An MCP server we built from scratch. Bob Shell driving auto-recovery through error pipes. And a personalized AGENTS.md that works with Bob's /init command. Every feature is Bob-native, not bolted on.
>
> The business case is simple. Traditional onboarding costs thirty thousand dollars per developer. OnboardOps costs three hundred. That's a 99% reduction. At scale—one hundred developers per year—that's three million dollars saved annually. And your senior engineers get their time back to build, not babysit."

### Outro (4:30 - 4:45)

> "OnboardOps. The ten-minute repo whisperer. Open source. Built with IBM Bob. Try it on your repository today."

**Total word count:** ~650 words  
**Speaking time at 150 wpm:** ~4 minutes 20 seconds  
**Remaining time for visuals:** ~25 seconds

---

**End of Rough Cut v1 Plan**