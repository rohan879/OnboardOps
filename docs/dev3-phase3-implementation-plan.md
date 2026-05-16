# Dev 3 Phase 3 Implementation Plan
## OnboardOps - Frontend/Dashboard Feature Buildout

**Phase Window:** H+10 to H+28 (18 hours wall-clock)  
**Effective Work Time:** ~12 hours  
**Bobcoin Budget:** 3 coins  
**Tasks:** 12 tasks  
**Status:** Ready to begin

---

## Overview

Phase 3 expands the Phase 2 vertical slice into the full feature surface. All three remaining cartography card variants, the certification panel, auto-recovery UI, and visual polish must be complete by H+28.

### Key Deliverables
1. **Three Card Variants:** Entry Points, Hotspots, Conventions
2. **Certification Panel:** Three-question quiz with grading UI
3. **Auto-Recovery Banner:** Visual feedback for bootstrap recovery
4. **Animation Polish:** Smooth transitions across all states
5. **Visual Consistency:** IBM Design System compliance at 1080p
6. **Session Documentation:** 3 curated Bob sessions + 5 screenshots

---

## Phase 3 Tasks (12 Total)

### T3.1: Build Entry Points Card Variant (75 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** Phase 2 T3.1, Dev 1 T1.1  
**Status:** Pending Dev 1 completion

**Objective:** Render Stage 2 cartography payload as three grouped lists (HTTP routes, CLI, jobs) with icons and color-coding.

**Implementation Steps:**
1. Create `frontend/src/components/cards/EntryPointsCard.tsx`
2. Define TypeScript interfaces for entry point data:
   ```typescript
   interface EntryPoint {
     type: 'http' | 'cli' | 'job';
     name: string;
     method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
     path?: string;
     description?: string;
   }
   ```
3. Implement three-section layout:
   - HTTP Routes (color-coded by method: GET=green, POST=blue, PUT=yellow, DELETE=red)
   - CLI Entry Points (terminal icon)
   - Scheduled Jobs (clock icon)
4. Add click-to-highlight in dependency graph (coordinate with DependencyGraph component)
5. Implement Framer Motion entry animation (stagger children)
6. Update `page.tsx` to use EntryPointsCard instead of generic CartographyCard

**Acceptance Criteria:**
- Card renders Stage 2 payload from real run
- Visually consistent with existing graph card
- HTTP methods color-coded correctly
- Clickable items highlight in dependency graph

**Manual Steps for You:**
- Test with Dev 1's Stage 2 output once available
- Verify color contrast meets IBM Design System standards

---

### T3.2: Build Hotspots Card Variant (90 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** T3.1, Dev 1 T1.2  
**Status:** Pending T3.1 + Dev 1 completion

**Objective:** Render Stage 3 payload as ranked table with churn visualization, author avatars, and sparklines.

**Implementation Steps:**
1. Create `frontend/src/components/cards/HotspotsCard.tsx`
2. Define TypeScript interfaces:
   ```typescript
   interface Hotspot {
     path: string;
     churnCount: number;
     topAuthor: { name: string; email: string; avatar?: string };
     lastPR: { url: string; title: string; date: string };
     rationale: string;
     commitFrequency: number[]; // 12-bucket array for sparkline
   }
   ```
3. Implement table layout:
   - Column 1: File path (truncated with tooltip)
   - Column 2: Churn count with horizontal bar visualization
   - Column 3: Top author avatar (use Gravatar or initials fallback)
   - Column 4: Last PR link (external link icon)
   - Column 5: Sparkline (12-bucket commit frequency)
4. Add expandable row for Bob's rationale (click to expand)
5. Implement sorting by churn count (default) or last modified
6. Add GitHub link-out for each file path

**Acceptance Criteria:**
- Card renders Stage 3 payload with ≥5 hotspots
- Sparklines render at correct resolution (12 buckets)
- Author avatars load or show initials fallback
- Rationale expands/collapses smoothly

**Manual Steps for You:**
- Test sparkline rendering with various data patterns
- Verify GitHub links open correctly

---

### T3.3: Build Conventions Card Variant (60 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** T3.2, Dev 1 T1.3  
**Status:** Pending T3.2 + Dev 1 completion

