'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useEditorView } from '@/contexts/EditorViewContext';
import { buildGraphBreadcrumb } from '@/lib/projectTree';
import { formatFunctionTabName } from '@/lib/functionTabs';
import { openGraphContainerTab } from '@/lib/graphTabs';
import { classHomeGraphId, MAIN_GRAPH_CONTAINER_ID } from '@/lib/classScope';
import { Tooltip } from '@/components/ui/Tooltip';

export function GraphBreadcrumb({
  compact = false,
  showModeBadge = false,
}: {
  /** Inline path for the status bar (no outer chrome). */
  compact?: boolean;
  /** Edit / Refs pill — matches former ProjectScopeHeader badge. */
  showModeBadge?: boolean;
}) {
  const {
    projectDetails,
    activeGraphTab,
    openTabs,
    setOpenTabs,
    functions,
    classes,
    activeClassId,
    graphContainers,
    setActiveGraphTab,
  } = useProject();
  const { navigate } = useEditorNavigation();
  const { activeView } = useEditorView();

  const segments = buildGraphBreadcrumb(
    projectDetails.moduleName,
    activeGraphTab,
    openTabs,
    classes,
    activeClassId
  );

  const navigateToGraph = (graphId?: string) => {
    if (!graphId) {
      navigate({
        graphTab: MAIN_GRAPH_CONTAINER_ID,
        editorView: 'canvas',
        selection: { type: 'graph', id: MAIN_GRAPH_CONTAINER_ID },
      });
      return;
    }

    const container = graphContainers.find((c) => c.id === graphId);
    if (container) {
      openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      navigate({
        graphTab: container.id,
        editorView: 'canvas',
        selection: { type: 'graph', id: container.id },
      });
      return;
    }

    if (graphId === 'main') {
      navigate({ graphTab: 'main', editorView: 'canvas', selection: { type: 'graph', id: null } });
      return;
    }

    const tab = openTabs.find((t) => t.id === graphId);
    const func = functions.find((f) => f.id === graphId);
    const cls = classes.find((c) => classHomeGraphId(c) === graphId || c.id === graphId);
    if (func && !openTabs.some((t) => t.id === graphId)) {
      setOpenTabs((prev) => [
        ...prev,
        { id: func.id, type: 'function', name: formatFunctionTabName(func.name) },
      ]);
    } else if (tab && !openTabs.some((t) => t.id === graphId)) {
      setOpenTabs((prev) => [...prev, tab]);
    } else if (cls) {
      const container = graphContainers.find((c) => c.id === classHomeGraphId(cls));
      if (container) {
        openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      }
    }

    navigate({
      graphTab: graphId,
      editorView: 'canvas',
      selection: { type: 'graph', id: graphId === 'main' ? null : graphId },
    });
  };

  const isRefs = activeView === 'references';
  const modeBadge =
    showModeBadge ? (
      <Tooltip content={isRefs ? 'References view' : 'Edit view'} placement="top">
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide border ${
            isRefs
              ? 'text-amber-300/90 border-amber-500/25 bg-amber-500/10'
              : 'text-zinc-400 border-zinc-700 bg-zinc-900'
          }`}
        >
          {isRefs ? 'Refs' : 'Edit'}
        </span>
      </Tooltip>
    ) : null;

  const path = (
    <div
      className={`flex items-center gap-0.5 min-w-0 ${
        compact && !showModeBadge ? 'flex-1 justify-center px-2' : 'min-w-0'
      }`}
    >
      {segments.map((seg, i) => (
        <React.Fragment key={`${seg.label}-${i}`}>
          {i > 0 && <ChevronRight size={compact ? 10 : 12} className="text-zinc-600 shrink-0" />}
          <button
            type="button"
            onClick={() => navigateToGraph(seg.graphId ?? (i === 0 ? undefined : seg.graphId))}
            className={`truncate transition-colors ${
              compact ? 'max-w-[100px] text-[10px]' : 'max-w-[140px] text-[11px]'
            } ${
              i === segments.length - 1
                ? 'text-zinc-300 font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {seg.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );

  if (compact) {
    if (showModeBadge) {
      return (
        <div className="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[min(280px,36%)]">
          {path}
          {modeBadge}
        </div>
      );
    }
    return path;
  }

  return (
    <div className="flex items-center gap-1 px-3 h-7 shrink-0 bg-zinc-950 border-t border-zinc-800/80 text-[11px]">
      {path}
      {modeBadge}
    </div>
  );
}
