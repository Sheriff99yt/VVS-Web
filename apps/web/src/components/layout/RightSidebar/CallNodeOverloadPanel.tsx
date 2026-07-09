'use client';

import React, { useMemo } from 'react';
import type { FunctionSymbol, VVSNodeData } from '@/types/graph';
import { applyFunctionCallBinding } from '@/lib/functionHelpers';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface CallNodeOverloadPanelProps {
  func: FunctionSymbol;
  nodeData: VVSNodeData;
  onApply: (patch: Partial<VVSNodeData>) => void;
}

export function CallNodeOverloadPanel({ func, nodeData, onApply }: CallNodeOverloadPanelProps) {
  const options = useMemo(
    () =>
      func.overloads.map((overload, index) => {
        const paramSummary =
          overload.parameters.length > 0
            ? overload.parameters.map((p) => `${p.label}: ${p.type}`).join(', ')
            : 'no params';
        const ret =
          overload.returnType && overload.returnType !== 'void' ? ` → ${overload.returnType}` : '';
        return {
          value: overload.id,
          label: `Overload ${index + 1}`,
          description: `(${paramSummary})${ret}`,
        };
      }),
    [func.overloads]
  );

  if (func.overloads.length <= 1) return null;

  const selectedId =
    nodeData.graphBinding?.overloadId ??
    (typeof nodeData.properties?.overloadId === 'string' ? nodeData.properties.overloadId : undefined) ??
    func.overloads[0]!.id;

  const handleChange = (overloadId: string) => {
    const patch = applyFunctionCallBinding(nodeData, func, overloadId);
    onApply({
      label: patch.label,
      kindId: patch.kindId,
      linkKind: patch.linkKind,
      linkedGraphId: patch.linkedGraphId,
      graphBinding: patch.graphBinding,
      properties: patch.properties,
      inputs: patch.inputs,
      outputs: patch.outputs,
    });
  };

  return (
    <div className="mb-2 pb-2 border-b border-zinc-800/80">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
        Function overload
      </p>
      <SearchableSelect
        value={selectedId}
        onChange={handleChange}
        options={options}
        placeholder="Select overload…"
      />
    </div>
  );
}
