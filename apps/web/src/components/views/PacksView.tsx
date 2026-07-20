'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { listSyntaxPacks, registerPack, type SyntaxPackManifest } from '@vvs/syntax-packs';
import type { LanguageFamily, SyntaxPackLock, SyntaxPackLockEntry } from '@vvs/graph-types';
import { 
  RefreshCw, 
  Check, 
  Layers, 
  ChevronRight, 
  Plus, 
  Download,
  AlertTriangle
} from 'lucide-react';

const LANGUAGE_FAMILIES: { id: LanguageFamily; name: string }[] = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript / TypeScript' },
  { id: 'cpp', name: 'C++' },
  { id: 'verse', name: 'Verse' },
  { id: 'gdscript', name: 'GDScript' },
  { id: 'rust', name: 'Rust' },
  { id: 'csharp', name: 'C#' }
];

// Simulated updates dictionary
interface SimulatedRelease {
  id: string;
  name: string;
  version: string;
  family: LanguageFamily;
  isOverlay: boolean;
  templatesCount: number;
}

const SIMULATED_UPDATES: SimulatedRelease[] = [
  {
    id: 'python.base',
    name: 'Python Base Pack',
    version: '1.2.0-beta',
    family: 'python',
    isOverlay: false,
    templatesCount: 45
  },
  {
    id: 'python.base',
    name: 'Python Base Pack',
    version: '2.0.0-rc1',
    family: 'python',
    isOverlay: false,
    templatesCount: 52
  },
  {
    id: 'javascript.es2026',
    name: 'JavaScript ES2026 Features',
    version: '1.0.0',
    family: 'javascript',
    isOverlay: true,
    templatesCount: 8
  },
  {
    id: 'cpp.base',
    name: 'C++ Modern Base Pack',
    version: '1.1.0',
    family: 'cpp',
    isOverlay: false,
    templatesCount: 60
  },
  {
    id: 'verse.base',
    name: 'Verse Experimental Pack',
    version: '1.0.5',
    family: 'verse',
    isOverlay: false,
    templatesCount: 38
  }
];

