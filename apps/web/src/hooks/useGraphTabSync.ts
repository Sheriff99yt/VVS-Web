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

function documentTabType(tabType: GraphTab['type'] | undefined): 'main' | 'function' {
  return tabType === 'main' ? 'main' : 'function';
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
  nodes: VVSNode[];
  edges: VVSEdge[];
  setNodes: React.Dispatch<React.SetStateAction<VVSNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<VVSEdge[]>>;
  clearHistory: () => void;
  initialMain: GraphDocument;
  getMainMetadata: () => GraphTabMetadata;
}

export function useGraphTabSync({
  activeGraphTab,
  openTabs,
  nodes,
  edges,
  setNodes,
  setEdges,
  clearHistory,
  initialMain,
  getMainMetadata,
}: UseGraphTabSyncOptions) {
  const documentsRef = useRef<Map<string, GraphDocument>>(
    new Map([['main', cloneDocument(withDefaultMetadata(initialMain, 'main', 'Main graph'))]])
  );
  const prevTabRef = useRef(activeGraphTab);
  const nodesRef = useLatestRef(nodes);
  const edgesRef = useLatestRef(edges);
  const metadataListenersRef = useRef(new Set<() => void>());

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
      nodes: structuredClone(nodesRef.current),
      edges: structuredClone(edgesRef.current),
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
      setNodes(loaded.nodes);
      setEdges(loaded.edges);
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
      if (activeGraphTab === 'main') return;
      const tabMeta = openTabs.find((t) => t.id === activeGraphTab);
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

  useEffect(() => {
    const timer = window.setTimeout(() => notifyMetadata(), 120);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, notifyMetadata]);

  useEffect(() => {
    const openIds = new Set(openTabs.map((tab) => tab.id));
    let changed = false;
    documentsRef.current.forEach((_, tabId) => {
      if (tabId !== 'main' && !openIds.has(tabId)) {
        documentsRef.current.delete(tabId);
        changed = true;
      }
    });
    if (changed) notifyMetadata();
  }, [openTabs, notifyMetadata]);

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
    setNodes(loaded.nodes);
    setEdges(loaded.edges);
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
      setNodes(doc.nodes);
      setEdges(doc.edges);
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
      setNodes(loaded.nodes);
      setEdges(loaded.edges);
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
  };
}
