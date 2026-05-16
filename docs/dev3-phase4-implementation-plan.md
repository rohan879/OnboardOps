# Dev 3 Phase 4 Implementation Plan
# Frontend/Dashboard - Hardening & Polish

**Owner:** Dev 3  
**Phase Window:** H+28 to H+40 (12 hours wall-clock, ~10 effective hours)  
**Time Budget:** 600 minutes  
**Bobcoin Budget:** 2 coins  
**Mission:** Make the dashboard video-ready with pixel-perfect polish at 1080p

---

## Phase 4 Overview

Phase 4 is **NOT about building new features**. It's about making the existing dashboard:
1. **Bulletproof** - Works flawlessly across 5 consecutive E2E runs
2. **Video-ready** - Every frame looks perfect when paused in the final video
3. **Story-driven** - Key moments have visual emphasis for demo impact

### Key Principles:
- ✅ **Replay mode first** - Use replay for iteration (saves Bobcoins)
- ✅ **Live runs last** - Only 5 mandated live E2E runs
- ✅ **No new features** - Polish existing work only
- ✅ **Video-first thinking** - Every change optimized for 1080p video capture

---

## Task Breakdown (12 Tasks, 600 minutes)

### T3.1: Defect Triage From H+28 Sync (30 min, 0 BC)

**Objective:** Identify and prioritize dashboard defects from team sync.

**Steps:**
1. Review H+28 sync defect log (coordinate with Dev 5)
2. Filter for frontend/dashboard issues
3. Order by demo impact:
   - P0: Breaks demo flow (layout shift in first 10s)
   - P1: Visible in video (color mismatch, animation jank)
   - P2: Minor polish (footer alignment)
4. Create fix plan for top 3 defects

**Deliverable:** `docs/dev3-phase4-defects.md` with prioritized list

**Acceptance:** Top 3 dashboard defects have remediation plan with effort estimates

**Dependencies:** None

---

### T3.2: Final Spacing and Typography Pass (60 min, 0 BC)

**Objective:** Pixel-perfect alignment at 1920×1080 using IBM Design System.

**Steps:**
1. **Open dashboard at 1920×1080:**
   ```bash
   # Chrome DevTools
   F12 → Toggle device toolbar (Ctrl+Shift+M)
   Set: 1920×1080
   ```

2. **Check 8px grid alignment:**
   - Use browser pixel ruler extension
   - Every heading baseline on 8px grid
   - All padding/margin multiples of 8px

3. **Verify typography:**
   - IBM Plex Sans for UI text
   - Line height 1.5 for paragraphs
   - Font sizes from IBM scale (12, 14, 16, 20, 24, 32, 48)

4. **Color audit:**
   - All colors from IBM palette (no custom hex)
   - IBM Blue 60: #0F62FE
   - IBM Gray 100: #161616
   - IBM Green 50: #24A148
   - IBM Orange 40: #FF832B
   - IBM Red 50: #DA1E28

5. **Document deviations:**
   - Any off-grid elements (with justification)
   - Any custom colors (with rationale)

**Deliverable:** Side-by-side comparison screenshots showing IBM Carbon parity

**Acceptance:** No off-grid elements; all colors from IBM palette

**Dependencies:** T3.1

---

### T3.3: Animation Timing Refinement (60 min, 0 BC)

**Objective:** Slow animations for video viewers; add demo mode.

**Current Problem:** Animations play too fast for video viewers to parse.

**Solution:** Add `?demo=true` URL parameter with slower timings.

**Implementation:**

1. **Create demo mode hook:**
   ```typescript
   // frontend/src/hooks/useDemoMode.ts
   import { useSearchParams } from 'next/navigation';
   
   export function useDemoMode() {
     const searchParams = useSearchParams();
     const isDemoMode = searchParams.get('demo') === 'true';
     
     return {
       isDemoMode,
       animationMultiplier: isDemoMode ? 1.75 : 1.0,
     };
   }
   ```

2. **Update animation timings:**
   ```typescript
   // frontend/src/components/animations.ts
   // Add multiplier parameter to all animations
   
   export const getCardVariants = (multiplier = 1.0): Variants => ({
     'in-progress': {
       opacity: 1,
       scale: 1,
       transition: { duration: 0.35 * multiplier }, // 200ms → 350ms in demo
     },
     // ... other states
   });
   ```

