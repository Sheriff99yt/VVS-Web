'use client';

import React from 'react';
import { Boxes, AlertTriangle } from 'lucide-react';
import type { ClassSymbol } from '@vvs/graph-types';

export function SymbolsScopeBar({
  activeClass,
  symbolCount,
  missingDeclareCount,
  onFocusClass,
}: {
  activeClass: ClassSymbol | undefined;
  symbolCount: number;
  missingDeclareCount: number;
  onFocusClass?: () => void;
}) {
  if (!activeClass) {
    return (
      <div className="px-2 py-1.5 border-b border-zinc-800/60 bg-zinc-900/30">
        <p className="text-[10px] text-zinc-500">Select a class to scope symbols.</p>
      </div>
    );
  }

  return (
    <div
      className="px-2 py-1 border-b border-zinc-800/60 bg-zinc-900/20 flex items-center gap-2 min-w-0"
      title="Functions, events, and variables are scoped to the active class. Graphs are tabs — assign a class to set where it generates code."
    >
      <Boxes size={11} className="text-violet-400/80 shrink-0" />
      <button
        type="button"
        onClick={onFocusClass}
        className="text-[11px] font-medium text-zinc-200 truncate hover:text-indigo-200 transition-colors min-w-0 flex-1 text-left"
        title="Open class graph"
      >
        {activeClass.name}
      </button>
      <span className="text-[9px] text-zinc-600 tabular-nums shrink-0">
        {symbolCount}
      </span>
      {missingDeclareCount > 0 ? (
        <span
          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 shrink-0"
          title="Symbols missing Declare or Handler nodes on canvas"
        >
          <AlertTriangle size={9} className="shrink-0" />
          {missingDeclareCount}
        </span>
      ) : (
        <span
          className="text-[8px] text-emerald-500/70 shrink-0"
          title="All symbols declared on canvas"
        >
          ✓
        </span>
      )}
    </div>
  );
}
