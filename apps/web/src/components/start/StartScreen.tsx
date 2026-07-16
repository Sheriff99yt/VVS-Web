'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  FilePlus,
  Upload,
  Clock,
  Trash2,
  ChevronRight,
  Library,
  FolderPlus,
  FolderSearch,
  BookOpen,
  Map,
} from 'lucide-react';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import {
  USABILITY_EXAMPLE_TESTS,
  openUsabilityTestProject,
  seedUsabilityTestProjectsToLocalStorage,
  type UsabilityTestLevel,
} from '@/lib/usabilityExampleProjects';
import {
  createProjectId,
  loadProjectFromStore,
  removeFromRecentList,
  removeProjectFromStore,
  saveProjectToStore,
  upsertRecentProject,
  saveProjectDraft,
} from '@/lib/projectStore';
import {
  initRecentProjects,
  notifyRecentProjectsChanged,
  useRecentProjects,
} from '@/lib/recentProjectsSubscribe';
import { isProjectSnapshot } from '@/types/projectSnapshot';
import type { RecentProjectEntry } from '@/types/projectRegistry';
import { isFolderRecentEntry } from '@/types/projectRegistry';
import {
  createProjectInFolder,
  folderKeyFromHandleName,
  getFolderHandle,
  loadProjectFromFolder,
  pickProjectFolder,
  storeFolderHandle,
  verifyHandlePermission,
  resolveProjectFolderHandle,
  linkLocalProjectToFolder,
} from '@/lib/projectFolder';
import { ProjectFolderBrowserModal } from '@/components/start/ProjectFolderBrowserModal';
import { useFolderPickerSupported } from '@/hooks/useFolderPickerSupported';

function openLocalInEditor(
  router: ReturnType<typeof useRouter>,
  projectId: string,
  snapshot: ReturnType<typeof createEmptyProjectSnapshot>,
  source: RecentProjectEntry['source'],
  query?: Record<string, string>
) {
  saveProjectToStore(projectId, snapshot, source);
  notifyRecentProjectsChanged();
  const params = new URLSearchParams({ id: projectId });
  if (query) {
    for (const [key, value] of Object.entries(query)) params.set(key, value);
  }
  router.push(`/editor?${params.toString()}`);
}

function openFolderInEditor(
  router: ReturnType<typeof useRouter>,
  folderKey: string,
  query?: Record<string, string>
) {
  notifyRecentProjectsChanged();
  const params = new URLSearchParams({ id: folderKey });
  if (query) {
    for (const [key, value] of Object.entries(query)) params.set(key, value);
  }
  router.push(`/editor?${params.toString()}`);
}

function openEditorView(
  router: ReturnType<typeof useRouter>,
  view: 'library' | 'roadmap',
  section?: string
) {
  const id = createProjectId();
  saveProjectDraft(id, createEmptyProjectSnapshot());
  const params = new URLSearchParams({ id, view });
  if (section) params.set('section', section);
  router.push(`/editor?${params.toString()}`);
}

const SOURCE_LABEL: Record<RecentProjectEntry['source'], string> = {
  new: 'New',
  recent: 'Saved',
  import: 'Imported',
  template: 'Template',
  demo: 'Demo',
  test: 'Test Project',
};

