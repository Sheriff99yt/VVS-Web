import { useCallback, useRef, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { VVSNode, VVSEdge } from '@/types/graph';
import { useLatestRef } from '@/hooks/useLatestRef';

interface HistoryState {
  nodes: VVSNode[];
  edges: VVSEdge[];
}

function cloneState(nodes: VVSNode[], edges: VVSEdge[]): HistoryState {
  return { nodes: structuredClone(nodes), edges: structuredClone(edges) };
}

export function useGraphState(initialNodes: VVSNode[] = [], initialEdges: VVSEdge[] = []) {
  const [nodes, setNodes, onNodesChangeReactFlow] = useNodesState<VVSNode>(initialNodes);
  const [edges, setEdges, onEdgesChangeReactFlow] = useEdgesState<VVSEdge>(initialEdges);

  const nodesRef = useLatestRef(nodes);
  const edgesRef = useLatestRef(edges);

  const pastRef = useRef<HistoryState[]>([]);
  const futureRef = useRef<HistoryState[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const saveSnapshot = useCallback(() => {
    pastRef.current.push(cloneState(nodesRef.current, edgesRef.current));
    if (pastRef.current.length > 50) pastRef.current.shift();
    futureRef.current = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const onNodesChange = useCallback(
    (changes: NodeChange<VVSNode>[]) => {
      const isSignificant = changes.some(
        (c) =>
          c.type === 'add' ||
          c.type === 'remove' ||
          c.type === 'replace' ||
          (c.type === 'position' && c.dragging === false)
      );
      const isDragEnd = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );

      onNodesChangeReactFlow(changes);

      if (isSignificant) {
        const save = () => saveSnapshot();
        if (isDragEnd) {
          requestAnimationFrame(save);
        } else {
          save();
        }
      }
    },
    [onNodesChangeReactFlow, saveSnapshot]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<VVSEdge>[]) => {
      const isSignificant = changes.some((c) => c.type === 'add' || c.type === 'remove');
      if (isSignificant) saveSnapshot();
      onEdgesChangeReactFlow(changes);
    },
    [onEdgesChangeReactFlow, saveSnapshot]
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    futureRef.current.push(cloneState(nodesRef.current, edgesRef.current));
    const prev = pastRef.current.pop()!;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    syncHistoryFlags();
  }, [setNodes, setEdges, syncHistoryFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    pastRef.current.push(cloneState(nodesRef.current, edgesRef.current));
    const next = futureRef.current.pop()!;
    setNodes(next.nodes);
    setEdges(next.edges);
    syncHistoryFlags();
  }, [setNodes, setEdges, syncHistoryFlags]);

  const setNodesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSNode[]>) => {
      saveSnapshot();
      setNodes(updater);
    },
    [saveSnapshot, setNodes]
  );

  const setEdgesWithHistory = useCallback(
    (updater: React.SetStateAction<VVSEdge[]>) => {
      saveSnapshot();
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
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  };
}
