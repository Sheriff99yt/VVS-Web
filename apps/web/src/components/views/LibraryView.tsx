'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Globe,
  Search,
  Download,
  Heart,
  Filter,
  Package,
  Check,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { COMMUNITY_LIBRARY_CATALOG, getLibraryAsset } from '@/lib/libraryCatalog';
import { buildLibraryImport, dispatchLibraryOpen } from '@/lib/libraryImport';
import { dispatchSwitchToCanvas } from '@/lib/editorNavigate';
import { LibraryAssetDetail } from './LibraryAssetDetail';
import type { LibraryAsset, LibraryAssetCategory } from '@/types/libraryAsset';
import { useEnvironmentCatalog } from '@/hooks/useEnvironmentCatalog';
import { environmentManifestToLibraryAsset } from '@/lib/environmentCatalog';
import { EnvironmentTemplatesPanel } from '@/components/environments/EnvironmentTemplatesPanel';
import { dispatchEnvironmentImportModal } from '@/components/environments/EnvironmentImportModal';
import { createProjectFromEnvironment } from '@vvs/environment-templates';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { saveProjectToStore } from '@/lib/projectStore';
import type { EnvironmentCategory } from '@vvs/environment-templates';

type LibrarySection = 'templates' | 'community' | 'installed';

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

  const [activeSection, setActiveSection] = useState<LibrarySection>(() => {
    if (initialSection === 'templates' || initialSection === 'community' || initialSection === 'installed') {
      return initialSection;
    }
    return 'templates';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommunityCategory, setActiveCommunityCategory] = useState<
    LibraryAssetCategory | 'All'
  >('All');
  const [activeEnvCategory, setActiveEnvCategory] = useState<EnvironmentCategory | 'all'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);

  const environmentAssets = useMemo(
    () => environments.map(environmentManifestToLibraryAsset),
    [environments]
  );

  const communityCatalog = COMMUNITY_LIBRARY_CATALOG;

  const installedIds = useMemo(
    () => new Set(installedLibrary.map((e) => e.assetId)),
    [installedLibrary]
  );

  const filteredCommunity = communityCatalog.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      activeCommunityCategory === 'All' || asset.type === activeCommunityCategory;
    return matchesSearch && matchesCategory;
  });

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

  const assetTypeBadgeClass = (type: LibraryAsset['type']) => {
    if (type === 'Scripts') return 'bg-blue-500/20 text-blue-400';
    if (type === 'Node packs') return 'bg-emerald-500/20 text-emerald-400';
    if (type === 'Environments') return 'bg-indigo-500/20 text-indigo-400';
    return 'bg-purple-500/20 text-purple-400';
  };

  const renderCommunityCard = (asset: LibraryAsset, showInstall = true) => {
    const installed = installedIds.has(asset.id);
    return (
      <div
        key={asset.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          setSelectedEnvironmentId(null);
          setSelectedAssetId(asset.id);
        }}
        onKeyDown={(e) => e.key === 'Enter' && setSelectedAssetId(asset.id)}
        className={`bg-zinc-900 border rounded-lg overflow-hidden flex flex-col hover:border-zinc-600 transition-colors cursor-pointer text-left ${
          selectedAssetId === asset.id ? 'border-indigo-500/60' : 'border-zinc-800'
        }`}
      >
        <div className="p-5 flex flex-col h-full relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {installed && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                <Check size={10} /> Installed
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${assetTypeBadgeClass(asset.type)}`}
            >
              {asset.type}
            </span>
          </div>
          <h3 className="font-bold text-lg text-zinc-100 mb-1 pr-24 leading-tight">{asset.title}</h3>
          <p className="text-xs text-zinc-500 mb-3">
            by <span className="text-zinc-400">{asset.author}</span>
          </p>
          <p className="text-sm text-zinc-400 mb-4 flex-1 leading-relaxed line-clamp-3">
            {asset.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50 mt-auto">
            <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Download size={14} /> {asset.downloads}
              </div>
              <div className="flex items-center gap-1.5">
                <Heart size={14} /> {asset.likes}
              </div>
            </div>
            {showInstall && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (installed) setSelectedAssetId(asset.id);
                  else handleInstall(asset.id);
                }}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 ${
                  installed
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 hover:bg-white text-zinc-900'
                }`}
              >
                {installed ? <>View</> : <>Install</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const sectionMeta = {
    templates: {
      title: 'Project templates',
      description: 'Start from an environment manifest — host files, natives, and events included.',
      icon: Layers,
    },
    community: {
      title: 'Community',
      description: 'Mock community scripts, node packs, and graph templates.',
      icon: Globe,
    },
    installed: {
      title: 'Installed in project',
      description: `${installedAssets.length} asset${installedAssets.length === 1 ? '' : 's'} linked to this project.`,
      icon: Package,
    },
  }[activeSection];

  const SectionIcon = sectionMeta.icon;

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden text-zinc-300">
      <div className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Library
          </h2>
          <div className="flex flex-col gap-1">
            {(
              [
                { id: 'templates' as const, label: 'Templates', icon: Layers, count: environments.length },
                {
                  id: 'community' as const,
                  label: 'Community',
                  icon: Globe,
                  count: communityCatalog.length,
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
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-zinc-800 text-white border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} className={activeSection === id ? 'text-indigo-400' : ''} />
                  {label}
                </span>
                {count > 0 && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 rounded-full font-mono">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeSection === 'community' && (
          <div className="px-4 pb-4 border-t border-zinc-800/60 pt-4 mt-2">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Filter</p>
            <div className="flex flex-col gap-1">
              {(['All', 'Scripts', 'Node packs', 'Templates'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCommunityCategory(cat)}
                  className={`text-left px-2 py-1.5 text-xs rounded transition-colors ${
                    activeCommunityCategory === cat
                      ? 'text-zinc-100 bg-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
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

              {activeSection === 'community' && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search community assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded pl-8 pr-3 py-2 w-64 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
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

            {activeSection === 'community' && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-zinc-600 mb-6">
                  <BookOpen size={12} />
                  Examples and demos also live under Community until wired to real catalog APIs.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCommunity.map((asset) => renderCommunityCard(asset))}
                  {filteredCommunity.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                      <Filter size={32} className="mb-4 text-zinc-600" />
                      <h3 className="text-zinc-300 font-semibold mb-1">No assets found</h3>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'installed' && (
              <>
                {installedAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {installedAssets.map(({ asset }) => renderCommunityCard(asset, false))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                    <Package size={32} className="mb-4 text-zinc-600" />
                    <h3 className="text-zinc-300 font-semibold mb-1">Nothing installed yet</h3>
                    <p className="text-sm max-w-sm mb-4">
                      Pick a project template or install a community asset for this project.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveSection('templates')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Browse templates →
                    </button>
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

        {selectedAsset && !selectedEnvironmentId && (
          <LibraryAssetDetail
            asset={selectedAsset}
            installed={selectedInstalled}
            onClose={() => setSelectedAssetId(null)}
            onInstall={() => handleInstall(selectedAsset.id)}
            onUninstall={() => handleUninstall(selectedAsset.id)}
            onOpenInProject={() => handleOpenInProject(selectedAsset)}
          />
        )}
      </div>
    </div>
  );
}