export function StartScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recent = useRecentProjects();
  const folderPickerReady = useFolderPickerSupported();
  const [folderBrowser, setFolderBrowser] = useState<{
    handle: FileSystemDirectoryHandle;
    projectName: string;
  } | null>(null);

  useEffect(() => {
    initRecentProjects();
    seedUsabilityTestProjectsToLocalStorage();
  }, []);

  const refreshRecent = () => notifyRecentProjectsChanged();

  const handleNewProject = () => {
    const id = createProjectId();
    openLocalInEditor(router, id, createEmptyProjectSnapshot(), 'new');
  };

  const handleOpenUsabilityTest = (level: UsabilityTestLevel) => {
    try {
      const { projectId, snapshot } = openUsabilityTestProject(level);
      openLocalInEditor(router, projectId, snapshot, 'test');
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not open this usability test. Check browser storage settings and try again.'
      );
    }
  };

  const handleNewProjectFolder = async () => {
    const handle = await pickProjectFolder();
    if (!handle) return;
    const snapshot = createEmptyProjectSnapshot();
    try {
      await createProjectInFolder(handle, snapshot, { adoptExisting: true });
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Could not create project in that folder.'
      );
      return;
    }
    const folderKey = folderKeyFromHandleName(handle.name);
    await storeFolderHandle(folderKey, handle);
    upsertRecentProject({
      id: folderKey,
      moduleName: snapshot.projectDetails.moduleName,
      savedAt: new Date().toISOString(),
      source: 'new',
      storage: 'folder',
      folderLabel: handle.name,
    });
    openFolderInEditor(router, folderKey);
  };

  const handleOpenProjectFolder = async () => {
    const handle = await pickProjectFolder();
    if (!handle) return;
    const permitted = await verifyHandlePermission(handle);
    if (!permitted) return;
    const loaded = await loadProjectFromFolder(handle);
    if (!loaded) {
      window.alert('No .vvs/project.json found in that folder. Use "New in folder" to initialize one.');
      return;
    }
    const folderKey = folderKeyFromHandleName(handle.name);
    await storeFolderHandle(folderKey, handle);
    upsertRecentProject({
      id: folderKey,
      moduleName: loaded.snapshot.projectDetails.moduleName || handle.name,
      savedAt: loaded.snapshot.savedAt,
      source: 'recent',
      storage: 'folder',
      folderLabel: handle.name,
    });
    openFolderInEditor(router, folderKey);
  };

  const handleOpenRecent = async (entry: RecentProjectEntry) => {
    if (isFolderRecentEntry(entry)) {
      const handle = await getFolderHandle(entry.id);
      if (!handle) {
        window.alert('Folder access was lost. Use the folder button to reconnect.');
        return;
      }
      const permitted = await verifyHandlePermission(handle);
      if (!permitted) return;
      openFolderInEditor(router, entry.id);
      return;
    }
    const snapshot = loadProjectFromStore(entry.id);
    if (!snapshot) {
      removeProjectFromStore(entry.id);
      refreshRecent();
      return;
    }
    openLocalInEditor(router, entry.id, snapshot, 'recent');
  };

  const handleRemoveRecent = (e: React.MouseEvent, entry: RecentProjectEntry) => {
    e.stopPropagation();
    removeFromRecentList(entry.id);
    refreshRecent();
  };

  const handleOpenProjectDirectory = async (
    e: React.MouseEvent,
    entry: RecentProjectEntry
  ) => {
    e.stopPropagation();
    if (!folderPickerReady) {
      window.alert('Your browser does not support folder access. Use Chrome or Edge.');
      return;
    }

    let handle: FileSystemDirectoryHandle | null = null;

    if (isFolderRecentEntry(entry)) {
      handle = await resolveProjectFolderHandle(entry.id, entry.folderLabel);
    } else {
      const snapshot = loadProjectFromStore(entry.id);
      if (!snapshot) {
        window.alert('Project data not found in browser storage.');
        return;
      }
      handle = await linkLocalProjectToFolder(entry.id, snapshot);
      if (handle) {
        upsertRecentProject({
          ...entry,
          storage: 'folder',
          folderLabel: handle.name,
          savedAt: new Date().toISOString(),
        });
        notifyRecentProjectsChanged();
      }
    }

    if (handle) {
      setFolderBrowser({ handle, projectName: entry.moduleName });
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isProjectSnapshot(parsed)) {
        window.alert('Invalid VVS project file.');
        return;
      }
      const id = parsed.projectId ?? createProjectId();
      openLocalInEditor(router, id, { ...parsed, projectId: id }, 'import');
    } catch {
      window.alert('Could not parse JSON file.');
    }
  };

  const formatRelative = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.vvs.json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-100" />
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-wide">VVS 2.0</h1>
            <p className="text-xs text-zinc-500">Visual graphs that generate real code</p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">
          {folderPickerReady ? 'Git-friendly · .vvs/ overlay' : 'Offline · Local projects'}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Start
            </h2>
            <div className="flex flex-wrap gap-2">
              {folderPickerReady ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleNewProjectFolder()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 text-sm text-emerald-200 transition-colors"
                  >
                    <FolderPlus size={16} className="text-emerald-400" />
                    New project in folder
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOpenProjectFolder()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-sm text-zinc-300 transition-colors"
                  >
                    <FolderOpen size={16} className="text-blue-400" />
                    Open project folder
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleNewProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-sm text-zinc-300 transition-colors"
              >
                <FilePlus size={16} className="text-emerald-400" />
                New blank project
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-sm text-zinc-300 transition-colors"
              >
                <Upload size={16} className="text-blue-400" />
                Open file
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen size={14} /> Usability tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {USABILITY_EXAMPLE_TESTS.map((fixture) => (
                <button
                  key={fixture.id}
                  type="button"
                  onClick={() => handleOpenUsabilityTest(fixture.level)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-indigo-500/40 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded ${
                        fixture.level === 'simple'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-indigo-400 bg-indigo-500/10'
                      }`}
                    >
                      {fixture.level === 'simple' ? 'Baseline' : 'Full coverage'}
                    </span>
                    <span className="text-[11px] text-zinc-600 font-mono">{fixture.moduleName}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-2 group-hover:text-white transition-colors">
                    {fixture.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{fixture.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {fixture.highlights.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Explore
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openEditorView(router, 'library', 'templates')}
                className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-indigo-500/40 transition-colors text-left group"
              >
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <Library size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-100">Library</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Project templates, environments, and community assets
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 shrink-0 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => openEditorView(router, 'roadmap')}
                className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-500/40 transition-colors text-left group"
              >
                <div className="p-2 rounded bg-zinc-500/10 text-zinc-300 group-hover:bg-zinc-500/20 transition-colors">
                  <Map size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-100">Roadmap</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Current features and what&apos;s coming next
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 shrink-0 group-hover:text-zinc-300 transition-colors" />
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Clock size={14} /> Recent projects
            </h2>
            {recent.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center">
                <p className="text-zinc-500 text-sm mb-3">No recent projects yet.</p>
                <button
                  type="button"
                  onClick={() => handleOpenUsabilityTest('simple')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Open Hello World usability test →
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                {recent.map((entry) => (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleOpenRecent(entry)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleOpenRecent(entry)}
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
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => void handleOpenProjectDirectory(e, entry)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            void handleOpenProjectDirectory(
                              e as unknown as React.MouseEvent,
                              entry
                            );
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-blue-400 rounded transition-colors shrink-0"
                        title={
                          isFolderRecentEntry(entry)
                            ? 'Browse project folder'
                            : 'Save to folder on disk and browse'
                        }
                      >
                        <FolderSearch size={14} />
                      </span>
                    ) : null}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveRecent(e, entry)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRemoveRecent(e as unknown as React.MouseEvent, entry);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 rounded transition-all"
                      title="Remove from recent"
                    >
                      <Trash2 size={14} />
                    </span>
                    <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

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
