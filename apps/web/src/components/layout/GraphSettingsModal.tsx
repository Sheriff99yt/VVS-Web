'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  FolderKanban,
  SlidersHorizontal,
  Keyboard,
  Volume2,
  Info,
  Search,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { GraphPropertiesPanel, type GraphPropertiesSection } from './RightSidebar/GraphPropertiesPanel';
import { GraphCodegenPanel, ProjectCodegenDefaultsPanel } from './CodegenTargetPanel';
import { CrossOverArchitecturePanel } from './CrossOverArchitecturePanel';
import { PortabilitySummaryPanel } from './PortabilitySummaryPanel';
import { SyntaxPackLockPanel } from './SyntaxPackLockPanel';
import { AppSettingsPanel } from './AppSettingsPanel';
import { ShortcutsSettingsPanel } from '@/components/settings/ShortcutsSettingsPanel';
import { AudioSettingsPanel } from '@/components/settings/AudioSettingsPanel';
import { AboutSettingsPanel } from '@/components/settings/AboutSettingsPanel';
import { PRODUCT_NAME } from '@/lib/productName';
import { anySettingsMatch, settingsBlockMatches } from '@/lib/settingsSearch';

export type SettingsSection = 'project' | 'editor' | 'shortcuts' | 'audio' | 'about';

/** @deprecated use SettingsSection. 'app' still opens Editor. */
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

function SearchGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ProjectSearchResults({ query }: { query: string }) {
  const thisGraph = settingsBlockMatches(query, 'this-graph');
  const defaults = settingsBlockMatches(query, 'project-defaults');
  const environment = settingsBlockMatches(query, 'environment');
  const exportPaths = settingsBlockMatches(query, 'export-paths');
  const details = settingsBlockMatches(query, 'graph-details');
  const packLock = settingsBlockMatches(query, 'pack-lock');
  const portability = settingsBlockMatches(query, 'portability');
  const coa = settingsBlockMatches(query, 'coa');
  if (
    !thisGraph &&
    !defaults &&
    !environment &&
    !exportPaths &&
    !details &&
    !packLock &&
    !portability &&
    !coa
  ) {
    return null;
  }

  const propertySections: GraphPropertiesSection[] = [
    ...(environment ? (['environment'] as const) : []),
    ...(exportPaths ? (['exportPaths'] as const) : []),
    ...(details ? (['details'] as const) : []),
  ];

  return (
    <SearchGroup
      icon={<FolderKanban size={13} className="text-indigo-400 shrink-0" />}
      title="Project"
    >
      {thisGraph ? <GraphCodegenPanel /> : null}
      {defaults ? <ProjectCodegenDefaultsPanel /> : null}
      {propertySections.length > 0 ? (
        <GraphPropertiesPanel sections={propertySections} />
      ) : null}
      {packLock ? <SyntaxPackLockPanel /> : null}
      {portability ? <PortabilitySummaryPanel /> : null}
      {coa ? <CrossOverArchitecturePanel /> : null}
    </SearchGroup>
  );
}

export function GraphSettingsModal() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>('project');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: SettingsSection; tab?: SettingsTab }>)
        .detail;
      const next =
        detail?.section ??
        (detail?.tab === 'app' ? 'editor' : detail?.tab === 'project' ? 'project' : 'project');
      setSection(next);
      setSearchQuery('');
      setOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const query = searchQuery.trim();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
      <div
        className="w-[min(880px,calc(100%-32px))] h-[min(640px,calc(100vh-48px))] flex bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="settings-title"
      >
        <aside className="w-48 shrink-0 border-r border-zinc-800 bg-zinc-950/80 flex flex-col">
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
                onClick={() => {
                  setSection(item.id);
                  if (searchQuery) setSearchQuery('');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left text-[11px] transition-colors ${
                  section === item.id && !searchQuery
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
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-zinc-800 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (searchQuery) {
                      e.stopPropagation();
                      setSearchQuery('');
                    } else {
                      setOpen(false);
                    }
                  }
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all settings (⌘,)..."
                className="w-full pl-7 pr-7 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>
            <Tooltip content="Close (Esc)" placement="bottom">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 shrink-0"
              >
                <X size={14} />
              </button>
            </Tooltip>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
            {query ? (
              <div className="space-y-6 max-w-2xl">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest pb-1 border-b border-zinc-800/80">
                  Search results across all tabs for &quot;{searchQuery}&quot;
                </div>

                {anySettingsMatch(query) ? (
                  <>
                    {settingsBlockMatches(query, 'editor') ? (
                      <SearchGroup
                        icon={<SlidersHorizontal size={13} className="text-indigo-400 shrink-0" />}
                        title="Editor"
                      >
                        <AppSettingsPanel onCloseSettings={() => setOpen(false)} searchQuery={searchQuery} />
                      </SearchGroup>
                    ) : null}

                    {settingsBlockMatches(query, 'shortcuts') ? (
                      <SearchGroup
                        icon={<Keyboard size={13} className="text-indigo-400 shrink-0" />}
                        title="Keyboard Shortcuts"
                      >
                        <ShortcutsSettingsPanel searchQuery={searchQuery} />
                      </SearchGroup>
                    ) : null}

                    {settingsBlockMatches(query, 'audio') ? (
                      <SearchGroup
                        icon={<Volume2 size={13} className="text-indigo-400 shrink-0" />}
                        title="Audio"
                      >
                        <AudioSettingsPanel searchQuery={searchQuery} />
                      </SearchGroup>
                    ) : null}

                    <ProjectSearchResults query={query} />

                    {settingsBlockMatches(query, 'about') ? (
                      <SearchGroup
                        icon={<Info size={13} className="text-indigo-400 shrink-0" />}
                        title="About"
                      >
                        <AboutSettingsPanel />
                      </SearchGroup>
                    ) : null}
                  </>
                ) : (
                  <p className="py-8 text-center text-zinc-500 text-[11px]">
                    No settings match &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            ) : (
              <>
                {section === 'project' ? (
                  <div className="space-y-5 max-w-2xl">
                    <GraphCodegenPanel />
                    <div className="border-t border-zinc-800/80 pt-4">
                      <ProjectCodegenDefaultsPanel />
                    </div>
                    <div className="border-t border-zinc-800/80 pt-4">
                      <GraphPropertiesPanel />
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
                  <div className="max-w-2xl">
                    <AppSettingsPanel onCloseSettings={() => setOpen(false)} searchQuery={searchQuery} />
                  </div>
                ) : null}

                {section === 'shortcuts' ? (
                  <div className="max-w-2xl">
                    <ShortcutsSettingsPanel />
                  </div>
                ) : null}

                {section === 'audio' ? (
                  <div className="max-w-2xl">
                    <AudioSettingsPanel />
                  </div>
                ) : null}

                {section === 'about' ? (
                  <div className="max-w-2xl">
                    <AboutSettingsPanel />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
