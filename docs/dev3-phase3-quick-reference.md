# Dev 3 Phase 3 Quick Reference
## OnboardOps Frontend - Essential Info

---

## Task Execution Order

### 🟢 **Start Immediately (Independent Tasks)**
1. **T3.5** - Auto-Recovery Banner (60 min, 0.5 BC)
2. **T3.10** - Replay Mode Polish (45 min, 0 BC)

### 🟡 **Wait for Dev 1 (Staircase Pattern)**
- **H+12:** T3.1 - Entry Points Card (needs Dev 1 T1.1)
- **H+14:** T3.2 - Hotspots Card (needs Dev 1 T1.2)
- **H+16:** T3.3 - Conventions Card (needs Dev 1 T1.3)
- **H+18:** T3.4 - Certification Panel (needs Dev 1 T1.4)

### 🔵 **Polish Phase (Sequential)**
- **H+18-20:** T3.6 - Card Animation Polish
- **H+18-20:** T3.7 - Certification Animation Polish
- **H+20-22:** T3.8 - 1080p Lockdown
- **H+20-22:** T3.9 - Final Visual Pass

### 🟣 **Testing & Documentation**
- **H+22-26:** T3.11 - End-to-End Visual Test
- **H+26-28:** T3.12 - Session Export + Screenshots

---

## File Structure

```
frontend/src/
├── components/
│   ├── cards/
│   │   ├── EntryPointsCard.tsx      (T3.1 - NEW)
│   │   ├── HotspotsCard.tsx         (T3.2 - NEW)
│   │   └── ConventionsCard.tsx      (T3.3 - NEW)
│   ├── CertificationPanel.tsx       (T3.4 - NEW)
│   ├── AutoRecoveryBanner.tsx       (T3.5 - NEW)
│   ├── CartographyCard.tsx          (Phase 2 - EXISTS)
│   ├── DependencyGraph.tsx          (Phase 2 - EXISTS)
│   └── ...
├── lib/
│   └── animations.ts                (T3.6 - NEW)
├── app/
│   ├── page.tsx                     (UPDATE throughout)
│   └── replay/
│       └── page.tsx                 (T3.10 - NEW or UPDATE)
└── store/
    └── events.ts                    (UPDATE as needed)
```

---

## Key TypeScript Interfaces

### Entry Points (T3.1)
```typescript
interface EntryPoint {
  type: 'http' | 'cli' | 'job';
  name: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path?: string;
  description?: string;
}
```

### Hotspots (T3.2)
```typescript
interface Hotspot {
  path: string;
  churnCount: number;
  topAuthor: { name: string; email: string; avatar?: string };
  lastPR: { url: string; title: string; date: string };
  rationale: string;
  commitFrequency: number[]; // 12 buckets for sparkline
}
```

### Conventions (T3.3)
```typescript
interface Convention {
  name: string;
  pattern: string;
  evidence: { file: string; lineNumber: number; snippet: string };
}
```

### Certification (T3.4)
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

### Auto-Recovery (T3.5)
```typescript
interface RecoveryEvent {
  pattern: 'port-in-use' | 'node-version' | 'missing-venv' | 'missing-seed' | 'db-not-running';
  action: string;
  details: string;
  status: 'in-progress' | 'success' | 'failed';
}
```

---

## IBM Design System Colors

```typescript
// Primary
'ibm-blue-60': '#0F62FE'    // Primary actions, links
'ibm-gray-100': '#161616'   // Body text
'ibm-gray-70': '#525252'    // Secondary text

// Status
'ibm-green-50': '#24A148'   // Success, pass
'ibm-red-50': '#DA1E28'     // Error, fail
'ibm-orange-40': '#FF832B'  // Warning, partial

// Card Types
'ibm-purple-50': '#8A3FFC'  // Entry points
'ibm-teal-50': '#009D9A'    // Conventions

// Backgrounds
'ibm-gray-10': '#F4F4F4'    // Light background
'ibm-gray-20': '#E0E0E0'    // Borders
```

---

## HTTP Method Colors (T3.1)

```typescript
const methodColors = {
  GET: 'text-green-600 bg-green-50',
  POST: 'text-blue-600 bg-blue-50',
  PUT: 'text-yellow-600 bg-yellow-50',
  DELETE: 'text-red-600 bg-red-50',
  PATCH: 'text-purple-600 bg-purple-50',
};
```

---

## Animation Variants (T3.6)

```typescript
// Shared card variants
export const cardVariants = {
  pending: { 
    opacity: 0.6, 
    scale: 0.98,
    transition: { duration: 0.2 }
  },
  'in-progress': { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  complete: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  error: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
};

// Grade animations (T3.7)
export const gradeVariants = {
  pass: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.5 }
  },
  partial: {
    y: [0, -5, 0],
    transition: { duration: 0.4 }
  },
  fail: {
    x: [-5, 5, -5, 5, 0],
    transition: { duration: 0.3 }
  },
};
```

---

## Spacing System (8px Grid)

```typescript
// Component padding
'p-4'  // 16px - tight
'p-6'  // 24px - standard
'p-8'  // 32px - spacious

// Section gaps
'gap-4'  // 16px - tight
'gap-6'  // 24px - standard
'gap-8'  // 32px - spacious

// Margins
'mb-3'  // 12px - small
'mb-4'  // 16px - standard
'mb-6'  // 24px - large
```

---

## Typography Scale

