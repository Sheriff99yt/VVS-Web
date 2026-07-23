'use client';

import React, { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import type { LanguageFamily, TargetLanguage } from '@vvs/graph-types';
import {
  DEFAULT_CAPABILITIES,
  FAMILY_CAPABILITY_OPTIONS,
  resolveCodegenTarget,
  targetLanguageToFamily,
  TARGET_FILE_EXTENSIONS,
  formatTargetFileExtension,
} from '@vvs/graph-types';
import { listSyntaxPacks } from '@vvs/syntax-packs';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';

const TARGET_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'verse', label: 'Verse' },
  { value: 'gdscript', label: 'GDScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'json', label: 'Graph JSON' },
] as const satisfies ReadonlyArray<{ value: TargetLanguage; label: string }>;

function activeCapabilities(
  family: LanguageFamily,
  overrides?: Partial<Record<LanguageFamily, string[]>>
): string[] {
  return overrides?.[family] ?? [...DEFAULT_CAPABILITIES[family]];
}

export function ProjectCodegenDefaultsPanel() {
  const {
    targetLanguage,
    setTargetLanguage,
    targetFileExtensions,
    setTargetFileExtensions,
  } = useProject();

  const extensionOptions = useMemo(
    () =>
      TARGET_FILE_EXTENSIONS[targetLanguage].map((ext) => ({
        value: ext,
        label: formatTargetFileExtension(ext),
      })),
    [targetLanguage]
  );

  const currentExtension =
    targetFileExtensions[targetLanguage] ??
    TARGET_FILE_EXTENSIONS[targetLanguage][0] ??
    'txt';

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Project defaults
        </p>
        <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
          New graphs start with this language and extension. Existing graphs keep their own settings
          until you change them.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Default language</label>
        <SearchableSelect
          value={targetLanguage}
          onChange={(value) => setTargetLanguage(value as TargetLanguage)}
          options={[...TARGET_OPTIONS]}
          placeholder="Select language…"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Default file extension</label>
        <SearchableSelect
          value={currentExtension}
          onChange={(ext) =>
            setTargetFileExtensions((prev) => ({
              ...prev,
              [targetLanguage]: ext,
            }))
          }
          options={extensionOptions}
          placeholder="Select extension…"
          searchable={extensionOptions.length > 1}
        />
      </div>
    </div>
  );
}

export function GraphCodegenPanel() {
  const { codegenCapabilities, setCodegenCapabilities, syntaxPackLock } = useProject();
  const {
    targetLanguage,
    targetFileExtension,
    isOrgGraph,
    usesProjectDefaults,
    setGraphTargetLanguage,
    setGraphTargetFileExtension,
    resetGraphCodegenToProjectDefaults,
    projectDefaults,
  } = useActiveGraphCodegenSettings();

  const family = targetLanguageToFamily(targetLanguage);
  const resolvedTarget = useMemo(
    () => resolveCodegenTarget(targetLanguage, { capabilities: codegenCapabilities, syntaxPackLock }),
    [targetLanguage, codegenCapabilities, syntaxPackLock]
  );

  const extensionOptions = useMemo(
    () =>
      TARGET_FILE_EXTENSIONS[targetLanguage].map((ext) => ({
        value: ext,
        label: formatTargetFileExtension(ext),
      })),
    [targetLanguage]
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

  if (isOrgGraph) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          This graph
        </p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Organizational graphs do not generate code. Open a class or function graph to set its
          language and extension.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            This graph
          </p>
          <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
            {usesProjectDefaults
              ? `Using project defaults (${projectDefaults.targetLanguage} · .${targetFileExtension}).`
              : 'Custom language and extension for this graph only.'}
          </p>
        </div>
        {!usesProjectDefaults ? (
          <button
            type="button"
            onClick={resetGraphCodegenToProjectDefaults}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 shrink-0"
          >
            Reset to defaults
          </button>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Generated language</label>
        <SearchableSelect
          value={targetLanguage}
          onChange={(value) => setGraphTargetLanguage(value as TargetLanguage)}
          options={[...TARGET_OPTIONS]}
          placeholder="Select language…"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">File extension</label>
        <SearchableSelect
          value={targetFileExtension}
          onChange={setGraphTargetFileExtension}
          options={extensionOptions}
          placeholder="Select extension…"
          searchable={extensionOptions.length > 1}
        />
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
    </div>
  );
}

/** @deprecated Use GraphCodegenPanel + ProjectCodegenDefaultsPanel */
export function CodegenTargetPanel() {
  return (
    <>
      <GraphCodegenPanel />
      <div className="border-t border-zinc-800/80 pt-4">
        <ProjectCodegenDefaultsPanel />
      </div>
    </>
  );
}