export function PacksView() {
  const { syntaxPackLock, setSyntaxPackLock } = useProject();

  // Load registered packs from package
  const [packPool, setPackPool] = useState<SyntaxPackManifest[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [availableUpdates, setAvailableUpdates] = useState<SimulatedRelease[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  // Initialize pool of packs, load accumulated ones from localStorage if any
  useEffect(() => {
    const defaultPacks = listSyntaxPacks();
    const stored = localStorage.getItem('vvs_accumulated_packs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SyntaxPackManifest[];
        // Merge without duplicating
        const merged = [...defaultPacks];
        for (const p of parsed) {
          if (!merged.some(x => x.id === p.id && x.version === p.version)) {
            merged.push(p);
          }
        }
        setPackPool(merged);
        return;
      } catch (e) {
        console.error('Failed to parse stored pack pool', e);
      }
    }
    setPackPool(defaultPacks);
  }, []);

  const savePackPool = (updatedPool: SyntaxPackManifest[]) => {
    setPackPool(updatedPool);
    // Filter to only save simulated/added packs that are not in default listSyntaxPacks
    const defaults = listSyntaxPacks();
    const custom = updatedPool.filter(p => !defaults.some(x => x.id === p.id && x.version === p.version));
    localStorage.setItem('vvs_accumulated_packs', JSON.stringify(custom));
  };

  const handleCheckUpdates = () => {
    setIsCheckingUpdates(true);
    setAvailableUpdates([]);
    
    setTimeout(() => {
      setIsCheckingUpdates(false);
      // Filter out updates already in pack pool
      const filtered = SIMULATED_UPDATES.filter(
        up => !packPool.some(p => p.id === up.id && p.version === up.version)
      );
      setAvailableUpdates(filtered);
      setCheckedAt(new Date().toLocaleTimeString());
    }, 800);
  };

  const handleInstallRelease = (release: SimulatedRelease) => {
    const newPack: SyntaxPackManifest = {
      id: release.id,
      version: release.version,
      family: release.family,
      templates: {}, // Empty mockup templates for rendering list UI
      layout: {
        indentUnit: '  ',
        bodyIndent: '  ',
        commentPrefix: '#',
        instanceReceiver: 'self',
        emptyFunctionBody: 'pass',
        emptyHandlerBody: 'pass',
        blockPlaceholder: 'TODO'
      }
    };

    const updatedPool = [...packPool, newPack];
    savePackPool(updatedPool);
    registerPack(newPack);

    // Remove from available updates list
    setAvailableUpdates(prev => prev.filter(x => !(x.id === release.id && x.version === release.version)));
  };

  const handleSetBasePack = (family: LanguageFamily, baseVersion: string) => {
    setSyntaxPackLock((prev: SyntaxPackLock | undefined) => {
      const next: SyntaxPackLock = { ...prev };
      const current = next[family];
      next[family] = {
        base: baseVersion,
        overlays: current?.overlays ?? []
      };
      return next;
    });
  };

  const handleToggleOverlay = (family: LanguageFamily, overlayRef: string) => {
    setSyntaxPackLock((prev: SyntaxPackLock | undefined) => {
      const next: SyntaxPackLock = { ...prev };
      const current = next[family];
      const overlays = current?.overlays ?? [];
      const updatedOverlays = overlays.includes(overlayRef)
        ? overlays.filter(o => o !== overlayRef)
        : [...overlays, overlayRef];

      next[family] = {
        base: current?.base ?? `${family}.base@1`,
        overlays: updatedOverlays
      };
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-300 font-sans min-h-0 overflow-y-auto">
      {/* View Header */}
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
          onClick={handleCheckUpdates}
          disabled={isCheckingUpdates}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 text-[11px] font-medium text-zinc-200 rounded transition-colors"
        >
          <RefreshCw size={13} className={isCheckingUpdates ? 'animate-spin' : ''} />
          {isCheckingUpdates ? 'Checking GitHub...' : 'Check for Updates'}
        </button>
      </div>

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Simulated Updates Section */}
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
              {availableUpdates.map((update) => (
                <div key={`${update.id}@${update.version}`} className="flex items-center justify-between p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-200">{update.name}</span>
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
                      Target: {update.family} | Templates: {update.templatesCount}
                    </p>
                  </div>
                  <button
                    onClick={() => handleInstallRelease(update)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-medium rounded transition-colors"
                  >
                    <Plus size={11} />
                    Add Version
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkedAt && availableUpdates.length === 0 && (
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

              // Filter pool for base versions matching this language family
              const baseVersions = packPool.filter(p => p.id === `${family.id}.base`);
              // Filter pool for overlays matching this language family
              const overlaysAvailable = packPool.filter(p => p.id.startsWith(family.id) && p.id !== `${family.id}.base`);

              return (
                <div key={family.id} className="grid grid-cols-12 gap-4 px-4 py-4.5 items-start">
                  {/* Language Family */}
                  <div className="col-span-3">
                    <span className="text-[11px] font-medium text-zinc-200">{family.name}</span>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{family.id}</p>
                  </div>

                  {/* Active Base Pack */}
                  <div className="col-span-4 space-y-2">
                    <div className="relative">
                      <select
                        value={activeBase}
                        onChange={(e) => handleSetBasePack(family.id, e.target.value)}
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

                  {/* Overlays list */}
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
                                onChange={() => handleToggleOverlay(family.id, ref)}
                                className="sr-only"
                              />
                              <div className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700'}`}>
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

        {/* Information Panel */}
        <div className="bg-zinc-900/10 border border-zinc-900 rounded p-4 flex gap-3">
          <AlertTriangle size={15} className="text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-medium text-zinc-400">About Syntax Packs</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Syntax packs act as the authoritative print layer mapping visual nodes to output code. Standard releases are bundled automatically with VVS. Pinned locks are stored directly in your <code className="bg-zinc-900 border border-zinc-800 px-1 rounded text-zinc-400 font-mono">.vvs/project.json</code> file, ensuring portability of code-generation target layouts across environments and team repositories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
