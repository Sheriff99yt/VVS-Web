'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  FilePlus,
  Upload,
  Clock,
  Globe,
  Trash2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import { EXAMPLE_PROJECTS } from '@/lib/exampleProjects';
import { createProjectFromTemplate } from '@/lib/createProjectFromTemplate';
import {
  createProjectId,
  loadProjectFromStore,
  removeFromRecentList,
  removeProjectFromStore,
  saveProjectToStore,
} from '@/lib/projectStore';
import {
  initRecentProjects,
  notifyRecentProjectsChanged,
  useRecentProjects,
} from '@/lib/recentProjectsSubscribe';
import { LIBRARY_CATALOG } from '@/lib/libraryCatalog';
import { isProjectSnapshot } from '@/types/projectSnapshot';
import type { RecentProjectEntry } from '@/types/projectRegistry';

function openInEditor(
  router: ReturnType<typeof useRouter>,
  projectId: string,
  snapshot: ReturnType<typeof createEmptyProjectSnapshot>,
  source: RecentProjectEntry['source'],
  initialView?: 'canvas' | 'library'
) {
  saveProjectToStore(projectId, snapshot, source);
  notifyRecentProjectsChanged();
  const params = new URLSearchParams({ id: projectId });
  if (initialView === 'library') params.set('view', 'library');
  router.push(`/editor?${params.toString()}`);
}

const SOURCE_LABEL: Record<RecentProjectEntry['source'], string> = {
  new: 'New',
  recent: 'Saved',
  import: 'Imported',
  template: 'Template',
  demo: 'Demo',
};

export function StartScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recent = useRecentProjects();

  useEffect(() => {
    initRecentProjects();
  }, []);

  const templates = LIBRARY_CATALOG.filter((a) => a.type === 'Templates');

  const refreshRecent = () => notifyRecentProjectsChanged();

  const handleNewProject = () => {
    const id = createProjectId();
    openInEditor(router, id, createEmptyProjectSnapshot(), 'new');
  };

  const handleOpenExample = (level: 'simple' | 'complex') => {
    try {
      const def = EXAMPLE_PROJECTS.find((e) => e.level === level);
      if (!def) return;
      const id = createProjectId();
      openInEditor(router, id, def.create(), 'demo');
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not open this example. Check browser storage settings and try again.'
      );
    }
  };

  const handleOpenRecent = (entry: RecentProjectEntry) => {
    const snapshot = loadProjectFromStore(entry.id);
    if (!snapshot) {
      removeProjectFromStore(entry.id);
      refreshRecent();
      return;
    }
    openInEditor(router, entry.id, snapshot, 'recent');
  };

  const handleRemoveRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromRecentList(id);
    refreshRecent();
  };

  const handleBrowseLibrary = () => {
    const id = createProjectId();
    openInEditor(router, id, createEmptyProjectSnapshot(), 'new', 'library');
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
      openInEditor(router, id, { ...parsed, projectId: id }, 'import');
    } catch {
      window.alert('Could not parse JSON file.');
    }
  };

  const handleTemplate = (assetId: string) => {
    const asset = LIBRARY_CATALOG.find((a) => a.id === assetId);
    if (!asset) return;
    const id = createProjectId();
    openInEditor(router, id, createProjectFromTemplate(asset), 'template');
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
          Offline · Local projects
        </span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
          {/* Quick actions */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Start
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNewProject}
                className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-900/80 transition-colors text-left group"
              >
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <FilePlus size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">New project</div>
                  <div className="text-xs text-zinc-500">Empty graph with On Start</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-900/80 transition-colors text-left group"
              >
                <div className="p-2 rounded bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Open file</div>
                  <div className="text-xs text-zinc-500">Import a .vvs.json project</div>
                </div>
              </button>
            </div>
          </section>

          {/* Examples */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen size={14} /> Examples
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXAMPLE_PROJECTS.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => handleOpenExample(example.level)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-indigo-500/40 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded ${
                        example.level === 'simple'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-indigo-400 bg-indigo-500/10'
                      }`}
                    >
                      {example.level === 'simple' ? 'Simple' : 'Complex'}
                    </span>
                    <span className="text-[11px] text-zinc-600 font-mono">{example.moduleName}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-2 group-hover:text-white transition-colors">
                    {example.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{example.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {example.highlights.map((tag) => (
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

          {/* Recent */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Recent projects
              </h2>
            </div>
            {recent.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center text-zinc-600 text-sm">
                No recent projects. Create a new project or try an example to get started.
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                {recent.map((entry) => (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenRecent(entry)}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenRecent(entry)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
                  >
                    <FolderOpen size={18} className="text-zinc-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">
                        {entry.moduleName}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {formatRelative(entry.savedAt)}
                        {entry.source !== 'recent' && (
                          <span className="ml-2 text-zinc-600">· {SOURCE_LABEL[entry.source]}</span>
                        )}
                      </div>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveRecent(e, entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRemoveRecent(e as unknown as React.MouseEvent, entry.id);
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

          {/* Community templates */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} /> Community templates
              </h2>
              <button
                type="button"
                onClick={handleBrowseLibrary}
                className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                Browse full library →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleTemplate(asset.id)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-purple-500/40 transition-colors text-left"
                >
                  <span className="text-[10px] uppercase tracking-wide font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    Template
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-2">{asset.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{asset.description}</p>
                  <p className="text-[11px] text-zinc-600 mt-3">by {asset.author}</p>
                </button>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-zinc-600 col-span-2">No templates available.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
