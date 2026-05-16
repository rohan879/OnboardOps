# Dev 3 (Frontend/Dashboard) - Phase 1 Implementation Plan

**Role:** Frontend / Dashboard Developer  
**Time Budget:** 105 minutes + 15-minute buffer  
**Total Tasks:** 9 (T3.1 through T3.9)  
**Primary Focus:** Next.js dashboard, real-time UI, IBM design system

---

## Overview

As Dev 3, you are responsible for building the OnboardOps dashboard frontend. This is the real-time interface that displays:
- A stopwatch showing onboarding session duration
- A 4-card stepper showing progress through the onboarding stages
- A certification panel for the Socratic quiz
- An event stream showing live backend activity

**Key Dependencies:**
- **T3.2 depends on Dev 1's T1.3** (directory skeleton must exist)
- **T3.7 soft-depends on Dev 2's T2.4** (backend WebSocket endpoint)

---

## Task Breakdown with Implementation Steps

### ✅ T3.1: Verify Local Node Environment (5 min)

**Objective:** Confirm your development environment is ready.

**Acceptance Criteria:**
- Node version 20+ confirmed
- pnpm or npm available
- OS noted for portability checks

**Manual Steps:**

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Expected: `v20.x.x` or higher

2. **Check package manager:**
   ```bash
   # If using pnpm (recommended)
   pnpm --version
   
   # Or if using npm
   npm --version
   ```

3. **Verify Git access:**
   ```bash
   git --version
   ```

4. **Document your environment:**
   Create a personal note with:
   - Node version
   - Package manager (pnpm/npm) and version
   - Operating System (macOS/Linux/Windows)
   - Any relevant system details

