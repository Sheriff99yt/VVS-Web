'use client';

import React from 'react';
import type { LanguageFamily } from '@vvs/graph-types';
import { usePackRegistry } from '@/hooks/usePackRegistry';
import { usePackReleases, type AvailableRelease } from '@/hooks/usePackReleases';
import {
  RefreshCw,
  Check,
  Layers,
  ChevronRight,
  Plus,
  Download,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const LANGUAGE_FAMILIES: { id: LanguageFamily; name: string }[] = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript / TypeScript' },
  { id: 'cpp', name: 'C++' },
  { id: 'verse', name: 'Verse' },
  { id: 'gdscript', name: 'GDScript' },
  { id: 'rust', name: 'Rust' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
];

export function PacksView() {
  const {
    packPool,
    syntaxPackLock,
    setBasePackVersion,
    toggleOverlayVersion,
    installPackManifest,
  } = usePackRegistry();

  const {
    repoInput,
    setRepoInput,
    applyRepo,
    isCheckingUpdates,
    availableUpdates,
    checkedAt,
    error,
    dismissError,
    installingId,
    checkUpdates,
    downloadAndInstallRelease,
  } = usePackReleases();

  const handleCheck = () => {
    void checkUpdates(packPool);
  };

  const handleInstall = (update: AvailableRelease) => {
    void downloadAndInstallRelease(update, (manifest) => {
      installPackManifest(manifest);
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-300 font-sans min-h-0 overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Layers className="text-zinc-400" size={16} />
            Syntax Pack Versions
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Configure pinned base packs, manage capability overlays, and check for new releases.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheck}
          disabled={isCheckingUpdates}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 text-[11px] font-medium text-zinc-200 rounded transition-colors"
        >
          {isCheckingUpdates ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {isCheckingUpdates ? 'Checking GitHub...' : 'Check for Updates'}
        </button>
      </div>

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Repository configuration input */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-3">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1.5">
            Pack repository (owner/name)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="VVS-Web/syntax-packs"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-700"
            />
            <button
              type="button"
              onClick={applyRepo}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] text-zinc-200 rounded transition-colors"
            >
              Apply
            </button>
          </div>
          <p className="text-[9px] text-zinc-600 mt-1.5 leading-relaxed">
            Releases are fetched from this GitHub repo. Asset naming: <code className="font-mono">{`{family}.base@{version}.json`}</code> or <code className="font-mono">{`{family}.{overlay}@{version}.json`}</code>.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/40 rounded p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[11px] font-medium text-red-300">GitHub request failed</p>
              <p className="text-[10px] text-red-400/80 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={dismissError}
              className="text-[10px] text-red-400/60 hover:text-red-300 px-1"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Available updates */}
        {availableUpdates.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-900/30 rounded p-4">
            <h2 className="text-[12px] font-medium text-amber-300 flex items-center gap-1.5 mb-2">
              <Download size={14} />
              New Syntax Pack Releases Available
            </h2>
            <p className="text-[11px] text-zinc-400 mb-3">
              Releases are fetched from the remote repository. Adding them installs them into your local workspace.
            </p>
            <div className="divide-y divide-zinc-900 bg-zinc-950 border border-zinc-850 rounded overflow-hidden">
              {availableUpdates.map((update) => {
                const installKey = `${update.id}@${update.version}`;
                const installing = installingId === installKey;
                return (
                  <div key={installKey} className="flex items-center justify-between p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-zinc-200">{update.displayName}</span>
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">
                          {update.version}
                        </span>
                        {update.isOverlay && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/25">
                            Overlay
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Target: {update.family} | Release: {update.asset.releaseTag}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInstall(update)}
                      disabled={installing}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[10px] font-medium rounded transition-colors"
                    >
                      {installing ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      {installing ? 'Installing...' : 'Add Version'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {checkedAt && availableUpdates.length === 0 && !error && (
          <div className="bg-zinc-900/50 border border-zinc-850 rounded p-3 text-center">
            <span className="text-[10px] text-zinc-500">
              Checked for updates at {checkedAt}. All syntax packs are up to date.
            </span>
          </div>
        )}

        {/* Language Families Table */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-900 text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
            <div className="col-span-3">Language Target</div>
            <div className="col-span-4">Active Base Pack Pinned</div>
            <div className="col-span-5">Overlay Packs</div>
          </div>

          <div className="divide-y divide-zinc-900">
            {LANGUAGE_FAMILIES.map((family) => {
              const currentLock = syntaxPackLock?.[family.id];
              const activeBase = currentLock?.base ?? `${family.id}.base@1`;
              const activeOverlays = currentLock?.overlays ?? [];

              const baseVersions = packPool.filter((p) => p.id === `${family.id}.base`);
              const overlaysAvailable = packPool.filter(
                (p) => p.id.startsWith(family.id) && p.id !== `${family.id}.base`
              );

              return (
                <div key={family.id} className="grid grid-cols-12 gap-4 px-4 py-4.5 items-start">
                  <div className="col-span-3">
                    <span className="text-[11px] font-medium text-zinc-200">{family.name}</span>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{family.id}</p>
                  </div>

                  <div className="col-span-4 space-y-2">
                    <div className="relative">
                      <select
                        value={activeBase}
                        onChange={(e) => setBasePackVersion(family.id, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer appearance-none"
                      >
                        {baseVersions.length > 0 ? (
                          baseVersions.map((p) => {
                            const ref = `${p.id}@${p.version}`;
                            return (
                              <option key={ref} value={ref}>
                                {p.id} ({p.version})
                              </option>
                            );
                          })
                        ) : (
                          <option value={`${family.id}.base@1`}>
                            {family.id}.base (1)
                          </option>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-zinc-500">
                        <ChevronRight size={12} className="rotate-90" />
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      Active: {activeBase}
                    </span>
                  </div>

                  <div className="col-span-5 space-y-2">
                    {overlaysAvailable.length > 0 ? (
                      <div className="space-y-1.5">
                        {overlaysAvailable.map((ov) => {
                          const ref = `${ov.id}@${ov.version}`;
                          const isActive = activeOverlays.includes(ref);
                          return (
                            <label
                              key={ref}
                              className="flex items-start gap-2 text-[11px] cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => toggleOverlayVersion(family.id, ref)}
                                className="sr-only"
                              />
                              <div
                                className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  isActive
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                                    : 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700'
                                }`}
                              >
                                {isActive && <Check size={9} strokeWidth={3} />}
                              </div>
                              <div className="flex-1">
                                <span className="text-zinc-300">{ov.id}</span>
                                <span className="text-[9px] text-zinc-500 font-mono ml-1.5">({ov.version})</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-600 italic">
                        No overlays registered for this language.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Information Footer */}
        <div className="bg-zinc-900/10 border border-zinc-900 rounded p-4 flex gap-3">
          <AlertTriangle size={15} className="text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-medium text-zinc-400">About Syntax Packs</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Syntax packs act as the authoritative print layer mapping visual nodes to output code. Standard releases are bundled automatically with VVS. Pinned locks are stored directly in your <code className="bg-zinc-900 border border-zinc-800 px-1 rounded text-zinc-400 font-mono">.vvs/project.json</code> file, ensuring portability across environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
