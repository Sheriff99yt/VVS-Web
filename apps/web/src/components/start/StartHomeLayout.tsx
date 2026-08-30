'use client';

import React from 'react';
import {
  FolderOpen,
  FilePlus,
  Upload,
  Clock,
  Trash2,
  ChevronRight,
  FolderPlus,
  FolderSearch,
  Layers,
} from 'lucide-react';
import { StandaloneTopBar } from '@/components/layout/StandaloneTopBar';
import { StartActivityRail } from '@/components/start/StartActivityRail';
import { ProjectFolderBrowserModal } from '@/components/start/ProjectFolderBrowserModal';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  USABILITY_EXAMPLE_TESTS,
  type UsabilityTestLevel,
} from '@/lib/usabilityExampleProjects';
import type { StartLocalActivityId } from '@/lib/startActivity';
import type { RecentProjectEntry } from '@/types/projectRegistry';
import { isFolderRecentEntry } from '@/types/projectRegistry';

const SOURCE_LABEL: Record<RecentProjectEntry['source'], string> = {
  new: 'New',
  recent: 'Saved',
  import: 'Imported',
  template: 'Template',
  demo: 'Demo',
  test: 'Test Project',
};

const SIDEBAR_BTN =
  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors text-left';

const MAIN_BTN =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-sm text-zinc-300 transition-colors';

type FolderBrowserState = {
  handle: FileSystemDirectoryHandle;
  projectName: string;
} | null;

