'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { NodeChange, EdgeChange } from '@xyflow/react';
import { useGraphState } from '@/hooks/useGraphState';
import { useGraphTabSync } from '@/hooks/useGraphTabSync';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { GraphEditProvider } from '@/contexts/GraphEditContext';
import { useProject } from '@/contexts/ProjectContext';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import type { LibraryImportPayload } from '@/lib/libraryImport';

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
    projectDetails,
    setSelection,
    undoTrigger,
    redoTrigger,
    setCanUndo,
    setCanRedo,
    setCompileState,
    setActiveGraphTab,
    setOpenTabs,
    setFunctions,
    markTabDirty,
  } = useProject();

  const { registerWorkspace } = useGraphWorkspace();

  const markCurrentTabDirty = useCallback(() => {
    markTabDirty(activeGraphTab);
    setCompileState('dirty');
  }, [markTabDirty, activeGraphTab, setCompileState]);

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
  } = useGraphState(initialNodes, initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange<VVSNode>[]) => {
      const isSignificant = changes.some(
        (c) =>
          c.type === 'add' ||
          c.type === 'remove' ||
          (c.type === 'position' && c.dragging === false)
      );
      onNodesChangeBase(changes);
      if (isSignificant) markCurrentTabDirty();
    },
    [onNodesChangeBase, markCurrentTabDirty]
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
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
    importGraphTab,
  } = useGraphTabSync({
    activeGraphTab,
    openTabs,
    nodes,
    edges,
    setNodes,
    setEdges,
    clearHistory,
    initialMain: { nodes: initialNodes, edges: initialEdges },
    getMainMetadata,
  });

  const tabSyncRef = useRef({
    getAllDocuments,
    loadAllDocuments,
    patchAllDocuments,
    importGraphTab,
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
  });
  tabSyncRef.current = {
    getAllDocuments,
    loadAllDocuments,
    patchAllDocuments,
    importGraphTab,
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
  };

  const patchAllDocumentsWithDirty = useCallback(
    (
      updater: (docs: Record<string, GraphDocument>) => Record<string, GraphDocument>,
      options?: { affectedTabIds?: string[] }
    ) => {
      const affected = tabSyncRef.current.patchAllDocuments(updater, options);
      for (const tabId of affected) {
        markTabDirty(tabId);
      }
      setCompileState('dirty');
      return affected;
    },
    [markTabDirty, setCompileState]
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
    });
    return () => registerWorkspace(null);
  }, [registerWorkspace, patchAllDocumentsWithDirty]);

  const documentsHydratedRef = useRef(false);
  useEffect(() => {
    if (!initialDocuments || documentsHydratedRef.current) return;
    loadAllDocuments(initialDocuments, activeGraphTab);
    documentsHydratedRef.current = true;
  }, [initialDocuments, loadAllDocuments, activeGraphTab]);

  useEffect(() => {
    const onImport = (event: Event) => {
      const { tab, document, functionEntry } = (event as CustomEvent<LibraryImportPayload>).detail;
      if (functionEntry) {
        setFunctions((prev) =>
          prev.some((f) => f.id === functionEntry.id) ? prev : [...prev, functionEntry]
        );
      }
      setOpenTabs((prev) => (prev.some((t) => t.id === tab.id) ? prev : [...prev, tab]));
      setActiveGraphTab(tab.id);
      setSelection({ type: 'graph', id: tab.id });
      importGraphTab(tab, document);
      markTabDirty(tab.id);
      setCompileState('dirty');
    };
    window.addEventListener('vvs:import-library-graph', onImport);
    return () => window.removeEventListener('vvs:import-library-graph', onImport);
  }, [importGraphTab, setFunctions, setOpenTabs, setActiveGraphTab, setSelection, setCompileState, markTabDirty]);

  useEffect(() => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  }, [canUndo, canRedo, setCanUndo, setCanRedo]);

  useEffect(() => {
    if (undoTrigger > 0) {
      undo();
      markCurrentTabDirty();
    }
  }, [undoTrigger, undo, markCurrentTabDirty]);

  useEffect(() => {
    if (redoTrigger > 0) {
      redo();
      markCurrentTabDirty();
    }
  }, [redoTrigger, redo, markCurrentTabDirty]);

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
      importGraphTab,
    ]
  );

  return <GraphEditProvider value={editValue}>{children}</GraphEditProvider>;
}