**Objective:** Render Stage 4 payload as clean two-column list with inline code previews.

**Implementation Steps:**
1. Create `frontend/src/components/cards/ConventionsCard.tsx`
2. Define TypeScript interfaces:
   ```typescript
   interface Convention {
     name: string;
     pattern: string;
     evidence: { file: string; lineNumber: number; snippet: string };
   }
   ```
3. Implement two-column layout:
   - Left: Convention name + pattern description
   - Right: Evidence file path + syntax-highlighted code snippet
4. Use `react-syntax-highlighter` for code snippets (Python/TypeScript detection)
5. Add "View in GitHub" link for each evidence file
6. Keep visual design calm (this is breathing room before certification)

**Acceptance Criteria:**
- Card renders Stage 4 payload with ≥3 conventions
- Code snippets syntax-highlighted correctly
- Visual design is calmer than other cards (less color, more whitespace)

**Manual Steps for You:**
- Verify syntax highlighting works for Python and TypeScript
- Test with various convention types (naming, error handling, test layout)

---

### T3.4: Build Certification Panel (90 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** Dev 1 T1.4  
**Status:** Pending Dev 1 completion

**Objective:** Render three certification questions with input fields and grade badges.

**Implementation Steps:**
1. Create `frontend/src/components/CertificationPanel.tsx`
2. Define TypeScript interfaces:
   ```typescript
   interface CertificationQuestion {
     id: string;
     topic: string;
     questionText: string;
     answer?: string;
     grade?: 'pass' | 'partial' | 'fail';
     rationale?: string;
   }
   ```
3. Implement vertical stack layout:
   - Question text in IBM Plex Serif (typographic contrast)
   - Textarea input field (auto-resize)
   - Grade badge (pass=green, partial=yellow, fail=red)
   - Rationale text (shown after grading)
4. Add final "Certified" celebration state (when 2 of 3 pass)
5. Implement Framer Motion animations:
   - Grade badge fill-in
   - Celebration confetti (subtle, IBM aesthetic)
6. Wire to WebSocket events: `QuestionAsk`, `CertificationGrade`
7. Update `page.tsx` to replace placeholder with CertificationPanel

**Acceptance Criteria:**
- Three questions render from real `QuestionAsk` events
- Grades fill in from `CertificationGrade` events
- Final celebration triggers correctly (2+ passes)
- Confetti is subtle and IBM-branded

**Manual Steps for You:**
- Test with Dev 1's certification skill once available
- Verify celebration animation is tasteful (not over-the-top)

---

### T3.5: Build Auto-Recovery Toast/Banner (60 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** Phase 2 T4.8  
**Status:** Can start independently

**Objective:** Slide-in banner showing bootstrap recovery actions with auto-dismiss.

**Implementation Steps:**
1. Create `frontend/src/components/AutoRecoveryBanner.tsx`
2. Define TypeScript interfaces:
   ```typescript
   interface RecoveryEvent {
     pattern: 'port-in-use' | 'node-version' | 'missing-venv' | 'missing-seed' | 'db-not-running';
     action: string;
     details: string;
     status: 'in-progress' | 'success' | 'failed';
   }
   ```
3. Implement slide-in from top:
   - Use Framer Motion `AnimatePresence`
   - Banner height: 80px
   - Auto-dismiss after 4 seconds (success) or 8 seconds (failed)
4. Add visual states:
   - In-progress: Blue background, spinner icon
   - Success: Green background, checkmark icon, subtle celebration
   - Failed: Red background, X icon
5. Display format: `"Port 8000 in use → killing PID 42193 → retrying"`
6. Wire to WebSocket `BootstrapRecovery` events
7. Add to `page.tsx` as fixed-position overlay

**Acceptance Criteria:**
- Banner appears on port-in-use recovery
- Auto-dismisses after 4 seconds
- Visually obvious on 1080p video frame
- Celebration animation on success

**Manual Steps for You:**
- Test with Dev 4's bootstrap recovery patterns
- Verify banner doesn't overlap critical UI elements

---

### T3.6: Animation Polish: Card Emissions (60 min)
**Bobcoin Cost:** 0  
**Dependencies:** T3.3  
**Status:** Pending T3.3

