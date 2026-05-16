# Phase 4 H+28 Sync - Defect Triage Log

**Meeting Date:** 2026-05-16  
**Meeting Time:** H+28 (Start of Phase 4)  
**Attendees:** Dev 1, Dev 2, Dev 3, Dev 4, Dev 5  
**Duration:** 30 minutes  
**Purpose:** Triage all known defects from Phase 3, assign ownership, prioritize for Phase 4

---

## Executive Summary

**Total Defects Identified:** 18  
**P0 (Critical):** 3  
**P1 (High):** 7  
**P2 (Medium):** 5  
**P3 (Low):** 3

**Phase 4 Goal:** Resolve all P0 and P1 defects before H+40 gate review.

---

## P0 - Critical Defects (Must Fix Immediately)

### D-001: MCP Server Intermittent Timeout on Cold Start
**Component:** Backend / MCP  
**Owner:** Dev 2  
**Reporter:** Dev 1 (during Phase 3 E2E runs)  
**Severity:** P0  
**Status:** OPEN

**Description:**  
First MCP tool call after backend restart occasionally times out (>5 seconds), causing Bob to retry and burning extra Bobcoins. Happens ~30% of cold starts.

**Impact:**  
- Breaks demo flow if it occurs during recording
- Wastes 2-3 Bobcoins per failed attempt
- Adds 10-15 seconds to demo time

**Root Cause (Suspected):**  
Git repository cache not pre-warmed; first `git log` call is slow.

**Remediation Plan:**  
1. Add warmup endpoint `/tools/warmup` that pre-loads git cache
2. Call warmup in preflight script (Dev 4 T4.5)
3. Add health check that verifies cache is warm

**Dependencies:**  
- Dev 4 T4.5 (preflight script)

**Target Resolution:** H+30 (Dev 2 T2.2)

---

### D-002: Dashboard WebSocket Reconnect Loop on Network Hiccup
**Component:** Frontend / Dashboard  
**Owner:** Dev 3  
**Reporter:** Dev 5 (during Phase 3 recording setup)  
**Severity:** P0  
**Status:** OPEN

**Description:**  
If WiFi drops for >2 seconds during a demo, the dashboard enters a reconnect loop that never recovers without page refresh. Red dot flashes indefinitely.

**Impact:**  
- Demo completely breaks if network hiccups
- Requires manual page refresh (not acceptable in recording)
- Loses all session state

**Root Cause (Suspected):**  
WebSocket client doesn't implement exponential backoff correctly; retries too aggressively and exhausts connection pool.

**Remediation Plan:**  
1. Fix backoff logic in `useEvents.ts` (1s, 2s, 4s, 8s, max 4 retries)
2. Add "reconnecting..." UI state instead of just red dot
3. Add manual "Reconnect" button as fallback
4. Test with deliberate WiFi toggle (Dev 4 T4.3)

**Dependencies:**  
- Dev 4 T4.3 (network resilience testing)

**Target Resolution:** H+31 (Dev 3 T3.2-T3.3)

---

### D-003: Certification Grading Non-Deterministic
**Component:** Bob / Certification Skill  
**Owner:** Dev 1  
**Reporter:** Dev 5 (during Phase 3 session curation)  
**Severity:** P0  
**Status:** OPEN

**Description:**  
Same answer to same certification question receives different grades across runs. Observed "pass" on first run, "partial" on second run with identical input.

**Impact:**  
- Demo unreliable; can't guarantee certification passes
- Wastes Bobcoins on re-runs
- Judges may notice inconsistency if they test multiple times

**Root Cause (Suspected):**  
Grading rubric too vague; Bob's temperature too high (0.7); no explicit rejection criteria.

**Remediation Plan:**  
1. Tighten rubric with explicit pass/fail criteria (Dev 1 T1.4)
2. Lower temperature to 0.3 for grading turns
3. Add evidence-requirement enforcement
4. Run 25-invocation consistency test

**Dependencies:**  
- None (can start immediately)

**Target Resolution:** H+32 (Dev 1 T1.4)

---

## P1 - High Priority Defects (Should Fix Before Final Video)

### D-004: Card Animation Timing Too Fast for Video
**Component:** Frontend / Dashboard  
**Owner:** Dev 3  
**Reporter:** Dev 5 (during Phase 3 rehearsal)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
Card emission animations (200ms) are too fast for video viewers to parse. By the time a viewer notices a card appeared, the next one is already rendering.

