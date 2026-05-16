'use client';

import { useEffect, useRef, useState } from 'react';
import { useEventsStore, Event } from '@/store/events';

interface ReplayOptions {
  sessionFile: string;
  speed?: number; // Playback speed multiplier (1.0 = real-time, 2.0 = 2x speed)
}

export function useReplay({ sessionFile, speed = 1.0 }: ReplayOptions) {
  const { addEvent, clearEvents, setConnectionState } = useEventsStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  
  const eventsRef = useRef<Event[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Load session file
  useEffect(() => {
    if (!sessionFile) return;

    const loadSession = async () => {
      try {
        setError(null);
        setConnectionState('connecting');
        
        // Fetch the JSONL file
        const response = await fetch(sessionFile);
        if (!response.ok) {
          throw new Error(`Failed to load session: ${response.statusText}`);
        }
        
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parse each line as JSON
        const events: Event[] = [];
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            events.push({
              id: event.id || crypto.randomUUID(),
              type: event.type || 'unknown',
              timestamp: event.timestamp || event._captured_at || new Date().toISOString(),
              data: event,
            });
          } catch (e) {
            console.warn('Failed to parse event line:', e);
          }
        }
        
        if (events.length === 0) {
          throw new Error('No valid events found in session file');
        }
        
        eventsRef.current = events;
        setTotalEvents(events.length);
        setConnectionState('connected');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setConnectionState('disconnected');
        console.error('Failed to load session:', err);
      }
    };

    loadSession();
  }, [sessionFile, setConnectionState]);

  // Play/replay logic
  const play = () => {
    if (eventsRef.current.length === 0) {
      setError('No events loaded');
      return;
    }

    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    
    // Clear existing events in store
    clearEvents();
    
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentEventIndex(0);
    startTimeRef.current = Date.now();
    
    const events = eventsRef.current;
    const firstTimestamp = new Date(events[0].timestamp).getTime();
    
    // Schedule each event based on its timestamp
    events.forEach((event, index) => {
      const eventTimestamp = new Date(event.timestamp).getTime();
      const delay = (eventTimestamp - firstTimestamp) / speed;
      
      const timeout = setTimeout(() => {
        addEvent(event);
        setCurrentEventIndex(index + 1);
        setProgress(((index + 1) / events.length) * 100);
        
        // If this is the last event, mark as complete
        if (index === events.length - 1) {
          setIsPlaying(false);
        }
      }, delay);
      
      timeoutsRef.current.push(timeout);
    });
  };

  const pause = () => {
    if (!isPlaying) return;
    
    setIsPaused(true);
    pausedAtRef.current = Date.now();
    
    // Clear all pending timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const resume = () => {
    if (!isPaused) return;
    
    setIsPaused(false);
    
    const pauseDuration = Date.now() - pausedAtRef.current;
    const events = eventsRef.current;
    const firstTimestamp = new Date(events[0].timestamp).getTime();
    
    // Reschedule remaining events
    events.slice(currentEventIndex).forEach((event, index) => {
      const eventTimestamp = new Date(event.timestamp).getTime();
      const originalDelay = (eventTimestamp - firstTimestamp) / speed;
      const adjustedDelay = originalDelay - (Date.now() - startTimeRef.current - pauseDuration);
      
      if (adjustedDelay > 0) {
        const timeout = setTimeout(() => {
          addEvent(event);
          setCurrentEventIndex(currentEventIndex + index + 1);
          setProgress(((currentEventIndex + index + 1) / events.length) * 100);
          
          if (currentEventIndex + index + 1 === events.length) {
            setIsPlaying(false);
          }
        }, adjustedDelay);
        
        timeoutsRef.current.push(timeout);
      }
    });
  };

  const stop = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentEventIndex(0);
    clearEvents();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  return {
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
  };
}

// Made with Bob