export function StartHomeLayout({
  fileInputRef,
  folderPickerReady,
  recent,
  folderBrowser,
  startActivity,
  sidebarOpen,
  setStartActivity,
  setSidebarOpen,
  setFolderBrowser,
  onNewProject,
  onNewProjectFolder,
  onOpenProjectFolder,
  onImportFile,
  onOpenUsabilityTest,
  onOpenRecent,
  onDeleteProject,
  onOpenProjectDirectory,
  formatRelative,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderPickerReady: boolean;
  recent: RecentProjectEntry[];
  folderBrowser: FolderBrowserState;
  startActivity: StartLocalActivityId;
  sidebarOpen: boolean;
  setStartActivity: (id: StartLocalActivityId) => void;
  setSidebarOpen: (open: boolean) => void;
  setFolderBrowser: React.Dispatch<React.SetStateAction<FolderBrowserState>>;
  onNewProject: () => void;
  onNewProjectFolder: () => void;
  onOpenProjectFolder: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenUsabilityTest: (level: UsabilityTestLevel) => void;
  onOpenRecent: (entry: RecentProjectEntry) => void;
  onDeleteProject: (e: React.MouseEvent, entry: RecentProjectEntry) => void;
  onOpenProjectDirectory: (e: React.MouseEvent, entry: RecentProjectEntry) => void;
  formatRelative: (iso: string) => string;
}) {
  const sidebarTitle =
    startActivity === 'start' ? 'Start' : startActivity === 'recent' ? 'Recent' : 'Examples';

  return (
    <div className="h-screen bg-zinc-950 text-zinc-300 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.vvs.json,application/json"
        className="hidden"
        onChange={onImportFile}
      />

      <StandaloneTopBar />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <StartActivityRail
          active={startActivity}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLocalActivity={(id) => {
            setStartActivity(id);
            setSidebarOpen(true);
          }}
        />

        {sidebarOpen ? (
          <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col min-h-0">
            <div className="h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 shrink-0">
              {sidebarTitle}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5">
              {startActivity === 'start' ? (
                <>
                  {folderPickerReady ? (
                    <>
                      <button type="button" onClick={onNewProjectFolder} className={SIDEBAR_BTN}>
                        <FolderPlus size={14} className="text-emerald-400 shrink-0" />
                        New in folder
                      </button>
                      <button type="button" onClick={onOpenProjectFolder} className={SIDEBAR_BTN}>
                        <FolderOpen size={14} className="text-blue-400 shrink-0" />
                        Open folder
                      </button>
                    </>
                  ) : null}
                  <button type="button" onClick={onNewProject} className={SIDEBAR_BTN}>
                    <FilePlus size={14} className="text-emerald-400 shrink-0" />
                    New blank
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={SIDEBAR_BTN}
                  >
                    <Upload size={14} className="text-blue-400 shrink-0" />
                    Open file
                  </button>
                </>
              ) : null}

              {startActivity === 'recent' ? (
                recent.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-zinc-600">No recent projects yet.</p>
                ) : (
                  recent.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onOpenRecent(entry)}
                      className={SIDEBAR_BTN}
                      title={
                        isFolderRecentEntry(entry) && entry.folderLabel
                          ? `${entry.folderLabel} / ${entry.moduleName}`
                          : entry.moduleName
                      }
                    >
                      <FolderOpen size={14} className="text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {isFolderRecentEntry(entry) && entry.folderLabel
                          ? `${entry.folderLabel} / ${entry.moduleName}`
                          : entry.moduleName}
                      </span>
                    </button>
                  ))
                )
              ) : null}

              {startActivity === 'examples' ? (
                USABILITY_EXAMPLE_TESTS.map((fixture) => (
                  <button
                    key={fixture.id}
                    type="button"
                    onClick={() => onOpenUsabilityTest(fixture.level)}
                    className={SIDEBAR_BTN}
                  >
                    <Layers size={14} className="text-zinc-500 shrink-0" />
                    {fixture.title}
                  </button>
                ))
              ) : null}
            </div>
          </aside>
        ) : null}

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
            {startActivity === 'start' ? (
              <>
                <section className="space-y-5">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight max-w-3xl leading-snug">
                    An open visual scripting language, designed to slot into anything and become the global standard.
                  </h1>
                  <button
                    type="button"
                    onClick={() => onOpenUsabilityTest('simple')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:border-indigo-400/60 text-sm text-indigo-200 transition-colors"
                  >
                    Try Simple
                    <ChevronRight size={16} />
                  </button>
                </section>
                <StartActionButtons
                  folderPickerReady={folderPickerReady}
                  fileInputRef={fileInputRef}
                  onNewProject={onNewProject}
                  onNewProjectFolder={onNewProjectFolder}
                  onOpenProjectFolder={onOpenProjectFolder}
                />
              </>
            ) : null}

            {startActivity === 'recent' ? (
              <RecentProjectsPanel
                recent={recent}
                folderPickerReady={folderPickerReady}
                onOpenRecent={onOpenRecent}
                onDeleteProject={onDeleteProject}
                onOpenProjectDirectory={onOpenProjectDirectory}
                onOpenUsabilityTest={onOpenUsabilityTest}
                formatRelative={formatRelative}
              />
            ) : null}

            {startActivity === 'examples' ? (
              <ExamplesPanel onOpenUsabilityTest={onOpenUsabilityTest} />
            ) : null}
          </div>
        </main>
      </div>

      {folderBrowser ? (
        <ProjectFolderBrowserModal
          handle={folderBrowser.handle}
          projectName={folderBrowser.projectName}
          onClose={() => setFolderBrowser(null)}
        />
      ) : null}
    </div>
  );
}

function StartActionButtons({
  folderPickerReady,
  fileInputRef,
  onNewProject,
  onNewProjectFolder,
  onOpenProjectFolder,
}: {
  folderPickerReady: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onNewProject: () => void;
  onNewProjectFolder: () => void;
  onOpenProjectFolder: () => void;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Start</h2>
      <div className="flex flex-wrap gap-2">
        {folderPickerReady ? (
          <>
            <button
              type="button"
              onClick={onNewProjectFolder}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 text-sm text-emerald-200 transition-colors"
            >
              <FolderPlus size={16} className="text-emerald-400" />
              New project in folder
            </button>
            <button type="button" onClick={onOpenProjectFolder} className={MAIN_BTN}>
              <FolderOpen size={16} className="text-blue-400" />
              Open project folder
            </button>
          </>
        ) : null}
        <button type="button" onClick={onNewProject} className={MAIN_BTN}>
          <FilePlus size={16} className="text-emerald-400" />
          New blank project
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className={MAIN_BTN}>
          <Upload size={16} className="text-blue-400" />
          Open file
        </button>
      </div>
    </section>
  );
}

