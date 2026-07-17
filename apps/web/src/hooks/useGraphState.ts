import { useCallback, useRef, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { VVSNode, VVSEdge } from '@/types/graph';
import { useLatestRef } from '@/hooks/useLatestRef';
import {
  cloneGraphSnapshot,
  metaFromSnapshot,
  type GraphHistoryEntryMeta,
  type GraphHistorySnapshot,
  type ProjectHistorySlice,
} from '@/lib/graphHistory';
import {
  shouldCaptureProjectOnJump,
  shouldCaptureProjectOnOpposite,
} from '@/lib/graphHistoryPolicy';

export interface UseGraphStateOptions {
  getActiveGraphTab?: () => string;
  /** Capture symbols + all documents for workspace undo entries. */
  getProjectSlice?: () => ProjectHistorySlice | null;
  /** Restore symbols + documents when undoing a project-backed entry. */
  applyProjectSlice?: (slice: ProjectHistorySlice) => void;
  /**
   * Lean canvas undo on another tab: switch to that tab and load its live
   * document before applying snapshotted nodes/edges.
   */
  ensureHistoryTab?: (tabId: string) => void;
  /** Keep documentsRef in sync when applying a lean snapshot. */
  commitTabDocument?: (tabId: string, nodes: VVSNode[], edges: VVSEdge[]) => void;
}

export interface CaptureSnapshotOptions {
  /** When true, attach full ProjectHistorySlice (symbol / class mutations). */
  includeProject?: boolean;
}

export function useGraphState(
  initialNodes: VVSNode[] = [],
  initialEdges: VVSEdge[] = [],
  options: UseGraphStateOptions = {}
) {
  const [nodes, setNodes, onNodesChangeReactFlow] = useNodesState<VVSNode>(initialNodes);
  const [edges, setEdges, onEdgesChangeReactFlow] = useEdgesState<VVSEdge>(initialEdges);

  const nodesRef = useLatestRef(nodes);
  const edgesRef = useLatestRef(edges);
  const getActiveGraphTabRef = useRef(options.getActiveGraphTab);
  const getProjectSliceRef = useRef(options.getProjectSlice);
  const applyProjectSliceRef = useRef(options.applyProjectSlice);
  const ensureHistoryTabRef = useRef(options.ensureHistoryTab);
  const commitTabDocumentRef = useRef(options.commitTabDocument);
  getActiveGraphTabRef.current = options.getActiveGraphTab;
  getProjectSliceRef.current = options.getProjectSlice;
  applyProjectSliceRef.current = options.applyProjectSlice;
  ensureHistoryTabRef.current = options.ensureHistoryTab;
  commitTabDocumentRef.current = options.commitTabDocument;

  const pastRef = useRef<GraphHistorySnapshot[]>([]);
  const futureRef = useRef<GraphHistorySnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  const bumpHistory = useCallback(() => {
    setHistoryVersion((v) => v + 1);
  }, []);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
    bumpHistory();
  }, [bumpHistory]);

  const captureSnapshot = useCallback(
    (label: string, opts?: CaptureSnapshotOptions): GraphHistorySnapshot => {
      const tab = getActiveGraphTabRef.current?.() ?? 'main';
      const project = opts?.includeProject ? (getProjectSliceRef.current?.() ?? null) : null;
      return cloneGraphSnapshot(nodesRef.current, edgesRef.current, label, tab, project);
    },
    []
  );

  const applySnapshot = useCallback(
    (snap: GraphHistorySnapshot) => {
      if (snap.project && applyProjectSliceRef.current) {
        applyProjectSliceRef.current(snap.project);
        return;
      }
      const currentTab = getActiveGraphTabRef.current?.() ?? 'main';
      const targetTab = snap.activeGraphTab || currentTab;
      if (targetTab !== currentTab) {
        ensureHistoryTabRef.current?.(targetTab);
      }
      setNodes(snap.nodes);
      setEdges(snap.edges);
      commitTabDocumentRef.current?.(targetTab, snap.nodes, snap.edges);
    },
    [setNodes, setEdges]
  );

  /** Canvas edits — lean snapshot (nodes/edges/tab only). */
  const saveSnapshot = useCallback(
    (label = 'Edit graph') => {
      pastRef.current.push(captureSnapshot(label, { includeProject: false }));
      if (pastRef.current.length > 50) pastRef.current.shift();
      futureRef.current = [];
      syncHistoryFlags();
    },
    [captureSnapshot, syncHistoryFlags]
  );

  /** Symbol / class mutations — full project slice. */
  const saveProjectSnapshot = useCallback(
    (label: string) => {
      const snap = captureSnapshot(label, { includeProject: true });
      // Workspace not ready — skip so we never record a fake "project" undo.
      if (!snap.project) return;
      pastRef.current.push(snap);
      if (pastRef.current.length > 50) pastRef.current.shift();
      futureRef.current = [];
      syncHistoryFlags();
    },
    [captureSnapshot, syncHistoryFlags]
  );

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const nodeDragHistoryArmedRef = useRef(false);

  const onNodesChange = useCallback(
    (changes: NodeChange<VVSNode>[]) => {
      const isStructural = changes.some(
        (c) => c.type === 'add' || c.type === 'remove' || c.type === 'replace'
      );
      const isDragMove = changes.some(
        (c) => c.type === 'position' && c.dragging === true
      );
      const isDragEnd = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );

      // Capture pre-drag positions on first move frame (nodesRef still has start pose).
      // Saving on drag-end would push the already-moved state and make undo a no-op.
      if (isDragMove && !nodeDragHistoryArmedRef.current) {
        saveSnapshot('Move nodes');
        nodeDragHistoryArmedRef.current = true;
      }
      if (isDragEnd) {
        nodeDragHistoryArmedRef.current = false;
      }

      onNodesChangeReactFlow(changes);

      // After apply, nodesRef is still pre-change until re-render — correct undo baseline.
      if (isStructural) {
        saveSnapshot(
          changes.some((c) => c.type === 'remove') ? 'Remove nodes' : 'Edit nodes'
        );
      }
    },
    [onNodesChangeReactFlow, saveSnapshot]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<VVSEdge>[]) => {
      const isSignificant = changes.some((c) => c.type === 'add' || c.type === 'remove');
      if (isSignificant) saveSnapshot('Edit wires');
      onEdgesChangeReactFlow(changes);
    },
    [onEdgesChangeReactFlow, saveSnapshot]
  );

  const undo = useCallback((): string | null => {
    if (pastRef.current.length === 0) return null;
    const prev = pastRef.current[pastRef.current.length - 1]!;
    const currentTab = getActiveGraphTabRef.current?.() ?? 'main';
    futureRef.current.push(
      captureSnapshot('Current', {
        includeProject: shouldCaptureProjectOnOpposite(
          Boolean(prev.project),
          prev.activeGraphTab,
          currentTab
        ),
      })
    );
    pastRef.current.pop();
    applySnapshot(prev);
    syncHistoryFlags();
    return prev.project?.activeGraphTab ?? prev.activeGraphTab;
  }, [captureSnapshot, applySnapshot, syncHistoryFlags]);

  const redo = useCallback((): string | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[futureRef.current.length - 1]!;
    const currentTab = getActiveGraphTabRef.current?.() ?? 'main';
    pastRef.current.push(
      captureSnapshot('Current', {
        includeProject: shouldCaptureProjectOnOpposite(
          Boolean(next.project),
          next.activeGraphTab,
          currentTab
        ),
      })
    );
    futureRef.current.pop();
    applySnapshot(next);
    syncHistoryFlags();
    return next.project?.activeGraphTab ?? next.activeGraphTab;
  }, [captureSnapshot, applySnapshot, syncHistoryFlags]);

  const jumpToPastEntry = useCallback(
    (entryId: string): string | null => {
      const idx = pastRef.current.findIndex((e) => e.id === entryId);
      if (idx < 0) return null;
      const target = pastRef.current[idx]!;
      const tail = pastRef.current.slice(idx + 1);
      const currentTab = getActiveGraphTabRef.current?.() ?? 'main';
      const current = captureSnapshot('Current', {
        includeProject:
          shouldCaptureProjectOnJump(
            Boolean(target.project),
            tail.some((e) => Boolean(e.project))
          ) ||
          shouldCaptureProjectOnOpposite(
            Boolean(target.project),
            target.activeGraphTab,
            currentTab
          ),
      });
      futureRef.current = [...tail.reverse(), current, ...futureRef.current];
      pastRef.current = pastRef.current.slice(0, idx);
      applySnapshot(target);
      syncHistoryFlags();
      return target.project?.activeGraphTab ?? target.activeGraphTab;
    },
    [captureSnapshot, applySnapshot, syncHistoryFlags]
  );

  const getPastHistory = useCallback((): GraphHistoryEntryMeta[] => {
    return pastRef.current.map(metaFromSnapshot).reverse();
  }, []);

  const getFutureCount = useCallback((): number => futureRef.current.length, []);

  const setNodesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSNode[]>, label = 'Edit graph') => {
      saveSnapshot(label);
      setNodes(updater);
    },
    [saveSnapshot, setNodes]
  );

  const setEdgesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSEdge[]>, label = 'Edit wires') => {
      saveSnapshot(label);
      setEdges(updater);
    },
    [saveSnapshot, setEdges]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    setNodesWithHistory,
    setEdgesWithHistory,
    saveSnapshot,
    saveProjectSnapshot,
    undo,
    redo,
    jumpToPastEntry,
    getPastHistory,
    getFutureCount,
    historyVersion,
    clearHistory,
    canUndo,
    canRedo,
  };
}
