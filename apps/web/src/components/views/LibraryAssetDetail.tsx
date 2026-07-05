'use client';

import React from 'react';
import { X, Download, Heart, ExternalLink, Trash2, Package, FileCode } from 'lucide-react';
import { LibraryAsset, InstalledLibraryEntry } from '@/types/libraryAsset';
import { loadEnvironmentManifest, summarizeEnvironmentManifest } from '@vvs/environment-templates';

interface LibraryAssetDetailProps {
  asset: LibraryAsset;
  installed?: InstalledLibraryEntry;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onOpenInProject: () => void;
  /** When set, primary action uses this label and skips install gate for environments */
  startProjectLabel?: string;
  onStartProject?: () => void;
}

function assetTypeBadgeClass(type: LibraryAsset['type']) {
  if (type === 'Scripts') return 'bg-blue-500/20 text-blue-400';
  if (type === 'Node packs') return 'bg-emerald-500/20 text-emerald-400';
  if (type === 'Environments') return 'bg-indigo-500/20 text-indigo-400';
  return 'bg-purple-500/20 text-purple-400';
}

export function LibraryAssetDetail({
  asset,
  installed,
  onClose,
  onInstall,
  onUninstall,
  onOpenInProject,
  startProjectLabel,
  onStartProject,
}: LibraryAssetDetailProps) {
  const isInstalled = Boolean(installed);
  const canOpenInProject = asset.importKind !== 'node_pack_only';
  const envManifest =
    asset.importKind === 'environment' && asset.environmentId
      ? loadEnvironmentManifest(asset.environmentId)
      : undefined;
  const envSummary = envManifest ? summarizeEnvironmentManifest(envManifest) : null;

  return (
    <div className="w-96 shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">Asset details</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${assetTypeBadgeClass(asset.type)}`}
          >
            {asset.type}
          </span>
          <h2 className="text-lg font-bold text-zinc-100 mt-2 leading-tight">{asset.title}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            by <span className="text-zinc-400">{asset.author}</span>
            {asset.environmentVersion ? (
              <span className="ml-2 font-mono text-zinc-600">v{asset.environmentVersion}</span>
            ) : null}
          </p>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">{asset.description}</p>

        {envSummary ? (
          <div className="text-[10px] text-zinc-500 space-y-1.5 rounded border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>{envSummary.nativeCount} natives</span>
              <span>{envSummary.eventCount} events</span>
              <span>{envSummary.methodCount} methods</span>
            </div>
            {envSummary.hostFilePaths.length > 0 ? (
              <div className="flex items-start gap-1.5 font-mono text-zinc-600">
                <FileCode size={11} className="shrink-0 mt-0.5" />
                <span>{envSummary.hostFilePaths.join(', ')}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {asset.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>

        {asset.type !== 'Environments' ? (
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Download size={14} /> {asset.downloads}
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={14} /> {asset.likes}
            </div>
          </div>
        ) : null}

        <div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            {asset.importKind === 'environment' ? 'Entry file preview' : 'Preview'}
          </div>
          <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto leading-relaxed">
            {asset.previewCode}
          </pre>
        </div>

        {asset.importKind === 'node_pack_only' && (
          <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-950 border border-zinc-800 rounded p-3">
            <Package size={14} className="shrink-0 mt-0.5 text-emerald-500" />
            <span>
              Node packs extend the spawn catalog. Install to unlock nodes in the canvas context menu
              (mock — full catalog wiring TBD).
            </span>
          </div>
        )}

        {asset.importKind === 'environment' && (
          <div className="flex items-start gap-2 text-xs text-zinc-500 bg-indigo-500/5 border border-indigo-500/20 rounded p-3">
            <FileCode size={14} className="shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Links the project to this environment manifest. Host files are emitted from the
              template at codegen — edit logic in graphs, not by rebuilding boilerplate visually.
            </span>
          </div>
        )}

        {isInstalled && installed?.linkedGraphId && (
          <div className="text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
            Imported as graph <span className="font-mono">{installed.linkedGraphId}</span>
          </div>
        )}

        {isInstalled && installed?.environmentVersion && asset.importKind === 'environment' && (
          <div className="text-xs text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 rounded px-3 py-2">
            Linked at manifest version <span className="font-mono">v{installed.environmentVersion}</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        {onStartProject && startProjectLabel ? (
          <>
            <button
              type="button"
              onClick={onStartProject}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              {startProjectLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-zinc-700 text-zinc-400 hover:text-zinc-300 py-2 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </>
        ) : !isInstalled ? (
          <button
            type="button"
            onClick={onInstall}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Download size={14} />
            {asset.importKind === 'environment' ? 'Add to project' : 'Install to project'}
          </button>
        ) : (
          <>
            {canOpenInProject && (
              <button
                type="button"
                onClick={onOpenInProject}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} />
                {asset.importKind === 'environment' ? 'Link environment' : 'Open in project'}
              </button>
            )}
            <button
              type="button"
              onClick={onUninstall}
              className="w-full border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/40 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Uninstall
            </button>
          </>
        )}
      </div>
    </div>
  );
}
