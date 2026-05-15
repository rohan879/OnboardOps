import { create } from 'zustand';

export type StepStatus = 'pending' | 'in-progress' | 'complete' | 'error';

export interface Event {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface CartographyStep {
  id: string;
  label: string;
  status: StepStatus;
}

export interface BobcoinBudget {
  total: number;
  spent: number;
  projected: number;
}

interface EventsState {
  events: Event[];
  connectionState: 'connecting' | 'connected' | 'disconnected';
  cartographySteps: CartographyStep[];
  bobcoinBudget: BobcoinBudget;
  addEvent: (event: Event) => void;
  setConnectionState: (state: 'connecting' | 'connected' | 'disconnected') => void;
  clearEvents: () => void;
  updateStepStatus: (stepId: string, status: StepStatus) => void;
  resetSteps: () => void;
  updateBobcoinBudget: (budget: Partial<BobcoinBudget>) => void;
  incrementBobcoinSpent: (amount: number) => void;
}

const DEFAULT_STEPS: CartographyStep[] = [
  { id: 'graph', label: 'Dependency Graph', status: 'pending' },
  { id: 'entry', label: 'Entry Points', status: 'pending' },
  { id: 'hotspot', label: 'Change Hotspots', status: 'pending' },
  { id: 'convention', label: 'Conventions', status: 'pending' },
];

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  connectionState: 'disconnected',
  cartographySteps: DEFAULT_STEPS,
  bobcoinBudget: {
    total: 200,
    spent: 0,
    projected: 0,
  },
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100), // Keep last 100 events
    })),
  setConnectionState: (connectionState) => set({ connectionState }),
  clearEvents: () => set({ events: [] }),
  updateStepStatus: (stepId, status) =>
    set((state) => ({
      cartographySteps: state.cartographySteps.map((step) =>
        step.id === stepId ? { ...step, status } : step
      ),
    })),
  resetSteps: () => set({ cartographySteps: DEFAULT_STEPS }),
  updateBobcoinBudget: (budget) =>
    set((state) => ({
      bobcoinBudget: { ...state.bobcoinBudget, ...budget },
    })),
  incrementBobcoinSpent: (amount) =>
    set((state) => ({
      bobcoinBudget: {
        ...state.bobcoinBudget,
        spent: state.bobcoinBudget.spent + amount,
        projected: state.bobcoinBudget.spent + amount,
      },
    })),
}));

// Made with Bob
