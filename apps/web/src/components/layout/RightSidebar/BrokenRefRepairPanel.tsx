'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ResolvedSymbolRef } from '@vvs/graph-types';

export interface BrokenRefRepairPanelProps {
  symbolRef: ResolvedSymbolRef;
  onDeleteNode: () => void;
  onDeleteAllForSymbol: () => void;
  onRecreateSymbol: () => void;
  onRecreateAllSymbols: () => void;
}

export function BrokenRefRepairPanel({
  symbolRef,
  onDeleteNode,
  onDeleteAllForSymbol,
  onRecreateSymbol,
  onRecreateAllSymbols,
}: BrokenRefRepairPanelProps) {
  const label = symbolRef.displayName ?? symbolRef.symbolId.replace(/^name:/, '');

  return (
    <div className="mb-3 rounded-md border border-amber-900/50 bg-amber-950/20 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-medium text-amber-200">Broken {symbolRef.kind} reference</p>
          <p className="text-[10px] text-amber-200/70 mt-0.5 leading-relaxed">
            This node is invalid — missing {symbolRef.kind}{' '}
            <span className="text-amber-100">{label}</span>. Recreate the symbol from this node, or
            remove the node(s).
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        <button
          type="button"
          onClick={onRecreateSymbol}
          className="text-left rounded border border-indigo-900/50 bg-indigo-950/30 px-2.5 py-1.5 text-[10px] text-indigo-200 hover:bg-indigo-950/50 transition-colors"
        >
          Recreate {symbolRef.kind} from this node
        </button>
        <button
          type="button"
          onClick={onRecreateAllSymbols}
          className="text-left rounded border border-indigo-900/50 bg-indigo-950/30 px-2.5 py-1.5 text-[10px] text-indigo-200 hover:bg-indigo-950/50 transition-colors"
        >
          Recreate all missing {symbolRef.kind}s from invalid nodes
        </button>
        <button
          type="button"
          onClick={onDeleteNode}
          className="text-left rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Delete this invalid node
        </button>
        <button
          type="button"
          onClick={onDeleteAllForSymbol}
          className="text-left rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Delete all invalid nodes for this {symbolRef.kind}
        </button>
      </div>
    </div>
  );
}