**Objective:** Ensure smooth, consistent transitions across all four card variants.

**Implementation Steps:**
1. Create shared Framer Motion variants in `frontend/src/lib/animations.ts`:
   ```typescript
   export const cardVariants = {
     pending: { opacity: 0.6, scale: 0.98 },
     'in-progress': { opacity: 1, scale: 1, transition: { duration: 0.3 } },
     complete: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
     error: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
   };
   ```
2. Add "thinking" shimmer during in-progress:
   - Use CSS gradient animation
   - Subtle pulse effect (0.8s cycle)
3. Update all four card components to use shared variants
4. Ensure stepper animates in lockstep with cards
5. Test transitions: pending→in-progress→complete
6. Record one demo run to verify visual consistency

**Acceptance Criteria:**
- Recording shows visually consistent animations
- No jitter or flash on transition
- Shimmer effect is subtle and professional

**Manual Steps for You:**
- Record 30-second clip of all four stages transitioning
- Review for any visual inconsistencies

---

### T3.7: Animation Polish: Certification Grading (45 min)
**Bobcoin Cost:** 0  
**Dependencies:** T3.4  
**Status:** Pending T3.4

**Objective:** Animate grade badges with distinct celebrations for pass/partial/fail.

**Implementation Steps:**
1. Update `CertificationPanel.tsx` with grade animations:
   - **Pass:** Gentle scale-up + green glow (0.5s)
   - **Partial:** Settle animation + yellow pulse (0.4s)
   - **Fail:** Quick shake + red flash (0.3s)
2. Implement certified-celebration state:
   - Trigger when 2+ questions pass
   - Subtle confetti or particle effect
   - Use `react-confetti` with IBM Blue particles
   - Auto-stop after 3 seconds
3. Add sound effects (optional, muted by default):
   - Pass: Soft chime
   - Fail: Subtle thud
   - Certified: Celebration sound
4. Ensure celebration triggers exactly once per session

**Acceptance Criteria:**
- All three grade animations distinct
- Celebration triggers exactly once per session
- Confetti is subtle (IBM aesthetic, not Mario party)

**Manual Steps for You:**
- Test with various pass/fail combinations
- Verify celebration doesn't trigger prematurely

---

### T3.8: 1080p Lockdown (No Mobile Fallback) (45 min)
**Bobcoin Cost:** 0  
**Dependencies:** T3.7  
**Status:** Pending T3.7

**Objective:** Lock dashboard to 1920×1080 resolution, remove mobile-responsive code.

**Implementation Steps:**
1. Update `frontend/src/app/globals.css`:
   ```css
   body {
     min-width: 1920px;
     min-height: 1080px;
     overflow-x: hidden;
   }
   ```
2. Set viewport constraints in `layout.tsx`:
   ```typescript
   export const viewport = {
     width: 1920,
     height: 1080,
     initialScale: 1,
     maximumScale: 1,
   };
   ```
3. Remove or comment out all mobile-responsive breakpoints
4. Test resizing browser window (should not break layout)
5. Document decision in `docs/dashboard-scope.md`:
   - Desktop-only for hackathon
   - Mobile support is post-hackathon work
   - Demo recording resolution: 1920×1080

**Acceptance Criteria:**
- Resizing demo browser does not break layout
- Dashboard pixel-perfect at 1920×1080
- Documentation explains desktop-only scope

**Manual Steps for You:**
- Test at 1920×1080 in Chrome/Firefox
- Verify no horizontal scroll at target resolution

---

### T3.9: Final Visual Pass: Typography, Spacing, Color (60 min)
**Bobcoin Cost:** 0  
**Dependencies:** T3.8  
**Status:** Pending T3.8

**Objective:** Holistic visual review for IBM Design System compliance.

**Implementation Steps:**
1. **Typography Audit:**
   - Headings: IBM Plex Sans Bold
   - Body: IBM Plex Sans Regular
   - Code: IBM Plex Mono
   - Certification questions: IBM Plex Serif (already done in T3.4)