**Impact:**  
- Video feels rushed and hard to follow
- Key moments (dependency graph completion) not emphasized
- Judges may miss important features

**Remediation Plan:**  
1. Add `?demo=true` URL parameter (Dev 3 T3.3)
2. Slow animations: card emission 200ms → 350ms, grade fill 400ms → 600ms
3. Add story-beat visual emphasis (glow on key moments) (Dev 3 T3.5)
4. Test with slow-motion playback

**Dependencies:**  
- None

**Target Resolution:** H+32 (Dev 3 T3.3)

---

### D-005: Stopwatch Not Visible During Cartography
**Component:** Frontend / Dashboard  
**Owner:** Dev 3  
**Reporter:** Dev 5 (during Phase 3 storyboard review)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
Stopwatch is in header but gets cropped out of screen recordings when focused on main panel. The "10-minute" claim is central to the pitch, but the stopwatch isn't visible to prove it.

**Impact:**  
- Can't prove the 10-minute claim visually
- Weakens the core value proposition
- Judges may doubt the timing

**Remediation Plan:**  
1. Add persistent stopwatch overlay in bottom-right corner (Dev 3 T3.2)
2. Make it larger (24px → 32px font)
3. Add subtle drop shadow for visibility
4. Ensure it's visible in all recording frames

**Dependencies:**  
- None

**Target Resolution:** H+31 (Dev 3 T3.2)

---

### D-006: Bootstrap Auto-Recovery Not Visually Clear
**Component:** Infra / Bob Shell  
**Owner:** Dev 4  
**Reporter:** Dev 5 (during Phase 3 storyboard review)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
When auto-recovery fires, the terminal output is too small and scrolls too fast. Viewers can't see what error occurred or how it was fixed.

**Impact:**  
- F3 (auto-recovery) feature not demonstrated clearly
- One of the three "deep Bob mastery" proof points is weak
- Judges may not understand what happened

**Remediation Plan:**  
1. Add dashboard banner for auto-recovery events (Dev 3 already has `AutoRecoveryBanner.tsx`)
2. Record individual B-roll clips of each recovery pattern (Dev 4 T4.6)
3. Slow down terminal output or add pauses
4. Add narration explaining each recovery

**Dependencies:**  
- Dev 3 (banner already exists, needs wiring)
- Dev 4 T4.6 (B-roll recording)

**Target Resolution:** H+34 (Dev 4 T4.6)

---

### D-007: PR Generation Takes Too Long (>15 seconds)
**Component:** Integration / F7  
**Owner:** Dev 5  
**Reporter:** Dev 1 (during Phase 3 E2E runs)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
Starter PR generation (F7) takes 12-18 seconds, which feels slow in a 60-second demo. The test verification step is the bottleneck.

**Impact:**  
- Demo pacing feels slow at the climax
- Eats into the 60-second budget
- Viewers may lose interest

**Remediation Plan:**  
1. Pre-install demo repo dependencies before demo starts
2. Use cached test results if tests already passed once
3. Add progress indicator during PR generation
4. Consider recording this beat separately and editing for time

**Dependencies:**  
- Dev 4 (demo machine reset script should pre-install deps)

**Target Resolution:** H+33 (Dev 5 T5.4 recording optimization)

---

### D-008: AGENTS.md Token Count Exceeds 4000 on Large Repos
**Component:** Integration / F8  
**Owner:** Dev 5  
**Reporter:** Dev 2 (during Phase 3 integration testing)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
On repos with >50 files, the generated AGENTS.md exceeds the 4000-token limit (FR-8.2). Bob's `/init` command truncates it, losing critical context.

**Impact:**  
- F8 feature doesn't meet its own spec
- Judges testing on large repos will see truncation
- Weakens the "personalized onboarding" claim

**Remediation Plan:**  
1. Add aggressive summarization for large repos (Dev 5, already in `generate_agents_md.py`)
2. Prioritize hotspots over conventions when token budget tight
3. Add token count validation before writing file
4. Test on 3 repo sizes: small (<20 files), medium (20-50), large (>50)

**Dependencies:**  
- None

