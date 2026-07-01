'use client';

import React, { useEffect, useRef } from 'react';
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
  } = useProject();

  const { registerWorkspace } = useGraphWorkspace();

  const {
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
    clearHistory,
  } = useGraphState(initialNodes, initialEdges);

  const {
    getAllDocuments,
    loadAllDocuments,
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
    getMainMetadata: () => ({
      moduleName: projectDetails.moduleName,
      extendsType: projectDetails.extendsType,
      description: projectDetails.description,
    }),
  });

  useEffect(() => {
    registerWorkspace({
      getDocuments: getAllDocuments,
      loadDocuments: loadAllDocuments,
      importGraphDocument: importGraphTab,
      getActiveTabMetadata,
      updateActiveTabMetadata,
      subscribeMetadata,
    });
    return () => registerWorkspace(null);
  }, [
    registerWorkspace,
    getAllDocuments,
    loadAllDocuments,
    importGraphTab,
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
  ]);

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
      setCompileState('dirty');
    };
    window.addEventListener('vvs:import-library-graph', onImport);
    return () => window.removeEventListener('vvs:import-library-graph', onImport);
  }, [importGraphTab, setFunctions, setOpenTabs, setActiveGraphTab, setSelection, setCompileState]);

  useEffect(() => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  }, [canUndo, canRedo, setCanUndo, setCanRedo]);

  useEffect(() => {
    if (undoTrigger > 0) undo();
  }, [undoTrigger, undo]);

  useEffect(() => {
    if (redoTrigger > 0) redo();
  }, [redoTrigger, redo]);

  useEffect(() => {
    setCompileState('dirty');
  }, [nodes, edges, setCompileState]);

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
