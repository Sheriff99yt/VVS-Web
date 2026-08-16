'use client';

import React, { useMemo } from 'react';
import { FolderOutput, Layers, Radio } from 'lucide-react';
import type { ExplorerTab } from './constants';
import { Tooltip } from '@/components/ui/Tooltip';
import { explorerTabOrder } from './explorerUtils';

const TAB_META: Record<
  ExplorerTab,
  { label: string; icon: typeof Radio }
> = {
  symbols: { label: 'Symbols', icon: Radio },
  output: { label: 'Output', icon: FolderOutput },
  api: { label: 'API', icon: Layers },
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
  const order = useMemo(() => explorerTabOrder(showApiTab), [showApiTab]);
  const current = order.includes(value) ? value : order[0];

  return (
    <div role="tablist" aria-label="Explorer views" className="flex items-center shrink-0">
      {order.map((tab) => {
        const { label, icon: Icon } = TAB_META[tab];
        const selected = tab === current;
        const issues = tabIssueCounts?.[tab] ?? 0;
        return (
          <Tooltip key={tab} content={label} placement="bottom">
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={label}
              onClick={() => onChange(tab)}
              className={`relative inline-flex items-center justify-center w-7 h-7 shrink-0 rounded transition-colors ${
                selected
                  ? 'text-indigo-300 bg-zinc-800/80'
                  : 'text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300'
              }`}
            >
              <Icon size={14} />
              {issues > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-amber-500/90 text-zinc-950 text-[8px] font-bold tabular-nums leading-none flex items-center justify-center">
                  {issues > 9 ? '9+' : issues}
                </span>
              ) : null}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
