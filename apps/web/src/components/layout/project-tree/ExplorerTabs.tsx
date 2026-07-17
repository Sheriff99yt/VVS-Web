'use client';

import React, { useMemo } from 'react';
import { FolderOutput, Layers, Radio } from 'lucide-react';
import type { ExplorerTab } from './constants';
import { Tooltip } from '@/components/ui/Tooltip';

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
  const order = useMemo<ExplorerTab[]>(
    () => (showApiTab ? ['symbols', 'output', 'api'] : ['symbols', 'output']),
    [showApiTab]
  );

  const current = order.includes(value) ? value : order[0];
  const next = order[(order.indexOf(current) + 1) % order.length];
  const { label, icon: Icon } = TAB_META[current];
  const nextLabel = TAB_META[next].label;
  const issues = tabIssueCounts?.[current] ?? 0;
  const otherIssues =
    current === 'symbols' ? 0 : (tabIssueCounts?.symbols ?? 0);

  return (
    <Tooltip content={`${label} · click → ${nextLabel}`} placement="bottom">
      <button
        type="button"
        role="tab"
        aria-label={`${label} view. Click for ${nextLabel}`}
        onClick={() => onChange(next)}
        className="relative inline-flex items-center justify-center w-7 h-7 shrink-0 rounded text-indigo-400/90 hover:bg-zinc-800/70 hover:text-indigo-300 transition-colors"
      >
        <Icon size={14} />
        {otherIssues > 0 || issues > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-amber-500/90 text-zinc-950 text-[8px] font-bold tabular-nums leading-none flex items-center justify-center">
            {(otherIssues || issues) > 9 ? '9+' : otherIssues || issues}
          </span>
        ) : null}
      </button>
    </Tooltip>
  );
}