3. **Apply to all animated components:**
   - CartographyCard: 200ms → 350ms
   - CertificationPanel grade fill: 400ms → 600ms
   - AutoRecoveryBanner dwell: 4s → 5s
   - DependencyGraph node animation: 300ms → 500ms

4. **Test both modes:**
   - Default: `http://localhost:3000` (fast, interactive)
   - Demo: `http://localhost:3000?demo=true` (slow, video-ready)

**Deliverable:** Demo mode working; slow-motion playback shows no jerky transitions

**Acceptance:** Replay at `?demo=true` feels paced for video

**Dependencies:** T3.2

---

### T3.4: Empty State and Idle State Polish (45 min, 0 BC)

**Objective:** Make idle states look intentional, not broken.

**Current Problem:** Dashboard is blank between launch and `/onboard` invocation.

**Solution:** Add centered waiting state with pulsing animation.

**Implementation:**

1. **Create IdleState component:**
   ```typescript
   // frontend/src/components/IdleState.tsx
   'use client';
   
   import { motion } from 'framer-motion';
   
   export function IdleState() {
     return (
       <motion.div
         className="flex flex-col items-center justify-center h-full"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 0.5 }}
       >
         <motion.div
           className="text-6xl font-bold text-ibm-blue-60 mb-4"
           animate={{ scale: [1, 1.05, 1] }}
           transition={{ duration: 2, repeat: Infinity }}
         >
           OnboardOps
         </motion.div>
         <p className="text-ibm-gray-70 text-lg">
           Waiting for onboarding to begin...
         </p>
         <motion.div
           className="mt-8 w-16 h-1 bg-ibm-blue-60 rounded-full"
           animate={{ scaleX: [0, 1, 0] }}
           transition={{ duration: 1.5, repeat: Infinity }}
         />
       </motion.div>
     );
   }
   ```

2. **Add to page.tsx:**
   ```typescript
   // Show IdleState when no events and session not started
   {!session.isActive && events.length === 0 && (
     <IdleState />
   )}
   ```

3. **Add between cartography stages:**
   - Show "Processing..." with pulsing dot
   - Prevent blank gaps

**Deliverable:** Idle state visible for 5+ seconds before `/onboard` starts

**Acceptance:** Idle state looks intentional and pleasant

**Dependencies:** T3.2

---

### T3.5: Story-Beat Visual Emphasis (60 min, 0 BC)

**Objective:** Add subtle visual cues at demo's key moments.

**Key Moments:**
1. Dependency graph completes → brief glow on card border
2. Certification passes → brief screen-edge highlight
3. PR opens → animated pointing arrow (fades after 2s)

**Implementation:**

1. **Dependency graph glow:**
   ```typescript
   // In CartographyCard.tsx
   {state === 'complete' && type === 'graph' && (
     <motion.div
       className="absolute inset-0 pointer-events-none rounded-lg"
       initial={{ boxShadow: '0 0 0px rgba(15, 98, 254, 0)' }}
       animate={{ boxShadow: [
         '0 0 0px rgba(15, 98, 254, 0)',
         '0 0 30px rgba(15, 98, 254, 0.4)',
         '0 0 0px rgba(15, 98, 254, 0)',
       ]}}
       transition={{ duration: 1.5 }}
     />
   )}
   ```

2. **Certification screen-edge highlight:**
   ```typescript
   // In CertificationPanel.tsx
   {allPassed && (
     <motion.div
       className="fixed inset-0 pointer-events-none"
       initial={{ opacity: 0 }}
       animate={{ opacity: [0, 0.3, 0] }}
       transition={{ duration: 2 }}
       style={{
         background: 'radial-gradient(circle at center, rgba(36, 161, 72, 0.2), transparent 70%)',
       }}
     />
   )}
   ```

3. **PR link pointing arrow:**
   ```typescript
   // In TranscriptPanel.tsx (when PR link appears)
   <motion.div
     className="absolute -right-8 top-1/2 -translate-y-1/2"
     initial={{ opacity: 0, x: -10 }}
     animate={{ opacity: [0, 1, 0], x: [0, 10, 10] }}
     transition={{ duration: 2, times: [0, 0.3, 1] }}
   >
     <svg className="w-6 h-6 text-ibm-blue-60" fill="currentColor">
       <path d="M8 0l8 8-8 8V0z" />
     </svg>
   </motion.div>
   ```

