'use client';

import React, { useMemo } from 'react';
import type { ProjectEventDefinition } from '@/types/graph';
import { eventDisplayName } from '@/lib/eventHelpers';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

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
  const options = useMemo(
    () =>
      events.map((ev) => ({
        value: ev.id,
        label:
          role === 'define'
            ? eventDisplayName(ev.name)
            : role === 'subscribe'
              ? `Subscribe ${ev.name}`
              : role === 'emit'
                ? `Emit ${ev.name}`
                : `Dispatch ${ev.name}`,
      })),
    [events, role]
  );

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
      <SearchableSelect
        value={eventId ?? ''}
        onChange={(id) => {
          const next = events.find((ev) => ev.id === id);
          if (next) onSelectEvent(next);
        }}
        options={options}
        placeholder="Select event…"
        emptyLabel="No events — add one in the project tree"
      />
    </div>
  );
}
