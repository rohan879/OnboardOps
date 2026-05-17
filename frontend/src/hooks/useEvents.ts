'use client';

import { useEffect, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useEventsStore } from '@/store/events';

const WS_URL =
  process.env.NEXT_PUBLIC_MCP_WS_URL || 'ws://127.0.0.1:8765/events';
const HEALTH_URL = (() => {
  try {
    const parsed = new URL(WS_URL);
    parsed.protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:';
    parsed.pathname = '/health';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return 'http://127.0.0.1:8765/health';
  }
})();

export function useEvents() {
  const { addEvent, setConnectionState } = useEventsStore();
  const reconnectAttempt = useRef(0);
  const hasLoggedSocketFailure = useRef(false);
  const [isBridgeReachable, setIsBridgeReachable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const probeBridge = async () => {
      try {
        const response = await fetch(HEALTH_URL, {
          cache: 'no-store',
        });

        if (!cancelled) {
          setIsBridgeReachable(response.ok);
        }
      } catch {
        if (!cancelled) {
          setIsBridgeReachable(false);
        }
      }
    };

    void probeBridge();

    const intervalId = window.setInterval(() => {
      void probeBridge();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const { lastMessage, readyState } = useWebSocket(WS_URL, {
    shouldReconnect: () => isBridgeReachable,
    reconnectAttempts: 10,
    reconnectInterval: (attemptNumber) => {
      // Exponential backoff: 1s, 2s, 4s, 8s (max)
      const delay = Math.min(1000 * Math.pow(2, attemptNumber), 8000);
      reconnectAttempt.current = attemptNumber;
      return delay;
    },
    onOpen: () => {
      reconnectAttempt.current = 0;
      hasLoggedSocketFailure.current = false;
    },
    onClose: () => undefined,
    onError: () => {
      if (hasLoggedSocketFailure.current) {
        return;
      }

      hasLoggedSocketFailure.current = true;
      console.warn(
        `WebSocket bridge at ${WS_URL} could not be opened. The dashboard will retry automatically.`
      );
    },
  }, isBridgeReachable);

  // Update connection state
  useEffect(() => {
    if (!isBridgeReachable) {
      setConnectionState('disconnected');
      return;
    }

    switch (readyState) {
      case ReadyState.UNINSTANTIATED:
        setConnectionState('disconnected');
        break;
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
  }, [isBridgeReachable, readyState, setConnectionState]);

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
    isConnected: isBridgeReachable && readyState === ReadyState.OPEN,
  };
}

// Made with Bob
