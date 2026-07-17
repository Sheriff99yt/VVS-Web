'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  FolderKanban,
  SlidersHorizontal,
  Keyboard,
  Volume2,
  Info,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { GraphPropertiesPanel } from './RightSidebar/GraphPropertiesPanel';
import { GraphCodegenPanel, ProjectCodegenDefaultsPanel } from './CodegenTargetPanel';
import { CrossOverArchitecturePanel } from './CrossOverArchitecturePanel';
import { PortabilitySummaryPanel } from './PortabilitySummaryPanel';
import { SyntaxPackLockPanel } from './SyntaxPackLockPanel';
import { AppSettingsPanel } from './AppSettingsPanel';
import { ShortcutsSettingsPanel } from '@/components/settings/ShortcutsSettingsPanel';
import { AudioSettingsPanel } from '@/components/settings/AudioSettingsPanel';
import { AboutSettingsPanel } from '@/components/settings/AboutSettingsPanel';
import { PRODUCT_NAME } from '@/lib/productName';

export type SettingsSection = 'project' | 'editor' | 'shortcuts' | 'audio' | 'about';

/** @deprecated use SettingsSection */
export type SettingsTab = 'project' | 'app';

export const OPEN_SETTINGS_EVENT = 'vvs:open-settings';
/** @deprecated use OPEN_SETTINGS_EVENT / dispatchOpenSettings */
export const GRAPH_SETTINGS_EVENT = OPEN_SETTINGS_EVENT;

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'project', label: 'Project', icon: <FolderKanban size={14} /> },
  { id: 'editor', label: 'Editor', icon: <SlidersHorizontal size={14} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={14} /> },
  { id: 'audio', label: 'Audio', icon: <Volume2 size={14} /> },
  { id: 'about', label: 'About', icon: <Info size={14} /> },
];

export function dispatchOpenSettings(section: SettingsSection | SettingsTab = 'project'): void {
  const mapped: SettingsSection =
    section === 'app' ? 'editor' : (section as SettingsSection);
  window.dispatchEvent(
    new CustomEvent(OPEN_SETTINGS_EVENT, { detail: { section: mapped } })
  );
}

export function GraphSettingsModal() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>('project');

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: SettingsSection; tab?: SettingsTab }>)
        .detail;
      const next =
        detail?.section ??
        (detail?.tab === 'app' ? 'editor' : detail?.tab === 'project' ? 'project' : 'project');
      setSection(next);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
      <div
        className="w-[min(720px,calc(100%-24px))] h-[min(560px,calc(100vh-48px))] flex bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="settings-title"
      >
        <aside className="w-44 shrink-0 border-r border-zinc-800 bg-zinc-950/80 flex flex-col">
          <div className="px-3 py-3 border-b border-zinc-800/80">
            <h2 id="settings-title" className="text-xs font-semibold text-zinc-200">
              Settings
            </h2>
            <p className="text-[9px] text-zinc-600 mt-0.5">{PRODUCT_NAME}</p>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left text-[11px] transition-colors ${
                  section === item.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/80'
                }`}
              >
                <span className="shrink-0 opacity-80">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex items-center justify-end px-3 py-2 border-b border-zinc-800 shrink-0">
            <Tooltip content="Close" placement="bottom">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              >
                <X size={14} />
              </button>
            </Tooltip>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
            {section === 'project' ? (
              <div className="space-y-5 max-w-lg">
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
              </div>
            ) : null}

            {section === 'editor' ? (
              <div className="max-w-lg">
                <AppSettingsPanel onCloseSettings={() => setOpen(false)} />
              </div>
            ) : null}

            {section === 'shortcuts' ? (
              <div className="max-w-lg">
                <ShortcutsSettingsPanel />
              </div>
            ) : null}

            {section === 'audio' ? (
              <div className="max-w-lg">
                <AudioSettingsPanel />
              </div>
            ) : null}

            {section === 'about' ? (
              <div className="max-w-lg">
                <AboutSettingsPanel />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
