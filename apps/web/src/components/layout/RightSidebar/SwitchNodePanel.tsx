import React, { useMemo } from 'react';
import { VVSNode } from '@/types/graph';
import { VVSNodeData, collectProjectEnumTypes } from '@vvs/graph-types';
import { Plus, Trash2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import {
  addSwitchCase,
  removeSwitchCase,
  setSwitchCaseLabel,
  switchCaseIndices,
  switchCaseLabel,
} from '@/lib/switchNode';

interface SwitchNodePanelProps {
  nodeData: Pick<VVSNode, 'id' | 'type' | 'data'>;
  onApply: (patch: Partial<VVSNodeData>) => void;
}

export function SwitchNodePanel({ nodeData, onApply }: SwitchNodePanelProps) {
  const documents = useGraphDocuments();
  const properties = nodeData.data.properties || {};
  const enumType = typeof properties.enumType === 'string' ? properties.enumType : '';

  const projectEnums = useMemo(
    () => collectProjectEnumTypes(documents ?? {}),
    [documents]
  );

  const selectedEnum = projectEnums.find((e) => e.name === enumType);
  const members = selectedEnum?.members ?? [];
  const caseIndices = switchCaseIndices(nodeData.data);

  const handleAddCase = () => {
    const memberDefault = members[caseIndices.length];
    onApply(addSwitchCase(nodeData.data, memberDefault));
  };

  const handleRemoveCase = (index: number) => {
    onApply(removeSwitchCase(nodeData.data, index));
  };

  const handleChangeCase = (index: number, value: string) => {
    onApply(setSwitchCaseLabel(nodeData.data, index, value));
  };

  const handleEnumTypeChange = (value: string) => {
    const nextEnum = value.trim();
    const nextMembers =
      projectEnums.find((e) => e.name === nextEnum)?.members ?? [];
    const nextProperties: Record<string, unknown> = {
      ...properties,
      enumType: nextEnum,
    };
    if (nextMembers.length > 0 && caseIndices.length === 0) {
      let seeded = {
        ...nodeData.data,
        properties: nextProperties,
      };
      let patch: Partial<VVSNodeData> = { properties: nextProperties };
      for (const member of nextMembers) {
        patch = addSwitchCase({ ...seeded, ...patch }, member);
        seeded = { ...seeded, ...patch };
      }
      onApply(patch);
      return;
    }
    onApply({
      properties: nextProperties,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-zinc-400">Enum type</label>
        {projectEnums.length > 0 ? (
          <SearchableSelect
            value={enumType}
            onChange={handleEnumTypeChange}
            options={[
              { value: '', label: '(none)' },
              ...projectEnums.map((e) => ({
                value: e.name,
                label: e.name,
                description: e.members.join(', '),
              })),
            ]}
            placeholder="Select enum?"
          />
        ) : (
          <input
            type="text"
            value={enumType}
            onChange={(e) => handleEnumTypeChange(e.target.value)}
            placeholder="Declare an Enum on canvas first"
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            {...graphInlineFieldProps}
          />
        )}
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Types come from Declare Enum on the canvas. Case values are member names.
        </p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Switch Cases{enumType ? ` ? ${enumType}` : ''}
        </p>
        <button
          onClick={handleAddCase}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors"
        >
          <Plus size={12} />
          Add Case
        </button>
      </div>

      {caseIndices.length === 0 && (
        <div className="text-zinc-500 text-xs text-center py-4 border border-dashed border-zinc-800/50 rounded">
          No cases defined.
        </div>
      )}

      {caseIndices.map((idx) => {
        const val = switchCaseLabel(nodeData.data, idx);
        return (
          <div key={`case${idx}`} className="flex items-center gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-medium text-zinc-400">
                Case {idx}
                {enumType ? ' (member)' : ''}
              </label>
              {members.length > 0 ? (
                <SearchableSelect
                  value={val}
                  onChange={(value) => handleChangeCase(idx, value)}
                  options={members.map((m) => ({ value: m, label: m }))}
                  placeholder="Member?"
                />
              ) : (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleChangeCase(idx, e.target.value)}
                  placeholder={enumType ? 'OK' : '0'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  {...graphInlineFieldProps}
                />
              )}
            </div>
            <Tooltip content="Remove Case" placement="top">
              <button
                type="button"
                onClick={() => handleRemoveCase(idx)}
                className="mt-5 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
