'use client';

import React from 'react';
import { Code2, Files } from 'lucide-react';

export type OutputViewTab = 'code' | 'files';

interface OutputViewTabsProps {
  value: OutputViewTab;
  onChange: (tab: OutputViewTab) => void;
}

const TABS: { id: OutputViewTab; label: string; icon: typeof Code2 }[] = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'files', label: 'Files', icon: Files },
];

export function OutputViewTabs({ value, onChange }: OutputViewTabsProps) {
  return (
    <div className="flex items-center gap-0.5" role="tablist" aria-label="Code output">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              active
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            <Icon size={11} className={active ? 'text-indigo-400' : 'text-zinc-600'} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