**Deliverable:** Three story-beat moments visually distinct on paused video frame

**Acceptance:** Each moment reads clearly in a screenshot

**Dependencies:** T3.3

---

### T3.6: Replay Mode UX Polish for Video Production (45 min, 0 BC)

**Objective:** Add controls for Dev 5's video recording sessions.

**Features:**
1. Presentation mode (hides controls/chrome)
2. Keyboard shortcuts
3. Start offset (skip first N seconds)

**Implementation:**

1. **Update replay page:**
   ```typescript
   // frontend/src/app/replay/page.tsx
   'use client';
   
   import { useState, useEffect } from 'react';
   import { useSearchParams } from 'next/navigation';
   
   export default function ReplayPage() {
     const searchParams = useSearchParams();
     const presentationMode = searchParams.get('presentation') === 'true';
     const startOffset = parseInt(searchParams.get('offset') || '0');
     
     const [isPaused, setIsPaused] = useState(false);
     const [currentIndex, setCurrentIndex] = useState(0);
     
     // Keyboard shortcuts
     useEffect(() => {
       const handleKeyPress = (e: KeyboardEvent) => {
         if (e.code === 'Space') {
           e.preventDefault();
           setIsPaused(p => !p);
         } else if (e.code === 'ArrowRight') {
           setCurrentIndex(i => i + 1);
         } else if (e.code === 'ArrowLeft') {
           setCurrentIndex(i => Math.max(0, i - 1));
         }
       };
       
       window.addEventListener('keydown', handleKeyPress);
       return () => window.removeEventListener('keydown', handleKeyPress);
     }, []);
     
     return (
       <div className={presentationMode ? 'presentation-mode' : ''}>
         {/* Dashboard with replay events */}
         {!presentationMode && (
           <div className="controls">
             <button onClick={() => setIsPaused(!isPaused)}>
               {isPaused ? 'Play' : 'Pause'}
             </button>
             <span>Event {currentIndex + 1}</span>
           </div>
         )}
       </div>
     );
   }
   ```

2. **Add presentation mode CSS:**
   ```css
   /* globals.css */
   .presentation-mode {
     /* Hide all chrome */
     .controls, .debug-panel, .event-stream {
       display: none !important;
     }
   }
   ```

**Deliverable:** Dev 5 can drive replay from keyboard during recording

**Acceptance:** Space = play/pause, arrows = navigate, presentation mode hides chrome

**Dependencies:** Phase 3 T3.10 (if completed) or create minimal replay page

---

### T3.7: Capture Screenshots and B-Roll for Slides (60 min, 0 BC)

**Objective:** Capture high-quality screenshots for Dev 5's slide deck.

**Screenshots Needed (8 total):**
1. Full dashboard mid-cartography
2. Dependency graph (zoomed)
3. Entry Points card (complete)
4. Hotspots card (complete)
5. Conventions card (complete)
6. Certification panel mid-grading
7. Certification panel post-success
8. Auto-recovery banner (success state)

**Process:**

1. **Setup replay session:**
   ```bash
   # Use recorded session from Phase 3
   cd frontend
   pnpm dev
   # Navigate to http://localhost:3000/replay?demo=true&presentation=true
   ```

2. **Capture method (Chrome DevTools):**
   ```
   F12 → Toggle device toolbar (Ctrl+Shift+M)
   Set: 1920×1080
   Click ⋮ menu → "Capture screenshot"
   ```

3. **Save to:**
   ```
   docs/screenshots/final/
   ├── 01-dashboard-mid-cartography.png
   ├── 02-dependency-graph-zoomed.png
   ├── 03-entry-points-complete.png
   ├── 04-hotspots-complete.png
   ├── 05-conventions-complete.png
   ├── 06-certification-mid-grading.png
   ├── 07-certification-success.png
   └── 08-auto-recovery-success.png
   ```

4. **Quality check:**
   - Exactly 1920×1080
   - No browser chrome
   - Colors accurate
   - Text crisp

**Deliverable:** 8 high-quality screenshots saved

**Acceptance:** Dev 5 confirms screenshots are slide-ready

**Dependencies:** T3.6

