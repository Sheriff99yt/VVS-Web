import { useEffect, useRef, useCallback } from 'react';
import { VVSNode, VVSEdge } from '@/types/graph';
import {
  GraphDocument,
  GraphTabMetadata,
  createDefaultGraphForTab,
  defaultTabMetadata,
  withDefaultMetadata,
} from '@/lib/graphDefaults';
import { GraphTab } from '@/contexts/ProjectContext';
import { graphDisplayName } from '@/lib/graphTabs';
import { useLatestRef } from '@/hooks/useLatestRef';
import { clearEdgeSelectionFlags, clearNodeSelectionFlags } from '@/lib/graphSelection';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

function documentTabType(
  tabType: GraphTab['type'] | undefined
): 'main' | 'function' | 'container' {
  if (tabType === 'main') return 'main';
  if (tabType === 'container') return 'container';
  return 'function';
}

function isPinnedDocumentTab(tabId: string, graphContainerIds: ReadonlySet<string>): boolean {
  return tabId === 'main' || tabId === MAIN_GRAPH_CONTAINER_ID || graphContainerIds.has(tabId);
}

function cloneDocument(doc: GraphDocument): GraphDocument {
  return {
    nodes: structuredClone(doc.nodes),
    edges: structuredClone(doc.edges),
    metadata: doc.metadata ? structuredClone(doc.metadata) : undefined,
  };
}

interface UseGraphTabSyncOptions {
  activeGraphTab: string;
  openTabs: GraphTab[];
  graphContainerIds: string[];
  nodes: VVSNode[];
  edges: VVSEdge[];
  setNodes: React.Dispatch<React.SetStateAction<VVSNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<VVSEdge[]>>;
  clearHistory: () => void;
  initialMain: GraphDocument;
  getMainMetadata: () => GraphTabMetadata;
  /** When true, skip debounced document revision notifications (during node drag). */
  isDraggingRef?: React.RefObject<boolean>;
}

