'use client';

import React from 'react';
import { FolderOutput, Layers, Radio } from 'lucide-react';
import type { ExplorerTab } from './constants';

const CORE_TABS: { id: ExplorerTab; label: string; icon: typeof Radio }[] = [
  { id: 'symbols', label: 'Symbols', icon: Radio },
  { id: 'output', label: 'Output', icon: FolderOutput },
];

const API_TAB: { id: ExplorerTab; label: string; icon: typeof Layers } = {
  id: 'api',
  label: 'API',
  icon: Layers,
};

export function ExplorerTabs({
  value,
  onChange,
  showApiTab,
  tabIssueCounts,
}: {
  value: ExplorerTab;
  onChange: (tab: ExplorerTab) => void;
  showApiTab: boolean;
  tabIssueCounts?: Partial<Record<ExplorerTab, number>>;
}) {
  const visible = showApiTab ? [...CORE_TABS, API_TAB] : CORE_TABS;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-zinc-800/60" role="tablist">
      {visible.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        const issues = tabIssueCounts?.[id] ?? 0;
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
            {!active && issues > 0 ? (
              <span className="min-w-[14px] h-3.5 px-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[8px] tabular-nums leading-none flex items-center justify-center">
                {issues > 9 ? '9+' : issues}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
