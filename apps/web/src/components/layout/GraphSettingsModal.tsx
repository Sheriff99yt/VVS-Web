'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { GraphPropertiesPanel } from './RightSidebar/GraphPropertiesPanel';
import { GraphCodegenPanel, ProjectCodegenDefaultsPanel } from './CodegenTargetPanel';
import { CrossOverArchitecturePanel } from './CrossOverArchitecturePanel';
import { PortabilitySummaryPanel } from './PortabilitySummaryPanel';
import { SyntaxPackLockPanel } from './SyntaxPackLockPanel';
import { AppSettingsPanel } from './AppSettingsPanel';

export type SettingsTab = 'project' | 'app';

export const OPEN_SETTINGS_EVENT = 'vvs:open-settings';
/** @deprecated use OPEN_SETTINGS_EVENT / dispatchOpenSettings */
export const GRAPH_SETTINGS_EVENT = OPEN_SETTINGS_EVENT;

export function dispatchOpenSettings(tab: SettingsTab = 'project'): void {
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT, { detail: { tab } }));
}

export function GraphSettingsModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('project');

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: SettingsTab }>).detail;
      setTab(detail?.tab === 'app' ? 'app' : 'project');
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] bg-black/50">
      <div
        className="w-[min(460px,calc(100%-24px))] max-h-[80vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden"
        role="dialog"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 shrink-0 gap-2">
          <div className="min-w-0">
            <h2 id="settings-title" className="text-xs font-semibold text-zinc-200">
              Settings
            </h2>
            <div className="flex items-center gap-0.5 mt-1.5">
              <button
                type="button"
                onClick={() => setTab('project')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  tab === 'project'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                Project
              </button>
              <button
                type="button"
                onClick={() => setTab('app')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  tab === 'app'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                App
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 shrink-0"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 space-y-5">
          {tab === 'project' ? (
            <>
              <section className="space-y-1">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                  Active graph
                </p>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Language and export for the graph you are editing. Other graphs keep their own
                  overrides.
                </p>
              </section>
              <GraphCodegenPanel />
              <div className="border-t border-zinc-800/80 pt-4">
                <GraphPropertiesPanel />
              </div>
              <div className="border-t border-zinc-800/80 pt-4">
                <ProjectCodegenDefaultsPanel />
              </div>
              <div className="border-t border-zinc-800/80 pt-4">
                <SyntaxPackLockPanel />
              </div>
              <div className="border-t border-zinc-800/80 pt-4">
                <PortabilitySummaryPanel />
              </div>
              <div className="border-t border-zinc-800/80 pt-4">
                <CrossOverArchitecturePanel />
              </div>
            </>
          ) : (
            <AppSettingsPanel onCloseSettings={() => setOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