export function useGraphTabSync({
  activeGraphTab,
  openTabs,
  graphContainerIds,
  nodes,
  edges,
  setNodes,
  setEdges,
  clearHistory,
  initialMain,
  getMainMetadata,
  isDraggingRef,
}: UseGraphTabSyncOptions) {
  const documentsRef = useRef<Map<string, GraphDocument>>(
    new Map([
      ['main', cloneDocument(withDefaultMetadata(initialMain, 'main', 'Main graph'))],
      [MAIN_GRAPH_CONTAINER_ID, { nodes: [], edges: [] }],
    ])
  );
  const prevTabRef = useRef(activeGraphTab);
  const nodesRef = useLatestRef(nodes);
  const edgesRef = useLatestRef(edges);
  const metadataListenersRef = useRef(new Set<() => void>());
  const graphContainerIdsRef = useLatestRef(graphContainerIds);

  const containerIdSet = useCallback((): ReadonlySet<string> => {
    return new Set(graphContainerIdsRef.current);
  }, [graphContainerIdsRef]);

  const notifyMetadata = useCallback(() => {
    metadataListenersRef.current.forEach((listener) => listener());
  }, []);

  const getTabMeta = useCallback(
    (tabId: string): GraphTabMetadata => {
      if (tabId === 'main') return getMainMetadata();
      const doc = documentsRef.current.get(tabId);
      const tabMeta = openTabs.find((t) => t.id === tabId);
      return doc?.metadata ?? defaultTabMetadata(documentTabType(tabMeta?.type), tabMeta?.name ?? 'Graph');
    },
    [getMainMetadata, openTabs]
  );

  const flushCurrentTab = useCallback(() => {
    const tabId = prevTabRef.current;
    const tabMeta = openTabs.find((t) => t.id === tabId);
    const metadata =
      tabId === 'main'
        ? getMainMetadata()
        : documentsRef.current.get(tabId)?.metadata ??
          defaultTabMetadata(documentTabType(tabMeta?.type), tabMeta?.name ?? 'Graph');

    documentsRef.current.set(tabId, {
      nodes: clearNodeSelectionFlags(structuredClone(nodesRef.current)),
      edges: clearEdgeSelectionFlags(structuredClone(edgesRef.current)),
      metadata,
    });
  }, [getMainMetadata, openTabs]);

  const getAllDocuments = useCallback((): Record<string, GraphDocument> => {
    flushCurrentTab();
    const result: Record<string, GraphDocument> = {};
    documentsRef.current.forEach((doc, tabId) => {
      result[tabId] = cloneDocument(doc);
    });
    return result;
  }, [flushCurrentTab]);

  const loadAllDocuments = useCallback(
    (documents: Record<string, GraphDocument>, activeTab: string) => {
      documentsRef.current = new Map(
        Object.entries(documents).map(([tabId, doc]) => [tabId, cloneDocument(doc)])
      );
      prevTabRef.current = activeTab;
      const doc = documentsRef.current.get(activeTab) ?? { nodes: [], edges: [] };
      const loaded = cloneDocument(doc);
      setNodes(clearNodeSelectionFlags(loaded.nodes));
      setEdges(clearEdgeSelectionFlags(loaded.edges));
      clearHistory();
      notifyMetadata();
    },
    [setNodes, setEdges, clearHistory, notifyMetadata]
  );

  const getActiveTabMetadata = useCallback((): GraphTabMetadata => {
    return getTabMeta(activeGraphTab);
  }, [activeGraphTab, getTabMeta]);

  const updateActiveTabMetadata = useCallback(
    (patch: Partial<GraphTabMetadata>) => {
      const tabMeta = openTabs.find((t) => t.id === activeGraphTab);
      if (activeGraphTab === 'main' || activeGraphTab === MAIN_GRAPH_CONTAINER_ID) return;
      if (containerIdSet().has(activeGraphTab) && tabMeta?.type === 'container') return;
      const doc = documentsRef.current.get(activeGraphTab) ?? {
        nodes: structuredClone(nodesRef.current),
        edges: structuredClone(edgesRef.current),
      };
      const base = doc.metadata ?? defaultTabMetadata(documentTabType(tabMeta?.type), tabMeta?.name ?? 'Graph');
      documentsRef.current.set(activeGraphTab, {
        ...doc,
        metadata: { ...base, ...patch },
      });
      notifyMetadata();
    },
    [activeGraphTab, openTabs, notifyMetadata]
  );

  const subscribeMetadata = useCallback((listener: () => void) => {
    metadataListenersRef.current.add(listener);
    return () => metadataListenersRef.current.delete(listener);
  }, []);

  const metadataSyncTimerRef = useRef<number | null>(null);

  const scheduleMetadataSync = useCallback(
    (immediate = false) => {
      if (metadataSyncTimerRef.current !== null) {
        window.clearTimeout(metadataSyncTimerRef.current);
        metadataSyncTimerRef.current = null;
      }
      const run = () => notifyMetadata();
      if (immediate) {
        run();
        return;
      }
      if (isDraggingRef?.current) return;
      metadataSyncTimerRef.current = window.setTimeout(run, 120);
    },
    [notifyMetadata, isDraggingRef]
  );

  useEffect(() => {
    scheduleMetadataSync();
    return () => {
      if (metadataSyncTimerRef.current !== null) {
        window.clearTimeout(metadataSyncTimerRef.current);
      }
    };
  }, [nodes, edges, scheduleMetadataSync]);

  useEffect(() => {
    const openIds = new Set(openTabs.map((tab) => tab.id));
    const containers = containerIdSet();
    let changed = false;
    documentsRef.current.forEach((_, tabId) => {
      if (isPinnedDocumentTab(tabId, containers)) return;
      if (!openIds.has(tabId)) {
        documentsRef.current.delete(tabId);
        changed = true;
      }
    });
    if (changed) notifyMetadata();
  }, [openTabs, notifyMetadata, containerIdSet]);

  useEffect(() => {
    if (prevTabRef.current === activeGraphTab) return;

    flushCurrentTab();

    const tabMeta = openTabs.find((t) => t.id === activeGraphTab);
    const tabType = documentTabType(tabMeta?.type);
    const tabName = tabMeta?.name ?? 'Graph';

    let nextDoc = documentsRef.current.get(activeGraphTab);
    if (!nextDoc) {
      nextDoc = withDefaultMetadata(createDefaultGraphForTab(tabType, tabName), tabType, tabName);
      documentsRef.current.set(activeGraphTab, nextDoc);
    }

    const loaded = cloneDocument(nextDoc);
    setNodes(clearNodeSelectionFlags(loaded.nodes));
    setEdges(clearEdgeSelectionFlags(loaded.edges));
    clearHistory();
    prevTabRef.current = activeGraphTab;
    notifyMetadata();
  }, [
    activeGraphTab,
    openTabs,
    setNodes,
    setEdges,
    clearHistory,
    flushCurrentTab,
    notifyMetadata,
  ]);

  const importGraphTab = useCallback(
    (tab: GraphTab, document: GraphDocument) => {
      flushCurrentTab();
      const tabType = documentTabType(tab.type);
      const name = graphDisplayName(tab);
      const doc = withDefaultMetadata(cloneDocument(document), tabType, name);
      documentsRef.current.set(tab.id, doc);
      setNodes(clearNodeSelectionFlags(doc.nodes));
      setEdges(clearEdgeSelectionFlags(doc.edges));
      prevTabRef.current = tab.id;
      clearHistory();
      notifyMetadata();
    },
    [flushCurrentTab, setNodes, setEdges, clearHistory, notifyMetadata]
  );

  const patchAllDocuments = useCallback(
    (
      updater: (docs: Record<string, GraphDocument>) => Record<string, GraphDocument>,
      options?: { affectedTabIds?: string[] }
    ): string[] => {
      flushCurrentTab();
      const current: Record<string, GraphDocument> = {};
      documentsRef.current.forEach((doc, tabId) => {
        current[tabId] = cloneDocument(doc);
      });
      const next = updater(current);
      documentsRef.current = new Map(
        Object.entries(next).map(([tabId, doc]) => [tabId, cloneDocument(doc)])
      );
      const activeDoc = documentsRef.current.get(activeGraphTab) ?? { nodes: [], edges: [] };
      const loaded = cloneDocument(activeDoc);
      setNodes(clearNodeSelectionFlags(loaded.nodes));
      setEdges(clearEdgeSelectionFlags(loaded.edges));
      clearHistory();
      notifyMetadata();
      const affected =
        options?.affectedTabIds ??
        Object.keys(next).filter((tabId) => tabId === activeGraphTab || current[tabId] !== next[tabId]);
      return affected;
    },
    [activeGraphTab, flushCurrentTab, setNodes, setEdges, clearHistory, notifyMetadata]
  );

  return {
    getAllDocuments,
    loadAllDocuments,
    patchAllDocuments,
    getActiveTabMetadata,
    updateActiveTabMetadata,
    subscribeMetadata,
    importGraphTab,
    scheduleMetadataSync,
  };
}
