'use client';

import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import type { LanguageFamily, SyntaxPackLock, SyntaxPackLockEntry } from '@vvs/graph-types';
import { targetLanguageToFamily } from '@vvs/graph-types';

const FAMILY_OPTIONS: { id: LanguageFamily; label: string; defaultBase: string }[] = [
  { id: 'python', label: 'Python', defaultBase: 'python.base' },
  { id: 'javascript', label: 'JavaScript', defaultBase: 'javascript.base' },
  { id: 'cpp', label: 'C++', defaultBase: 'cpp.base' },
  { id: 'verse', label: 'Verse', defaultBase: 'verse.base' },
  { id: 'gdscript', label: 'GDScript', defaultBase: 'gdscript.base' },
  { id: 'rust', label: 'Rust', defaultBase: 'rust.base' },
  { id: 'csharp', label: 'C#', defaultBase: 'csharp.base' },
];

function parseOverlays(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatOverlays(overlays: string[] | undefined): string {
  return overlays?.join(', ') ?? '';
}

export function SyntaxPackLockPanel() {
  const { targetLanguage, syntaxPackLock, setSyntaxPackLock } = useProject();
  const activeFamily = targetLanguageToFamily(targetLanguage);

  const updateFamily = (family: LanguageFamily, entry: SyntaxPackLockEntry | undefined) => {
    setSyntaxPackLock((prev) => {
      const next: SyntaxPackLock = { ...prev };
      if (!entry || !entry.base.trim()) {
        delete next[family];
      } else {
        next[family] = entry;
      }
      return Object.keys(next).length > 0 ? next : undefined;
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
          Syntax pack lock
        </p>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Pin base pack and overlay ids per language family. Saved to{' '}
          <span className="font-mono text-zinc-500">.vvs/project.json</span> on folder projects.
        </p>
      </div>
      {FAMILY_OPTIONS.map(({ id, label, defaultBase }) => {
        const entry = syntaxPackLock?.[id];
        const isActive = activeFamily === id;
        return (
          <div
            key={id}
            className={`rounded border px-2.5 py-2 space-y-1.5 ${
              isActive ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-zinc-800/80'
            }`}
          >
            <p className="text-[11px] font-medium text-zinc-300">
              {label}
              {isActive ? <span className="text-indigo-400/80 ml-1">· active target</span> : null}
            </p>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500">Base pack id</label>
              <input
                type="text"
                value={entry?.base ?? ''}
                placeholder={defaultBase}
                onChange={(e) =>
                  updateFamily(id, {
                    base: e.target.value,
                    overlays: entry?.overlays ?? [],
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500">Overlays (comma-separated)</label>
              <input
                type="text"
                value={formatOverlays(entry?.overlays)}
                placeholder="e.g. python.async"
                onChange={(e) =>
                  updateFamily(id, {
                    base: entry?.base ?? defaultBase,
                    overlays: parseOverlays(e.target.value),
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
