'use client';

import { useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useEventsStore } from '@/store/events';

const WS_URL =
  process.env.NEXT_PUBLIC_MCP_WS_URL || 'ws://127.0.0.1:8765/events';

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
      reconnectAttempt.current = 0;
    },
    onClose: () => undefined,
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
        const envelope = JSON.parse(lastMessage.data) as Record<string, unknown>;
        const event =
          envelope.event && typeof envelope.event === 'object'
            ? (envelope.event as Record<string, unknown>)
            : envelope;

        addEvent({
          id: (event.event_id as string) || (event.id as string) || crypto.randomUUID(),
          type: (event.event_type as string) || (event.type as string) || 'unknown',
          timestamp: event.timestamp
            ? new Date((event.timestamp as number) * 1000).toISOString()
            : new Date().toISOString(),
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

// Made with Bob
