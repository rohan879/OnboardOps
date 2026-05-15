'use client';

import { Stopwatch } from '@/components/Stopwatch';
import { EventStream } from '@/components/EventStream';
import { CartographyCard } from '@/components/CartographyCard';
import { DependencyGraph, GraphData } from '@/components/DependencyGraph';
import { CartographyStepper } from '@/components/CartographyStepper';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { useEvents } from '@/hooks/useEvents';
import { useEventsStore } from '@/store/events';
import { useState } from 'react';

// Sample graph data for testing
const sampleGraphData: GraphData = {
  nodes: [
    { id: 'app', name: 'app.py', group: 1, val: 15 },
    { id: 'models', name: 'models.py', group: 1, val: 12 },
    { id: 'views', name: 'views.py', group: 1, val: 10 },
    { id: 'utils', name: 'utils.py', group: 2, val: 8 },
    { id: 'config', name: 'config.py', group: 2, val: 8 },
    { id: 'auth', name: 'auth.py', group: 3, val: 10 },
    { id: 'db', name: 'database.py', group: 3, val: 12 },
    { id: 'api', name: 'api.py', group: 1, val: 10 },
  ],
  edges: [
    { source: 'app', target: 'models' },
    { source: 'app', target: 'views' },
    { source: 'app', target: 'config' },
    { source: 'views', target: 'models' },
    { source: 'views', target: 'auth' },
    { source: 'models', target: 'db' },
    { source: 'auth', target: 'db' },
    { source: 'api', target: 'models' },
    { source: 'api', target: 'auth' },
    { source: 'utils', target: 'config' },
  ],
};

export default function Home() {
  const [sessionStart] = useState(new Date());
  const [showEventStream, setShowEventStream] = useState(false);
  const { isConnected } = useEvents();
  const connectionState = useEventsStore((state) => state.connectionState);
  const cartographySteps = useEventsStore((state) => state.cartographySteps);
  const updateStepStatus = useEventsStore((state) => state.updateStepStatus);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-ibm-gray-10 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Stopwatch startedAt={sessionStart} className="text-ibm-gray-100" />
          <div className="text-2xl font-bold text-ibm-blue-60">
            OnboardOps
          </div>
          <div className="text-sm text-ibm-gray-70">
            Dev 3
          </div>
        </div>
      </header>

      {/* Stepper Section */}
      <div className="border-b border-ibm-gray-10 px-6 py-6 bg-ibm-gray-10/30">
        <div className="max-w-[1440px] mx-auto">
          <CartographyStepper steps={cartographySteps} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex max-w-[1440px] mx-auto w-full">
        {/* Main Panel - Cartography Cards */}
        <main className="flex-1 p-6 space-y-6">
          {/* Dependency Graph Card with real visualization */}
          <CartographyCard
            type="graph"
            title="Dependency Graph"
            state="complete"
          >
            <DependencyGraph data={sampleGraphData} width={700} height={500} />
          </CartographyCard>

          {/* Other cards */}
          <div className="grid grid-cols-3 gap-4">
            <CartographyCard
              type="entry"
              title="Entry Points"
              state="in-progress"
            >
              <div className="text-sm text-ibm-gray-70">
                Analyzing entry points...
              </div>
            </CartographyCard>

            <CartographyCard
              type="hotspot"
              title="Change Hotspots"
              state="pending"
            >
              <div className="text-sm text-ibm-gray-70">
                Waiting to analyze hotspots
              </div>
            </CartographyCard>

            <CartographyCard
              type="convention"
              title="Project Conventions"
              state="pending"
            >
              <div className="text-sm text-ibm-gray-70">
                Waiting to analyze conventions
              </div>
            </CartographyCard>
          </div>
        </main>

        {/* Right Sidebar - Transcript & Certification */}
        <aside className="w-96 border-l border-ibm-gray-10 p-6 space-y-6 flex flex-col">
          {/* Transcript Panel */}
          <div className="flex-1 min-h-0">
            <TranscriptPanel maxHeight={400} />
          </div>

          {/* Test Controls */}
          <div>
            <h2 className="text-sm font-semibold text-ibm-gray-100 mb-3">
              Test Controls
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => updateStepStatus('graph', 'in-progress')}
                className="w-full px-3 py-2 text-xs bg-ibm-blue-60 text-white rounded hover:bg-ibm-blue-70 transition-colors"
              >
                Start Graph
              </button>
              <button
                onClick={() => updateStepStatus('graph', 'complete')}
                className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Complete Graph
              </button>
            </div>
          </div>

          {/* Certification Panel */}
          <div>
            <h2 className="text-sm font-semibold text-ibm-gray-100 mb-3">
              Certification
            </h2>
            <div className="bg-ibm-gray-10 rounded-lg p-4">
              <p className="text-xs text-ibm-gray-70">
                Socratic quiz panel placeholder
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer - Event Stream Toggle */}
      <footer className="border-t border-ibm-gray-10 px-6 py-3">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-3">
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
    </div>
  );
}
