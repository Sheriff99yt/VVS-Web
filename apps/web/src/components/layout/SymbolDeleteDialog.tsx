'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { SymbolRefKind } from '@vvs/graph-types';

export interface SymbolDeleteDialogProps {
  open: boolean;
  kind: SymbolRefKind;
  symbolName: string;
  itemCount?: number;
  nodeCount: number;
  graphCount: number;
  onCancel: () => void;
  onDeleteSymbolOnly: () => void;
  onDeleteSymbolAndRefs: () => void;
}

const KIND_LABELS: Record<SymbolRefKind, string> = {
  variable: 'variable',
  function: 'function',
  event: 'event',
  macro: 'macro',
};

export function SymbolDeleteDialog({
  open,
  kind,
  symbolName,
  itemCount = 1,
  nodeCount,
  graphCount,
  onCancel,
  onDeleteSymbolOnly,
  onDeleteSymbolAndRefs,
}: SymbolDeleteDialogProps) {
  if (!open) return null;

  const multi = itemCount > 1;
  const usageText =
    nodeCount === 0
      ? 'Not referenced in any graph.'
      : `${nodeCount} node${nodeCount === 1 ? '' : 's'} in ${graphCount} graph${graphCount === 1 ? '' : 's'}.`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="symbol-delete-title"
      >
        <div className="flex items-start gap-3 border-b border-zinc-800 px-4 py-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 id="symbol-delete-title" className="text-sm font-medium text-white">
              {multi ? `Delete ${itemCount} symbols?` : `Delete ${KIND_LABELS[kind]}?`}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              <span className="text-zinc-200">{symbolName}</span> — {usageText}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 text-[11px] text-zinc-500 leading-relaxed">
          <p>
            <span className="text-zinc-300">Delete symbol only</span> — removes the{' '}
            {multi ? 'symbols' : KIND_LABELS[kind]} and {multi ? 'their' : 'its'} Declare from the
            project. Use nodes stay on the graph as invalid. Select one later in Details to recreate
            the symbol from that node.
          </p>
          <p>
            <span className="text-zinc-300">Delete symbol and uses</span> — also removes every bound
            node on graphs and closes related tabs where applicable. Nothing left to recreate from.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDeleteSymbolOnly}
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Delete symbol only
          </button>
          <button
            type="button"
            onClick={onDeleteSymbolAndRefs}
            className="flex-1 rounded border border-red-900/60 bg-red-950/50 px-3 py-2 text-xs text-red-200 hover:bg-red-900/40 transition-colors"
          >
            Delete symbol and uses
          </button>
        </div>
      </div>
    </div>
  );
}
