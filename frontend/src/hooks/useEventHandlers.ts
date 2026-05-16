'use client';

import { useEffect } from 'react';
import { useEventsStore } from '@/store/events';

/**
 * Hook that processes WebSocket events and updates application state
 * Handles: TurnStart, TurnEnd, ToolCall, CardEmit, SessionStart, SessionEnd, CertificationGrade
 */
export function useEventHandlers() {
  const events = useEventsStore((state) => state.events);
  const updateStepStatus = useEventsStore((state) => state.updateStepStatus);
  const updateBobcoinBudget = useEventsStore((state) => state.updateBobcoinBudget);
  const incrementBobcoinSpent = useEventsStore((state) => state.incrementBobcoinSpent);
  const startSession = useEventsStore((state) => state.startSession);
  const endSession = useEventsStore((state) => state.endSession);

  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[0]; // Events are prepended, so [0] is latest

    // Handle different event types
    switch (latestEvent.type) {
      case 'turn_start':
        break;

      case 'turn_end': {
        // Turn ended - update Bobcoin budget
        const bobcoinsSpent = (latestEvent.data.bobcoins_spent as number) || 0;
        if (bobcoinsSpent > 0) {
          incrementBobcoinSpent(bobcoinsSpent);
        }
        break;
      }

      case 'tool_call':
        break;

      case 'card_emit': {
        // Cartography card emitted - update step status
        const cardType = latestEvent.data.card_type as string;
        
        // Map backend card types to frontend step IDs
        const stepMap: Record<string, string> = {
          'dependency_graph': 'graph',
          'entry_points': 'entry',
          'hotspots': 'hotspot',
          'conventions': 'convention',
        };

        const stepId = stepMap[cardType];
        if (stepId) {
          updateStepStatus(stepId, 'complete');
        }
        break;
      }

      case 'session_start':
        // Session started - start stopwatch and reset state
        startSession();
        updateStepStatus('graph', 'pending');
        updateStepStatus('entry', 'pending');
        updateStepStatus('hotspot', 'pending');
        updateStepStatus('convention', 'pending');
        updateBobcoinBudget({ spent: 0, projected: 0 });
        break;

      case 'session_end': {
        // Session ended - stop stopwatch and finalize budget
        endSession();
        const totalSpent = (latestEvent.data.total_bobcoins_spent as number) || 0;
        updateBobcoinBudget({ spent: totalSpent, projected: totalSpent });
        break;
      }

      case 'certification_grade':
        break;

      case 'checkpoint_create':
      case 'checkpoint_restore':
        break;

      default:
        // Unknown event type
        break;
    }
  }, [events, updateStepStatus, updateBobcoinBudget, incrementBobcoinSpent, startSession, endSession]);
}

// Made with Bob