2. **Color Audit:**
   - Primary actions: IBM Blue 60 (#0F62FE)
   - Body text: IBM Gray 100 (#161616)
   - Secondary text: IBM Gray 70 (#525252)
   - Success: IBM Green 50 (#24A148)
   - Error: IBM Red 50 (#DA1E28)
   - Warning: IBM Orange 40 (#FF832B)
3. **Spacing Audit:**
   - Use 8px grid throughout
   - Component padding: 16px or 24px
   - Section gaps: 24px or 32px
4. Create `docs/design-system.md` documenting:
   - Typography scale
   - Color palette
   - Spacing system
   - Component patterns
5. Take side-by-side screenshots with IBM Carbon docs for comparison

**Acceptance Criteria:**
- Side-by-side comparison shows visual parity with IBM Carbon
- All spacing follows 8px grid
- Typography uses correct IBM Plex variants

**Manual Steps for You:**
- Review every component against IBM Carbon docs
- Fix any inconsistencies found

---

### T3.10: Replay Mode Polish (45 min)
**Bobcoin Cost:** 0  
**Dependencies:** Phase 2 T5.4  
**Status:** Can start after Phase 2 complete

**Objective:** Add playback speed controls, scrubber, and screenshot capture to `/replay` route.

**Implementation Steps:**
1. Update `frontend/src/app/replay/page.tsx` (if exists) or create it
2. Add URL parameter for playback speed:
   ```typescript
   const searchParams = useSearchParams();
   const speed = parseFloat(searchParams.get('speed') || '1');
   // Supported: 1x, 2x, 5x, 10x
   ```
3. Implement scrubber:
   - Timeline slider showing session progress
   - Click to jump to timestamp
   - Display current time / total time
4. Add speed control buttons:
   - 1x (real-time for demo)
   - 2x (faster review)
   - 5x (quick B-roll)
   - 10x (ultra-fast scrub)
5. Add "Capture Screenshot" button:
   - Uses `html2canvas` to snapshot current state
   - Downloads as PNG with timestamp filename
   - Preserves full 1920×1080 resolution
6. Wire to stored session events from Zustand

**Acceptance Criteria:**
- Replay supports four speeds and scrubbing
- Screenshot button produces clean PNG of current state
- Scrubber shows accurate progress

**Manual Steps for You:**
- Test replay with recorded session
- Verify screenshots are high-quality

---

### T3.11: End-to-End Visual Test (60 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** T3.10  
**Status:** Pending T3.10

**Objective:** Run full pipeline three times, identify and fix top three visual defects.

**Implementation Steps:**
1. Reset demo machine (use Dev 4's reset script)
2. Run full `/onboard` pipeline three times
3. Watch dashboard carefully, note every visual defect:
   - Layout shifts
   - Mis-aligned text
   - Animations playing twice
   - Race conditions
   - Color inconsistencies
   - Timing issues
4. Categorize defects by severity (critical, major, minor)
5. Fix top three defects
6. Re-run to verify fixes
7. Document remaining defects in `docs/phase3-visual-defects.md`

**Acceptance Criteria:**
- Three back-to-back runs render cleanly
- Top three defects fixed
- No visual defects in critical categories

**Manual Steps for You:**
- Coordinate with Dev 1 for full pipeline runs
- Take notes during each run
- Prioritize fixes that impact video recording

---

### T3.12: Session Export + Screenshots for Slides (30 min)
**Bobcoin Cost:** 0.5  
**Dependencies:** T3.11  
**Status:** Pending T3.11

**Objective:** Export Bob sessions and capture high-quality screenshots for slide deck.

**Implementation Steps:**
1. Export Dev 3 Bob sessions to `bob_sessions/dev3/`:
   - Session 1: Ask mode component scaffolding (EntryPointsCard)
   - Session 2: Debugging session (animation timing issue)
   - Session 3: Visual polish iteration (typography audit)
2. Capture five high-quality screenshots (1920×1080):
   - Screenshot 1: Full dashboard with all four cards complete
   - Screenshot 2: Entry Points card (close-up)
   - Screenshot 3: Hotspots card with sparklines (close-up)
   - Screenshot 4: Conventions card (close-up)
   - Screenshot 5: Certification panel with grades (close-up)
3. Save screenshots to `docs/screenshots/phase3/`
4. Add captions to each screenshot in `docs/screenshots/phase3/README.md`

**Acceptance Criteria:**
- Three sessions exported with markdown + consumption screenshots
- Five screenshots committed to `docs/screenshots/phase3/`
- Screenshots are high-quality (no compression artifacts)

**Manual Steps for You:**
- Use browser DevTools to capture at exact 1920×1080
- Verify screenshots are suitable for slide deck

---

## Dependency Timeline

### H+10 to H+12 (Early Phase 3)
- **T3.5:** Auto-Recovery Banner (independent, can start immediately)
- **T3.10:** Replay Mode Polish (independent, can start immediately)

### H+12 to H+14 (Waiting for Dev 1 Stage 2)
- **T3.1:** Entry Points Card (blocked until Dev 1 T1.1 complete)

### H+14 to H+16 (Waiting for Dev 1 Stage 3)
- **T3.2:** Hotspots Card (blocked until Dev 1 T1.2 complete)

### H+16 to H+18 (Waiting for Dev 1 Stage 4)
- **T3.3:** Conventions Card (blocked until Dev 1 T1.3 complete)
- **T3.6:** Animation Polish: Card Emissions (can start after T3.3)

### H+18 to H+20 (Waiting for Dev 1 Certification)
- **T3.4:** Certification Panel (blocked until Dev 1 T1.4 complete)
- **T3.7:** Animation Polish: Certification Grading (can start after T3.4)

### H+20 to H+22 (Polish Phase)
- **T3.8:** 1080p Lockdown
- **T3.9:** Final Visual Pass

### H+22 to H+28 (Testing & Documentation)
- **T3.11:** End-to-End Visual Test
- **T3.12:** Session Export + Screenshots

---

## Bobcoin Budget Tracking

| Task | Bobcoins | Cumulative |
|------|----------|------------|
| T3.1 | 0.5 | 0.5 |
| T3.2 | 0.5 | 1.0 |
| T3.3 | 0.5 | 1.5 |
| T3.4 | 0.5 | 2.0 |
| T3.5 | 0.5 | 2.5 |
| T3.6 | 0 | 2.5 |
| T3.7 | 0 | 2.5 |
| T3.8 | 0 | 2.5 |
| T3.9 | 0 | 2.5 |
| T3.10 | 0 | 2.5 |
| T3.11 | 0.5 | 3.0 |
| T3.12 | 0.5 | 3.5 |
| **Total** | **3.5** | **3.5** |

**Note:** Slightly over budget (3.5 vs 3.0), but within acceptable range. Use Ask/Plan mode aggressively to stay under 4.0.

---

## Critical Success Factors

1. **Coordinate with Dev 1:** Most tasks depend on Dev 1's cartography stages. Check in at H+12, H+14, H+16, H+18.
2. **Start Independent Tasks Early:** T3.5 and T3.10 can start immediately. Don't wait.
3. **Use Ask Mode:** For quick questions and component scaffolding, use Ask mode (lowest Bobcoin cost).
4. **Test Incrementally:** Don't wait until T3.11 to test. Test each card variant as you build it.
5. **Document as You Go:** Export Bob sessions immediately after each task, not retrospectively.

---

## Phase 3 Gate Checklist (H+28)

- [ ] All four cartography card variants render real data
- [ ] Certification panel shows three questions with grading
- [ ] Auto-recovery banner appears and auto-dismisses
- [ ] All animations smooth and consistent
- [ ] Dashboard pixel-perfect at 1920×1080
- [ ] Three Bob sessions exported
- [ ] Five screenshots captured for slides
- [ ] Bobcoin spend ≤ 4.0 (target 3.0, max 4.0)

---

## Next Steps for You

1. **Review this plan** and ask any clarifying questions
2. **Check Dev 1's progress** on Stage 2 (T1.1) - if complete, start T3.1
3. **Start T3.5** (Auto-Recovery Banner) immediately - it's independent
4. **Start T3.10** (Replay Mode Polish) if Phase 2 T5.4 is complete
5. **Coordinate with team** at H+18 sync for status check

Let me know when you're ready to start, and I'll guide you through each task step-by-step!