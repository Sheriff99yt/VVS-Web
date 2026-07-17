import { useEffect, useRef, useCallback } from 'react';
import { VVSNode, VVSEdge } from '@/types/graph';
import {
  GraphDocument,
  GraphTabMetadata,
  createDefaultGraphForTab,
  defaultTabMetadata,
  withDefaultMetadata,
  isCodegenMetadataPatch,
  type ProjectCodegenDefaults,
} from '@/lib/graphDefaults';
import { GraphTab } from '@/contexts/ProjectContext';
import { graphDisplayName } from '@/lib/graphTabs';
import { useLatestRef } from '@/hooks/useLatestRef';
import { clearEdgeSelectionFlags, clearNodeSelectionFlags } from '@/lib/graphSelection';
import { normalizeParenting } from '@/lib/graphParenting';
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

/**
 * Documents outlive open tabs. Closing a function tab must not wipe its body —
 * retain while the function symbol exists (or the tab is still open / pinned).
 */
export function shouldRetainGraphDocument(
  tabId: string,
  options: {
    openTabIds: ReadonlySet<string>;
    graphContainerIds: ReadonlySet<string>;
    functionIds: ReadonlySet<string>;
  }
): boolean {
  if (isPinnedDocumentTab(tabId, options.graphContainerIds)) return true;
  if (options.functionIds.has(tabId)) return true;
  if (options.openTabIds.has(tabId)) return true;
  return false;
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
  /** Function symbol ids whose body graphs must survive tab close. */
  functionIds?: string[];
  nodes: VVSNode[];
  edges: VVSEdge[];
  setNodes: React.Dispatch<React.SetStateAction<VVSNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<VVSEdge[]>>;
  clearHistory: () => void;
  initialMain: GraphDocument;
  getMainMetadata: () => GraphTabMetadata;
  getProjectCodegenDefaults: () => ProjectCodegenDefaults;
  /** When true, skip debounced document revision notifications (during node drag). */
  isDraggingRef?: React.RefObject<boolean>;
  /**
   * When true, tab switches / document loads must not wipe the undo stack
   * (used while restoring a project history slice).
   */
  suppressHistoryClearRef?: React.RefObject<boolean>;
}

