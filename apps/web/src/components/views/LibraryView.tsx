'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Package,
  Layers,
  GitBranch,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { COMMUNITY_LIBRARY_CATALOG, getLibraryAsset } from '@/lib/libraryCatalog';
import { buildLibraryImport, dispatchLibraryOpen } from '@/lib/libraryImport';
import { dispatchSwitchToCanvas } from '@/lib/editorNavigate';
import { LibraryAssetDetail } from './LibraryAssetDetail';
import type { LibraryAsset } from '@/types/libraryAsset';
import { useEnvironmentCatalog } from '@/hooks/useEnvironmentCatalog';
import { environmentManifestToLibraryAsset } from '@/lib/environmentCatalog';
import { EnvironmentTemplatesPanel } from '@/components/environments/EnvironmentTemplatesPanel';
import { dispatchEnvironmentImportModal } from '@/components/environments/EnvironmentImportModal';
import { createProjectFromEnvironment } from '@vvs/environment-templates';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { saveProjectToStore } from '@/lib/projectStore';
import { editorHrefForProject, persistBrowseTemplateProject } from '@/lib/startExplore';
import type { EnvironmentCategory } from '@vvs/environment-templates';
import { useGitCatalog } from '@/hooks/useGitCatalog';
import { GitPackImportModal } from './GitPackImportModal';
import {
  filterEnvironmentsBySearch,
  filterGitReposBySearch,
  filterLibraryAssetsBySearch,
  libraryTemplateEmptyLabel,
} from '@/lib/librarySearch';

type LibrarySection = 'templates' | 'git_catalogs' | 'installed';

