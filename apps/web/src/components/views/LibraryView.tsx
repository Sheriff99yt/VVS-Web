'use client';

import React, { useState, useMemo } from 'react';
import { Globe, Search, Download, Heart, Filter, Package, Check } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { LIBRARY_CATALOG, getLibraryAsset } from '@/lib/libraryCatalog';
import { buildLibraryImport, dispatchLibraryImport } from '@/lib/libraryImport';
import { dispatchSwitchToCanvas } from '@/lib/editorNavigate';
import { LibraryAssetDetail } from './LibraryAssetDetail';
import type { LibraryAsset, LibraryAssetCategory } from '@/types/libraryAsset';

type LibrarySection = 'discover' | 'installed';

export function LibraryView() {
  const { installedLibrary, setInstalledLibrary } = useProject();
  const [activeSection, setActiveSection] = useState<LibrarySection>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<LibraryAssetCategory | 'All'>('All');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const installedIds = useMemo(
    () => new Set(installedLibrary.map((e) => e.assetId)),
    [installedLibrary]
  );

  const filteredAssets = LIBRARY_CATALOG.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || asset.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const installedAssets = installedLibrary
    .map((entry) => ({ entry, asset: getLibraryAsset(entry.assetId) }))
    .filter((row): row is { entry: (typeof installedLibrary)[0]; asset: LibraryAsset } =>
      Boolean(row.asset)
    );

  const selectedAsset = selectedAssetId ? getLibraryAsset(selectedAssetId) : null;
  const selectedInstalled = selectedAssetId
    ? installedLibrary.find((e) => e.assetId === selectedAssetId)
    : undefined;

  const handleInstall = (assetId: string) => {
    if (installedIds.has(assetId)) return;
    setInstalledLibrary((prev) => [
      ...prev,
      { assetId, installedAt: new Date().toISOString() },
    ]);
    setSelectedAssetId(assetId);
  };

  const handleUninstall = (assetId: string) => {
    setInstalledLibrary((prev) => prev.filter((e) => e.assetId !== assetId));
    if (selectedAssetId === assetId) setSelectedAssetId(null);
  };

  const handleOpenInProject = (asset: LibraryAsset) => {
    const payload = buildLibraryImport(asset);
    if (!payload) return;

    dispatchLibraryImport(payload);
    setInstalledLibrary((prev) =>
      prev.map((e) =>
        e.assetId === asset.id ? { ...e, linkedGraphId: payload.tab.id } : e
      )
    );
    dispatchSwitchToCanvas();
  };

  const renderAssetCard = (asset: LibraryAsset, showInstall = true) => {
    const installed = installedIds.has(asset.id);
    return (
      <div
        key={asset.id}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedAssetId(asset.id)}
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
              className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${
                asset.type === 'Scripts'
                  ? 'bg-blue-500/20 text-blue-400'
                  : asset.type === 'Node packs'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-purple-500/20 text-purple-400'
              }`}
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
                  if (installed) {
                    setSelectedAssetId(asset.id);
                  } else {
                    handleInstall(asset.id);
                  }
                }}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 ${
                  installed
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 hover:bg-white text-zinc-900'
                }`}
              >
                {installed ? (
                  <>View</>
                ) : (
                  <>
                    <Download size={14} /> Install
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden text-zinc-300">
      <div className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Community Library
          </h2>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveSection('discover');
                setSearchQuery('');
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                activeSection === 'discover'
                  ? 'bg-zinc-800 text-white border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <Globe size={16} className={activeSection === 'discover' ? 'text-emerald-400' : ''} />
              Discover
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection('installed');
                setSearchQuery('');
              }}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                activeSection === 'installed'
                  ? 'bg-zinc-800 text-white border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-3">
                <Package size={16} className={activeSection === 'installed' ? 'text-purple-400' : ''} />
                Installed
              </span>
              {installedLibrary.length > 0 && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded-full">
                  {installedLibrary.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-w-0 h-full">
        <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto p-8 min-w-0">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                {activeSection === 'discover' ? (
                  <Globe size={24} className="text-zinc-400" />
                ) : (
                  <Package size={24} className="text-zinc-400" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-1">
                    {activeSection === 'discover' ? 'Discover Community Scripts' : 'Installed Assets'}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    {activeSection === 'discover'
                      ? 'Browse, search, and install community-made visual scripts.'
                      : `${installedAssets.length} asset${installedAssets.length === 1 ? '' : 's'} in this project.`}
                  </p>
                </div>
              </div>

              {activeSection === 'discover' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-1">
                    {(['All', 'Scripts', 'Node packs', 'Templates'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          activeCategory === cat
                            ? 'bg-zinc-800 text-zinc-100 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search assets or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded pl-8 pr-3 py-2 w-64 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {activeSection === 'discover' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => renderAssetCard(asset))}
                {filteredAssets.length === 0 && (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                    <Filter size={32} className="mb-4 text-zinc-600" />
                    <h3 className="text-zinc-300 font-semibold mb-1">No community assets found</h3>
                    <p className="text-sm">Try adjusting your search or category filters.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'installed' && (
              <>
                {installedAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {installedAssets.map(({ asset }) => renderAssetCard(asset, false))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                    <Package size={32} className="mb-4 text-zinc-600" />
                    <h3 className="text-zinc-300 font-semibold mb-1">No Community Assets Installed</h3>
                    <p className="text-sm max-w-sm">
                      Browse Discover to find and install community scripts into this project.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {selectedAsset && (
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
