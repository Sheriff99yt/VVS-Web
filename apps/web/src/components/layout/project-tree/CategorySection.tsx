'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { INDENT, type SectionViewMode } from './constants';
import { SectionViewToggle } from './SectionViewToggle';
import { sectionBodyClass } from './explorerStyles';

export function CategorySection({
  title,
  count,
  issueCount = 0,
  icon,
  expanded,
  onToggle,
  onAdd,
  addLabel,
  viewMode = 'list',
  onViewModeChange,
  children,
}: {
  title: string;
  count: number;
  issueCount?: number;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
  viewMode?: SectionViewMode;
  onViewModeChange?: (mode: SectionViewMode) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-800/40 last:border-b-0">
      <div
        className={`flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer select-none group ${INDENT.root} hover:bg-zinc-900/50`}
        onClick={onToggle}
      >
        <span className="p-0.5 text-zinc-500 shrink-0">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-400 flex-1 min-w-0 truncate">
          {title}
        </span>
        {!expanded && issueCount > 0 ? (
          <Tooltip content={`${issueCount} missing on canvas`} placement="top">
            <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
              {issueCount}
            </span>
          </Tooltip>
        ) : null}
        <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">{count}</span>
        {expanded && onViewModeChange ? (
          <SectionViewToggle value={viewMode} onChange={onViewModeChange} />
        ) : onViewModeChange ? (
          <span className="w-6 shrink-0" aria-hidden />
        ) : null}
        {onAdd ? (
          <Tooltip content={addLabel} placement="top">
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200 shrink-0"
              aria-label={addLabel}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Plus size={14} />
            </button>
          </Tooltip>
        ) : (
          <span className="w-6 shrink-0" />
        )}
      </div>
      {expanded ? (
        <div className={sectionBodyClass(viewMode)}>{children}</div>
      ) : null}
    </div>
  );
}
