'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { buildGraphBreadcrumb } from '@/lib/projectTree';
import type { ProjectTreeMode } from './constants';

export function ProjectScopeHeader({
  projectName,
  activeGraphTab,
  openTabs,
  classes,
  activeClassId,
  mode,
  activeClassName,
}: {
  projectName: string;
  activeGraphTab: string;
  openTabs: import('@/contexts/ProjectContext').GraphTab[];
  classes: import('@vvs/graph-types').ClassSymbol[];
  activeClassId: string;
  mode: ProjectTreeMode;
  activeClassName?: string;
}) {
  const segments = buildGraphBreadcrumb(
    projectName,
    activeGraphTab,
    openTabs,
    classes,
    activeClassId
  );
  const scopeTail = segments.slice(1);

  return (
    <div className="flex-none px-2 pt-2 pb-1.5 border-b border-zinc-800 space-y-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="min-w-0 flex-1">
          <div
            className="text-[12px] font-medium text-zinc-100 truncate"
            title={projectName || 'Untitled'}
          >
            {projectName || 'Untitled'}
          </div>
          {scopeTail.length > 0 ? (
            <div className="flex items-center gap-0.5 min-w-0 text-[10px] text-zinc-500 mt-0.5">
              {scopeTail.map((seg, index) => (
                <React.Fragment key={`${seg.label}-${index}`}>
                  {index > 0 ? <ChevronRight size={9} className="shrink-0 text-zinc-700" /> : null}
                  <span className="truncate" title={seg.label}>
                    {seg.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-zinc-600 mt-0.5">
              {activeClassName ? (
                <>
                  Active class{' '}
                  <span className="text-zinc-400">{activeClassName}</span>
                </>
              ) : (
                'Project scope'
              )}
            </div>
          )}
        </div>
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide border ${
            mode === 'references'
              ? 'text-amber-300/90 border-amber-500/25 bg-amber-500/10'
              : 'text-zinc-400 border-zinc-700 bg-zinc-900'
          }`}
        >
          {mode === 'references' ? 'Refs' : 'Edit'}
        </span>
      </div>
    </div>
  );
}