---

### T3.8: Cross-Browser Smoke Test (30 min, 0 BC)

**Objective:** Verify dashboard works in Chrome and Safari.

**Test Protocol:**

1. **Chrome (primary demo browser):**
   - Full E2E flow
   - Check animations
   - Verify layout

2. **Safari (backup):**
   - Load dashboard
   - Check for rendering differences
   - Note any layout breaks

3. **Common issues to check:**
   - CSS Grid support
   - Flexbox behavior
   - Animation performance
   - WebSocket connection

4. **Fix critical issues only:**
   - Anything that breaks demo flow
   - Layout-breaking defects
   - Non-functional animations

**Deliverable:** Test report documenting any differences

**Acceptance:** Both browsers render without layout-breaking defects

**Dependencies:** T3.5

---

### T3.9: Live Demo Support and Polish Iteration (90 min, 1 BC)

**Objective:** Watch live E2E runs and fix visual issues in real-time.

**Process:**

1. **During Dev 1's live runs #1-#5:**
   - Watch dashboard closely
   - Note any visual glitches
   - Screenshot issues immediately

2. **Between runs:**
   - Fix one specific issue
   - Test fix in replay mode
   - Commit and deploy

3. **Target improvements:**
   - Animation timing tweaks
   - Layout shift fixes
   - Color contrast improvements

4. **Track progress:**
   - Run #1: Baseline (expect 3-5 issues)
   - Run #2: Fix top 2 issues
   - Run #3: Fix next 2 issues
   - Run #4: Polish pass
   - Run #5: Final verification

**Deliverable:** At least 3 visual polish improvements committed between runs

**Acceptance:** Run #5 has visibly fewer issues than Run #1

**Dependencies:** Dev 1 T1.7 (first live run)

---

### T3.10: Final Accessibility Check (30 min, 0 BC)

**Objective:** Ensure basic accessibility compliance.

**Steps:**

1. **Run Lighthouse audit:**
   ```bash
   # Chrome DevTools
   F12 → Lighthouse tab
   Select: Accessibility
   Click: Generate report
   ```

2. **Fix AAA color contrast issues:**
   - Check all text/background combinations
   - Use WebAIM contrast checker
   - Target: 7:1 for normal text, 4.5:1 for large text

3. **Add focus indicators:**
   ```css
   /* globals.css */
   button:focus-visible,
   a:focus-visible,
   input:focus-visible {
     outline: 2px solid #0F62FE;
     outline-offset: 2px;
   }
   ```

4. **Test keyboard navigation:**
   - Tab through all interactive elements
   - Verify focus order makes sense
   - Ensure all actions keyboard-accessible

**Deliverable:** Lighthouse accessibility score ≥ 90

**Acceptance:** No AAA color contrast failures; focus indicators present

**Dependencies:** T3.2

---

### T3.11: Bob Session Export (30 min, 0 BC)

**Objective:** Export 3 representative Bob sessions from Phase 4 work.

**Sessions to Export:**

1. **Session 1: T3.2 (Spacing/Typography Pass)**
   - Shows attention to design system
   - Demonstrates pixel-perfect thinking

2. **Session 2: T3.5 (Story-Beat Emphasis)**
   - Shows creative problem-solving
   - Demonstrates video-first thinking

3. **Session 3: T3.9 (Live Demo Polish)**
   - Shows debugging process
   - Demonstrates iterative improvement

**Export Process:**

1. In Bob IDE:
   - Open task/conversation
   - Click "Export" → Markdown
   - Save to `bob_sessions/dev3/`

2. Naming:
   ```
   bob_sessions/dev3/
   ├── 19_phase4-spacing-typography.md
   ├── 20_phase4-story-beat-emphasis.md
   └── 21_phase4-live-demo-polish.md
   ```

3. Add screenshots of Bob IDE showing each session

**Deliverable:** 3 sessions exported with screenshots

**Acceptance:** Each session has narrative foreword explaining purpose

**Dependencies:** T3.9

---

### T3.12: Buffer (60 min, 1 BC)

**Objective:** Reserve time for late polish requests and unexpected issues.

**Use Cases:**
- Dev 5 requests specific screenshot re-takes
- Last-minute animation tweaks
- Integration issues with other devs' work
- Emergency bug fixes

