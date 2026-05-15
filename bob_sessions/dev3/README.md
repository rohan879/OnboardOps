# Dev 3 - Frontend / Dashboard Sessions

**Developer:** Dev 3  
**Role:** Frontend / Dashboard Engineer  
**Primary Ownership:** Next.js dashboard, real-time UI, IBM design system integration

## Focus Areas

### Phase 1 (H+0 to H+2)
- Next.js application scaffolding
- IBM Design System integration (Carbon/Plex)
- Dashboard layout shell (4 regions)
- Stopwatch component
- WebSocket client hook
- Event stream component

### Phase 2 (H+2 to H+10)
- Real-time card emission animations
- Progress stepper component
- WebSocket reconnection logic
- State management with Zustand

### Phase 3 (H+10 to H+24)
- Certification panel UI
- Question/answer interface
- Real-time grading feedback
- Replay mode from JSON logs

### Phase 4 (H+24 to H+32)
- Dashboard polish and animations
- Responsive design refinements
- Performance optimization
- Accessibility improvements

## Session Exports

### Phase 1 Sessions
1. `01_nextjs-scaffold.md` - Creating Next.js app with TypeScript
2. `02_dependencies.md` - Installing supporting libraries
3. `03_ibm-design-tokens.md` - Applying IBM color palette and fonts
4. `04_layout-shell.md` - Building 4-region dashboard layout
5. `05_stopwatch-component.md` - Real-time timer implementation
6. `06_websocket-hook.md` - WebSocket client with reconnection
7. `07_event-stream.md` - Scrolling event list component
8. `08_build-verification.md` - Ensuring production build succeeds

### Phase 2+ Sessions
(To be added as development progresses)

## Key Deliverables

- `frontend/src/app/page.tsx` - Main dashboard page
- `frontend/src/components/Stopwatch.tsx` - Timer component
- `frontend/src/components/EventStream.tsx` - Real-time event list
- `frontend/src/components/CardStepper.tsx` - 4-card progress indicator
- `frontend/src/components/CertificationPanel.tsx` - Quiz interface
- `frontend/src/hooks/useEvents.ts` - WebSocket client hook
- `frontend/src/store/events.ts` - Zustand state management
- `frontend/tailwind.config.ts` - IBM design tokens

## Dashboard Regions

1. **Header** - Stopwatch (left), OnboardOps wordmark (center), user name (right)
2. **Main Panel** - Horizontal 4-card stepper showing cartography progress
3. **Right Sidebar** - Certification panel with questions and scoring
4. **Footer** - Event stream toggle and WebSocket connection indicator

## Design System

- **Colors:** IBM Blue (#0F62FE), IBM Gray (#161616), IBM Light (#F4F4F4)
- **Typography:** IBM Plex Sans (via Google Fonts)
- **Icons:** Lucide React
- **Animations:** Framer Motion for card emissions
- **Layout:** Tailwind CSS Grid

## Notes

- Dashboard must be usable at 1440×900 without horizontal scroll
- Stopwatch updates every 100ms for smooth animation
- WebSocket reconnects with exponential backoff (1s, 2s, 4s, 8s)
- Event stream shows newest events at top
- All components are memoized for performance