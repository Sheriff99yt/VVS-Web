'use client';

import React from 'react';
import { resolveGraphCodegenSettings, type ProjectCodegenDefaults } from '@vvs/graph-types';
import type { GraphDocument } from '@/lib/graphDefaults';

const LANGUAGE_SHORT: Record<string, string> = {
  python: 'Py',
  javascript: 'JS',
  cpp: 'C++',
  verse: 'Verse',
  gdscript: 'GD',
  rust: 'Rust',
  csharp: 'C#',
  json: 'JSON',
};

export function CodegenSuffix({
  tabId,
  documents,
  projectDefaults,
}: {
  tabId: string;
  documents: Record<string, GraphDocument> | null;
  projectDefaults: ProjectCodegenDefaults;
}) {
  const settings = resolveGraphCodegenSettings(documents?.[tabId]?.metadata, projectDefaults);
  const lang = LANGUAGE_SHORT[settings.targetLanguage] ?? settings.targetLanguage;

  return (
    <span
      className="shrink-0 text-[8px] font-mono text-zinc-600 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity"
      title={`Output: ${settings.targetLanguage} · .${settings.targetFileExtension}`}
    >
      {lang}
    </span>
  );
}
