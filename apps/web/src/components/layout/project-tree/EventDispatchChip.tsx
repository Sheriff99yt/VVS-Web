'use client';

import React from 'react';
import { Zap } from 'lucide-react';

/** Inline dispatch affordance on event rows (replaces nested dispatch child rows). */
export function EventDispatchChip({ dispatchCount }: { dispatchCount: number }) {
  if (dispatchCount > 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 shrink-0 px-1 py-0.5 rounded text-[8px] tabular-nums text-zinc-500 bg-zinc-800/60 border border-zinc-700/50"
        title={`${dispatchCount} dispatch node${dispatchCount === 1 ? '' : 's'} on canvas`}
      >
        <Zap size={8} className="text-violet-400/70 shrink-0" />
        {dispatchCount}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 shrink-0 px-1 py-0.5 rounded text-[8px] text-zinc-600 border border-dashed border-zinc-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
      title="Drag event row to graph to add a dispatch node"
    >
      <Zap size={8} className="shrink-0" />
      dispatch
    </span>
  );
}
