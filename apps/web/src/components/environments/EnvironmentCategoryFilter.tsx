'use client';

import React from 'react';
import {
  ENVIRONMENT_CATEGORIES,
  type EnvironmentCategory,
} from '@vvs/environment-templates';

interface EnvironmentCategoryFilterProps {
  active: EnvironmentCategory | 'all';
  counts: Record<EnvironmentCategory | 'all', number>;
  onChange: (category: EnvironmentCategory | 'all') => void;
}

export function EnvironmentCategoryFilter({
  active,
  counts,
  onChange,
}: EnvironmentCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`px-3 py-1 text-[11px] rounded border transition-colors ${
          active === 'all'
            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold'
            : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
        }`}
      >
        All
        <span className="ml-1.5 text-zinc-600 font-mono">{counts.all}</span>
      </button>
      {ENVIRONMENT_CATEGORIES.map((cat) => {
        const count = counts[cat.id] ?? 0;
        if (count === 0) return null;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`px-3 py-1 text-[11px] rounded border transition-colors ${
              active === cat.id
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {cat.label}
            <span className="ml-1.5 text-zinc-600 font-mono">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
