'use client';

import React from 'react';
import { Boxes, Layers, Radio } from 'lucide-react';
import type { ExplorerTab } from './constants';

const TABS: { id: ExplorerTab; label: string; icon: typeof Boxes }[] = [
  { id: 'structure', label: 'Structure', icon: Boxes },
  { id: 'symbols', label: 'Symbols', icon: Radio },
  { id: 'api', label: 'API', icon: Layers },
];

export function ExplorerTabs({
  value,
  onChange,
  showApiTab,
}: {
  value: ExplorerTab;
  onChange: (tab: ExplorerTab) => void;
  showApiTab: boolean;
}) {
  const visible = showApiTab ? TABS : TABS.filter((tab) => tab.id !== 'api');

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-zinc-800/60" role="tablist">
      {visible.map(({ id, label, icon: Icon }) => {
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