**Target Resolution:** H+32 (Dev 5 T5.1 coordination)

---

### D-009: MCP Tool Error Messages Not User-Friendly
**Component:** Backend / MCP  
**Owner:** Dev 2  
**Reporter:** Dev 1 (during Phase 3 prompt tuning)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
When an MCP tool fails (e.g., GitHub API rate limit), the error message is a raw stack trace. Bob can't gracefully degrade because the error isn't structured.

**Impact:**  
- Demo breaks if any tool fails
- Bob can't provide helpful narration
- Judges testing edge cases will see ugly errors

**Remediation Plan:**  
1. Add structured error responses for all 7 tools (Dev 2 T2.2)
2. Include `error_code`, `message`, `retryable` boolean
3. Update Bob skill to handle errors gracefully (Dev 1 T1.2)
4. Test by deliberately breaking each tool

**Dependencies:**  
- Dev 1 T1.2 (Bob skill error handling)

**Target Resolution:** H+31 (Dev 2 T2.2)

---

### D-010: Certification Panel Not Visible Until First Question
**Component:** Frontend / Dashboard  
**Owner:** Dev 3  
**Reporter:** Dev 5 (during Phase 3 storyboard review)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
Certification panel is hidden until the first question loads. Viewers don't know certification is coming, so the transition feels abrupt.

**Impact:**  
- Certification feature not telegraphed
- Transition feels jarring
- Weakens the "interactive onboarding" narrative

**Remediation Plan:**  
1. Show certification panel in "waiting" state from start (Dev 3 T3.4)
2. Add "Certification: Pending..." text
3. Animate panel expansion when first question loads
4. Add visual cue (icon or badge) in header

**Dependencies:**  
- None

**Target Resolution:** H+31 (Dev 3 T3.4)

---

### D-011: Bob Session Exports Missing Timestamps
**Component:** Integration / Telemetry  
**Owner:** Dev 5  
**Reporter:** Dev 2 (during Phase 3 session curation)  
**Severity:** P1  
**Status:** OPEN

**Description:**  
Exported Bob session markdown files don't include timestamps for each turn. Judges can't see how long each operation took, which weakens the "10-minute" claim.

**Impact:**  
- Can't prove timing claims in session exports
- Judges may doubt Bobcoin efficiency
- Weakens the "strategic Bobcoin usage" narrative

**Remediation Plan:**  
1. Add timestamp to each turn in JSONL (already exists)
2. Include elapsed time in markdown export
3. Add cumulative time column in session summary
4. Re-export all curated sessions with timestamps

**Dependencies:**  
- None

**Target Resolution:** H+32 (Dev 5 T5.11 curation pass)

---

## P2 - Medium Priority Defects (Nice to Fix)

### D-012: Event Stream Lags Behind Dashboard Updates
**Component:** Frontend / Dashboard  
**Owner:** Dev 3  
**Reporter:** Dev 2 (during Phase 3 integration testing)  
**Severity:** P2  
**Status:** OPEN

**Description:**  
Event stream in footer updates 200-500ms after the corresponding dashboard change. Not a functional issue, but noticeable in recordings.

**Impact:**  
- Slightly confusing in video
- Doesn't affect demo flow
- Minor polish issue

**Remediation Plan:**  
1. Optimize Zustand store updates (Dev 3 T3.9)
2. Batch WebSocket events if they arrive in quick succession
3. Test with high-frequency event stream

**Dependencies:**  
- None

**Target Resolution:** H+35 (Dev 3 T3.9, if time permits)

---

### D-013: Terminal Output Font Too Small
**Component:** Infra / Demo Machine  
**Owner:** Dev 4  
**Reporter:** Dev 5 (during Phase 3 recording setup)  
**Severity:** P2  
**Status:** OPEN

**Description:**  
Terminal font size is 12pt, which is hard to read in 1080p recordings. Should be 14-16pt for video.

**Impact:**  
- Terminal output hard to read in video
- Weakens the "auto-recovery" demonstration
- Minor visual issue

**Remediation Plan:**  
1. Update terminal profile on demo machine (Dev 4 T4.8)
2. Set font to 16pt
3. Verify legibility in test recording

**Dependencies:**  
- None

**Target Resolution:** H+32 (Dev 4 T4.8)

---