function RecentProjectsPanel({
  recent,
  folderPickerReady,
  onOpenRecent,
  onDeleteProject,
  onOpenProjectDirectory,
  onOpenUsabilityTest,
  formatRelative,
}: {
  recent: RecentProjectEntry[];
  folderPickerReady: boolean;
  onOpenRecent: (entry: RecentProjectEntry) => void;
  onDeleteProject: (e: React.MouseEvent, entry: RecentProjectEntry) => void;
  onOpenProjectDirectory: (e: React.MouseEvent, entry: RecentProjectEntry) => void;
  onOpenUsabilityTest: (level: UsabilityTestLevel) => void;
  formatRelative: (iso: string) => string;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
        <Clock size={14} /> Recent projects
      </h2>
      {recent.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center">
          <p className="text-zinc-500 text-sm mb-3">No recent projects yet.</p>
          <button
            type="button"
            onClick={() => onOpenUsabilityTest('simple')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Open Simple →
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {recent.map((entry) => (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenRecent(entry)}
              onKeyDown={(e) => e.key === 'Enter' && onOpenRecent(entry)}
              className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
            >
              <FolderOpen size={18} className="text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200 truncate">
                  {isFolderRecentEntry(entry) && entry.folderLabel
                    ? `${entry.folderLabel} / ${entry.moduleName}`
                    : entry.moduleName}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {formatRelative(entry.savedAt)}
                  {isFolderRecentEntry(entry) ? (
                    <span className="ml-2 text-zinc-600">· Folder</span>
                  ) : (
                    <span className="ml-2 text-zinc-600">· Browser</span>
                  )}
                  {entry.source !== 'recent' && !isFolderRecentEntry(entry) ? (
                    <span className="ml-2 text-zinc-600">· {SOURCE_LABEL[entry.source]}</span>
                  ) : null}
                </div>
              </div>
              {folderPickerReady ? (
                <Tooltip
                  content={
                    isFolderRecentEntry(entry)
                      ? 'Browse project folder'
                      : 'Save to folder on disk and browse'
                  }
                  placement="top"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => onOpenProjectDirectory(e, entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onOpenProjectDirectory(e as unknown as React.MouseEvent, entry);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors shrink-0"
                  >
                    <FolderSearch size={14} />
                  </span>
                </Tooltip>
              ) : null}
              <Tooltip content="Delete project" placement="top">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onDeleteProject(e, entry)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onDeleteProject(e as unknown as React.MouseEvent, entry);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 rounded transition-all"
                >
                  <Trash2 size={14} />
                </span>
              </Tooltip>
              <ChevronRight size={16} className="text-zinc-600 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ExamplesPanel({
  onOpenUsabilityTest,
}: {
  onOpenUsabilityTest: (level: UsabilityTestLevel) => void;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Layers size={14} /> Examples
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {USABILITY_EXAMPLE_TESTS.map((fixture) => (
          <button
            key={fixture.id}
            type="button"
            onClick={() => onOpenUsabilityTest(fixture.level)}
            className={`rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-indigo-500/40 transition-colors text-left group h-full ${
              fixture.id === 'simple' ? 'md:col-span-2' : 'min-h-[10.5rem]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded ${
                  fixture.level === 'simple'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : fixture.level === 'complex'
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-amber-400 bg-amber-500/10'
                }`}
              >
                {fixture.level === 'simple'
                  ? 'Baseline'
                  : fixture.level === 'complex'
                    ? 'All langs'
                    : 'Most langs'}
              </span>
              <span className="text-[11px] text-zinc-600 font-mono">{fixture.moduleName}</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mt-2 group-hover:text-white transition-colors">
              {fixture.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{fixture.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {fixture.highlights.map((tag) => (
                <span key={tag} className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
