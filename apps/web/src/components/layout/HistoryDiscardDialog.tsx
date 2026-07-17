'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  acceptHistoryDiscard,
  cancelHistoryDiscard,
  getHistoryDiscardGateState,
  jumpToLatestHistory,
  subscribeHistoryDiscardGate,
} from '@/lib/historyDiscardGate';

function useHistoryDiscardGate() {
  return useSyncExternalStore(
    subscribeHistoryDiscardGate,
    getHistoryDiscardGateState,
    getHistoryDiscardGateState
  );
}

/**
 * Prompt only when a *new* edit would discard redo/History futures.
 * Undo, redo, and History jumps never open this dialog.
 */
export function HistoryDiscardDialog() {
  const { open, newerCount } = useHistoryDiscardGate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelHistoryDiscard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const plural = newerCount === 1 ? '' : 's';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={cancelHistoryDiscard}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-discard-title"
      >
        <div className="flex items-start gap-3 border-b border-zinc-800 px-4 py-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 id="history-discard-title" className="text-sm font-medium text-white">
              Discard newer History?
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              You are browsing an older History row with{' '}
              <span className="text-zinc-200">
                {newerCount} newer state{plural}
              </span>{' '}
              still available. Editing now discards that newer progress. Undo and Redo never ask —
              only browsing History does.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={cancelHistoryDiscard}
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={jumpToLatestHistory}
            className="flex-1 rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 hover:bg-zinc-700 transition-colors"
          >
            Jump to latest
          </button>
          <button
            type="button"
            onClick={acceptHistoryDiscard}
            className="flex-1 rounded border border-amber-900/60 bg-amber-950/50 px-3 py-2 text-xs text-amber-100 hover:bg-amber-900/40 transition-colors"
          >
            Discard & continue
          </button>
        </div>
      </div>
    </div>
  );
}