```typescript
// Headings
'text-2xl font-bold'  // 24px - Page title
'text-xl font-bold'   // 20px - Section heading
'text-lg font-semibold' // 18px - Card title

// Body
'text-base'  // 16px - Standard body
'text-sm'    // 14px - Secondary text
'text-xs'    // 12px - Labels, captions

// Fonts
'font-sans'  // IBM Plex Sans (default)
'font-serif' // IBM Plex Serif (certification questions only)
'font-mono'  // IBM Plex Mono (code)
```

---

## WebSocket Event Types (Phase 3)

```typescript
// Existing (Phase 2)
'session_start'
'session_end'
'turn_start'
'turn_end'
'tool_call'
'card_emit'

// New (Phase 3)
'question_ask'           // T3.4 - Certification question
'certification_grade'    // T3.4 - Grade result
'bootstrap_recovery'     // T3.5 - Auto-recovery event
```

---

## Dependencies npm Packages

### Already Installed (Phase 2)
- `framer-motion` - Animations
- `lucide-react` - Icons
- `zustand` - State management
- `react-force-graph-2d` - Dependency graph

### Need to Install (Phase 3)
```bash
# T3.3 - Syntax highlighting
npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter

# T3.7 - Confetti (optional)
npm install react-confetti

# T3.10 - Screenshot capture
npm install html2canvas
```

---

## Bobcoin Budget Tracking

| Phase | Target | Actual | Remaining |
|-------|--------|--------|-----------|
| Phase 1 | 0 | 0 | 40 |
| Phase 2 | 5 | 4 | 36 |
| Phase 3 | 3 | TBD | 33 (target) |
| Phase 4-6 | - | - | 33 (buffer) |

**Phase 3 Task Costs:**
- T3.1-T3.5: 0.5 BC each = 2.5 BC
- T3.6-T3.10: 0 BC each = 0 BC
- T3.11-T3.12: 0.5 BC each = 1.0 BC
- **Total: 3.5 BC** (slightly over, use Ask mode to compensate)

---

## Bob Mode Selection

| Task | Recommended Mode | Reason |
|------|------------------|--------|
| T3.1-T3.3 | **Code** | Component scaffolding (1-2 files) |
| T3.4 | **Code** | Complex component with state |
| T3.5 | **Code** | Animation-heavy component |
| T3.6-T3.7 | **Ask** | Quick animation tweaks |
| T3.8-T3.9 | **Ask** | CSS/config changes |
| T3.10 | **Code** | New route with features |
| T3.11 | **Plan** | Testing strategy |
| T3.12 | **Ask** | Documentation |

---

## Testing Checklist

### Per-Component Testing
- [ ] Component renders with sample data
- [ ] Component renders with real WebSocket data
- [ ] Animations play smoothly
- [ ] Colors match IBM Design System
- [ ] Typography uses correct fonts
- [ ] Spacing follows 8px grid
- [ ] Responsive at 1920×1080

### Integration Testing (T3.11)
- [ ] All four cards render in sequence
- [ ] Stepper updates in lockstep
- [ ] Certification panel shows questions
- [ ] Auto-recovery banner appears
- [ ] Bobcoin meter updates correctly
- [ ] Transcript panel scrolls
- [ ] No layout shifts
- [ ] No console errors

---

## Common Pitfalls to Avoid

1. **Don't start card variants before Dev 1 completes stages**
   - Check Dev 1's progress before starting T3.1-T3.4
   
2. **Don't use Advanced mode for simple tasks**
   - Use Ask for questions, Plan for strategy, Code for implementation
   
3. **Don't skip incremental testing**
   - Test each component as you build it, not at the end
   
4. **Don't forget to export Bob sessions**
   - Export immediately after each task, not retrospectively
   
5. **Don't over-animate**
   - Keep animations subtle and professional (IBM aesthetic)
   
6. **Don't break the 8px grid**
   - All spacing must be multiples of 8px
   
7. **Don't add mobile responsiveness**
   - Desktop-only (1920×1080) for this hackathon

---

## Quick Commands

```bash
# Start frontend dev server
cd frontend && npm run dev

# Start backend (for WebSocket testing)
cd backend && python -m uvicorn app:app --reload --port 8765

# Install new dependencies
cd frontend && npm install <package>

# Type check
cd frontend && npm run type-check

# Build for production
cd frontend && npm run build

# Reset demo machine (coordinate with Dev 4)
./scripts/reset-demo-machine.sh
```

---

## Phase 3 Syncs

### H+18 Sync (Midpoint - 20 min)
- Live cartography demo
- Per-dev status (90 sec each)
- Scope decision (cut stretch items if needed)
- Handoff if rotating shifts

### H+22 Sync (Integration - 15 min)
- Full E2E demo run
- Defect log (prioritize top 3)
- Phase 4 lock

### H+28 Sync (Gate - 30 min)
- Cold-start E2E demo
- Gate review (G3.1-G3.8)
- Defect log
- Phase 4 scope confirmation

---

## Emergency Contacts

- **Dev 1 (Bob Architect):** Cartography stages, certification skill
- **Dev 2 (Backend/MCP):** WebSocket events, tool data
- **Dev 4 (Infra):** Bootstrap recovery, demo machine
- **Dev 5 (Integration):** Session reports, slide deck

---

## Success Metrics

- [ ] All 12 tasks complete by H+28
- [ ] Bobcoin spend ≤ 4.0 (target 3.0)
- [ ] Dashboard pixel-perfect at 1920×1080
- [ ] Three Bob sessions exported
- [ ] Five screenshots captured
- [ ] Zero critical visual defects
- [ ] E2E run completes in < 12 minutes

---

**Last Updated:** Phase 3 Start (H+10)  
**Next Review:** H+18 Sync