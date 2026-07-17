'use client';

import React from 'react';
import { GitBranch, Layers, PlaySquare, Radio } from 'lucide-react';
import type { ClassSymbol, FunctionSymbol, ProjectEventDefinition, VariableSymbol } from '@vvs/graph-types';
import type { ResolvedApiSurface } from '@vvs/environment-templates';
import {
  dispatchSpawnEnvironmentNode,
  type EnvironmentSpawnAction,
} from '@/lib/environmentHelpers';
import { CategorySection } from './CategorySection';
import { TreeRow } from './TreeRow';
import { INDENT, type SectionViewMode } from './constants';
import { matchesExplorerFilter, sectionGridSpan } from './explorerUtils';

export function EnvironmentApiSection({
  environmentManifest,
  environmentVersion,
  environmentSurface,
  filterQuery,
  viewMode = 'list',
  onViewModeChange,
  isReferenceMode,
}: {
  environmentManifest: NonNullable<ReturnType<typeof import('@/lib/environmentContext').getLinkedEnvironmentManifest>>;
  environmentVersion: string | null | undefined;
  environmentSurface: ResolvedApiSurface;
  filterQuery: string;
  viewMode?: SectionViewMode;
  onViewModeChange?: (mode: SectionViewMode) => void;
  isReferenceMode: boolean;
}) {
  const q = filterQuery.trim().toLowerCase();
  const apiCount =
    environmentSurface.events.length +
    environmentSurface.natives.length +
    environmentSurface.overrideable.length;

  return (
    <CategorySection
      title="Environment API"
      count={apiCount}
      icon={<Layers size={12} className="text-indigo-400/80 shrink-0" />}
      expanded
      onToggle={() => {}}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    >
      <div
        className={`${INDENT.l1} text-[9px] text-indigo-400/80 truncate pr-2 pb-1 ${sectionGridSpan(viewMode) ?? ''}`}
      >
        {environmentManifest.displayName}
        {environmentVersion ? (
          <span className="text-zinc-600 font-mono"> · v{environmentVersion}</span>
        ) : null}
      </div>
      {environmentSurface.events
        .filter((e) => matchesExplorerFilter(e.name, q))
        .map((event) => (
          <TreeRow
            key={event.id}
            layout={viewMode}
            icon={<Radio size={10} className="text-indigo-400/70 shrink-0" />}
            label={event.name}
            meta="event"
            hint="Spawn handler"
            suffix={
              !isReferenceMode ? (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    className="px-1 py-0.5 rounded text-[8px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                    title="Add handler"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchSpawnEnvironmentNode('event_handler', event.id);
                    }}
                  >
                    Handler
                  </button>
                </div>
              ) : null
            }
          />
        ))}
      {environmentSurface.natives
        .filter((m) => matchesExplorerFilter(m.name, q))
        .map((method) => (
          <TreeRow
            key={method.id}
            layout={viewMode}
            icon={<PlaySquare size={10} className="text-sky-400/70 shrink-0" />}
            label={`${method.name}()`}
            meta="native"
            hint="Spawn native call node"
            suffix={
              !isReferenceMode ? (
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-[8px] bg-sky-500/20 text-sky-200 border border-sky-500/30"
                  title="Add call"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatchSpawnEnvironmentNode('call_native' as EnvironmentSpawnAction, method.id);
                  }}
                >
                  Call
                </button>
              ) : null
            }
          />
        ))}
      {environmentSurface.overrideable
        .filter((m) => matchesExplorerFilter(m.name, q))
        .map((method) => (
          <TreeRow
            key={method.id}
            layout={viewMode}
            icon={<GitBranch size={10} className="text-amber-400/70 shrink-0" />}
            label={`${method.name}()`}
            meta="override"
            hint="Spawn override handler"
            suffix={
              !isReferenceMode ? (
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-200 border border-amber-500/30"
                  title="Add override"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatchSpawnEnvironmentNode('event_handler', method.id);
                  }}
                >
                  Override
                </button>
              ) : null
            }
          />
        ))}
    </CategorySection>
  );
}
