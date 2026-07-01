'use client';

import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { ReferenceGraphNodeData } from '@/lib/referenceGraphLayout';
import { graphTypeAccent } from '@/lib/referenceGraphLayout';
import { GitBranch, PlaySquare, Boxes } from 'lucide-react';

const TYPE_LABEL: Record<ReferenceGraphNodeData['graphType'], string> = {
  main: 'Event Graph',
  function: 'Function',
  macro: 'Macro',
};

const TYPE_ICON: Record<ReferenceGraphNodeData['graphType'], React.ReactNode> = {
  main: <GitBranch size={28} className="text-emerald-500/40" />,
  function: <PlaySquare size={28} className="text-indigo-400/40" />,
  macro: <Boxes size={28} className="text-amber-500/40" />,
};

export function ReferenceGraphNode({
  data,
  selected,
}: NodeProps<Node<ReferenceGraphNodeData>>) {
  const accent = graphTypeAccent(data.graphType);

  return (
    <div
      className={`w-[200px] rounded-md overflow-hidden border bg-zinc-900 shadow-md select-none ${
        data.isRoot
          ? 'border-amber-500/80 ring-2 ring-amber-500/30'
          : selected
            ? 'border-zinc-500'
            : 'border-zinc-700/80'
      }`}
    >
      {/* Referencers connect on the left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-zinc-600 !bg-zinc-400"
        style={{ top: '50%' }}
      />

      <div
        className="px-2.5 py-1.5 border-b border-zinc-800/80"
        style={{ borderTopWidth: 3, borderTopColor: accent }}
      >
        <div className="text-[11px] font-semibold text-zinc-100 truncate leading-tight">{data.label}</div>
        <div className="text-[9px] text-zinc-500 uppercase tracking-wide mt-0.5">
          {TYPE_LABEL[data.graphType]}
        </div>
      </div>

      <div className="h-[72px] flex items-center justify-center bg-zinc-950/80 border-b border-zinc-800/50">
        {TYPE_ICON[data.graphType]}
      </div>

      {data.isRoot ? (
        <div className="px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-amber-500/90 bg-amber-500/5 text-center">
          Focus
        </div>
      ) : (
        <div className="px-2 py-1 text-[8px] text-zinc-600 text-center capitalize">
          {data.side === 'referencers' ? 'Referencer' : data.side === 'dependencies' ? 'Dependency' : ''}
        </div>
      )}

      {/* Dependencies flow to the right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-zinc-600 !bg-zinc-400"
        style={{ top: '50%' }}
      />
    </div>
  );
}
