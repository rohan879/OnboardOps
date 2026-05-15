'use client';

import { useEventsStore, Event } from '@/store/events';
import { Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';

const EVENT_COLORS = {
  tool_call: 'text-ibm-blue-60 bg-ibm-blue-60/10',
  tool_response: 'text-ibm-blue-60 bg-ibm-blue-60/10',
  card_emit: 'text-ibm-purple-50 bg-ibm-purple-50/10',
  certification_grade: 'text-ibm-green-50 bg-ibm-green-50/10',
  checkpoint_create: 'text-ibm-orange-40 bg-ibm-orange-40/10',
  checkpoint_restore: 'text-ibm-orange-40 bg-ibm-orange-40/10',
  turn_start: 'text-ibm-gray-70 bg-ibm-gray-10',
  turn_end: 'text-ibm-gray-70 bg-ibm-gray-10',
  default: 'text-ibm-gray-70 bg-ibm-gray-10',
};

const EVENT_ICONS = {
  tool_call: Zap,
  tool_response: CheckCircle,
  card_emit: AlertCircle,
  certification_grade: CheckCircle,
  default: Clock,
};

function EventItem({ event }: { event: Event }) {
  const colorClass = EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
  const Icon = EVENT_ICONS[event.type as keyof typeof EVENT_ICONS] || EVENT_ICONS.default;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide">
            {event.type.replace(/_/g, ' ')}
          </span>
          <span className="text-xs opacity-70">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-xs opacity-80 truncate">
          {JSON.stringify(event.data).slice(0, 100)}
        </div>
      </div>
    </div>
  );
}

export function EventStream() {
  const events = useEventsStore((state) => state.events);

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {events.length === 0 ? (
        <div className="text-center py-8 text-ibm-gray-70 text-sm">
          No events yet. Waiting for backend activity...
        </div>
      ) : (
        events.map((event) => <EventItem key={event.id} event={event} />)
      )}
    </div>
  );
}

// Made with Bob
