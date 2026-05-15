import { create } from 'zustand';

export interface Event {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
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

// Made with Bob
