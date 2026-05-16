'use client';

import { useEventsStore, Event } from '@/store/events';
import { useMemo, useState } from 'react';
import { Clock, Zap, CheckCircle, AlertCircle, Search } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [eventType, setEventType] = useState('all');
  const eventTypes = useMemo(
    () => ['all', ...Array.from(new Set(events.map((event) => event.type))).sort()],
    [events]
  );
  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesType = eventType === 'all' || event.type === eventType;
      const matchesQuery =
        !normalizedQuery ||
        event.type.toLowerCase().includes(normalizedQuery) ||
        JSON.stringify(event.data).toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [events, eventType, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ibm-gray-50" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 w-full border border-ibm-gray-20 bg-white pl-9 pr-3 text-sm text-ibm-gray-100 outline-none transition-colors focus:border-ibm-blue-60"
            placeholder="Search events"
            type="search"
          />
        </label>
        <select
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
          className="h-9 border border-ibm-gray-20 bg-white px-3 text-sm text-ibm-gray-100 outline-none transition-colors focus:border-ibm-blue-60"
          aria-label="Filter event type"
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All event types' : type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
      {events.length === 0 ? (
        <div className="text-center py-8 text-ibm-gray-70 text-sm">
          No events yet. Waiting for backend activity...
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="text-center py-8 text-ibm-gray-70 text-sm">
          No events match the current filter.
        </div>
      ) : (
        visibleEvents.map((event) => <EventItem key={event.id} event={event} />)
      )}
      </div>
    </div>
  );
}

// Made with Bob
