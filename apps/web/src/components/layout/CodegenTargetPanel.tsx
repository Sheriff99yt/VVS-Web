'use client';

import React, { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import type { LanguageFamily, TargetLanguage } from '@vvs/graph-types';
import {
  DEFAULT_CAPABILITIES,
  FAMILY_CAPABILITY_OPTIONS,
  resolveCodegenTarget,
  targetLanguageToFamily,
} from '@vvs/graph-types';
import { listSyntaxPacks } from '@vvs/syntax-packs';

const TARGET_OPTIONS: { id: TargetLanguage; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'cpp', label: 'C++' },
  { id: 'verse', label: 'Verse' },
  { id: 'gdscript', label: 'GDScript' },
  { id: 'rust', label: 'Rust' },
  { id: 'csharp', label: 'C#' },
  { id: 'json', label: 'Graph JSON' },
];

function activeCapabilities(
  family: LanguageFamily,
  overrides?: Partial<Record<LanguageFamily, string[]>>
): string[] {
  return overrides?.[family] ?? [...DEFAULT_CAPABILITIES[family]];
}

export function CodegenTargetPanel() {
  const {
    targetLanguage,
    setTargetLanguage,
    codegenCapabilities,
    setCodegenCapabilities,
    syntaxPackLock,
  } = useProject();

  const family = targetLanguageToFamily(targetLanguage);
  const resolvedTarget = useMemo(
    () => resolveCodegenTarget(targetLanguage, { capabilities: codegenCapabilities, syntaxPackLock }),
    [targetLanguage, codegenCapabilities, syntaxPackLock]
  );

  const packIds = resolvedTarget
    ? listSyntaxPacks()
        .filter((pack) => {
          if (pack.family !== resolvedTarget.family) return false;
          if (!pack.capabilities?.length) return true;
          return pack.capabilities.every((cap) => resolvedTarget.capabilities.includes(cap));
        })
        .map((pack) => `${pack.id}@${pack.version}`)
    : [];

  const toggleCapability = (capId: string) => {
    if (!family) return;
    const current = activeCapabilities(family, codegenCapabilities);
    const next = current.includes(capId)
      ? current.filter((c) => c !== capId)
      : [...current, capId];
    setCodegenCapabilities((prev) => ({ ...prev, [family]: next }));
  };

  const resetCapabilities = () => {
    if (!family) return;
    setCodegenCapabilities((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[family];
      return Object.keys(next).length > 0 ? next : undefined;
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Codegen target</label>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
        >
          {TARGET_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {family ? (
        <div className="space-y-1.5 rounded border border-zinc-800/80 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Language capabilities
            </p>
            <button
              type="button"
              onClick={resetCapabilities}
              className="text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Reset defaults
            </button>
          </div>
          <div className="space-y-1">
            {FAMILY_CAPABILITY_OPTIONS[family].map(({ id, label }) => {
              const enabled = activeCapabilities(family, codegenCapabilities).includes(id);
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleCapability(id)}
                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0"
                  />
                  <span>{label}</span>
                  <span className="font-mono text-[10px] text-zinc-600">{id}</span>
                </label>
              );
            })}
          </div>
          {packIds.length > 0 ? (
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Active syntax packs:{' '}
              <span className="font-mono text-zinc-500">{packIds.join(', ')}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Capabilities select syntax pack overlays (e.g. ES2022). Pin exact pack versions in Syntax
        pack lock below.
      </p>
    </div>
  );
}
