'use client';

import React from 'react';
import { X, Download, Heart, ExternalLink, Trash2, Package } from 'lucide-react';
import { LibraryAsset, InstalledLibraryEntry } from '@/types/libraryAsset';

interface LibraryAssetDetailProps {
  asset: LibraryAsset;
  installed?: InstalledLibraryEntry;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onOpenInProject: () => void;
}

export function LibraryAssetDetail({
  asset,
  installed,
  onClose,
  onInstall,
  onUninstall,
  onOpenInProject,
}: LibraryAssetDetailProps) {
  const isInstalled = Boolean(installed);
  const canOpenInProject = asset.importKind !== 'node_pack_only';

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
          <h2 className="text-lg font-bold text-zinc-100 mt-2 leading-tight">{asset.title}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            by <span className="text-zinc-400">{asset.author}</span>
          </p>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">{asset.description}</p>

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

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Download size={14} /> {asset.downloads}
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={14} /> {asset.likes}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Preview
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

        {isInstalled && installed?.linkedGraphId && (
          <div className="text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
            Imported as graph <span className="font-mono">{installed.linkedGraphId}</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        {!isInstalled ? (
          <button
            type="button"
            onClick={onInstall}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Download size={14} /> Install to project
          </button>
        ) : (
          <>
            {canOpenInProject && (
              <button
                type="button"
                onClick={onOpenInProject}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} /> Open in project
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