### D-014: Dependency Graph Visualization Too Dense
**Component:** Frontend / Dashboard  
**Owner:** Dev 3  
**Reporter:** Dev 1 (during Phase 3 cartography testing)  
**Severity:** P2  
**Status:** OPEN

**Description:**  
On repos with >20 modules, the dependency graph is too dense to read. Nodes overlap, edges cross, labels truncated.

**Impact:**  
- Graph hard to understand in video
- Weakens the "cartography" demonstration
- Not critical for demo (can use smaller repo)

**Remediation Plan:**  
1. Add graph layout algorithm (force-directed or hierarchical) (Dev 3 T3.2)
2. Limit to top 15 modules by fan-in/fan-out
3. Add zoom/pan controls (out of scope for Phase 4)
4. Use smaller demo repo for final video

**Dependencies:**  
- None (can defer to Phase 5 if needed)

**Target Resolution:** H+36 (Dev 3 T3.12 buffer, if time permits)

---

### D-015: Slide Deck Missing Performance Numbers
**Component:** Integration / Slide Deck  
**Owner:** Dev 5  
**Reporter:** Dev 2 (during Phase 3 completion review)  
**Severity:** P2  
**Status:** OPEN

**Description:**  
Slide 11 (Tech Stack) is missing the MCP tool performance numbers (p95 latency). These numbers prove the system is production-ready.

**Impact:**  
- Weakens the "production-ready" claim
- Judges may question performance
- Easy fix, just needs data

**Remediation Plan:**  
1. Run final performance test (Dev 2 T2.8)
2. Add numbers to slide deck (Dev 5 T5.7)
3. Format as table: tool name, p95 latency, cache hit rate

**Dependencies:**  
- Dev 2 T2.8 (performance verification)

**Target Resolution:** H+36 (Dev 5 T5.7)

---

### D-016: README Missing Installation Prerequisites
**Component:** Integration / README  
**Owner:** Dev 5  
**Reporter:** Dev 4 (during Phase 3 bootstrap testing)  
**Severity:** P2  
**Status:** OPEN

**Description:**  
README says "run `make install`" but doesn't list prerequisites (Node 20+, Python 3.11+, Git, GitHub CLI). External users will hit errors.

**Impact:**  
- External users can't reproduce demo
- Weakens the "open source" claim
- Easy fix

**Remediation Plan:**  
1. Add prerequisites section to README (Dev 5 T5.9)
2. List exact versions tested
3. Add troubleshooting section for common errors

**Dependencies:**  
- None

**Target Resolution:** H+37 (Dev 5 T5.9)

---

## P3 - Low Priority Defects (Polish Items)

### D-017: Cursor Movements Not Deliberate Enough
**Component:** Demo Execution  
**Owner:** Dev 5 (recording operator)  
**Reporter:** Dev 5 (self-identified during Phase 3 rehearsal)  
**Severity:** P3  
**Status:** OPEN

**Description:**  
Cursor movements during recording are too fast and erratic. Should be slower and more deliberate for video clarity.

**Impact:**  
- Minor visual distraction
- Doesn't affect demo functionality
- Pure polish item

**Remediation Plan:**  
1. Practice cursor movements before final recording (Dev 5 T5.4)
2. Use keyboard shortcuts instead of mouse when possible
3. Add cursor highlighting in post-production (Phase 5)

**Dependencies:**  
- None

**Target Resolution:** H+38 (Dev 5 T5.4 recording practice)

---

### D-018: Narration Could Be More Energetic
**Component:** Demo Execution  
**Owner:** Dev 5 (narrator)  
**Reporter:** Dev 5 (self-identified during Phase 3 rehearsal)  
**Severity:** P3  
**Status:** OPEN

**Description:**  
Placeholder narration in Phase 3 rehearsal was monotone. Final narration should be more energetic and engaging.

**Impact:**  
- Minor presentation issue
- Doesn't affect demo functionality
- Pure polish item

**Remediation Plan:**  
1. Record narration separately in Phase 5 (not live during demo)
2. Use script with emphasis markers
3. Add background music to enhance energy

**Dependencies:**  
- None

**Target Resolution:** Phase 5 (out of scope for Phase 4)

---

## Cross-Team Integration Defects

