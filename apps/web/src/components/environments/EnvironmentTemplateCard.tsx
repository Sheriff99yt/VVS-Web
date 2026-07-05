'use client';

import React from 'react';
import { FileCode, Layers, Zap } from 'lucide-react';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import {
  summarizeEnvironmentManifest,
  resolveEnvironmentCategory,
  environmentCategoryLabel,
} from '@vvs/environment-templates';
import { environmentVersionDrift } from '@/lib/environmentContext';

const TARGET_LABEL: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  verse: 'Verse',
  json: 'JSON',
};

const CATEGORY_STYLE: Record<string, string> = {
  console: 'text-emerald-400 bg-emerald-500/10',
  web: 'text-sky-400 bg-sky-500/10',
  data: 'text-amber-400 bg-amber-500/10',
  api: 'text-violet-400 bg-violet-500/10',
  game: 'text-rose-400 bg-rose-500/10',
};

interface EnvironmentTemplateCardProps {
  manifest: ProjectEnvironmentManifest;
  linkedVersion?: string;
  onSelect: (environmentId: string) => void;
  compact?: boolean;
}

export function EnvironmentTemplateCard({
  manifest,
  linkedVersion,
  onSelect,
  compact = false,
}: EnvironmentTemplateCardProps) {
  const summary = summarizeEnvironmentManifest(manifest);
  const drift = environmentVersionDrift(manifest.id, linkedVersion);
  const category = resolveEnvironmentCategory(manifest);
  const categoryClass = CATEGORY_STYLE[category] ?? 'text-indigo-400 bg-indigo-500/10';

  return (
    <button
      type="button"
      onClick={() => onSelect(manifest.id)}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-indigo-500/40 transition-colors text-left group w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded shrink-0 ${categoryClass}`}
        >
          {environmentCategoryLabel(category)}
        </span>
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">v{manifest.version}</span>
      </div>

      <h3 className="text-sm font-semibold text-zinc-100 mt-2 group-hover:text-white transition-colors">
        {manifest.displayName}
      </h3>

      {!compact ? (
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{manifest.description}</p>
      ) : null}

      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="text-[10px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded font-medium border border-zinc-700/50">
          {TARGET_LABEL[manifest.defaultTarget] ?? manifest.defaultTarget}
        </span>
        {manifest.supportedTargets
          .filter((t) => t !== manifest.defaultTarget)
          .slice(0, compact ? 2 : 3)
          .map((target) => (
            <span
              key={target}
              className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded"
            >
              {TARGET_LABEL[target] ?? target}
            </span>
          ))}
      </div>

      {!compact ? (
        <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <Zap size={11} className="text-amber-500/80" />
            {summary.nativeCount} natives
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers size={11} className="text-indigo-400/80" />
            {summary.eventCount} events
          </span>
          {summary.entryPath ? (
            <span className="inline-flex items-center gap-1 font-mono truncate max-w-[140px]">
              <FileCode size={11} />
              {summary.entryPath}
            </span>
          ) : null}
        </div>
      ) : null}

      {drift.drift && linkedVersion ? (
        <p className="text-[10px] text-amber-400 mt-2">
          Update available: v{linkedVersion} → v{drift.currentVersion}
        </p>
      ) : null}

      <p className="text-[10px] text-zinc-600 mt-2 font-mono truncate">{manifest.id}</p>
    </button>
  );
}
