import React, { useMemo } from 'react';
import { VVSNode } from '@/types/graph';
import { VVSNodeData, collectProjectEnumTypes } from '@vvs/graph-types';
import { Plus, Trash2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';

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

  const caseKeys = Object.keys(properties)
    .filter((k) => /^case\d+$/.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.replace('case', ''), 10);
      const numB = parseInt(b.replace('case', ''), 10);
      return numA - numB;
    });

  const applyPatch = (dataPatch: Partial<VVSNodeData>) => {
    onApply(dataPatch);
  };

  const handleAddCase = () => {
    const newIdx = caseKeys.length;
    const newKey = `case${newIdx}`;

    const currentOutputs = [...(nodeData.data.outputs || [])];
    const defaultIdx = currentOutputs.findIndex((o) => o.id === 'default_exec');
    const insertIdx = defaultIdx !== -1 ? defaultIdx : currentOutputs.length;

    const memberDefault = members[newIdx] ?? String(newIdx);
    const newOutput = {
      id: `case_${newIdx}`,
      label: memberDefault,
      type: 'execution' as const,
    };
    currentOutputs.splice(insertIdx, 0, newOutput);

    applyPatch({
      properties: {
        ...properties,
        [newKey]: memberDefault,
      },
      outputs: currentOutputs,
    });
  };

  const handleRemoveCase = (keyToRemove: string) => {
    const idxToRemove = parseInt(keyToRemove.replace('case', ''), 10);

    const newProperties: Record<string, unknown> = { ...properties };
    delete newProperties[keyToRemove];

    const newOutputs = [...(nodeData.data.outputs || [])];
    const outIdx = newOutputs.findIndex((o) => o.id === `case_${idxToRemove}`);
    if (outIdx !== -1) {
      newOutputs.splice(outIdx, 1);
    }

    const remainingKeys = Object.keys(newProperties)
      .filter((k) => /^case\d+$/.test(k))
      .sort((a, b) => parseInt(a.replace('case', ''), 10) - parseInt(b.replace('case', ''), 10));

    const finalProperties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(newProperties)) {
      if (!/^case\d+$/.test(k)) {
        finalProperties[k] = v;
      }
    }

    remainingKeys.forEach((oldKey, newIdx) => {
      finalProperties[`case${newIdx}`] = newProperties[oldKey];

      const oldOutId = `case_${oldKey.replace('case', '')}`;
      const outPin = newOutputs.find((o) => o.id === oldOutId);
      if (outPin) {
        outPin.id = `case_${newIdx}`;
        outPin.label = String(newProperties[oldKey] ?? `Case ${newIdx}`);
      }
    });

    applyPatch({
      properties: finalProperties,
      outputs: newOutputs,
    });
  };

  const handleChangeCase = (key: string, value: string) => {
    const idx = key.replace('case', '');
    const outputs = (nodeData.data.outputs || []).map((o) =>
      o.id === `case_${idx}` ? { ...o, label: value || o.label } : o
    );
    applyPatch({
      properties: {
        ...properties,
        [key]: value,
      },
      outputs,
    });
  };

  const handleEnumTypeChange = (value: string) => {
    const nextEnum = value.trim();
    const nextMembers =
      projectEnums.find((e) => e.name === nextEnum)?.members ?? [];
    const nextProperties: Record<string, unknown> = {
      ...properties,
      enumType: nextEnum,
    };
    // When picking a known enum, seed cases from members if empty.
    if (nextMembers.length > 0 && caseKeys.length === 0) {
      nextMembers.forEach((m, idx) => {
        nextProperties[`case${idx}`] = m;
      });
      const seen = new Set<string>();
      const mergedOutputs = [
        ...nextMembers.map((m, idx) => ({
          id: `case_${idx}`,
          label: m,
          type: 'execution' as const,
        })),
        ...(nodeData.data.outputs || []).filter((o) => {
          if (o.id.startsWith('case_')) return false;
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        }),
      ];
      applyPatch({ properties: nextProperties, outputs: mergedOutputs });
      return;
    }
    applyPatch({
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
            placeholder="Select enum…"
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
          Switch Cases{enumType ? ` · ${enumType}` : ''}
        </p>
        <button
          onClick={handleAddCase}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors"
        >
          <Plus size={12} />
          Add Case
        </button>
      </div>

      {caseKeys.length === 0 && (
        <div className="text-zinc-500 text-xs text-center py-4 border border-dashed border-zinc-800/50 rounded">
          No cases defined.
        </div>
      )}

      {caseKeys.map((key) => {
        const val = properties[key] as string;
        const idx = key.replace('case', '');
        return (
          <div key={key} className="flex items-center gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-medium text-zinc-400">
                Case {idx}
                {enumType ? ' (member)' : ''}
              </label>
              {members.length > 0 ? (
                <SearchableSelect
                  value={val}
                  onChange={(value) => handleChangeCase(key, value)}
                  options={members.map((m) => ({ value: m, label: m }))}
                  placeholder="Member…"
                />
              ) : (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleChangeCase(key, e.target.value)}
                  placeholder={enumType ? 'OK' : '0'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  {...graphInlineFieldProps}
                />
              )}
            </div>
            <Tooltip content="Remove Case" placement="top">
              <button
                type="button"
                onClick={() => handleRemoveCase(key)}
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
