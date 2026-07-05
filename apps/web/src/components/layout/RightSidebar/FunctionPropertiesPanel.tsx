'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { FunctionBinding, FunctionSymbol, PinType, SymbolVisibility } from '@vvs/graph-types';
import { createDefaultOverload } from '@vvs/graph-types';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { SymbolParameterEditor } from './SymbolParameterEditor';
import { overloadDisplayLabel } from '@/lib/functionTabs';

const RETURN_TYPES: { value: PinType | 'void'; label: string }[] = [
  { value: 'void', label: 'None' },
  { value: 'data_number', label: 'Number' },
  { value: 'data_string', label: 'Text' },
  { value: 'data_boolean', label: 'Yes/No' },
  { value: 'data_any', label: 'Any' },
];

interface FunctionPropertiesPanelProps {
  func: FunctionSymbol;
  onChange: (next: FunctionSymbol) => void;
  onOpenGraph?: (overloadId: string) => void;
  callSiteCount?: number;
}

export function FunctionPropertiesPanel({
  func,
  onChange,
  onOpenGraph,
  callSiteCount,
}: FunctionPropertiesPanelProps) {
  const [selectedOverloadId, setSelectedOverloadId] = useState(func.overloads[0]?.id ?? '');

  const selectedOverload =
    func.overloads.find((o) => o.id === selectedOverloadId) ?? func.overloads[0];

  const updateOverload = (overloadId: string, patch: Partial<FunctionSymbol['overloads'][number]>) => {
    onChange({
      ...func,
      overloads: func.overloads.map((o) => (o.id === overloadId ? { ...o, ...patch } : o)),
    });
  };

  const addOverload = () => {
    const next = createDefaultOverload();
    onChange({
      ...func,
      overloads: [...func.overloads, { ...next, graphTabId: `${func.id}::${next.id}` }],
    });
    setSelectedOverloadId(next.id);
  };

  const removeOverload = (overloadId: string) => {
    if (func.overloads.length <= 1) return;
    const next = func.overloads.filter((o) => o.id !== overloadId);
    onChange({ ...func, overloads: next });
    if (selectedOverloadId === overloadId) setSelectedOverloadId(next[0]!.id);
  };

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Function</label>
        <input
          type="text"
          value={func.name}
          onChange={(e) => onChange({ ...func, name: e.target.value.trim() })}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
          {...graphInlineFieldProps}
        />
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Binding</span>
        <div className="flex flex-wrap gap-1">
          {(['instance', 'static', 'module'] as FunctionBinding[]).map((binding) => (
            <button
              key={binding}
              type="button"
              onClick={() => onChange({ ...func, binding })}
              className={`px-2 py-0.5 rounded text-[10px] border ${
                func.binding === binding
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {binding}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Visibility</span>
        <select
          value={func.visibility}
          onChange={(e) => onChange({ ...func, visibility: e.target.value as SymbolVisibility })}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="space-y-1.5 border-t border-zinc-800/80 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Overloads</span>
          <button
            type="button"
            onClick={addOverload}
            className="flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-300"
          >
            <Plus size={11} />
            Add
          </button>
        </div>
        <div className="space-y-1">
          {func.overloads.map((overload) => (
            <div key={overload.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedOverloadId(overload.id)}
                className={`flex-1 text-left px-2 py-1 rounded text-[10px] border ${
                  selectedOverload?.id === overload.id
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                }`}
              >
                {overloadDisplayLabel(overload)}
              </button>
              {func.overloads.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOverload(overload.id)}
                  className="p-1 text-zinc-600 hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedOverload && (
        <>
          <SymbolParameterEditor
            parameters={selectedOverload.parameters}
            onChange={(parameters) => updateOverload(selectedOverload.id, { parameters })}
          />
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Return</label>
            <select
              value={selectedOverload.returnType}
              onChange={(e) =>
                updateOverload(selectedOverload.id, {
                  returnType: e.target.value as PinType | 'void',
                })
              }
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300"
            >
              {RETURN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <details className="text-[10px] text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-400">Advanced</summary>
        <div className="mt-2 space-y-1 pl-1">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(func.flags?.virtual)}
              onChange={(e) =>
                onChange({
                  ...func,
                  flags: { ...func.flags, virtual: e.target.checked || undefined },
                })
              }
            />
            Virtual
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(func.flags?.async)}
              onChange={(e) =>
                onChange({
                  ...func,
                  flags: { ...func.flags, async: e.target.checked || undefined },
                })
              }
            />
            Async
          </label>
        </div>
      </details>

      {onOpenGraph && selectedOverload && (
        <button
          type="button"
          onClick={() => onOpenGraph(selectedOverload.id)}
          className="w-full px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
        >
          Open graph
          {callSiteCount != null ? ` · called ${callSiteCount}×` : ''}
        </button>
      )}
    </div>
  );
}
