'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { buildGraphBreadcrumb } from '@/lib/projectTree';
import { formatFunctionTabName } from '@/lib/functionTabs';

export function GraphBreadcrumb() {
  const {
    projectDetails,
    activeGraphTab,
    openTabs,
    setOpenTabs,
    functions,
  } = useProject();
  const { navigate } = useEditorNavigation();

  const segments = buildGraphBreadcrumb(
    projectDetails.moduleName,
    activeGraphTab,
    openTabs
  );

  const navigateToGraph = (graphId?: string) => {
    if (!graphId || graphId === 'main') {
      navigate({ graphTab: 'main', editorView: 'canvas', selection: { type: 'graph', id: null } });
      return;
    }

    const tab = openTabs.find((t) => t.id === graphId);
    if (tab?.type === 'macro') {
      if (!openTabs.some((t) => t.id === graphId)) {
        setOpenTabs((prev) => [...prev, tab]);
      }
    } else {
      const func = functions.find((f) => f.id === graphId);
      if (func && !openTabs.some((t) => t.id === graphId)) {
        setOpenTabs((prev) => [
          ...prev,
          { id: func.id, type: 'function', name: formatFunctionTabName(func.name) },
        ]);
      }
    }

    navigate({
      graphTab: graphId,
      editorView: 'canvas',
      selection: { type: 'graph', id: graphId },
    });
  };

  return (
    <div className="flex items-center gap-1 px-3 h-7 shrink-0 bg-zinc-950 border-b border-zinc-800/80 text-[11px]">
      {segments.map((seg, i) => (
        <React.Fragment key={`${seg.label}-${i}`}>
          {i > 0 && <ChevronRight size={12} className="text-zinc-600 shrink-0" />}
          <button
            type="button"
            onClick={() => navigateToGraph(seg.graphId ?? (i === 0 ? 'main' : undefined))}
            className={`truncate max-w-[140px] transition-colors ${
              i === segments.length - 1
                ? 'text-zinc-200 font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {seg.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
