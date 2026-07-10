'use client';

import React from 'react';
import { PANEL_SCROLL_ATTR } from '@/components/graph/useBlockCanvasWheel';

export function ExplorerPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col border-r border-zinc-800 min-h-0 min-w-[200px]">
      {children}
    </div>
  );
}

export function ExplorerScrollRegion({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-y-auto min-h-0 py-0.5 overscroll-contain"
      {...{ [PANEL_SCROLL_ATTR]: '' }}
    >
      {children}
    </div>
  );
}

export function ExplorerToolbarRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-none flex items-center gap-1 px-2 py-1 border-b border-zinc-800/60">
      {children}
    </div>
  );
}
