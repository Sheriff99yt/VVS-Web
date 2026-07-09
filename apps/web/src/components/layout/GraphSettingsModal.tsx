'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { GraphPropertiesPanel } from './RightSidebar/GraphPropertiesPanel';
import { GraphCodegenPanel, ProjectCodegenDefaultsPanel } from './CodegenTargetPanel';
import { CrossOverArchitecturePanel } from './CrossOverArchitecturePanel';
import { PortabilitySummaryPanel } from './PortabilitySummaryPanel';
import { SyntaxPackLockPanel } from './SyntaxPackLockPanel';

export const GRAPH_SETTINGS_EVENT = 'vvs:open-graph-settings';

export function GraphSettingsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(GRAPH_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(GRAPH_SETTINGS_EVENT, onOpen);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] bg-black/50">
      <div
        className="w-[min(440px,calc(100%-24px))] max-h-[80vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden"
        role="dialog"
        aria-labelledby="graph-settings-title"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 shrink-0">
          <h2 id="graph-settings-title" className="text-xs font-semibold text-zinc-200">
            Graph & codegen settings
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 space-y-5">
          <GraphCodegenPanel />
          <div className="border-t border-zinc-800/80 pt-4">
            <ProjectCodegenDefaultsPanel />
          </div>
          <div className="border-t border-zinc-800/80 pt-4">
            <CrossOverArchitecturePanel />
          </div>
          <div className="border-t border-zinc-800/80 pt-4">
            <PortabilitySummaryPanel />
          </div>
          <div className="border-t border-zinc-800/80 pt-4">
            <SyntaxPackLockPanel />
          </div>
          <div className="border-t border-zinc-800/80 pt-4">
            <GraphPropertiesPanel onClose={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
