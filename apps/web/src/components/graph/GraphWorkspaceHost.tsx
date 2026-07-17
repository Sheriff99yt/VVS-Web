'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { NodeChange, EdgeChange, applyNodeChanges } from '@xyflow/react';
import { useGraphState } from '@/hooks/useGraphState';
import { useGraphTabSync } from '@/hooks/useGraphTabSync';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { useLiveProjectValidation } from '@/hooks/useLiveProjectValidation';
import { GraphEditProvider } from '@/contexts/GraphEditContext';
import { useProject } from '@/contexts/ProjectContext';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import { appendUnlockedCommentFollowChanges } from '@/lib/graphCommentMembership';
import {
  dualWriteLibraryImportDefines,
  type LibraryImportPayload,
} from '@/lib/libraryImport';
import { logActivity } from '@/lib/actionActivityLog';
import { playAudioCue } from '@/lib/audioFeedback';
import type { ProjectHistorySlice } from '@/lib/graphHistory';
import { useLatestRef } from '@/hooks/useLatestRef';

interface GraphWorkspaceHostProps {
  initialNodes?: VVSNode[];
  initialEdges?: VVSEdge[];
  initialDocuments?: Record<string, GraphDocument>;
  children: React.ReactNode;
}

/**
 * Always-mounted graph document layer — owns tab documents and workspace API
 * without a React Flow instance. Edit canvas mounts separately under its own provider.
 */
