'use client';

import React from 'react';
import { ChevronRight, Settings2 } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { buildGraphBreadcrumb } from '@/lib/projectTree';
import { formatFunctionTabName } from '@/lib/functionTabs';
import { openGraphContainerTab } from '@/lib/graphTabs';
import { GRAPH_SETTINGS_EVENT } from './GraphSettingsModal';
import { classHomeGraphId, MAIN_GRAPH_CONTAINER_ID } from '@/lib/classScope';

export function GraphBreadcrumb() {
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

  return (
    <div className="flex items-center gap-1 px-3 h-7 shrink-0 bg-zinc-950 border-b border-zinc-800/80 text-[11px]">
      <div className="flex items-center gap-1 min-w-0 flex-1">
      {segments.map((seg, i) => (
        <React.Fragment key={`${seg.label}-${i}`}>
          {i > 0 && <ChevronRight size={12} className="text-zinc-600 shrink-0" />}
          <button
            type="button"
            onClick={() => navigateToGraph(seg.graphId ?? (i === 0 ? undefined : seg.graphId))}
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
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(GRAPH_SETTINGS_EVENT))}
        className="shrink-0 p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
        title="Graph settings"
      >
        <Settings2 size={13} />
      </button>
    </div>
  );
}
