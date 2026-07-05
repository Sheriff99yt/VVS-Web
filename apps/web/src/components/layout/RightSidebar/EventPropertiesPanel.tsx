'use client';

import React from 'react';
import { Plus, Trash2, Radio, Send, Bell } from 'lucide-react';
import type { EventParameter, PinType, ProjectEventDefinition } from '@/types/graph';
import { DATA_PIN_TYPE_OPTIONS } from '@vvs/graph-types';
import { createEventParameterId, eventDisplayName } from '@/lib/eventHelpers';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';

const PARAM_TYPES = DATA_PIN_TYPE_OPTIONS.filter((t) => t.value !== 'data_object' && t.value !== 'data_array');

interface EventPropertiesPanelProps {
  event: ProjectEventDefinition;
  onChange: (next: ProjectEventDefinition) => void;
  onSpawnDefine?: () => void;
  onSpawnDispatch?: () => void;
  onSpawnEmit?: () => void;
  onSpawnSubscribe?: () => void;
}

export function EventPropertiesPanel({
  event,
  onChange,
  onSpawnDefine,
  onSpawnDispatch,
  onSpawnEmit,
  onSpawnSubscribe,
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
                <select
                  value={param.type}
                  onChange={(e) => updateParam(index, { type: e.target.value as PinType })}
                  className="w-[72px] shrink-0 nowheel nopan nodrag bg-zinc-900/80 border border-zinc-800 rounded px-1 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-600"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {PARAM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
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

      {(onSpawnDefine || onSpawnDispatch || onSpawnEmit || onSpawnSubscribe) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/80">
          {onSpawnDefine && (
            <button
              type="button"
              onClick={onSpawnDefine}
              className="flex items-center gap-1 px-2 py-1 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] hover:bg-violet-500/25"
              title="Add On node to canvas"
            >
              <Radio size={10} />
              On
            </button>
          )}
          {onSpawnSubscribe && (
            <button
              type="button"
              onClick={onSpawnSubscribe}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] hover:bg-emerald-500/25"
              title="Add Subscribe node to canvas"
            >
              <Bell size={10} />
              Subscribe
            </button>
          )}
          {onSpawnEmit && (
            <button
              type="button"
              onClick={onSpawnEmit}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] hover:bg-amber-500/25"
              title="Add Emit node to canvas"
            >
              <Send size={10} />
              Emit
            </button>
          )}
          {onSpawnDispatch && (
            <button
              type="button"
              onClick={onSpawnDispatch}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] hover:bg-zinc-700"
              title="Add Dispatch node (legacy) to canvas"
            >
              <Send size={10} />
              Dispatch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
