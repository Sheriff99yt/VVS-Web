import { useCallback, useEffect, useRef, useState } from 'react';
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
  revealFromSnapshot,
  type GraphHistoryEntryMeta,
  type GraphHistoryReveal,
  type GraphHistorySnapshot,
  type ProjectHistorySlice,
} from '@/lib/graphHistory';
import {
  shouldCaptureProjectOnJump,
  shouldCaptureProjectOnOpposite,
} from '@/lib/graphHistoryPolicy';
import {
  beginApplyingHistory,
  endApplyingHistory,
  isApplyingHistory,
  registerHistoryDiscardClearer,
  registerHistoryJumpToLatest,
  requestHistoryEditGate,
  resetHistoryDiscardGate,
  setHistoryBrowsePreview,
} from '@/lib/historyDiscardGate';
import { dispatchRevealEditHistory } from '@/lib/editHistoryReveal';
import { markNavGraphEdit } from '@/lib/navActivityFlags';

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

  useEffect(() => {
    return registerHistoryDiscardClearer(() => {
      futureRef.current = [];
      syncHistoryFlags();
    });
  }, [syncHistoryFlags]);

  const pushLeanSnapshot = useCallback(
    (label: string) => {
      pastRef.current.push(captureSnapshot(label, { includeProject: false }));
      if (pastRef.current.length > 50) pastRef.current.shift();
      futureRef.current = [];
      setHistoryBrowsePreview(false);
      syncHistoryFlags();
      markNavGraphEdit();
    },
    [captureSnapshot, syncHistoryFlags]
  );

  const pushProjectSnapshot = useCallback(
    (label: string): boolean => {
      const snap = captureSnapshot(label, { includeProject: true });
      if (!snap.project) return false;
      pastRef.current.push(snap);
      if (pastRef.current.length > 50) pastRef.current.shift();
      futureRef.current = [];
      setHistoryBrowsePreview(false);
      syncHistoryFlags();
      markNavGraphEdit();
      return true;
    },
    [captureSnapshot, syncHistoryFlags]
  );

  /**
   * Record history then run `proceed`. If newer states exist, opens the discard
   * dialog and runs both after Discard (one click). Undo/redo apply skips this.
   */
  const commitEdit = useCallback(
    (label: string, proceed: () => void, kind: 'lean' | 'project' = 'lean') => {
      if (isApplyingHistory()) {
        proceed();
        return;
      }
      const run = () => {
        if (kind === 'project') {
          if (!pushProjectSnapshot(label)) return;
        } else {
          pushLeanSnapshot(label);
        }
        proceed();
      };
      const newer = futureRef.current.length;
      if (newer > 0) {
        requestHistoryEditGate(newer, run);
        return;
      }
      run();
    },
    [pushLeanSnapshot, pushProjectSnapshot]
  );

  /** @deprecated Prefer commitEdit — boolean API for legacy call sites. */
  const saveSnapshot = useCallback(
    (label = 'Edit graph'): boolean => {
      if (isApplyingHistory()) return true;
      if (futureRef.current.length > 0) {
        requestHistoryEditGate(futureRef.current.length, () => pushLeanSnapshot(label));
        return false;
      }
      pushLeanSnapshot(label);
      return true;
    },
    [pushLeanSnapshot]
  );

  const saveProjectSnapshot = useCallback(
    (label: string): boolean => {
      if (isApplyingHistory()) return true;
      if (futureRef.current.length > 0) {
        requestHistoryEditGate(futureRef.current.length, () => {
          pushProjectSnapshot(label);
        });
        return false;
      }
      return pushProjectSnapshot(label);
    },
    [pushProjectSnapshot]
  );

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    setHistoryBrowsePreview(false);
    resetHistoryDiscardGate();
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const nodeDragHistoryArmedRef = useRef(false);

  const onNodesChange = useCallback(
    (changes: NodeChange<VVSNode>[]) => {
      if (isApplyingHistory()) {
        onNodesChangeReactFlow(changes);
        return;
      }

      const isStructural = changes.some(
        (c) => c.type === 'add' || c.type === 'remove' || c.type === 'replace'
      );
      const isDragMove = changes.some(
        (c) => c.type === 'position' && c.dragging === true
      );
      const isDragEnd = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );

      if (isDragMove && !nodeDragHistoryArmedRef.current) {
        commitEdit('Move nodes', () => {
          nodeDragHistoryArmedRef.current = true;
          onNodesChangeReactFlow(changes);
        });
        return;
      }
      if (isDragEnd) {
        nodeDragHistoryArmedRef.current = false;
      }

      if (isStructural) {
        const label = changes.some((c) => c.type === 'remove')
          ? 'Remove nodes'
          : 'Edit nodes';
        commitEdit(label, () => onNodesChangeReactFlow(changes));
        return;
      }

      onNodesChangeReactFlow(changes);
    },
    [onNodesChangeReactFlow, commitEdit]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<VVSEdge>[]) => {
      if (isApplyingHistory()) {
        onEdgesChangeReactFlow(changes);
        return;
      }
      const isSignificant = changes.some((c) => c.type === 'add' || c.type === 'remove');
      if (isSignificant) {
        commitEdit('Edit wires', () => onEdgesChangeReactFlow(changes));
        return;
      }
      onEdgesChangeReactFlow(changes);
    },
    [onEdgesChangeReactFlow, commitEdit]
  );

  const undo = useCallback((): GraphHistoryReveal | null => {
    if (pastRef.current.length === 0) return null;
    beginApplyingHistory();
    try {
      // Undo is a committed step — not History-list browse preview.
      setHistoryBrowsePreview(false);
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
      const reveal = revealFromSnapshot(prev);
      dispatchRevealEditHistory(reveal);
      return reveal;
    } finally {
      endApplyingHistory();
    }
  }, [captureSnapshot, applySnapshot, syncHistoryFlags]);

  const redo = useCallback((): GraphHistoryReveal | null => {
    if (futureRef.current.length === 0) return null;
    beginApplyingHistory();
    try {
      setHistoryBrowsePreview(false);
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
      const reveal = revealFromSnapshot(next);
      dispatchRevealEditHistory(reveal);
      return reveal;
    } finally {
      endApplyingHistory();
    }
  }, [captureSnapshot, applySnapshot, syncHistoryFlags]);

  const jumpToLatest = useCallback((): GraphHistoryReveal | null => {
    if (futureRef.current.length === 0) return null;
    beginApplyingHistory();
    try {
      setHistoryBrowsePreview(false);
      let lastReveal: GraphHistoryReveal | null = null;
      while (futureRef.current.length > 0) {
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
        lastReveal = revealFromSnapshot(next);
      }
      syncHistoryFlags();
      if (lastReveal) dispatchRevealEditHistory(lastReveal);
      return lastReveal;
    } finally {
      endApplyingHistory();
    }
  }, [captureSnapshot, applySnapshot, syncHistoryFlags]);

  useEffect(() => {
    return registerHistoryJumpToLatest(() => {
      jumpToLatest();
    });
  }, [jumpToLatest]);

  const jumpToPastEntry = useCallback(
    (entryId: string): GraphHistoryReveal | null => {
      beginApplyingHistory();
      try {
        // History list click = browse preview (next divergent edit may confirm discard).
        setHistoryBrowsePreview(true);
        const pastIdx = pastRef.current.findIndex((e) => e.id === entryId);
        if (pastIdx >= 0) {
          const target = pastRef.current[pastIdx]!;
          const tail = pastRef.current.slice(pastIdx + 1);
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
          // Redo tip = first step after target: walk tail oldest→newest, then live current.
          futureRef.current = [
            ...futureRef.current,
            current,
            ...tail.slice().reverse(),
          ];
          pastRef.current = pastRef.current.slice(0, pastIdx);
          applySnapshot(target);
          syncHistoryFlags();
          const reveal = revealFromSnapshot(target);
          dispatchRevealEditHistory(reveal);
          return reveal;
        }

        const futureIdx = futureRef.current.findIndex((e) => e.id === entryId);
        if (futureIdx < 0) {
          setHistoryBrowsePreview(false);
          return null;
        }
        let lastReveal: GraphHistoryReveal | null = null;
        const redosNeeded = futureRef.current.length - futureIdx;
        for (let i = 0; i < redosNeeded; i++) {
          if (futureRef.current.length === 0) break;
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
          lastReveal = revealFromSnapshot(next);
        }
        // Jumping to a "newer" row is still browse until the tip is live-committed.
        if (futureRef.current.length === 0) {
          setHistoryBrowsePreview(false);
        }
        syncHistoryFlags();
        if (lastReveal) dispatchRevealEditHistory(lastReveal);
        return lastReveal;
      } finally {
        endApplyingHistory();
      }
    },
    [captureSnapshot, applySnapshot, syncHistoryFlags]
  );

  const getPastHistory = useCallback((): GraphHistoryEntryMeta[] => {
    return pastRef.current.map(metaFromSnapshot).reverse();
  }, []);

  /** Newer states after undo / jump-back (tip / next-redo first in the UI list). */
  const getFutureHistory = useCallback((): GraphHistoryEntryMeta[] => {
    return futureRef.current.map(metaFromSnapshot).reverse();
  }, []);

  const getFutureCount = useCallback((): number => futureRef.current.length, []);

  const setNodesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSNode[]>, label = 'Edit graph') => {
      commitEdit(label, () => setNodes(updater));
    },
    [commitEdit, setNodes]
  );

  const setEdgesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSEdge[]>, label = 'Edit wires') => {
      commitEdit(label, () => setEdges(updater));
    },
    [commitEdit, setEdges]
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
    jumpToLatest,
    getPastHistory,
    getFutureHistory,
    getFutureCount,
    historyVersion,
    clearHistory,
    canUndo,
    canRedo,
  };
}
