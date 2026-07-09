import React, { useMemo } from 'react';
import type { VariableSymbol, VariableBinding, SymbolVisibility, VariableDataType } from '@/types/graph';
import {
  LOGICAL_DATA_TYPE_DESCRIPTORS,
  portabilityFeaturesForVariable,
} from '@vvs/graph-types';
import { analyzePortability } from '@vvs/language-profiles';
import { useProject } from '@/contexts/ProjectContext';
import {
  coerceVariableDefaultValue,
  defaultValueForVariableType,
} from '@/lib/variableDefaults';
import {
  isBindingCoaAllowed,
  isDataTypeCoaAllowed,
  isReadonlyCoaAllowed,
} from '@/lib/variableCoaUi';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface VariablePropertiesPanelProps {
  variable: VariableSymbol;
  onChange: (next: VariableSymbol) => void;
}

export function VariablePropertiesPanel({ variable, onChange }: VariablePropertiesPanelProps) {
  const { targetLanguage, crossOverMode } = useProject();

  const portabilityHints = useMemo(() => {
    return analyzePortability(portabilityFeaturesForVariable(variable), targetLanguage);
  }, [variable, targetLanguage]);

  const objectDefault =
    variable.type === 'data_object' && variable.defaultValue && typeof variable.defaultValue === 'object'
      ? JSON.stringify(variable.defaultValue, null, 2)
      : '{}';

  const arrayDefault =
    variable.type === 'data_array' && Array.isArray(variable.defaultValue)
      ? JSON.stringify(variable.defaultValue, null, 2)
      : '[]';

  const patch = (partial: Partial<VariableSymbol>) => onChange({ ...variable, ...partial });

  return (
    <div className="text-sm text-zinc-300 space-y-3">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Name</label>
        <input
          type="text"
          value={variable.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          {...graphInlineFieldProps}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Type</label>
        <SearchableSelect
          value={variable.type}
          onChange={(nextType) => {
            if (!isDataTypeCoaAllowed(nextType as VariableDataType, crossOverMode)) return;
            patch({
              type: nextType as VariableDataType,
              defaultValue: defaultValueForVariableType(nextType as VariableDataType),
            });
          }}
          options={LOGICAL_DATA_TYPE_DESCRIPTORS.map((descriptor) => ({
            value: descriptor.id,
            label: `${descriptor.label}${!isDataTypeCoaAllowed(descriptor.id, crossOverMode) ? ' (COA)' : ''}`,
            description: descriptor.description,
          }))}
          placeholder="Select type…"
        />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          {LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === variable.type)?.description}
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Binding</span>
        <div className="flex flex-wrap gap-1">
          {(['instance', 'static', 'module'] as VariableBinding[]).map((binding) => {
            const coaBlocked = !isBindingCoaAllowed(binding, crossOverMode);
            return (
              <button
                key={binding}
                type="button"
                disabled={coaBlocked}
                onClick={() => patch({ binding })}
                title={coaBlocked ? 'Not allowed in current COA language set' : undefined}
                className={`px-2 py-0.5 rounded text-[10px] border transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                  variable.binding === binding
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {binding}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Visibility</span>
        <SearchableSelect
          value={variable.visibility}
          onChange={(value) => patch({ visibility: value as SymbolVisibility })}
          options={[
            { value: 'public', label: 'Public' },
            { value: 'private', label: 'Private' },
          ]}
          searchable={false}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={variable.flags?.readonly ?? false}
          disabled={!isReadonlyCoaAllowed(crossOverMode)}
          onChange={(e) =>
            patch({
              flags: e.target.checked ? { readonly: true } : undefined,
            })
          }
          className="accent-zinc-500 bg-zinc-900 border-zinc-800 disabled:opacity-40"
        />
        Read-only
        {!isReadonlyCoaAllowed(crossOverMode) ? (
          <span className="text-[9px] text-zinc-600">(blocked by COA)</span>
        ) : null}
      </label>

      {portabilityHints.length > 0 ? (
        <div className="space-y-1 border-t border-zinc-800/80 pt-2">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            Cross-language ({targetLanguage})
          </span>
          <ul className="space-y-1">
            {portabilityHints.map((hint, index) => (
              <li
                key={`${hint.code ?? 'hint'}-${index}`}
                className={`text-[10px] leading-relaxed ${
                  hint.level === 'warning' ? 'text-amber-400/90' : 'text-zinc-500'
                }`}
              >
                {hint.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Default</label>

        {variable.type === 'data_string' && (
          <input
            type="text"
            value={(variable.defaultValue as string) ?? ''}
            onChange={(e) => patch({ defaultValue: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          />
        )}

        {variable.type === 'data_number' && (
          <input
            type="number"
            value={(variable.defaultValue as number) ?? 0}
            onChange={(e) => patch({ defaultValue: parseFloat(e.target.value) || 0 })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          />
        )}

        {variable.type === 'data_boolean' && (
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer py-1">
            <input
              type="checkbox"
              checked={Boolean(variable.defaultValue)}
              onChange={(e) => patch({ defaultValue: e.target.checked })}
              className="accent-zinc-500 bg-zinc-900 border-zinc-800"
            />
            True/False
          </label>
        )}

        {variable.type === 'data_object' && (
          <textarea
            rows={4}
            value={objectDefault}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '{}');
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  patch({ defaultValue: parsed });
                }
              } catch {
                // keep last valid value while typing
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            placeholder="{}"
          />
        )}

        {variable.type === 'data_array' && (
          <textarea
            rows={4}
            value={arrayDefault}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '[]');
                if (Array.isArray(parsed)) {
                  patch({ defaultValue: parsed });
                }
              } catch {
                // keep last valid value while typing
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            placeholder="[]"
          />
        )}

        {variable.type === 'data_any' && (
          <input
            type="text"
            value={variable.defaultValue == null ? '' : String(variable.defaultValue)}
            onChange={(e) =>
              patch({
                defaultValue: coerceVariableDefaultValue('data_any', e.target.value || null),
              })
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="any value"
          />
        )}
      </div>
    </div>
  );
}
