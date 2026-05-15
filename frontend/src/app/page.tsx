'use client';

import { Stopwatch } from '@/components/Stopwatch';
import { EventStream } from '@/components/EventStream';
import { useEvents } from '@/hooks/useEvents';
import { useEventsStore } from '@/store/events';
import { useState } from 'react';

export default function Home() {
  const [sessionStart] = useState(new Date());
  const [showEventStream, setShowEventStream] = useState(false);
  const { isConnected } = useEvents();
  const connectionState = useEventsStore((state) => state.connectionState);

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