**Guidelines:**
- Don't start new features
- Focus on demo-critical fixes only
- Coordinate with Dev 5 for video needs

**Deliverable:** No outstanding visual issues at H+40

**Acceptance:** Dashboard is video-ready and demo-stable

**Dependencies:** None

---

## Bobcoin Budget Tracking

| Task | Time | Bobcoins | Cumulative |
|------|------|----------|------------|
| T3.1 | 30 min | 0 | 0 |
| T3.2 | 60 min | 0 | 0 |
| T3.3 | 60 min | 0 | 0 |
| T3.4 | 45 min | 0 | 0 |
| T3.5 | 60 min | 0 | 0 |
| T3.6 | 45 min | 0 | 0 |
| T3.7 | 60 min | 0 | 0 |
| T3.8 | 30 min | 0 | 0 |
| T3.9 | 90 min | 1 | 1 |
| T3.10 | 30 min | 0 | 1 |
| T3.11 | 30 min | 0 | 1 |
| T3.12 | 60 min | 1 | 2 |
| **Total** | **600 min** | **2** | **2/2** |

**Phase 3 Cumulative:** 8 Bobcoins  
**Phase 4 Target:** 2 Bobcoins  
**Phase 4 Cumulative:** 10 Bobcoins  
**Personal Cap:** 40 Bobcoins  
**Remaining for P5-P6:** 30 Bobcoins ✅

---

## Critical Success Factors

### ✅ DO:
- Use replay mode for all iteration (saves Bobcoins)
- Make every change video-first (1080p paused frame test)
- Fix demo-critical issues only
- Coordinate with Dev 5 for video needs
- Test in both Chrome and Safari

### ❌ DON'T:
- Add new features (Phase 4 is hardening only)
- Refactor working code
- Skip preflight before live runs
- Burn Bobcoins on iteration
- Work without sleep

---

## Dependencies on Other Devs

| Task | Depends On | Artifact Needed |
|------|------------|-----------------|
| T3.1 | Dev 5 T5.1 | H+28 defect log |
| T3.7 | Dev 5 T5.3 | Shot list for screenshots |
| T3.9 | Dev 1 T1.7 | Live E2E runs #1-#5 |

---

## Deliverables Checklist

- [ ] T3.1: Defect triage document
- [ ] T3.2: Spacing/typography audit complete
- [ ] T3.3: Demo mode implemented (`?demo=true`)
- [ ] T3.4: Idle state component added
- [ ] T3.5: Story-beat visual emphasis added
- [ ] T3.6: Replay mode keyboard controls
- [ ] T3.7: 8 screenshots captured at 1920×1080
- [ ] T3.8: Cross-browser test report
- [ ] T3.9: 3+ polish improvements committed
- [ ] T3.10: Lighthouse score ≥ 90
- [ ] T3.11: 3 Bob sessions exported
- [ ] T3.12: Buffer time used effectively

---

## Phase 4 Gate Contribution

Dev 3 contributes to these gates:

**G4.1 - Five Consecutive E2E Runs:**
- Dashboard must render correctly in all 5 runs
- No visual defects that break demo flow

**G4.4 - Rough Video Cut Exists:**
- Provide 8 high-quality screenshots for slides

**G4.6 - bob_sessions/ Curated:**
- Export 3 Phase 4 sessions with narratives

**G4.8 - Cover Image, README, Architecture Diagram:**
- Provide dashboard screenshots for README

---

## Next Steps

1. **Immediately after Phase 3 completion:**
   - Review this plan
   - Coordinate with Dev 5 on H+28 sync timing
   - Prepare demo machine for live runs

2. **H+28 (Phase 4 Start):**
   - Attend H+28 sync
   - Execute T3.1 (defect triage)
   - Begin T3.2 (spacing/typography)

3. **H+34 (Mid-Phase Sync):**
   - Report progress on polish improvements
   - Coordinate with Dev 5 on screenshot needs

4. **H+40 (Phase 4 Gate):**
   - Verify all deliverables complete
   - Hand off screenshots to Dev 5
   - Prepare for Phase 5 support role

---

**Last Updated:** 2026-05-16  
**Status:** Ready for execution  
**Owner:** Dev 3 (Frontend/Dashboard)  
**Phase:** 4 (Hardening & Polish)