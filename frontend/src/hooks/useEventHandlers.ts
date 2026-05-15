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

  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[0]; // Events are prepended, so [0] is latest

    // Handle different event types
    switch (latestEvent.type) {
      case 'turn_start':
        // Turn started - could show loading indicator
        console.log('Turn started:', latestEvent.data);
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
        // Tool called - could show which tool is being used
        console.log('Tool called:', latestEvent.data.tool_name);
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
        // Session started - reset all steps to pending
        updateStepStatus('graph', 'pending');
        updateStepStatus('entry', 'pending');
        updateStepStatus('hotspot', 'pending');
        updateStepStatus('convention', 'pending');
        
        // Reset budget
        updateBobcoinBudget({ spent: 0, projected: 0 });
        break;

      case 'session_end': {
        // Session ended - finalize budget
        const totalSpent = (latestEvent.data.total_bobcoins_spent as number) || 0;
        updateBobcoinBudget({ spent: totalSpent, projected: totalSpent });
        break;
      }

      case 'certification_grade':
        // Certification graded - could update certification panel
        console.log('Certification graded:', latestEvent.data);
        break;

      case 'checkpoint_create':
      case 'checkpoint_restore':
        // Checkpoint events - could show notification
        console.log('Checkpoint event:', latestEvent.type, latestEvent.data);
        break;

      default:
        // Unknown event type
        break;
    }
  }, [events, updateStepStatus, updateBobcoinBudget, incrementBobcoinSpent]);
}

// Made with Bob