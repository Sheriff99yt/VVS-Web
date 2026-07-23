'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Globe,
  Search,
  Download,
  Filter,
  Package,
  Check,
  Layers,
  GitBranch,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
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
import type { EnvironmentCategory } from '@vvs/environment-templates';
import { useGitCatalog } from '@/hooks/useGitCatalog';
import { GitPackImportModal } from './GitPackImportModal';

type LibrarySection = 'templates' | 'git_catalogs' | 'installed';

export function LibraryView() {
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
    if (initialSection === 'templates' || initialSection === 'git_catalogs' || initialSection === 'installed') {
      return initialSection;
    }
    return 'templates';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEnvCategory, setActiveEnvCategory] = useState<EnvironmentCategory | 'all'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [isGitImportModalOpen, setIsGitImportModalOpen] = useState(false);

  const environmentAssets = useMemo(
    () => environments.map(environmentManifestToLibraryAsset),
    [environments]
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

  const sectionMeta = {
    templates: {
      title: 'Project templates',
      description: 'Start from an environment manifest — host files, natives, and events included.',
      icon: Layers,
    },
    git_catalogs: {
      title: 'Git & release pack imports',
      description: 'Client-first pack imports directly from GitHub repositories, releases, or local manifests.',
      icon: GitBranch,
    },
    installed: {
      title: 'Installed in project',
      description: `${installedAssets.length} extension${installedAssets.length === 1 ? '' : 's'} linked to this project.`,
      icon: Package,
    },
  }[activeSection];

  const SectionIcon = sectionMeta.icon;

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden text-zinc-300 font-sans">
      <div className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Client-First Library
          </h2>
          <div className="flex flex-col gap-1">
            {(
              [
                { id: 'templates' as const, label: 'Templates', icon: Layers, count: environments.length },
                {
                  id: 'git_catalogs' as const,
                  label: 'Git Imports',
                  icon: GitBranch,
                  count: gitRepos.length,
                },
                {
                  id: 'installed' as const,
                  label: 'Installed',
                  icon: Package,
                  count: installedLibrary.length,
                },
              ] as const
            ).map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveSection(id);
                  setSearchQuery('');
                  setSelectedAssetId(null);
                  setSelectedEnvironmentId(null);
                }}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-zinc-800 text-white border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={15} className={activeSection === id ? 'text-indigo-400' : ''} />
                  {label}
                </span>
                {count > 0 && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full font-mono">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-w-0 h-full">
        <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto p-8 min-w-0">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <SectionIcon size={24} className="text-zinc-400" />
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-1">{sectionMeta.title}</h2>
                  <p className="text-zinc-400 text-sm">{sectionMeta.description}</p>
                </div>
              </div>

              {activeSection === 'templates' && (
                <button
                  type="button"
                  onClick={() => dispatchEnvironmentImportModal()}
                  className="text-xs px-3 py-2 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/15 transition-colors shrink-0"
                >
                  Import OpenAPI / AsyncAPI
                </button>
              )}

              {activeSection === 'git_catalogs' && (
                <button
                  type="button"
                  onClick={() => setIsGitImportModalOpen(true)}
                  className="text-xs px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Import Git Catalog Repo
                </button>
              )}
            </div>

            {activeSection === 'templates' && (
              <>
                {!environmentsReady ? (
                  <p className="text-sm text-zinc-600">Loading templates…</p>
                ) : (
                  <EnvironmentTemplatesPanel
                    environments={environments}
                    activeCategory={activeEnvCategory}
                    onCategoryChange={setActiveEnvCategory}
                    onSelect={(id) => {
                      setSelectedAssetId(null);
                      setSelectedEnvironmentId(id);
                    }}
                    selectedId={selectedEnvironmentId}
                  />
                )}
              </>
            )}

            {activeSection === 'git_catalogs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gitRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
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

            {activeSection === 'installed' && (
              <>
                {installedAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {installedAssets.map(({ asset }) => (
                      <div
                        key={asset.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3"
                      >
                        <h3 className="font-bold text-zinc-100">{asset.title}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{asset.description}</p>
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
                    <h3 className="text-zinc-300 font-semibold mb-1">Nothing installed yet</h3>
                    <p className="text-sm max-w-sm mb-4">
                      Pick a project template or import a custom Git catalog pack.
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
