'use client';

import React from 'react';
import { Plus, Trash2, Radio, Send, Link2 } from 'lucide-react';
import type { EventParameter, PinType, ProjectEventDefinition } from '@/types/graph';
import { DATA_PIN_TYPE_OPTIONS } from '@vvs/graph-types';
import { createEventParameterId, eventDisplayName } from '@/lib/eventHelpers';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const PARAM_TYPES = DATA_PIN_TYPE_OPTIONS.filter((t) => t.value !== 'data_object' && t.value !== 'data_array');

interface EventPropertiesPanelProps {
  event: ProjectEventDefinition;
  onChange: (next: ProjectEventDefinition) => void;
  /** Insert event_member_define on the class member chain. */
  onSpawnDeclareMember?: () => void;
  /** Spawn event_define handler (On) on the flow graph. */
  onSpawnHandler?: () => void;
  onSpawnDispatch?: () => void;
}

export function EventPropertiesPanel({
  event,
  onChange,
  onSpawnDeclareMember,
  onSpawnHandler,
  onSpawnDispatch,
}: EventPropertiesPanelProps) {
  const updateParam = (index: number, patch: Partial<EventParameter>) => {
    const parameters = event.parameters.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ ...event, parameters });
  };

  const removeParam = (index: number) => {
    onChange({ ...event, parameters: event.parameters.filter((_, i) => i !== index) });
  };

  const addParam = () => {
    const id = createEventParameterId();
    onChange({
      ...event,
      parameters: [
        ...event.parameters,
        { id, label: 'Value', type: 'data_number' },
      ],
    });
  };

  const hasCanvasActions = onSpawnDeclareMember || onSpawnHandler || onSpawnDispatch;

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Event</label>
        <input
          type="text"
          value={event.name}
          onChange={(e) => onChange({ ...event, name: e.target.value.replace(/^on\s+/i, '').trim() })}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
          placeholder="damage"
          {...graphInlineFieldProps}
        />
        <p className="text-[10px] text-zinc-600">{eventDisplayName(event.name)}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Parameters</span>
          <button
            type="button"
            onClick={addParam}
            className="flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-300"
          >
            <Plus size={11} />
            Add
          </button>
        </div>

        {event.parameters.length === 0 ? (
          <p className="text-[10px] text-zinc-600 py-1">No params</p>
        ) : (
          <div className="space-y-1.5">
            {event.parameters.map((param, index) => (
              <div key={param.id} className="flex gap-1 items-center">
                <input
                  type="text"
                  value={param.label}
                  onChange={(e) => updateParam(index, { label: e.target.value })}
                  className="flex-1 min-w-0 bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
                  placeholder="Label"
                  {...graphInlineFieldProps}
                />
                <div className="w-[88px] shrink-0">
                  <SearchableSelect
                    value={param.type}
                    onChange={(value) => updateParam(index, { type: value as PinType })}
                    options={PARAM_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeParam(index)}
                  className="p-1 text-zinc-600 hover:text-red-400"
                  title="Remove parameter"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasCanvasActions ? (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/80">
          {onSpawnDeclareMember ? (
            <button
              type="button"
              onClick={onSpawnDeclareMember}
              className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] hover:bg-sky-500/25"
              title="Declare event on class member chain"
            >
              <Link2 size={10} />
              Declare
            </button>
          ) : null}
          {onSpawnHandler ? (
            <button
              type="button"
              onClick={onSpawnHandler}
              className="flex items-center gap-1 px-2 py-1 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] hover:bg-violet-500/25"
              title="Add On handler node to canvas"
            >
              <Radio size={10} />
              On
            </button>
          ) : null}
          {onSpawnDispatch ? (
            <button
              type="button"
              onClick={onSpawnDispatch}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] hover:bg-amber-500/25"
              title="Add Dispatch node to canvas"
            >
              <Send size={10} />
              Dispatch
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