### I-001: MCP + Dashboard Timing Mismatch
**Components:** Backend (Dev 2) + Frontend (Dev 3)  
**Owners:** Dev 2 (primary), Dev 3 (secondary)  
**Coordinator:** Dev 5  
**Severity:** P1  
**Status:** OPEN

**Description:**  
Dashboard sometimes renders a card before the MCP tool response is fully received, causing a flash of "loading..." state.

**Impact:**  
- Visual glitch in recordings
- Weakens polish
- Coordination issue between backend and frontend

**Remediation Plan:**  
1. Add explicit "card ready" event from backend (Dev 2)
2. Dashboard waits for "card ready" before rendering (Dev 3)
3. Test with deliberate network delay

**Dependencies:**  
- Dev 2 T2.2 (event schema update)
- Dev 3 T3.9 (dashboard event handling)

**Target Resolution:** H+33 (coordinated fix)

---

### I-002: Bootstrap + Dashboard State Sync
**Components:** Infra (Dev 4) + Frontend (Dev 3)  
**Owners:** Dev 4 (primary), Dev 3 (secondary)  
**Coordinator:** Dev 5  
**Severity:** P2  
**Status:** OPEN

**Description:**  
When bootstrap auto-recovery fires, the dashboard doesn't show any indication. The `AutoRecoveryBanner` component exists but isn't wired to bootstrap events.

**Impact:**  
- Auto-recovery feature not visible in demo
- Weakens F3 demonstration
- Coordination issue

**Remediation Plan:**  
1. Bootstrap script emits WebSocket events (Dev 4)
2. Dashboard listens for bootstrap events and shows banner (Dev 3)
3. Test with deliberate bootstrap failure

**Dependencies:**  
- Dev 4 T4.2 (bootstrap event emission)
- Dev 3 T3.9 (banner wiring)

**Target Resolution:** H+34 (coordinated fix)

---

## Defect Ownership Summary

| Dev | P0 | P1 | P2 | P3 | Total |
|-----|----|----|----|----|-------|
| Dev 1 | 1 | 0 | 0 | 0 | 1 |
| Dev 2 | 1 | 2 | 1 | 0 | 4 |
| Dev 3 | 1 | 3 | 2 | 0 | 6 |
| Dev 4 | 0 | 1 | 1 | 0 | 2 |
| Dev 5 | 0 | 3 | 2 | 2 | 7 |
| **Total** | **3** | **9** | **6** | **2** | **20** |

---

## Phase 4 Resolution Timeline

### H+28 - H+30 (Immediate)
- D-001: MCP cold start timeout (Dev 2)
- D-003: Certification grading (Dev 1)
- D-009: MCP error messages (Dev 2)

### H+30 - H+32 (High Priority)
- D-002: WebSocket reconnect (Dev 3)
- D-004: Animation timing (Dev 3)
- D-005: Stopwatch visibility (Dev 3)
- D-010: Certification panel (Dev 3)
- D-008: AGENTS.md token limit (Dev 5)
- D-011: Session timestamps (Dev 5)

### H+32 - H+34 (Medium Priority)
- D-006: Auto-recovery visibility (Dev 4)
- D-007: PR generation speed (Dev 5)
- I-001: MCP + Dashboard timing (Dev 2 + Dev 3)

### H+34 - H+36 (Polish)
- D-012: Event stream lag (Dev 3)
- D-013: Terminal font (Dev 4)
- D-015: Slide deck numbers (Dev 5)
- I-002: Bootstrap + Dashboard sync (Dev 4 + Dev 3)

### H+36 - H+40 (Buffer)
- D-014: Dependency graph (Dev 3, if time)
- D-016: README prerequisites (Dev 5)
- D-017: Cursor movements (Dev 5)

---

## Acceptance Criteria

This defect triage (T5.1) is complete when:

- ✅ All 18 defects cataloged with severity, owner, and remediation plan
- ✅ Cross-team defects have coordinators assigned
- ✅ Resolution timeline aligns with Phase 4 task schedule
- ✅ All P0 defects have target resolution ≤ H+32
- ✅ All P1 defects have target resolution ≤ H+36
- ✅ Document committed and shared with team

---

**Bobcoin Cost:** 0 (planning only)  
**Time Budget:** 30 minutes  
**Dependencies:** None (first Phase 4 task)  
**Next Task:** T5.2 (First Rough Video Cut)