export function useGraphTabSync({
  activeGraphTab,
  openTabs,
  graphContainerIds,
  functionIds = [],
  nodes,
  edges,
  setNodes,
  setEdges,
  clearHistory,
  initialMain,
  getMainMetadata,
  getProjectCodegenDefaults,
  isDraggingRef,
  suppressHistoryClearRef,
}: UseGraphTabSyncOptions) {
  const maybeClearHistory = useCallback(() => {
    if (suppressHistoryClearRef?.current) return;
    clearHistory();
  }, [clearHistory, suppressHistoryClearRef]);
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
      const tabMeta = openTabs.find((t) => t.id === tabId);
      const codegenDefaults = getProjectCodegenDefaults();
      const doc = documentsRef.current.get(tabId);
      if (tabId === 'main') {
        return {
          ...defaultTabMetadata('main', tabMeta?.name ?? 'Main graph', codegenDefaults),
          ...getMainMetadata(),
          ...(doc?.metadata?.targetLanguage !== undefined
            ? { targetLanguage: doc.metadata.targetLanguage }
            : {}),
          ...(doc?.metadata?.targetFileExtension !== undefined
            ? { targetFileExtension: doc.metadata.targetFileExtension }
            : {}),
        };
      }
      return (
        doc?.metadata ??
        defaultTabMetadata(documentTabType(tabMeta?.type), tabMeta?.name ?? 'Graph', codegenDefaults)
      );
    },
    [getMainMetadata, getProjectCodegenDefaults, openTabs]
  );

  const flushCurrentTab = useCallback(
    (nodesOverride?: VVSNode[], edgesOverride?: VVSEdge[]) => {
      const tabId = prevTabRef.current;
      const tabMeta = openTabs.find((t) => t.id === tabId);
      const codegenDefaults = getProjectCodegenDefaults();
      const existingMetadata = documentsRef.current.get(tabId)?.metadata;

      let metadata: GraphTabMetadata;
      if (tabId === 'main') {
        metadata = {
          ...defaultTabMetadata('main', tabMeta?.name ?? 'Main graph', codegenDefaults),
          ...getMainMetadata(),
          ...(existingMetadata?.targetLanguage !== undefined
            ? { targetLanguage: existingMetadata.targetLanguage }
            : {}),
          ...(existingMetadata?.targetFileExtension !== undefined
            ? { targetFileExtension: existingMetadata.targetFileExtension }
            : {}),
        };
      } else {
        metadata =
          existingMetadata ??
          defaultTabMetadata(documentTabType(tabMeta?.type), tabMeta?.name ?? 'Graph', codegenDefaults);
      }

      documentsRef.current.set(tabId, {
        nodes: clearNodeSelectionFlags(structuredClone(nodesOverride ?? nodesRef.current)),
        edges: clearEdgeSelectionFlags(structuredClone(edgesOverride ?? edgesRef.current)),
        metadata,
      });
    },
    [getMainMetadata, getProjectCodegenDefaults, openTabs, nodesRef, edgesRef]
  );

  const flushAndNotify = useCallback(
    (nodesOverride?: VVSNode[], edgesOverride?: VVSEdge[]) => {
      if (nodesOverride) nodesRef.current = nodesOverride;
      if (edgesOverride) edgesRef.current = edgesOverride;
      flushCurrentTab(nodesOverride, edgesOverride);
      notifyMetadata();
    },
    [flushCurrentTab, notifyMetadata, nodesRef, edgesRef]
  );

  const getAllDocuments = useCallback((): Record<string, GraphDocument> => {
    // Skip mid-drag re-flush so in-flight RF positions do not thrash documents.
    if (!isDraggingRef?.current) {
      flushCurrentTab();
    }
    const result: Record<string, GraphDocument> = {};
    documentsRef.current.forEach((doc, tabId) => {
      result[tabId] = cloneDocument(doc);
    });
    return result;
  }, [flushCurrentTab, isDraggingRef]);

  const loadAllDocuments = useCallback(
    (documents: Record<string, GraphDocument>, activeTab: string) => {
      documentsRef.current = new Map(
        Object.entries(documents).map(([tabId, doc]) => [tabId, cloneDocument(doc)])
      );
      prevTabRef.current = activeTab;
      const doc = documentsRef.current.get(activeTab) ?? { nodes: [], edges: [] };
      const loaded = cloneDocument(doc);
      setNodes(clearNodeSelectionFlags(normalizeParenting(loaded.nodes)));
      setEdges(clearEdgeSelectionFlags(loaded.edges));
      maybeClearHistory();
      notifyMetadata();
    },
    [setNodes, setEdges, maybeClearHistory, notifyMetadata]
  );

  const getActiveTabMetadata = useCallback((): GraphTabMetadata => {
    return getTabMeta(activeGraphTab);
  }, [activeGraphTab, getTabMeta]);

  const updateActiveTabMetadata = useCallback(
    (patch: Partial<GraphTabMetadata>) => {
      const tabMeta = openTabs.find((t) => t.id === activeGraphTab);
      const codegenPatch = isCodegenMetadataPatch(patch);

      if (!codegenPatch) {
        if (activeGraphTab === MAIN_GRAPH_CONTAINER_ID) return;
        if (containerIdSet().has(activeGraphTab) && tabMeta?.type === 'container') return;
      }

      const doc = documentsRef.current.get(activeGraphTab) ?? {
        nodes: structuredClone(nodesRef.current),
        edges: structuredClone(edgesRef.current),
      };
      const base =
        doc.metadata ??
        defaultTabMetadata(documentTabType(tabMeta?.type), tabMeta?.name ?? 'Graph', getProjectCodegenDefaults());
      documentsRef.current.set(activeGraphTab, {
        ...doc,
        metadata: { ...base, ...patch },
      });
      notifyMetadata();
    },
    [activeGraphTab, openTabs, notifyMetadata, getProjectCodegenDefaults, containerIdSet]
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
      const run = () => {
        if (isDraggingRef?.current) return;
        flushCurrentTab();
        notifyMetadata();
      };
      if (immediate) {
        run();
        return;
      }
      if (isDraggingRef?.current) return;
      metadataSyncTimerRef.current = window.setTimeout(run, 120);
    },
    [flushCurrentTab, notifyMetadata, isDraggingRef]
  );

  useEffect(() => {
    scheduleMetadataSync();
    return () => {
      if (metadataSyncTimerRef.current !== null) {
        window.clearTimeout(metadataSyncTimerRef.current);
      }
    };
  }, [nodes, edges, scheduleMetadataSync]);

  const functionIdsRef = useLatestRef(functionIds);

  useEffect(() => {
    const openIds = new Set(openTabs.map((tab) => tab.id));
    const containers = containerIdSet();
    const retainedFunctions = new Set(functionIdsRef.current);
    let changed = false;
    documentsRef.current.forEach((_, tabId) => {
      if (
        shouldRetainGraphDocument(tabId, {
          openTabIds: openIds,
          graphContainerIds: containers,
          functionIds: retainedFunctions,
        })
      ) {
        return;
      }
      documentsRef.current.delete(tabId);
      changed = true;
    });
    if (changed) notifyMetadata();
  }, [openTabs, functionIds, notifyMetadata, containerIdSet, functionIdsRef]);

  useEffect(() => {
    if (prevTabRef.current === activeGraphTab) return;

    flushCurrentTab();

    const tabMeta = openTabs.find((t) => t.id === activeGraphTab);
    const tabType = documentTabType(tabMeta?.type);
    const tabName = tabMeta?.name ?? 'Graph';

    let nextDoc = documentsRef.current.get(activeGraphTab);
    if (!nextDoc) {
      const codegenDefaults = getProjectCodegenDefaults();
      nextDoc = withDefaultMetadata(
        createDefaultGraphForTab(tabType, tabName, undefined, codegenDefaults),
        tabType,
        tabName,
        codegenDefaults
      );
      documentsRef.current.set(activeGraphTab, nextDoc);
    }

    const loaded = cloneDocument(nextDoc);
    setNodes(clearNodeSelectionFlags(normalizeParenting(loaded.nodes)));
    setEdges(clearEdgeSelectionFlags(loaded.edges));
    // U116: keep undo stack across tab switches (snapshots carry activeGraphTab).
    prevTabRef.current = activeGraphTab;
    notifyMetadata();
  }, [
    activeGraphTab,
    openTabs,
    setNodes,
    setEdges,
    flushCurrentTab,
    notifyMetadata,
    getProjectCodegenDefaults,
  ]);

  const importGraphTab = useCallback(
    (tab: GraphTab, document: GraphDocument) => {
      flushCurrentTab();
      const tabType = documentTabType(tab.type);
      const name = graphDisplayName(tab);
      const doc = withDefaultMetadata(
        cloneDocument(document),
        tabType,
        name,
        getProjectCodegenDefaults()
      );
      documentsRef.current.set(tab.id, doc);
      setNodes(clearNodeSelectionFlags(normalizeParenting(doc.nodes)));
      setEdges(clearEdgeSelectionFlags(doc.edges));
      prevTabRef.current = tab.id;
      maybeClearHistory();
      notifyMetadata();
    },
    [flushCurrentTab, setNodes, setEdges, maybeClearHistory, notifyMetadata, getProjectCodegenDefaults]
  );

  const patchAllDocuments = useCallback(
    (
      updater: (docs: Record<string, GraphDocument>) => Record<string, GraphDocument>,
      options?: { affectedTabIds?: string[]; preserveHistory?: boolean; viewTabId?: string }
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
      const tabToShow = options?.viewTabId ?? activeGraphTab;
      if (options?.viewTabId) {
        prevTabRef.current = options.viewTabId;
      }
      const activeDoc = documentsRef.current.get(tabToShow) ?? { nodes: [], edges: [] };
      const loaded = cloneDocument(activeDoc);
      setNodes(clearNodeSelectionFlags(normalizeParenting(loaded.nodes)));
      setEdges(clearEdgeSelectionFlags(loaded.edges));
      if (!options?.preserveHistory) {
        maybeClearHistory();
      }
      notifyMetadata();
      const affected =
        options?.affectedTabIds ??
        Object.keys(next).filter((tabId) => tabId === tabToShow || current[tabId] !== next[tabId]);
      return affected;
    },
    [activeGraphTab, flushCurrentTab, setNodes, setEdges, maybeClearHistory, notifyMetadata]
  );

  /** Replace all documents and show `activeTab` without wiping undo (history restore). */
  const replaceDocumentsForHistory = useCallback(
    (documents: Record<string, GraphDocument>, activeTab: string) => {
      documentsRef.current = new Map(
        Object.entries(documents).map(([tabId, doc]) => [tabId, cloneDocument(doc)])
      );
      prevTabRef.current = activeTab;
      const doc = documentsRef.current.get(activeTab) ?? { nodes: [], edges: [] };
      const loaded = cloneDocument(doc);
      setNodes(clearNodeSelectionFlags(normalizeParenting(loaded.nodes)));
      setEdges(clearEdgeSelectionFlags(loaded.edges));
      notifyMetadata();
    },
    [setNodes, setEdges, notifyMetadata]
  );

  /**
   * U116 lean undo: flush current tab, point prevTabRef at `tabId` so the
   * activeGraphTab effect does not reload/clear — caller then setNodes from snapshot.
   */
  const prepareTabSwitchForHistory = useCallback((tabId: string) => {
    flushCurrentTab();
    prevTabRef.current = tabId;
  }, [flushCurrentTab]);

  /** Write nodes/edges into documentsRef for a tab (lean undo must not leave stale docs). */
  const commitTabDocumentForHistory = useCallback(
    (tabId: string, nextNodes: VVSNode[], nextEdges: VVSEdge[]) => {
      const existing = documentsRef.current.get(tabId);
      const tabMeta = openTabs.find((t) => t.id === tabId);
      const codegenDefaults = getProjectCodegenDefaults();
      const metadata =
        existing?.metadata ??
        defaultTabMetadata(
          documentTabType(tabMeta?.type),
          tabMeta?.name ?? 'Graph',
          codegenDefaults
        );
      documentsRef.current.set(tabId, {
        nodes: clearNodeSelectionFlags(structuredClone(nextNodes)),
        edges: clearEdgeSelectionFlags(structuredClone(nextEdges)),
        metadata,
      });
      notifyMetadata();
    },
    [openTabs, getProjectCodegenDefaults, notifyMetadata]
  );

  return {
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
    scheduleMetadataSync,
    flushAndNotify,
  };
}
