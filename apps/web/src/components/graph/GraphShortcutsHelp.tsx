'use client';

import React from 'react';
import { X } from 'lucide-react';
import { shortcutsForSection, isMacPlatform } from '@/lib/graphShortcuts';

interface GraphShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

function ShortcutRow({ label, keysWin, keysMac }: { label: string; keysWin: string; keysMac?: string }) {
  const keys = isMacPlatform() ? (keysMac ?? keysWin.replace(/Ctrl\+/g, '⌘')) : keysWin;
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-xs">
      <span className="text-zinc-300">{label}</span>
      <kbd className="shrink-0 font-mono text-[10px] text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 rounded px-1.5 py-0.5">
        {keys}
      </kbd>
    </div>
  );
}

export function GraphShortcutsHelp({ open, onClose }: GraphShortcutsHelpProps) {
  if (!open) return null;

  const canvas = shortcutsForSection('canvas');
  const project = shortcutsForSection('project');

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-lg"
        role="dialog"
        aria-labelledby="graph-shortcuts-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 id="graph-shortcuts-title" className="text-sm font-semibold text-zinc-100">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close shortcuts help"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3 max-h-[min(70vh,420px)] overflow-y-auto space-y-4">
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Canvas</h3>
            <div className="divide-y divide-zinc-800/60">
              {canvas.map((s) => (
                <ShortcutRow key={s.id} label={s.label} keysWin={s.keysWin} keysMac={s.keysMac} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Project</h3>
            <div className="divide-y divide-zinc-800/60">
              {project.map((s) => (
                <ShortcutRow key={s.id} label={s.label} keysWin={s.keysWin} keysMac={s.keysMac} />
              ))}
            </div>
          </section>
        </div>

        <p className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
          Press <kbd className="font-mono text-zinc-500">?</kbd> or <kbd className="font-mono text-zinc-500">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
