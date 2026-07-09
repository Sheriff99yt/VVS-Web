'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { INDENT } from './constants';

export function CategorySection({
  title,
  count,
  icon,
  expanded,
  onToggle,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-800/40 last:border-b-0">
      <div
        className={`flex items-center gap-1 py-1.5 pr-2 cursor-pointer select-none group ${INDENT.root} hover:bg-zinc-900/50`}
        onClick={onToggle}
      >
        <span className="p-0.5 text-zinc-500 shrink-0">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-400 flex-1">
          {title}
        </span>
        <span className="text-[9px] text-zinc-600 tabular-nums">{count}</span>
        {onAdd ? (
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
            title={addLabel}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus size={12} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
      </div>
      {expanded ? <div className="pb-1">{children}</div> : null}
    </div>
  );
}
