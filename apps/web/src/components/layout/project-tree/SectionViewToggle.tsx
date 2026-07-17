'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { SectionViewMode } from './constants';

export function SectionViewToggle({
  value,
  onChange,
}: {
  value: SectionViewMode;
  onChange: (mode: SectionViewMode) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded border border-zinc-800 overflow-hidden shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="List view"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        className={`p-1 ${
          value === 'list'
            ? 'bg-zinc-800 text-zinc-200'
            : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/60'
        }`}
      >
        <List size={14} />
      </button>
      <button
        type="button"
        title="Grid view"
        aria-pressed={value === 'grid'}
        onClick={() => onChange('grid')}
        className={`p-1 ${
          value === 'grid'
            ? 'bg-zinc-800 text-zinc-200'
            : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/60'
        }`}
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}
