'use client';

import { useCallback } from 'react';
import type { ClassSymbol, FunctionSymbol, GraphContainer } from '@vvs/graph-types';
import type { VVSNodeData } from '@/types/graph';
import type { SelectionState } from '@/contexts/ProjectContext';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import {
  canvasFocusFrame,
  resolveClassHomeGraphTarget,
  type ClassHomeGraphTarget,
} from '@/lib/editorFocus';
import { resolveGraphRefTarget } from '@/lib/graphRefHelpers';
import {
  openFunctionGraphTab,
  openGraphContainerTab,
  openMainGraph,
} from '@/lib/graphTabs';
import type { EditorNavigateOptions } from '@/types/editorNavigation';

export interface EditorFocusResult extends ClassHomeGraphTarget {}

/**
 * Single entry for canvas + selection changes from the project tree.
 * Always passes explicit `selection` into `navigate()` so history sync cannot
 * restore stale React state over tree symbol focus.
 */
export function useEditorFocus() {
  const { navigate } = useEditorNavigation();
  const {
    setOpenTabs,
    setActiveGraphTab,
    setActiveClassId,
    focusReference,
    graphContainers,
    classes,
    activeGraphTab,
  } = useProject();
  const { getDocuments } = useGraphWorkspace();

  const focusCanvas = useCallback(
    (
      graphTab: string,
      selection: SelectionState,
      options?: EditorNavigateOptions
    ) => {
      navigate(canvasFocusFrame(graphTab, selection), options);
    },
    [navigate]
  );

  const openClassHomeCanvas = useCallback(
    (cls: ClassSymbol, selection: SelectionState): EditorFocusResult => {
      const target = resolveClassHomeGraphTarget(cls, graphContainers, getDocuments() || {}, activeGraphTab);
      setActiveClassId(cls.id);
      if (target.container) {
        openGraphContainerTab(target.container, setOpenTabs, setActiveGraphTab);
      } else {
        setActiveGraphTab(target.referenceTabId);
      }
      focusReference(target.referenceTabId, null);
      focusCanvas(target.graphTab, selection);
      return target;
    },
    [
      focusCanvas,
      focusReference,
      graphContainers,
      setActiveClassId,
      setActiveGraphTab,
      setOpenTabs,
      getDocuments,
      activeGraphTab,
    ]
  );

  const focusClass = useCallback(
    (cls: ClassSymbol) => openClassHomeCanvas(cls, { type: 'class', id: cls.id }),
    [openClassHomeCanvas]
  );

  const focusTreeSymbolOnClass = useCallback(
    (cls: ClassSymbol, selection: SelectionState) => openClassHomeCanvas(cls, selection),
    [openClassHomeCanvas]
  );

  const focusFunction = useCallback(
    (func: FunctionSymbol, graphTab?: string) => {
      const tabId = graphTab ?? func.overloads[0]?.graphTabId ?? func.id;
      openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
      if (tabId !== func.id) {
        setActiveGraphTab(tabId);
      }
      focusCanvas(tabId, { type: 'function', id: func.id });
    },
    [focusCanvas, setActiveGraphTab, setOpenTabs]
  );

  const focusGraphContainer = useCallback(
    (container: GraphContainer) => {
      openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      focusReference(container.id, null);
      focusCanvas(container.id, { type: 'graph', id: container.id });
    },
    [focusCanvas, focusReference, setActiveGraphTab, setOpenTabs]
  );

  const focusMainGraph = useCallback(() => {
    openMainGraph(setActiveGraphTab);
    focusReference('main', null);
    focusCanvas('main', { type: 'graph', id: null });
  }, [focusCanvas, focusReference, setActiveGraphTab]);

  const focusFunctionGraphTab = useCallback(
    (graphId: string) => {
      focusCanvas(graphId, { type: 'graph', id: graphId });
    },
    [focusCanvas]
  );

  const focusClassGraphTab = useCallback(
    (graphId: string) => {
      setActiveGraphTab(graphId);
      focusReference(graphId, null);
      focusCanvas(graphId, { type: 'graph', id: null });
    },
    [focusCanvas, focusReference, setActiveGraphTab]
  );

  const focusGraphRef = useCallback(
    (data: VVSNodeData) => {
      const target = resolveGraphRefTarget(
        data,
        classes,
        data.properties?.containerId
          ? graphContainers.find((c) => c.id === String(data.properties?.containerId))?.name
          : undefined
      );
      if (!target) return false;

      if (target.type === 'container') {
        const container = graphContainers.find((c) => c.id === target.containerId);
        if (!container) return false;
        focusGraphContainer(container);
        return true;
      }

      if (target.type === 'class') {
        const cls = classes.find((c) => c.id === target.classId);
        if (!cls) return false;
        focusClass(cls);
        return true;
      }

      setActiveGraphTab(target.graphTabId);
      focusReference(target.graphTabId, null);
      focusCanvas(target.graphTabId, { type: 'graph', id: target.graphTabId });
      return true;
    },
    [classes, focusCanvas, focusClass, focusGraphContainer, focusReference, graphContainers, setActiveGraphTab]
  );

  return {
    focusCanvas,
    focusClass,
    focusTreeSymbolOnClass,
    focusFunction,
    focusGraphContainer,
    focusMainGraph,
    focusFunctionGraphTab,
    focusClassGraphTab,
    focusGraphRef,
  };
}
