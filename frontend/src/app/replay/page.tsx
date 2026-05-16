'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { useReplay } from '@/hooks/useReplay';
import { useEventsStore } from '@/store/events';
import { Stopwatch } from '@/components/Stopwatch';
import { EventStream } from '@/components/EventStream';

function ReplayContent() {
  const searchParams = useSearchParams();
  const sessionFile = searchParams.get('file') || '';
  const presentationMode = searchParams.get('presentation') === 'true';
  const [speed, setSpeed] = useState(1.0);
  
  const {
    isPlaying,
    isPaused,
    progress,
    error,
    totalEvents,
    currentEventIndex,
    play,
    pause,
    resume,
    stop,
  } = useReplay({ sessionFile, speed });
  
  const { events, connectionState } = useEventsStore();
  
  // Calculate elapsed time from events
  const startTime = events.length > 0 ? new Date(events[events.length - 1].timestamp) : new Date();
  
  // Keyboard shortcuts for video production
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying && !isPaused) {
            pause();
          } else if (isPaused) {
            resume();
          } else {
            play();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          break;
        case 'Escape':
          e.preventDefault();
          stop();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, play, pause, resume, stop]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`border-b border-gray-200 bg-white ${presentationMode ? 'hidden' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Stopwatch */}
            <div className="flex items-center space-x-4">
              <Stopwatch startedAt={startTime} />
              <span className="text-sm text-gray-500">
                {isPlaying ? '▶️ Playing' : isPaused ? '⏸️ Paused' : '⏹️ Stopped'}
              </span>
            </div>
            
            {/* Wordmark */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-ibm-blue-60">OnboardOps</h1>
              <p className="text-sm text-gray-500">Replay Mode</p>
            </div>
            
            {/* Connection indicator */}
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' :
                connectionState === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {connectionState === 'connected' ? 'Loaded' :
                 connectionState === 'connecting' ? 'Loading...' :
                 'Not loaded'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${presentationMode ? 'pt-4' : ''}`}>
        {/* Keyboard shortcuts hint (only in presentation mode) */}
        {presentationMode && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <strong>Keyboard Shortcuts:</strong> Space = Play/Pause | Esc = Stop | ← → = Navigate (coming soon)
          </div>
        )}
        
        {/* Session info */}
        <div className={`mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 ${presentationMode ? 'hidden' : ''}`}>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Session Replay</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-gray-500">File:</span>
              <p className="font-mono text-gray-900">{sessionFile || 'None'}</p>
            </div>
            <div>
              <span className="text-gray-500">Events:</span>
              <p className="text-gray-900">{currentEventIndex} / {totalEvents}</p>
            </div>
            <div>
              <span className="text-gray-500">Progress:</span>
              <p className="text-gray-900">{progress.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-gray-500">Speed:</span>
              <p className="text-gray-900">{speed}x</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-ibm-blue-60 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className={`mb-6 flex items-center space-x-4 ${presentationMode ? 'hidden' : ''}`}>
          {!isPlaying && !isPaused && (
            <button
              onClick={play}
              disabled={!sessionFile || !!error}
              className="rounded-lg bg-ibm-blue-60 px-6 py-2 text-white hover:bg-ibm-blue-70 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              ▶️ Play
            </button>
          )}
          
          {isPlaying && !isPaused && (
            <button
              onClick={pause}
              className="rounded-lg bg-yellow-500 px-6 py-2 text-white hover:bg-yellow-600"
            >
              ⏸️ Pause
            </button>
          )}
          
          {isPaused && (
            <button
              onClick={resume}
              className="rounded-lg bg-green-500 px-6 py-2 text-white hover:bg-green-600"
            >
              ▶️ Resume
            </button>
          )}
          
          {(isPlaying || isPaused) && (
            <button
              onClick={stop}
              className="rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
            >
              ⏹️ Stop
            </button>
          )}
          
          {/* Speed control */}
          <div className="flex items-center space-x-2">
            <label htmlFor="speed" className="text-sm text-gray-600">
              Speed:
            </label>
            <select
              id="speed"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={isPlaying}
              className="rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
            >
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
              <option value="5.0">5.0x</option>
            </select>
          </div>
        </div>

        {/* Instructions */}
        {!sessionFile && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">How to use Replay Mode</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-blue-800">
              <li>Add <code className="rounded bg-blue-100 px-1 py-0.5">?file=/path/to/session.jsonl</code> to the URL</li>
              <li>Click <span className="font-medium">Play</span> to start the replay</li>
              <li>Use pause/resume/stop controls as needed</li>
              <li>Adjust playback speed (0.5x to 5x)</li>
            </ol>
            <p className="mt-4 text-sm text-blue-700">
              Example: <code className="rounded bg-blue-100 px-1 py-0.5">/replay?file=/.onboardops/sessions/session-123.jsonl</code>
            </p>
          </div>
        )}

        {/* Event stream */}
        {events.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Event Stream</h3>
            <EventStream />
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-ibm-blue-60 mx-auto" />
          <p className="text-gray-600">Loading replay...</p>
        </div>
      </div>
    }>
      <ReplayContent />
    </Suspense>
  );
}

// Made with Bob