**Troubleshooting:**
- If Node < 20, install via [nvm](https://github.com/nvm-sh/nvm) or [official installer](https://nodejs.org/)
- If pnpm not installed: `npm install -g pnpm`

**Time Check:** Should complete in ~5 minutes

---

### ⏳ T3.2: Scaffold the Next.js Application (10 min)

**Objective:** Create the Next.js application structure.

**Dependencies:** 
- ⚠️ **WAIT for Dev 1 to complete T1.3** (directory skeleton)
- Repository must be cloned locally

**Acceptance Criteria:**
- `pnpm dev` in `frontend/` serves on localhost:3000
- Default Next.js page visible

**Manual Steps:**

1. **Wait for Dev 1's notification** that T1.3 is complete and repository URL is shared

2. **Clone the repository:**
   ```bash
   cd ~/Desktop  # or your preferred location
   git clone <repository-url>
   cd onboardops
   ```

3. **Verify directory skeleton exists:**
   ```bash
   ls -la
   # Should see: .bob/, backend/, frontend/, scripts/, docs/, etc.
   ```

4. **Create the Next.js application:**
   ```bash
   pnpm create next-app@latest frontend \
     --typescript \
     --tailwind \
     --app \
     --eslint \
     --src-dir \
     --import-alias "@/*"
   ```
   
   **Interactive prompts - Select:**
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - `src/` directory: Yes
   - App Router: Yes
   - Import alias: Yes (default `@/*`)

5. **Test the development server:**
   ```bash
   cd frontend
   pnpm dev
   ```
   
6. **Verify in browser:**
   - Open http://localhost:3000
   - Should see default Next.js welcome page

7. **Commit the scaffold:**
   ```bash
   git add frontend/
   git commit -m "feat(frontend): scaffold Next.js application (T3.2)"
   git push origin main
   ```

**Troubleshooting:**
- If port 3000 is in use: `lsof -ti:3000 | xargs kill -9`
- If pnpm fails: try `npx create-next-app@latest` instead

**Time Check:** Should complete in ~10 minutes

---

### 📦 T3.3: Install Supporting Dependencies (10 min)

**Objective:** Add all required npm packages for the dashboard.

**Dependencies:** T3.2 must be complete

**Acceptance Criteria:**
- All dependencies installed
- `pnpm build` passes with no warnings

**Manual Steps:**

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm add react-use-websocket zustand framer-motion lucide-react date-fns
   ```

   **Package purposes:**
   - `react-use-websocket`: WebSocket client for real-time events
   - `zustand`: Lightweight state management
   - `framer-motion`: Animations for card emissions
   - `lucide-react`: Icon library
   - `date-fns`: Date/time utilities for stopwatch

3. **Verify installation:**
   ```bash
   pnpm list react-use-websocket zustand framer-motion lucide-react date-fns
   ```

4. **Test build:**
   ```bash
   pnpm build
   ```
   Expected: Build completes successfully with no warnings

5. **Verify dev server still works:**
   ```bash
   pnpm dev
   ```
   Check http://localhost:3000 still loads

6. **Commit the dependencies:**
   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "feat(frontend): add supporting dependencies (T3.3)"
   git push origin main
   ```

**Troubleshooting:**
- If build fails: Check for TypeScript errors with `pnpm tsc --noEmit`
- If peer dependency warnings: Usually safe to ignore in development

**Time Check:** Should complete in ~10 minutes

---

### 🎨 T3.4: Apply IBM Design Tokens (15 min)

**Objective:** Configure Tailwind with IBM Design System colors and typography.

**Dependencies:** T3.2 must be complete

**Acceptance Criteria:**
- Default page renders in IBM Plex Sans
- IBM Blue heading visible

**Manual Steps:**

1. **Edit Tailwind configuration:**
   ```bash
   # Open in your editor
   code frontend/tailwind.config.ts
   ```

2. **Add IBM color palette to `tailwind.config.ts`:**
   ```typescript
   import type { Config } from "tailwindcss";

   const config: Config = {
     content: [
       "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: {
       extend: {
         colors: {
           background: "var(--background)",
           foreground: "var(--foreground)",
           // IBM Design System colors
           'ibm-blue-60': '#0F62FE',
           'ibm-blue-70': '#0043CE',
           'ibm-gray-10': '#F4F4F4',
           'ibm-gray-100': '#161616',
           'ibm-gray-70': '#525252',
           'ibm-green-50': '#24A148',
           'ibm-red-50': '#DA1E28',
           'ibm-purple-50': '#8A3FFC',
           'ibm-orange-40': '#FF832B',
         },
       },
     },
     plugins: [],
   };
   export default config;
   ```

3. **Load IBM Plex Sans font:**
   ```bash
   # Open the root layout
   code frontend/src/app/layout.tsx
   ```

4. **Update `layout.tsx` with IBM Plex Sans:**
   ```typescript
   import type { Metadata } from "next";
   import { IBM_Plex_Sans } from "next/font/google";
   import "./globals.css";

   const ibmPlexSans = IBM_Plex_Sans({
     weight: ['400', '500', '600', '700'],
     subsets: ["latin"],
     variable: '--font-ibm-plex-sans',
   });

   export const metadata: Metadata = {
     title: "OnboardOps Dashboard",
     description: "The 10-Minute Repo Whisperer",
   };

   export default function RootLayout({
     children,
   }: Readonly<{
     children: React.ReactNode;
   }>) {
     return (
       <html lang="en">
         <body
           className={`${ibmPlexSans.variable} font-sans antialiased bg-white text-ibm-gray-100`}
         >
           {children}
         </body>
       </html>
     );
   }
   ```

5. **Update globals.css:**
   ```bash
   code frontend/src/app/globals.css
   ```
   
   Add at the top:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     :root {
       --font-ibm-plex-sans: 'IBM Plex Sans', sans-serif;
     }
     
     body {
       font-family: var(--font-ibm-plex-sans);
     }
   }
   ```

6. **Test the styling:**
   ```bash
   # Update page.tsx to test IBM colors
   code frontend/src/app/page.tsx
   ```
   
   Replace content with:
   ```typescript
   export default function Home() {
     return (
       <main className="flex min-h-screen flex-col items-center justify-center p-24">
         <h1 className="text-4xl font-bold text-ibm-blue-60 mb-4">
           OnboardOps Dashboard
         </h1>
         <p className="text-ibm-gray-70">
           The 10-Minute Repo Whisperer
         </p>
       </main>
     );
   }
   ```

7. **Verify in browser:**
   ```bash
   pnpm dev
   ```
   - Open http://localhost:3000
   - Should see IBM Blue heading in IBM Plex Sans font

8. **Commit the design tokens:**
   ```bash
   git add frontend/tailwind.config.ts frontend/src/app/layout.tsx frontend/src/app/globals.css frontend/src/app/page.tsx
   git commit -m "feat(frontend): apply IBM design tokens (T3.4)"
   git push origin main
   ```

**Time Check:** Should complete in ~15 minutes

---

### 🏗️ T3.5: Build the Dashboard Layout Shell (20 min)

**Objective:** Create the four-region dashboard layout structure.

**Dependencies:** T3.4 must be complete

**Acceptance Criteria:**
- Page renders all four regions at 1440×900
- No horizontal overflow
- Visible on screenshot

**Layout Regions:**
1. **Header:** Stopwatch (left), wordmark (center), user name (right)
2. **Main Panel:** Horizontal 4-card stepper with placeholder cards
3. **Right Sidebar:** Certification panel placeholder
4. **Footer:** Event stream toggle

**Manual Steps:**

1. **Create the main page layout:**
   ```bash
   code frontend/src/app/page.tsx
   ```

2. **Implement the dashboard layout:**
   ```typescript
   export default function Home() {
     return (
       <div className="min-h-screen bg-white flex flex-col">
         {/* Header */}
         <header className="border-b border-ibm-gray-10 px-6 py-4">
           <div className="max-w-[1440px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="text-2xl font-mono text-ibm-gray-100">
                 00:00.0
               </div>
             </div>
             <div className="text-2xl font-bold text-ibm-blue-60">
               OnboardOps
             </div>
             <div className="text-sm text-ibm-gray-70">
               Dev 3
             </div>
           </div>
         </header>

         {/* Main Content Area */}
         <div className="flex-1 flex max-w-[1440px] mx-auto w-full">
           {/* Main Panel - 4-card stepper */}
           <main className="flex-1 p-6">
             <div className="grid grid-cols-4 gap-4 mb-6">
               {[1, 2, 3, 4].map((step) => (
                 <div
                   key={step}
                   className="bg-ibm-gray-10 rounded-lg p-6 border-2 border-transparent hover:border-ibm-blue-60 transition-colors"
                 >
                   <div className="text-sm font-semibold text-ibm-gray-70 mb-2">
                     Step {step}
                   </div>
                   <div className="text-xs text-ibm-gray-70">
                     Placeholder card
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="bg-ibm-gray-10 rounded-lg p-6">
               <h2 className="text-lg font-semibold text-ibm-gray-100 mb-2">
                 Main Content Area
               </h2>
               <p className="text-sm text-ibm-gray-70">
                 This area will display onboarding progress and insights.
               </p>
             </div>
           </main>

           {/* Right Sidebar - Certification Panel */}
           <aside className="w-80 border-l border-ibm-gray-10 p-6">
             <h2 className="text-lg font-semibold text-ibm-gray-100 mb-4">
               Certification
             </h2>
             <div className="bg-ibm-gray-10 rounded-lg p-4">
               <p className="text-sm text-ibm-gray-70">
                 Socratic quiz panel placeholder
               </p>
             </div>
           </aside>
         </div>

         {/* Footer - Event Stream Toggle */}
         <footer className="border-t border-ibm-gray-10 px-6 py-3">
           <div className="max-w-[1440px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-ibm-gray-70"></div>
               <span className="text-xs text-ibm-gray-70">Event Stream</span>
             </div>
             <button className="text-xs text-ibm-blue-60 hover:underline">
               Toggle Stream
             </button>
           </div>
         </footer>
       </div>
     );
   }
   ```

3. **Test at 1440×900 resolution:**
   ```bash
   pnpm dev
   ```
   - Open http://localhost:3000
   - Open browser DevTools (F12)
   - Set viewport to 1440×900
   - Verify no horizontal scroll
   - Take a screenshot for documentation

4. **Commit the layout:**
   ```bash
   git add frontend/src/app/page.tsx
   git commit -m "feat(frontend): build dashboard layout shell (T3.5)"
   git push origin main
   ```

**Time Check:** Should complete in ~20 minutes

---

### ⏱️ T3.6: Build the Stopwatch Component (15 min)

**Objective:** Create a reusable stopwatch component that updates every 100ms.

**Dependencies:** T3.5 must be complete

**Acceptance Criteria:**
- Stopwatch ticks accurately from any `startedAt` timestamp
- Displays as `mm:ss.t` format
- Passes basic test

**Manual Steps:**

1. **Create components directory:**
   ```bash
   mkdir -p frontend/src/components
   ```

2. **Create the Stopwatch component:**
   ```bash
   code frontend/src/components/Stopwatch.tsx
   ```

3. **Implement the Stopwatch:**
   ```typescript
   'use client';

   import { useEffect, useState, useMemo } from 'react';
   import { differenceInMilliseconds } from 'date-fns';

   interface StopwatchProps {
     startedAt: Date;
     className?: string;
   }

   export function Stopwatch({ startedAt, className = '' }: StopwatchProps) {
     const [now, setNow] = useState(new Date());

     useEffect(() => {
       const interval = setInterval(() => {
         setNow(new Date());
       }, 100); // Update every 100ms

       return () => clearInterval(interval);
     }, []);

     const elapsed = useMemo(() => {
       const ms = differenceInMilliseconds(now, startedAt);
       const totalSeconds = Math.floor(ms / 1000);
       const minutes = Math.floor(totalSeconds / 60);
       const seconds = totalSeconds % 60;
       const tenths = Math.floor((ms % 1000) / 100);

       return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
     }, [now, startedAt]);

     return (
       <div className={`font-mono text-2xl font-semibold ${className}`}>
         {elapsed}
       </div>
     );
   }
   ```

4. **Update page.tsx to use Stopwatch:**
   ```bash
   code frontend/src/app/page.tsx
   ```
   
   Add import at top:
   ```typescript
   'use client';

   import { Stopwatch } from '@/components/Stopwatch';
   import { useState, useEffect } from 'react';
   ```
   
   Update the component:
   ```typescript
   export default function Home() {
     const [sessionStart] = useState(new Date());

     return (
       <div className="min-h-screen bg-white flex flex-col">
         <header className="border-b border-ibm-gray-10 px-6 py-4">
           <div className="max-w-[1440px] mx-auto flex items-center justify-between">
             <Stopwatch startedAt={sessionStart} className="text-ibm-gray-100" />
             {/* ... rest of header ... */}
   ```

5. **Test the stopwatch:**
   ```bash
   pnpm dev
   ```
   - Open http://localhost:3000
   - Verify stopwatch starts at 00:00.0 and ticks every 100ms
   - Refresh page - should restart from 00:00.0

6. **Create a simple test (optional but recommended):**
   ```bash
   code frontend/src/components/Stopwatch.test.tsx
   ```
   
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { Stopwatch } from './Stopwatch';

   describe('Stopwatch', () => {
     it('renders initial time correctly', () => {
       const startTime = new Date();
       render(<Stopwatch startedAt={startTime} />);
       expect(screen.getByText(/00:00\.\d/)).toBeInTheDocument();
     });
   });
   ```

7. **Commit the stopwatch:**
   ```bash
   git add frontend/src/components/Stopwatch.tsx frontend/src/app/page.tsx
   git commit -m "feat(frontend): build stopwatch component (T3.6)"
   git push origin main
   ```

**Time Check:** Should complete in ~15 minutes

---

### 🔌 T3.7: Build the WebSocket Client Hook (15 min)

**Objective:** Create a WebSocket hook that connects to the backend event stream.

**Dependencies:** 
- T3.5 must be complete
- Soft-depends on Dev 2's T2.4 (backend WebSocket endpoint)

**Acceptance Criteria:**
- When backend is running, footer dot is green
- When backend is stopped, dot goes red and client retries

**Manual Steps:**

1. **Create hooks directory:**
   ```bash
   mkdir -p frontend/src/hooks
   ```

2. **Create Zustand store for events:**
   ```bash
   code frontend/src/store/events.ts
   ```

3. **Implement the events store:**
   ```typescript
   import { create } from 'zustand';

   export interface Event {
     id: string;
     type: string;
     timestamp: string;
     data: any;
   }

   interface EventsState {
     events: Event[];
     connectionState: 'connecting' | 'connected' | 'disconnected';
     addEvent: (event: Event) => void;
     setConnectionState: (state: 'connecting' | 'connected' | 'disconnected') => void;
     clearEvents: () => void;
   }

   export const useEventsStore = create<EventsState>((set) => ({
     events: [],
     connectionState: 'disconnected',
     addEvent: (event) =>
       set((state) => ({
         events: [event, ...state.events].slice(0, 100), // Keep last 100 events
       })),
     setConnectionState: (connectionState) => set({ connectionState }),
     clearEvents: () => set({ events: [] }),
   }));
   ```

4. **Create the WebSocket hook:**
   ```bash
   code frontend/src/hooks/useEvents.ts
   ```

5. **Implement the WebSocket hook:**
   ```typescript
   'use client';

   import { useEffect, useRef } from 'react';
   import useWebSocket, { ReadyState } from 'react-use-websocket';
   import { useEventsStore } from '@/store/events';

   const WS_URL = 'ws://localhost:8765/events';

   export function useEvents() {
     const { addEvent, setConnectionState } = useEventsStore();
     const reconnectAttempt = useRef(0);

     const { lastMessage, readyState } = useWebSocket(WS_URL, {
       shouldReconnect: () => true,
       reconnectAttempts: 10,
       reconnectInterval: (attemptNumber) => {
         // Exponential backoff: 1s, 2s, 4s, 8s (max)
         const delay = Math.min(1000 * Math.pow(2, attemptNumber), 8000);
         reconnectAttempt.current = attemptNumber;
         return delay;
       },
       onOpen: () => {
         console.log('WebSocket connected');
         reconnectAttempt.current = 0;
       },
       onClose: () => {
         console.log('WebSocket disconnected');
       },
       onError: (error) => {
         console.error('WebSocket error:', error);
       },
     });

     // Update connection state
     useEffect(() => {
       switch (readyState) {
         case ReadyState.CONNECTING:
           setConnectionState('connecting');
           break;
         case ReadyState.OPEN:
           setConnectionState('connected');
           break;
         case ReadyState.CLOSING:
         case ReadyState.CLOSED:
           setConnectionState('disconnected');
           break;
       }
     }, [readyState, setConnectionState]);

     // Process incoming messages
     useEffect(() => {
       if (lastMessage !== null) {
         try {
           const event = JSON.parse(lastMessage.data);
           addEvent({
             id: event.id || crypto.randomUUID(),
             type: event.type || 'unknown',
             timestamp: event.timestamp || new Date().toISOString(),
             data: event,
           });
         } catch (error) {
           console.error('Failed to parse WebSocket message:', error);
         }
       }
     }, [lastMessage, addEvent]);

     return {
       connectionState: readyState,
       isConnected: readyState === ReadyState.OPEN,
     };
   }
   ```

6. **Update page.tsx to show connection status:**
   ```bash
   code frontend/src/app/page.tsx
   ```
   
   Add imports:
   ```typescript
   import { useEvents } from '@/hooks/useEvents';
   import { useEventsStore } from '@/store/events';
   ```
   
   Update component:
   ```typescript
   export default function Home() {
     const [sessionStart] = useState(new Date());
     const { isConnected } = useEvents();
     const connectionState = useEventsStore((state) => state.connectionState);

     return (
       <div className="min-h-screen bg-white flex flex-col">
         {/* ... header and main content ... */}

         {/* Footer - Event Stream Toggle */}
         <footer className="border-t border-ibm-gray-10 px-6 py-3">
           <div className="max-w-[1440px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div
                 className={`w-2 h-2 rounded-full ${
                   isConnected
                     ? 'bg-ibm-green-50'
                     : connectionState === 'connecting'
                     ? 'bg-ibm-orange-40'
                     : 'bg-ibm-red-50'
                 }`}
               ></div>
               <span className="text-xs text-ibm-gray-70">
                 {isConnected ? 'Connected' : connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
               </span>
             </div>
             <button className="text-xs text-ibm-blue-60 hover:underline">
               Toggle Stream
             </button>
           </div>
         </footer>
       </div>
     );
   }
   ```

7. **Create store directory:**
   ```bash
   mkdir -p frontend/src/store
   ```

8. **Test the WebSocket connection:**
   ```bash
   pnpm dev
   ```
   
   **Without backend running:**
   - Footer dot should be red or orange (connecting)
   - Console should show connection attempts
   
   **With backend running (if Dev 2 has completed T2.4):**
   - Ask Dev 2 to start their backend: `uvicorn backend.app:app --port 8765`
   - Footer dot should turn green
   - Stop backend - dot should turn red and retry

9. **Commit the WebSocket hook:**
   ```bash
   git add frontend/src/hooks/useEvents.ts frontend/src/store/events.ts frontend/src/app/page.tsx
   git commit -m "feat(frontend): build WebSocket client hook (T3.7)"
   git push origin main
   ```

**Time Check:** Should complete in ~15 minutes

---

### 📊 T3.8: Build the Event Stream Component (10 min)

**Objective:** Create a component to display the live event stream.

**Dependencies:** T3.7 must be complete

**Acceptance Criteria:**
- When backend echoes a fake event, it appears in stream within 200ms
- Events are color-coded by type
- Newest events at top

**Manual Steps:**

1. **Create the EventStream component:**
   ```bash
   code frontend/src/components/EventStream.tsx
   ```

2. **Implement the EventStream:**
   ```typescript
   'use client';

   import { useEventsStore, Event } from '@/store/events';
   import { Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';

   const EVENT_COLORS = {
     tool_call: 'text-ibm-blue-60 bg-ibm-blue-60/10',
     tool_response: 'text-ibm-blue-60 bg-ibm-blue-60/10',
     card_emit: 'text-ibm-purple-50 bg-ibm-purple-50/10',
     certification_grade: 'text-ibm-green-50 bg-ibm-green-50/10',
     checkpoint_create: 'text-ibm-orange-40 bg-ibm-orange-40/10',
     checkpoint_restore: 'text-ibm-orange-40 bg-ibm-orange-40/10',
     turn_start: 'text-ibm-gray-70 bg-ibm-gray-10',
     turn_end: 'text-ibm-gray-70 bg-ibm-gray-10',
     default: 'text-ibm-gray-70 bg-ibm-gray-10',
   };

   const EVENT_ICONS = {
     tool_call: Zap,
     tool_response: CheckCircle,
     card_emit: AlertCircle,
     certification_grade: CheckCircle,
     default: Clock,
   };

   function EventItem({ event }: { event: Event }) {
     const colorClass = EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
     const Icon = EVENT_ICONS[event.type as keyof typeof EVENT_ICONS] || EVENT_ICONS.default;

     return (
       <div className={`flex items-start gap-3 p-3 rounded-lg ${colorClass}`}>
         <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
         <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between gap-2 mb-1">
             <span className="text-xs font-semibold uppercase tracking-wide">
               {event.type.replace(/_/g, ' ')}
             </span>
             <span className="text-xs opacity-70">
               {new Date(event.timestamp).toLocaleTimeString()}
             </span>
           </div>
           <div className="text-xs opacity-80 truncate">
             {JSON.stringify(event.data).slice(0, 100)}
           </div>
         </div>
       </div>
     );
   }

   export function EventStream() {
     const events = useEventsStore((state) => state.events);

     return (
       <div className="space-y-2 max-h-96 overflow-y-auto">
         {events.length === 0 ? (
           <div className="text-center py-8 text-ibm-gray-70 text-sm">
             No events yet. Waiting for backend activity...
           </div>
         ) : (
           events.map((event) => <EventItem key={event.id} event={event} />)
         )}
       </div>
     );
   }
   ```

3. **Add EventStream to the page:**
   ```bash
   code frontend/src/app/page.tsx
   ```
   
   Add import:
   ```typescript
   import { EventStream } from '@/components/EventStream';
   import { useState } from 'react';
   ```
   
   Add state for stream visibility:
   ```typescript
   export default function Home() {
     const [sessionStart] = useState(new Date());
     const [showEventStream, setShowEventStream] = useState(false);
     const { isConnected } = useEvents();
     const connectionState = useEventsStore((state) => state.connectionState);
   ```
   
   Update footer to toggle stream:
   ```typescript
   <footer className="border-t border-ibm-gray-10 px-6 py-3">
     <div className="max-w-[1440px] mx-auto">
       <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${/* ... */}`}></div>
           <span className="text-xs text-ibm-gray-70">
             {/* ... connection status ... */}
           </span>
         </div>
         <button
           onClick={() => setShowEventStream(!showEventStream)}
           className="text-xs text-ibm-blue-60 hover:underline"
         >
           {showEventStream ? 'Hide' : 'Show'} Event Stream
         </button>
       </div>
       
       {showEventStream && (
         <div className="border-t border-ibm-gray-10 pt-3">
           <EventStream />
         </div>
       )}
     </div>
   </footer>
   ```

4. **Test the event stream:**
   ```bash
   pnpm dev
   ```
   
   - Click "Show Event Stream" in footer
   - If backend is running and echoing events, they should appear
   - Events should be color-coded
   - Newest events should appear at top

5. **Test with Dev 2's backend (if available):**
   - Ask Dev 2 to send a test event through their WebSocket
   - Verify it appears in the stream within 200ms

6. **Commit the event stream:**
   ```bash
   git add frontend/src/components/EventStream.tsx frontend/src/app/page.tsx
   git commit -m "feat(frontend): build event stream component (T3.8)"
   git push origin main
   ```

**Time Check:** Should complete in ~10 minutes

---

### ✅ T3.9: Build Verification and Commit (5 min)

**Objective:** Final verification that everything works and create a draft PR.

**Dependencies:** T3.2 through T3.8 must be complete

**Acceptance Criteria:**
- `pnpm build` succeeds
- `pnpm lint` passes
- `pnpm tsc --noEmit` has zero errors
- Draft PR open with green CI checks

**Manual Steps:**

1. **Run full build:**
   ```bash
   cd frontend
   pnpm build
   ```
   Expected: Build completes successfully

2. **Run linter:**
   ```bash
   pnpm lint
   ```
   Expected: No errors (warnings are OK for now)

3. **Run TypeScript check:**
   ```bash
   pnpm tsc --noEmit
   ```
   Expected: Zero errors

4. **Fix any issues found:**
   - If build fails: Check for missing imports or syntax errors
   - If lint fails: Run `pnpm lint --fix` to auto-fix
   - If TypeScript fails: Fix type errors

5. **Final manual test:**
   ```bash
   pnpm dev
   ```
   - Open http://localhost:3000
   - Verify all four regions render correctly
   - Verify stopwatch is ticking
   - Verify connection indicator shows correct state
   - Toggle event stream - should show/hide
   - Test at 1440×900 resolution - no overflow

6. **Commit all remaining changes:**
   ```bash
   git add .
   git commit -m "feat(frontend): complete Phase 1 frontend scaffold (T3.9)"
   git push origin main
   ```

7. **Create draft PR:**
   ```bash
   # Using GitHub CLI
   gh pr create \
     --title "Phase 1: Frontend scaffold" \
     --body "Completes all Phase 1 tasks for Dev 3 (Frontend/Dashboard):
   
   - ✅ T3.1: Verified Node environment
   - ✅ T3.2: Scaffolded Next.js application
   - ✅ T3.3: Installed supporting dependencies
   - ✅ T3.4: Applied IBM design tokens
   - ✅ T3.5: Built dashboard layout shell
   - ✅ T3.6: Built stopwatch component
   - ✅ T3.7: Built WebSocket client hook
   - ✅ T3.8: Built event stream component
   - ✅ T3.9: Verified build and tests
   
   **Testing:**
   - \`pnpm build\` passes
   - \`pnpm lint\` passes
   - \`pnpm tsc --noEmit\` passes
   - Dashboard renders at 1440×900 without overflow
   - Stopwatch ticks correctly
   - WebSocket connection indicator works
   
   **Dependencies:**
   - Depends on Dev 1's T1.3 (directory skeleton) ✅
   - Soft-depends on Dev 2's T2.4 (backend WebSocket) - can test when ready
   
   Ready for Phase 1 H+2 sync review." \
     --draft
   ```
   
   Or manually on GitHub:
   - Go to repository on GitHub
   - Click "Pull requests" → "New pull request"
   - Select your branch
   - Click "Create pull request"
   - Check "Create as draft"
   - Fill in title and description as above

8. **Verify CI checks:**
   - Wait for GitHub Actions to run
   - Verify all checks pass (green)
   - If any fail, fix and push again

**Time Check:** Should complete in ~5 minutes

---

## Phase 1 Completion Checklist

Before the H+2 sync meeting, verify:

- [ ] All 9 tasks (T3.1 - T3.9) completed
- [ ] Frontend boots with `pnpm dev` on port 3000
- [ ] Dashboard layout visible at 1440×900
- [ ] Stopwatch component ticking
- [ ] WebSocket connection indicator working
- [ ] Event stream component renders
- [ ] All code committed and pushed
- [ ] Draft PR created with green CI checks
- [ ] Ready to demo at H+2 sync (2 minutes)

---

## H+2 Sync Demo Script (2 minutes)

When it's your turn at the sync meeting:

1. **Show the dashboard running** (30 seconds)
   ```bash
   cd frontend && pnpm dev
   ```
   - Open http://localhost:3000
   - Show all four regions rendering

2. **Show the stopwatch ticking** (15 seconds)
   - Point out the stopwatch in the header
   - Show it updating every 100ms

3. **Show the WebSocket connection indicator** (30 seconds)
   - Point out the connection dot in footer
   - If Dev 2's backend is running, show green dot
   - If not, show red dot and explain retry logic

4. **Show the event stream** (30 seconds)
   - Click "Show Event Stream"
   - If events are flowing, show them appearing
   - If not, explain it's waiting for backend

5. **Confirm completion** (15 seconds)
   - "All 9 tasks complete"
   - "Build, lint, and TypeScript checks passing"
   - "Draft PR open with green CI"

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue: Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -- -p 3001
```

**Issue: pnpm not found**
```bash
npm install -g pnpm
```

**Issue: Build fails with TypeScript errors**
```bash
# Check for errors
pnpm tsc --noEmit

# Common fixes:
# - Add missing imports
# - Fix type annotations
# - Add 'use client' directive for client components
```

**Issue: WebSocket won't connect**
- Verify backend is running on port 8765
- Check browser console for errors
- Verify WebSocket URL is correct: `ws://localhost:8765/events`

**Issue: Stopwatch not updating**
- Verify `date-fns` is installed
- Check browser console for errors
- Ensure component has `'use client'` directive

**Issue: IBM Plex Sans not loading**
- Verify font import in layout.tsx
- Check network tab for font loading
- Clear browser cache and reload

---

## Time Management Tips

- **T3.1 (5 min):** Quick verification, don't overthink
- **T3.2 (10 min):** Let Next.js CLI do the work
- **T3.3 (10 min):** Batch install all dependencies at once
- **T3.4 (15 min):** Copy-paste color values, don't type manually
- **T3.5 (20 min):** Use Tailwind classes, avoid custom CSS
- **T3.6 (15 min):** Simple implementation, optimize later
- **T3.7 (15 min):** Use react-use-websocket, don't reinvent
- **T3.8 (10 min):** Basic rendering, polish in Phase 2
- **T3.9 (5 min):** Just verify and commit, don't add features

**Total: 105 minutes + 15-minute buffer = 120 minutes**

---

## What NOT to Do in Phase 1

❌ **Don't implement real data fetching** - Use placeholders  
❌ **Don't add animations** - Basic functionality only  
❌ **Don't optimize performance** - Make it work first  
❌ **Don't write tests** - One basic test for stopwatch is enough  
❌ **Don't add extra features** - Stick to the task list  
❌ **Don't wait for perfect** - Ship working code, iterate later  

---

## Dependencies on Other Devs

### Hard Dependencies (Must Wait)
- **Dev 1's T1.3** - Directory skeleton must exist before T3.2

### Soft Dependencies (Nice to Have)
- **Dev 2's T2.4** - Backend WebSocket endpoint for T3.7 testing
  - Can proceed without it using mock data
  - Connection will show red dot until backend is ready

### Provides to Other Devs
- **Dev 5's T5.3** - Frontend directory needed for Makefile
  - Complete T3.2 by H+40 so Dev 5 can proceed

---

## Questions to Ask if Blocked

1. **If Dev 1 hasn't completed T1.3 by H+15:**
   - "Dev 1, what's the ETA on the directory skeleton (T1.3)?"
   - "Can I help unblock you?"

2. **If WebSocket connection fails in T3.7:**
   - "Dev 2, is your backend running on port 8765?"
   - "Can you send a test event through the WebSocket?"

3. **If build fails unexpectedly:**
   - "Has anyone else seen this error?"
   - "Should I proceed with a workaround or wait for a fix?"

---

## Success Criteria Summary

By the end of Phase 1, you should have:

✅ A working Next.js application on port 3000  
✅ IBM Design System styling applied  
✅ Four-region dashboard layout rendering  
✅ Stopwatch component ticking every 100ms  
✅ WebSocket client with connection indicator  
✅ Event stream component displaying events  
✅ All code committed and pushed  
✅ Draft PR with green CI checks  
✅ Ready to demo in 2 minutes at H+2 sync  

---

## Next Steps After Phase 1

After the H+2 sync meeting:

1. **Review feedback** from other devs
2. **Fix any P0 issues** identified at the gate review
3. **Prepare for Phase 2** - Read Phase 2 instructions
4. **Export Bob session** - Document your Phase 1 work
5. **Take a 5-minute break** - You've earned it!

---

## Contact Information

If you need help during Phase 1:

- **Dev 1 (Bob Architect):** Directory skeleton, Bob configuration
- **Dev 2 (Backend/MCP):** WebSocket endpoint, event schema
- **Dev 4 (Infra):** Build issues, environment problems
- **Dev 5 (Integration):** Makefile, CI/CD, general coordination

**Team Channel:** Post questions in the team Slack/Discord channel  
**Emergency:** If completely blocked, raise flag by H+1:30

---

## Good Luck! 🚀

You've got this! Follow the plan, stay focused, and ship working code. See you at the H+2 sync!
