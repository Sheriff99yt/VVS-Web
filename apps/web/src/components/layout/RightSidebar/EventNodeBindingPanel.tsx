'use client';

import React from 'react';
import type { ProjectEventDefinition } from '@/types/graph';
import { eventDisplayName } from '@/lib/eventHelpers';

interface EventNodeBindingPanelProps {
  events: ProjectEventDefinition[];
  eventId: string | undefined;
  role: 'define' | 'dispatch' | 'emit' | 'subscribe';
  onSelectEvent: (event: ProjectEventDefinition) => void;
}

export function EventNodeBindingPanel({
  events,
  eventId,
  role,
  onSelectEvent,
}: EventNodeBindingPanelProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
        {role === 'define'
          ? 'Handler event'
          : role === 'subscribe'
            ? 'Subscribe event'
            : role === 'emit'
              ? 'Emit event'
              : 'Dispatch event'}
      </label>
      <select
        value={eventId ?? ''}
        onChange={(e) => {
          const next = events.find((ev) => ev.id === e.target.value);
          if (next) onSelectEvent(next);
        }}
        className="w-full nowheel nopan nodrag bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
        onWheel={(e) => e.stopPropagation()}
      >
        <option value="" disabled>
          Select event…
        </option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {role === 'define'
              ? eventDisplayName(ev.name)
              : role === 'subscribe'
                ? `Subscribe ${ev.name}`
                : role === 'emit'
                  ? `Emit ${ev.name}`
                  : `Dispatch ${ev.name}`}
          </option>
        ))}
      </select>
      {events.length === 0 && (
        <p className="text-[10px] text-zinc-600">Add an event in the project tree first.</p>
      )}
    </div>
  );
}
