'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { SectionViewMode } from './constants';

/** List/grid control — no chrome; fades in on section hover like the + button. */
export function SectionViewToggle({
  value,
  onChange,
}: {
  value: SectionViewMode;
  onChange: (mode: SectionViewMode) => void;
}) {
  const next: SectionViewMode = value === 'list' ? 'grid' : 'list';
  return (
    <button
      type="button"
      title={value === 'list' ? 'Grid view' : 'List view'}
      aria-label={value === 'list' ? 'Switch to grid view' : 'Switch to list view'}
      onClick={(e) => {
        e.stopPropagation();
        onChange(next);
      }}
      className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 shrink-0 transition-opacity"
    >
      {value === 'list' ? <LayoutGrid size={14} /> : <List size={14} />}
    </button>
  );
}
