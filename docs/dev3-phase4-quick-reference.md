# Dev 3 Phase 4 Quick Reference

## 🎯 Mission
Make dashboard **video-ready** with pixel-perfect polish at 1080p.

## ⏱️ Time Budget
600 minutes (10 hours) | 2 Bobcoins

## 🚫 Phase 4 Rules
- ❌ NO new features
- ❌ NO refactoring working code
- ✅ Polish existing work only
- ✅ Use replay mode for iteration
- ✅ Live runs only for mandated E2E tests

## 📋 Task Checklist

### Automated Tasks (Can be done now)
- [ ] T3.2: Spacing/Typography Pass (60 min)
- [ ] T3.3: Animation Timing + Demo Mode (60 min)
- [ ] T3.4: Idle State Component (45 min)
- [ ] T3.5: Story-Beat Visual Emphasis (60 min)
- [ ] T3.6: Replay Mode UX Polish (45 min)
- [ ] T3.10: Accessibility Check (30 min)

### Manual/Coordination Tasks
- [ ] T3.1: Defect Triage (needs H+28 sync)
- [ ] T3.7: Screenshot Capture (needs replay session)
- [ ] T3.8: Cross-Browser Test (manual testing)
- [ ] T3.9: Live Demo Support (during E2E runs)
- [ ] T3.11: Bob Session Export (after work complete)
- [ ] T3.12: Buffer (as needed)

## 🎨 Key Deliverables

### Code Changes
1. **Demo mode** (`?demo=true`) - slower animations for video
2. **Idle state** - centered waiting screen
3. **Story-beat emphasis** - visual cues at key moments
4. **Replay controls** - keyboard shortcuts for video production
5. **Accessibility** - focus indicators, contrast fixes

### Assets
1. **8 screenshots** at 1920×1080 for slides
2. **3 Bob sessions** exported with narratives
3. **Test reports** for cross-browser and accessibility

## 🎬 Demo Mode Features

```typescript
// URL: http://localhost:3000?demo=true

// Slower animations:
- Card emission: 200ms → 350ms
- Grade fill: 400ms → 600ms
- Recovery banner: 4s → 5s
- Graph nodes: 300ms → 500ms

// Keyboard shortcuts (replay mode):
- Space: Play/Pause
- →: Next event
- ←: Previous event
- ?presentation=true: Hide chrome
```

## 📐 Design System Checklist

### 8px Grid
- All padding/margin: multiples of 8px
- Heading baselines: on 8px grid
- Use browser pixel ruler to verify

### IBM Colors
- Blue 60: `#0F62FE`
- Gray 100: `#161616`
- Green 50: `#24A148`
- Orange 40: `#FF832B`
- Red 50: `#DA1E28`

### Typography
- Font: IBM Plex Sans
- Line height: 1.5 for paragraphs
- Sizes: 12, 14, 16, 20, 24, 32, 48

## 🎯 Story-Beat Moments

1. **Dependency graph completes**
   - Brief glow on card border
   - Duration: 1.5s

2. **Certification passes**
   - Screen-edge green highlight
   - Duration: 2s

3. **PR opens**
   - Animated pointing arrow
   - Fades after 2s

## 📸 Screenshot List

1. Dashboard mid-cartography
2. Dependency graph (zoomed)
3. Entry Points card
4. Hotspots card
5. Conventions card
6. Certification mid-grading
7. Certification success
8. Auto-recovery banner

## 🔧 Quick Commands

```bash
# Start dev server
cd frontend && pnpm dev

# Open at 1080p
# Chrome DevTools: F12 → Device toolbar → 1920×1080

# Demo mode
http://localhost:3000?demo=true

# Replay mode
http://localhost:3000/replay?demo=true&presentation=true

# Lighthouse audit
# DevTools → Lighthouse → Accessibility

# Screenshot capture
# DevTools → ⋮ → Capture screenshot
```

## 🎓 Bobcoin Economy

| Phase | Spent | Remaining |
|-------|-------|-----------|
| P1-P3 | 8 | 32 |
| P4 Target | 2 | 30 |
| P5-P6 Reserve | - | 30 ✅ |

**Status:** Healthy headroom for final phases

## 🚨 Critical Dependencies

- **T3.1:** Needs H+28 sync defect log (Dev 5)
- **T3.7:** Needs shot list (Dev 5 T5.3)
- **T3.9:** Needs live E2E runs (Dev 1 T1.7)

## ✅ Phase 4 Gate Contributions

- **G4.1:** Dashboard works in 5 consecutive runs
- **G4.4:** Provide 8 screenshots for video
- **G4.6:** Export 3 curated Bob sessions
- **G4.8:** Provide dashboard screenshots for README

## 📝 Notes

- Most work happens in **replay mode** (saves Bobcoins)
- Only 2 Bobcoins for live demo support (T3.9, T3.12)
- Focus on **video-readiness** over interactive polish
- Every change should improve demo reliability or visual clarity