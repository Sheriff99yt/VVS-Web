'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import type { PinType, SymbolParameter } from '@vvs/graph-types';
import { DATA_PIN_TYPE_OPTIONS } from '@vvs/graph-types';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const PARAM_TYPES: { value: PinType; label: string }[] = DATA_PIN_TYPE_OPTIONS;

export function createSymbolParameterId(): string {
  return `param-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface SymbolParameterEditorProps {
  parameters: SymbolParameter[];
  onChange: (parameters: SymbolParameter[]) => void;
  emptyLabel?: string;
}

export function SymbolParameterEditor({
  parameters,
  onChange,
  emptyLabel = 'No params',
}: SymbolParameterEditorProps) {
  const updateParam = (index: number, patch: Partial<SymbolParameter>) => {
    onChange(parameters.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removeParam = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  };

  const addParam = () => {
    onChange([
      ...parameters,
      { id: createSymbolParameterId(), label: 'Value', type: 'data_number' },
    ]);
  };

  return (
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

      {parameters.length === 0 ? (
        <p className="text-[10px] text-zinc-600 py-1">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          {parameters.map((param, index) => (
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
                  searchable={PARAM_TYPES.length > 4}
                />
              </div>
              <Tooltip content="Remove parameter" placement="top">
                <button
                  type="button"
                  onClick={() => removeParam(index)}
                  className="p-1 text-zinc-600 hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
