'use client';

import React from 'react';
import { LIBRARY_LANGUAGE_LABELS } from '@/lib/librarySearch';

interface EnvironmentLanguageFilterProps {
  active: string | 'all';
  languages: string[];
  counts: Record<string, number>;
  onChange: (language: string | 'all') => void;
}

export function EnvironmentLanguageFilter({
  active,
  languages,
  counts,
  onChange,
}: EnvironmentLanguageFilterProps) {
  if (languages.length === 0) return null;
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
        All languages
        <span className="ml-1.5 text-zinc-600 font-mono">{counts.all ?? 0}</span>
      </button>
      {languages.map((id) => {
        const count = counts[id] ?? 0;
        if (count === 0) return null;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`px-3 py-1 text-[11px] rounded border transition-colors ${
              active === id
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {LIBRARY_LANGUAGE_LABELS[id] ?? id}
            <span className="ml-1.5 text-zinc-600 font-mono">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
