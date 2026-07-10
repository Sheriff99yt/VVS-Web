'use client';

import React from 'react';
import type { ExplorerTab } from './constants';
import type { ProjectTreeMode } from './constants';

const HINTS: Record<ExplorerTab, Record<ProjectTreeMode, string>> = {
  symbols: {
    canvas: 'Graphs, classes, and symbols · ⚠ restores Declare · drag rows to spawn',
    references: 'Class-scoped symbols · click to focus references',
  },
  output: {
    canvas: '.vvs metadata and workspace files · click generated files to open in Code panel',
    references: 'Project on-disk layout (read-only in reference mode)',
  },
  api: {
    canvas: 'Spawn native calls and handlers from linked environment',
    references: 'Environment API browse only in edit mode',
  },
};

export function ExplorerFooterHint({
  tab,
  mode,
}: {
  tab: ExplorerTab;
  mode: ProjectTreeMode;
}) {
  const copy = HINTS[tab][mode];
  return (
    <div className="flex-none px-3 py-1.5 border-t border-zinc-800 text-[9px] text-zinc-600 text-center leading-snug">
      {copy}
    </div>
  );
}
