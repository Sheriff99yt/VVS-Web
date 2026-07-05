import React from 'react';
import { GraphVariable } from '@/types/graph';
import { VariableType, defaultValueForVariableType } from '@/lib/variableDefaults';

interface VariablePropertiesPanelProps {
  variable: GraphVariable;
  onChange: (
    key: 'name' | 'type' | 'defaultValue' | 'binding' | 'readonly',
    value: string | number | boolean | Record<string, unknown>
  ) => void;
}

export function VariablePropertiesPanel({ variable, onChange }: VariablePropertiesPanelProps) {
  const objectDefault =
    variable.type === 'object' && variable.defaultValue && typeof variable.defaultValue === 'object'
      ? JSON.stringify(variable.defaultValue, null, 2)
      : '{}';

  return (
    <div className="text-sm text-zinc-300 space-y-3">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Name</label>
        <input
          type="text"
          value={variable.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Type</label>
        <select
          value={variable.type}
          onChange={(e) => {
            const nextType = e.target.value as VariableType;
            onChange('type', nextType);
            onChange('defaultValue', defaultValueForVariableType(nextType) as Record<string, unknown>);
          }}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="object">Object</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Binding</label>
        <div className="flex gap-2">
          {(['instance', 'static'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange('binding', mode)}
              className={`flex-1 px-2 py-1.5 text-xs rounded border transition-colors ${
                (variable.binding ?? 'instance') === mode
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {mode === 'instance' ? 'Instance' : 'Static'}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={variable.readonly ?? false}
          onChange={(e) => onChange('readonly', e.target.checked)}
          className="accent-zinc-500 bg-zinc-900 border-zinc-800"
        />
        Read-only
      </label>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Default</label>

        {variable.type === 'string' && (
          <input
            type="text"
            value={variable.defaultValue as string}
            onChange={(e) => onChange('defaultValue', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          />
        )}

        {variable.type === 'number' && (
          <input
            type="number"
            value={variable.defaultValue as number}
            onChange={(e) => onChange('defaultValue', parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          />
        )}

        {variable.type === 'boolean' && (
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer py-1">
            <input
              type="checkbox"
              checked={variable.defaultValue as boolean}
              onChange={(e) => onChange('defaultValue', e.target.checked)}
              className="accent-zinc-500 bg-zinc-900 border-zinc-800"
            />
            True/False
          </label>
        )}

        {variable.type === 'object' && (
          <textarea
            rows={4}
            value={objectDefault}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '{}');
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  onChange('defaultValue', parsed);
                }
              } catch {
                // keep last valid value while typing
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            placeholder="{}"
          />
        )}
      </div>
    </div>
  );
}