export function LibraryView({ browseMode = false }: { browseMode?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section');
  const {
    projectId,
    installedLibrary,
    setInstalledLibrary,
    setEnvironmentLink,
    setProjectDetails,
    setTargetLanguage,
    setTargetFileExtensions,
    setVariables,
    setEvents,
    setFunctions,
    setClasses,
    setActiveClassId,
    setOpenTabs,
    setActiveGraphTab,
    setAutoCompile,
    setAutoSave,
    setSelection,
    setIntegration,
  } = useProject();
  const { loadDocuments } = useGraphWorkspace();
  const { environments, ready: environmentsReady } = useEnvironmentCatalog();
  const { repos: gitRepos, addCatalogRepo, removeCatalogRepo } = useGitCatalog();

  const [activeSection, setActiveSection] = useState<LibrarySection>(() => {
    if (browseMode && initialSection === 'installed') return 'templates';
    if (initialSection === 'templates' || initialSection === 'git_catalogs' || initialSection === 'installed') {
      return initialSection;
    }
    return 'templates';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEnvCategory, setActiveEnvCategory] = useState<EnvironmentCategory | 'all'>('all');
  const [activeEnvLanguage, setActiveEnvLanguage] = useState<string | 'all'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [isGitImportModalOpen, setIsGitImportModalOpen] = useState(false);

  const environmentAssets = useMemo(
    () => environments.map(environmentManifestToLibraryAsset),
    [environments]
  );

  const filteredEnvironments = useMemo(
    () => filterEnvironmentsBySearch(environments, searchQuery),
    [environments, searchQuery]
  );

  const filteredGitRepos = useMemo(
    () => filterGitReposBySearch(gitRepos, searchQuery),
    [gitRepos, searchQuery]
  );

  const communityCatalog = COMMUNITY_LIBRARY_CATALOG;

  const installedIds = useMemo(
    () => new Set(installedLibrary.map((e) => e.assetId)),
    [installedLibrary]
  );

  const installedAssets = installedLibrary
    .map((entry) => ({
      entry,
      asset:
        getLibraryAsset(entry.assetId, environmentAssets) ??
        communityCatalog.find((a) => a.id === entry.assetId),
    }))
    .filter((row): row is { entry: (typeof installedLibrary)[0]; asset: LibraryAsset } =>
      Boolean(row.asset)
    );

  const filteredInstalledAssets = useMemo(
    () =>
      filterLibraryAssetsBySearch(
        installedAssets.map((row) => row.asset),
        searchQuery
      ).map((asset) => installedAssets.find((row) => row.asset.id === asset.id)!),
    [installedAssets, searchQuery]
  );

  const selectedAsset = selectedAssetId
    ? getLibraryAsset(selectedAssetId, environmentAssets) ??
      communityCatalog.find((a) => a.id === selectedAssetId) ??
      null
    : null;

  const selectedEnvironmentAsset = selectedEnvironmentId
    ? environmentAssets.find((a) => a.id === selectedEnvironmentId)
    : null;

  const selectedInstalled = selectedAssetId
    ? installedLibrary.find((e) => e.assetId === selectedAssetId)
    : undefined;

  const applySnapshotToProject = (snapshot: ReturnType<typeof createProjectFromEnvironment>) => {
    if (!snapshot) return;
    const withId = { ...snapshot, projectId };
    applyProjectSnapshot(withId, {
      setVariables,
      setEvents,
      setFunctions,
      setClasses,
      setActiveClassId,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setTargetFileExtensions,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
      setEnvironmentLink,
      setIntegration,
    });
    saveProjectToStore(projectId, withId, 'template');
  };

  const handleStartFromEnvironment = (environmentId: string) => {
    const snapshot = createProjectFromEnvironment(environmentId);
    if (!snapshot) return;
    if (browseMode) {
      const projectId = persistBrowseTemplateProject(snapshot);
      router.push(editorHrefForProject(projectId));
      return;
    }
    applySnapshotToProject(snapshot);
    setSelectedEnvironmentId(null);
    dispatchSwitchToCanvas();
  };

  const handleInstall = (assetId: string) => {
    if (installedIds.has(assetId)) return;
    const asset =
      getLibraryAsset(assetId, environmentAssets) ?? communityCatalog.find((a) => a.id === assetId);
    setInstalledLibrary((prev) => [
      ...prev,
      {
        assetId,
        installedAt: new Date().toISOString(),
        ...(asset?.environmentVersion ? { environmentVersion: asset.environmentVersion } : {}),
      },
    ]);
    setSelectedAssetId(assetId);
  };

  const handleUninstall = (assetId: string) => {
    setInstalledLibrary((prev) => prev.filter((e) => e.assetId !== assetId));
    if (selectedAssetId === assetId) setSelectedAssetId(null);
  };

  const handleOpenInProject = (asset: LibraryAsset) => {
    if (asset.importKind === 'environment') {
      handleStartFromEnvironment(asset.environmentId ?? asset.id);
      return;
    }

    const payload = buildLibraryImport(asset);
    if (!payload || ('kind' in payload && payload.kind === 'environment')) return;

    dispatchLibraryOpen(payload);
    setInstalledLibrary((prev) =>
      prev.map((e) =>
        e.assetId === asset.id && 'tab' in payload
          ? { ...e, linkedGraphId: payload.tab.id }
          : e
      )
    );
    dispatchSwitchToCanvas();
  };

  const section: LibrarySection =
    browseMode && activeSection === 'installed' ? 'templates' : activeSection;

  const librarySections = (
    [
      { id: 'templates' as const, label: 'Templates', icon: Layers, count: environments.length },
      { id: 'git_catalogs' as const, label: 'Git imports', icon: GitBranch, count: gitRepos.length },
      ...(!browseMode
        ? [
            {
              id: 'installed' as const,
              label: 'Installed',
              icon: Package,
              count: installedLibrary.length,
            },
          ]
        : []),
    ] as const
  );

  const sectionMeta = {
    templates: {
      title: 'Templates',
      description: 'Start from an environment. Host files, natives, and events come with it.',
      icon: Layers,
    },
    git_catalogs: {
      title: 'Git imports',
      description: 'Pack imports from GitHub repositories, releases, or a local manifest.',
      icon: GitBranch,
    },
    installed: {
      title: 'Installed',
      description: `${installedAssets.length} linked to this project.`,
      icon: Package,
    },
  }[section];

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden text-zinc-300 font-sans">
      <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col min-h-0">
        <div className="h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 shrink-0">
          Library
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5">
          {librarySections.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveSection(id);
                setSearchQuery('');
                setActiveEnvLanguage('all');
                setSelectedAssetId(null);
                setSelectedEnvironmentId(null);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors text-left ${
                section === id
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <Icon size={14} className="text-zinc-500 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {count > 0 ? (
                <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{count}</span>
              ) : null}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex min-w-0 h-full">
        <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto px-8 py-8 min-w-0">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div className="min-w-0 max-w-xl">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {sectionMeta.title}
                </h2>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{sectionMeta.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="relative w-56">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search"
                    aria-label="Search library catalog"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </label>
                {section === 'templates' ? (
                  <button
                    type="button"
                    onClick={() => dispatchEnvironmentImportModal()}
                    className="text-sm px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 transition-colors"
                  >
                    Import OpenAPI
                  </button>
                ) : null}
                {section === 'git_catalogs' ? (
                  <button
                    type="button"
                    onClick={() => setIsGitImportModalOpen(true)}
                    className="text-sm px-3 py-1.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:border-indigo-400/60 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Import git
                  </button>
                ) : null}
              </div>
            </div>


            {section === 'templates' && (
              <>
                {!environmentsReady ? (
                  <p className="text-sm text-zinc-600">Loading templates…</p>
                ) : (
                  <EnvironmentTemplatesPanel
                    environments={filteredEnvironments}
                    activeCategory={activeEnvCategory}
                    onCategoryChange={setActiveEnvCategory}
                    activeLanguage={activeEnvLanguage}
                    onLanguageChange={setActiveEnvLanguage}
                    onSelect={(id) => {
                      setSelectedAssetId(null);
                      setSelectedEnvironmentId(id);
                    }}
                    selectedId={selectedEnvironmentId}
                    emptyLabel={libraryTemplateEmptyLabel(searchQuery, activeEnvLanguage)}
                  />
                )}
              </>
            )}

            {section === 'git_catalogs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGitRepos.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center">
                      <p className="text-sm text-zinc-500">
                        {searchQuery.trim()
                          ? `No git catalogs match “${searchQuery.trim()}”.`
                          : 'No git catalogs yet.'}
                      </p>
                      {!searchQuery.trim() ? (
                        <button
                          type="button"
                          onClick={() => setIsGitImportModalOpen(true)}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                        >
                          <Plus size={14} />
                          Import git
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {filteredGitRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2 font-mono">
                            <GitBranch size={14} className="text-indigo-400" />
                            {repo.name}
                          </h3>
                          {repo.id !== 'vvs-official-packs' && (
                            <button
                              type="button"
                              onClick={() => removeCatalogRepo(repo.id)}
                              className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {repo.description || 'Custom Git pack catalog'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-zinc-800/60 mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {repo.owner}/{repo.repo}
                        </span>
                        <a
                          href={`https://github.com/${repo.owner}/${repo.repo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          View Repository <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!browseMode && section === 'installed' && (
              <>
                {filteredInstalledAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredInstalledAssets.map(({ asset }) => (
                      <div
                        key={asset.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3"
                      >
                        <h3 className="font-bold text-zinc-100">{asset.title}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{asset.description}</p>
                        {asset.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {asset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 font-mono">Active</span>
                          <button
                            type="button"
                            onClick={() => handleUninstall(asset.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                    <Package size={32} className="mb-4 text-zinc-600" />
                    <h3 className="text-zinc-300 font-semibold mb-1">
                      {searchQuery.trim() ? 'No installed items match' : 'Nothing installed yet'}
                    </h3>
                    <p className="text-sm max-w-sm mb-4">
                      {searchQuery.trim()
                        ? `Nothing installed matches “${searchQuery.trim()}”.`
                        : 'Pick a project template or import a custom Git catalog pack.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {selectedEnvironmentAsset && (
          <LibraryAssetDetail
            asset={selectedEnvironmentAsset}
            onClose={() => setSelectedEnvironmentId(null)}
            onInstall={() => {}}
            onUninstall={() => {}}
            onOpenInProject={() => handleStartFromEnvironment(selectedEnvironmentAsset.id)}
            startProjectLabel="Start project with this template"
            onStartProject={() => handleStartFromEnvironment(selectedEnvironmentAsset.id)}
          />
        )}
      </div>

      <GitPackImportModal
        isOpen={isGitImportModalOpen}
        onClose={() => setIsGitImportModalOpen(false)}
        onImportRepo={(url) => addCatalogRepo(url)}
      />
    </div>
  );
}