export function GraphWorkspaceHost({
  initialNodes = [],
  initialEdges = [],
  initialDocuments,
  children,
}: GraphWorkspaceHostProps) {
  const {
    activeGraphTab,
    openTabs,
    graphContainers,
    projectDetails,
    setProjectDetails,
    setSelection,
    undoTrigger,
    redoTrigger,
    setCanUndo,
    setCanRedo,
    setCompileState,
    setActiveGraphTab,
    setOpenTabs,
    setFunctions,
    functions,
    variables,
    setVariables,
    events,
    setEvents,
    markTabDirty,
    classes,
    setClasses,
    activeClassId,
    setActiveClassId,
    targetLanguage,
    targetFileExtensions,
  } = useProject();

  const { registerWorkspace } = useGraphWorkspace();

  useLiveProjectValidation();

  const markCurrentTabDirty = useCallback(() => {
    markTabDirty(activeGraphTab);
    setCompileState('dirty');
  }, [markTabDirty, activeGraphTab, setCompileState]);

  const isDraggingRef = useRef(false);
  const suppressHistoryClearRef = useRef(false);
  const suppressReleaseTimerRef = useRef<number | null>(null);
  const tabSyncApiRef = useRef<{
    getAllDocuments: () => Record<string, GraphDocument>;
    replaceDocumentsForHistory: (documents: Record<string, GraphDocument>, activeTab: string) => void;
    prepareTabSwitchForHistory: (tabId: string) => void;
    commitTabDocumentForHistory: (tabId: string, nodes: VVSNode[], edges: VVSEdge[]) => void;
  } | null>(null);

  const variablesRef = useLatestRef(variables);
  const functionsRef = useLatestRef(functions);
  const eventsRef = useLatestRef(events);
  const classesRef = useLatestRef(classes);
  const activeClassIdRef = useLatestRef(activeClassId);
  const projectDetailsRef = useLatestRef(projectDetails);
  const openTabsRef = useLatestRef(openTabs);
  const activeGraphTabRef = useLatestRef(activeGraphTab);

  const markHistoryTabDirty = useCallback(
    (tabId: string | null) => {
      markTabDirty(tabId ?? activeGraphTabRef.current);
      setCompileState('dirty');
    },
    [markTabDirty, setCompileState, activeGraphTabRef]
  );

  /** Keep clearHistory suppressed until after React tab-switch effects (macrotask). */
  const beginHistoryPreserve = useCallback(() => {
    suppressHistoryClearRef.current = true;
    if (suppressReleaseTimerRef.current !== null) {
      window.clearTimeout(suppressReleaseTimerRef.current);
    }
    suppressReleaseTimerRef.current = window.setTimeout(() => {
      suppressHistoryClearRef.current = false;
      suppressReleaseTimerRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (suppressReleaseTimerRef.current !== null) {
        window.clearTimeout(suppressReleaseTimerRef.current);
      }
    };
  }, []);

  const getActiveGraphTab = useCallback(() => activeGraphTabRef.current, [activeGraphTabRef]);

  const getProjectSlice = useCallback((): ProjectHistorySlice | null => {
    const docs = tabSyncApiRef.current?.getAllDocuments();
    if (!docs) return null;
    return {
      variables: variablesRef.current,
      functions: functionsRef.current,
      events: eventsRef.current,
      classes: classesRef.current,
      activeClassId: activeClassIdRef.current,
      projectDetails: projectDetailsRef.current,
      documents: docs,
      openTabs: openTabsRef.current,
      activeGraphTab: activeGraphTabRef.current,
    };
  }, [
    variablesRef,
    functionsRef,
    eventsRef,
    classesRef,
    activeClassIdRef,
    projectDetailsRef,
    openTabsRef,
    activeGraphTabRef,
  ]);

  const applyProjectSlice = useCallback(
    (slice: ProjectHistorySlice) => {
      beginHistoryPreserve();
      setVariables(structuredClone(slice.variables));
      setFunctions(structuredClone(slice.functions));
      setEvents(structuredClone(slice.events));
      setClasses(structuredClone(slice.classes));
      setActiveClassId(slice.activeClassId);
      setProjectDetails(structuredClone(slice.projectDetails));
      setOpenTabs(structuredClone(slice.openTabs));
      tabSyncApiRef.current?.replaceDocumentsForHistory(slice.documents, slice.activeGraphTab);
      setActiveGraphTab(slice.activeGraphTab);
    },
    [
      beginHistoryPreserve,
      setVariables,
      setFunctions,
      setEvents,
      setClasses,
      setActiveClassId,
      setProjectDetails,
      setOpenTabs,
      setActiveGraphTab,
    ]
  );

  const ensureHistoryTab = useCallback(
    (tabId: string) => {
      beginHistoryPreserve();
      tabSyncApiRef.current?.prepareTabSwitchForHistory(tabId);
      setActiveGraphTab(tabId);
    },
    [beginHistoryPreserve, setActiveGraphTab]
  );

  const commitTabDocument = useCallback((tabId: string, nextNodes: VVSNode[], nextEdges: VVSEdge[]) => {
    tabSyncApiRef.current?.commitTabDocumentForHistory(tabId, nextNodes, nextEdges);
  }, []);

  const {
    nodes,
    edges,
    onNodesChange: onNodesChangeBase,
    onEdgesChange: onEdgesChangeBase,
    setNodes,
    setEdges,
    setNodesWithHistory: setNodesWithHistoryBase,
    setEdgesWithHistory: setEdgesWithHistoryBase,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    saveProjectSnapshot,
    jumpToPastEntry,
    getPastHistory,
    getFutureCount,
    historyVersion,
  } = useGraphState(initialNodes, initialEdges, {
    getActiveGraphTab,
    getProjectSlice,
    applyProjectSlice,
    ensureHistoryTab,
    commitTabDocument,
  });

  const getProjectCodegenDefaults = useCallback(
    () => ({ targetLanguage, targetFileExtensions }),
    [targetLanguage, targetFileExtensions]
  );

  const getMainMetadata = useCallback(
    () => ({
      moduleName: projectDetails.moduleName,
      extendsType: projectDetails.extendsType,
      description: projectDetails.description,
    }),
    [projectDetails.moduleName, projectDetails.extendsType, projectDetails.description]
  );

  const {
    getAllDocuments,
    loadAllDocuments,
    patchAllDocuments,
    replaceDocumentsForHistory,
    prepareTabSwitchForHistory,
    commitTabDocumentForHistory,
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
    importGraphTab,
    flushAndNotify,
  } = useGraphTabSync({
    activeGraphTab,
    openTabs,
    graphContainerIds: graphContainers.map((container) => container.id),
    functionIds: functions.flatMap((fn) => [
      fn.id,
      ...fn.overloads
        .map((o) => o.graphTabId)
        .filter((id): id is string => Boolean(id && id.trim())),
    ]),
    nodes,
    edges,
    setNodes,
    setEdges,
    clearHistory,
    initialMain: { nodes: initialNodes, edges: initialEdges },
    getMainMetadata,
    getProjectCodegenDefaults,
    isDraggingRef,
    suppressHistoryClearRef,
  });

  React.useLayoutEffect(() => {
    tabSyncApiRef.current = {
      getAllDocuments,
      replaceDocumentsForHistory,
      prepareTabSwitchForHistory,
      commitTabDocumentForHistory,
    };
  }, [
    getAllDocuments,
    replaceDocumentsForHistory,
    prepareTabSwitchForHistory,
    commitTabDocumentForHistory,
  ]);

  const onNodesChange = useCallback(
    (changes: NodeChange<VVSNode>[]) => {
      const withFollow = appendUnlockedCommentFollowChanges(nodes, changes);
      const isDragging = withFollow.some(
        (c) => c.type === 'position' && c.dragging === true
      );
      const dragEnded = withFollow.some(
        (c) => c.type === 'position' && c.dragging === false
      );
      isDraggingRef.current = dragEnded ? false : isDragging;

      const isSignificant = withFollow.some(
        (c) =>
          c.type === 'add' ||
          c.type === 'remove' ||
          c.type === 'replace' ||
          (c.type === 'position' && c.dragging === false)
      );
      onNodesChangeBase(withFollow);
      if (isSignificant) {
        // Sync — must mark dirty before document flush so Auto-generate-off
        // freezes the Code panel on the prior emit (not the new graph).
        markCurrentTabDirty();
      }
      if (dragEnded) {
        // Flush final positions into documents. Do not teleport sibling nodes
        // (e.g. Event Declare / Call) when an On handler is dragged — U79 order
        // still comes from Event Declare Y; rearrange Declares to change order.
        flushAndNotify(applyNodeChanges(withFollow, nodes) as VVSNode[]);
      }
    },
    [nodes, onNodesChangeBase, markCurrentTabDirty, flushAndNotify]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<VVSEdge>[]) => {
      const isSignificant = changes.some((c) => c.type === 'add' || c.type === 'remove');
      onEdgesChangeBase(changes);
      if (isSignificant) markCurrentTabDirty();
    },
    [onEdgesChangeBase, markCurrentTabDirty]
  );

  const setNodesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSNode[]>) => {
      setNodesWithHistoryBase(updater);
      markCurrentTabDirty();
    },
    [setNodesWithHistoryBase, markCurrentTabDirty]
  );

  const setEdgesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSEdge[]>) => {
      setEdgesWithHistoryBase(updater);
      markCurrentTabDirty();
    },
    [setEdgesWithHistoryBase, markCurrentTabDirty]
  );

  const tabSyncRef = useRef({
    getAllDocuments,
    loadAllDocuments,
    patchAllDocuments,
    importGraphTab,
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
  });
  React.useLayoutEffect(() => {
    tabSyncRef.current = {
      getAllDocuments,
      loadAllDocuments,
      patchAllDocuments,
      importGraphTab,
      getActiveTabMetadata,
      updateActiveTabMetadata,
      subscribeMetadata,
    };
  });

  const patchAllDocumentsWithDirty = useCallback(
    (
      updater: (docs: Record<string, GraphDocument>) => Record<string, GraphDocument>,
      options?: { affectedTabIds?: string[]; preserveHistory?: boolean; viewTabId?: string }
    ) => {
      const affected = tabSyncRef.current.patchAllDocuments(updater, options);
      for (const tabId of affected) {
        markTabDirty(tabId);
      }
      if (options?.viewTabId) {
        markTabDirty(options.viewTabId);
      }
      setCompileState('dirty');
      return affected;
    },
    [markTabDirty, setCompileState]
  );

  const pushHistory = useCallback(
    (label: string) => {
      // Keep tab-switch / patch from wiping this entry when callers also change
      // activeGraphTab in the same event (e.g. open function body after create).
      beginHistoryPreserve();
      saveProjectSnapshot(label);
    },
    [beginHistoryPreserve, saveProjectSnapshot]
  );

  useEffect(() => {
    registerWorkspace({
      getDocuments: () => tabSyncRef.current.getAllDocuments(),
      loadDocuments: (documents, activeTab) =>
        tabSyncRef.current.loadAllDocuments(documents, activeTab),
      patchAllDocuments: patchAllDocumentsWithDirty,
      importGraphDocument: (tab, document) =>
        tabSyncRef.current.importGraphTab(tab, document),
      getActiveTabMetadata: () => tabSyncRef.current.getActiveTabMetadata(),
      updateActiveTabMetadata: (patch) =>
        tabSyncRef.current.updateActiveTabMetadata(patch),
      subscribeMetadata: (listener) => tabSyncRef.current.subscribeMetadata(listener),
      pushHistory,
    });
    return () => registerWorkspace(null);
  }, [registerWorkspace, patchAllDocumentsWithDirty, pushHistory]);

  const documentsHydratedRef = useRef(false);
  useEffect(() => {
    if (!initialDocuments || documentsHydratedRef.current) return;
    loadAllDocuments(initialDocuments, activeGraphTab);
    documentsHydratedRef.current = true;
  }, [initialDocuments, loadAllDocuments, activeGraphTab]);

  useEffect(() => {
    const onImport = (event: Event) => {
      const payload = (event as CustomEvent<LibraryImportPayload>).detail;
      const { tab, document, functionEntry } = payload;
      if (functionEntry) {
        setFunctions((prev) =>
          prev.some((f) => f.id === functionEntry.id) ? prev : [...prev, functionEntry]
        );
      }
      setOpenTabs((prev) => (prev.some((t) => t.id === tab.id) ? prev : [...prev, tab]));
      setActiveGraphTab(tab.id);
      setSelection({ type: 'graph', id: tab.id });
      importGraphTab(tab, document);
      if (functionEntry) {
        const documents = tabSyncRef.current.getAllDocuments();
        const withDefine = dualWriteLibraryImportDefines(
          documents,
          classes,
          activeClassId,
          payload
        );
        if (withDefine !== documents) {
          patchAllDocumentsWithDirty(() => withDefine);
        }
      }
      markTabDirty(tab.id);
      setCompileState('dirty');
    };
    window.addEventListener('vvs:import-library-graph', onImport);
    return () => window.removeEventListener('vvs:import-library-graph', onImport);
  }, [
    importGraphTab,
    setFunctions,
    setOpenTabs,
    setActiveGraphTab,
    setSelection,
    setCompileState,
    markTabDirty,
    classes,
    activeClassId,
    patchAllDocumentsWithDirty,
  ]);

  useEffect(() => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  }, [canUndo, canRedo, setCanUndo, setCanRedo]);

  useEffect(() => {
    if (undoTrigger > 0) {
      const tabId = undo();
      markHistoryTabDirty(tabId);
      logActivity('undo', 'Undo');
      playAudioCue('undo');
    }
  }, [undoTrigger, undo, markHistoryTabDirty]);

  useEffect(() => {
    if (redoTrigger > 0) {
      const tabId = redo();
      markHistoryTabDirty(tabId);
      logActivity('redo', 'Redo');
      playAudioCue('redo');
    }
  }, [redoTrigger, redo, markHistoryTabDirty]);

  const editValue = React.useMemo(
    () => ({
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      setNodes,
      setEdges,
      setNodesWithHistory,
      setEdgesWithHistory,
      undo,
      redo,
      canUndo,
      canRedo,
      jumpToPastEntry,
      getPastHistory,
      getFutureCount,
      historyVersion,
      importGraphTab,
    }),
    [
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      setNodes,
      setEdges,
      setNodesWithHistory,
      setEdgesWithHistory,
      undo,
      redo,
      canUndo,
      canRedo,
      jumpToPastEntry,
      getPastHistory,
      getFutureCount,
      historyVersion,
      importGraphTab,
    ]
  );

  return <GraphEditProvider value={editValue}>{children}</GraphEditProvider>;
}
