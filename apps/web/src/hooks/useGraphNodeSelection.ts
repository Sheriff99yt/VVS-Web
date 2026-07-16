import { useCallback, useMemo } from 'react';
import { useStore } from '@xyflow/react';
import type { VVSNode } from '@/types/graph';

export interface GraphNodeSelection {
  /** All React Flow selected nodes on the active graph. */
  selectedNodes: VVSNode[];
  /** Anchor node for toolbar placement and inspector sync (first selected). */
  primaryNode: VVSNode | null;
  /** Flow-space point above the selection bounding box center. */
  anchorFlowPoint: { x: number; y: number } | null;
  isVisible: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  count: number;
}

function defaultNodeSize(node: VVSNode): { width: number; height: number } {
  if (node.type === 'vvs_reroute_node') return { width: 16, height: 16 };
  if (node.type === 'vvs_comment_node') {
    const width = typeof node.style?.width === 'number' ? node.style.width : 240;
    const height = typeof node.style?.height === 'number' ? node.style.height : 160;
    return { width, height };
  }
  return {
    width: node.measured?.width ?? 180,
    height: node.measured?.height ?? 80,
  };
}

export function resolveSelectionAnchorFlowPoint(
  selectedNodes: VVSNode[],
  getAbsolutePosition?: (nodeId: string) => { x: number; y: number } | undefined
): { x: number; y: number } | null {
  if (selectedNodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;

  for (const node of selectedNodes) {
    const absolute = getAbsolutePosition?.(node.id) ?? node.position;
    const { width } = defaultNodeSize(node);
    minX = Math.min(minX, absolute.x);
    minY = Math.min(minY, absolute.y);
    maxX = Math.max(maxX, absolute.x + width);
  }

  return { x: (minX + maxX) / 2, y: minY };
}

function commentMemberIds(node: VVSNode): string[] {
  const raw = node.data.properties?.commentMemberIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string');
}

function buildGraphNodeSelection(
  selectedNodes: VVSNode[],
  getAbsolutePosition?: (nodeId: string) => { x: number; y: number } | undefined,
  allNodes?: VVSNode[]
): GraphNodeSelection {
  const primaryNode = selectedNodes[0] ?? null;
  const groupable = selectedNodes.filter((node) => node.type !== 'vvs_comment_node');
  const canGroup = groupable.length >= 1;
  const selectedIds = new Set(selectedNodes.map((n) => n.id));
  const softMemberSelected = Boolean(
    allNodes?.some(
      (n) =>
        n.type === 'vvs_comment_node' &&
        commentMemberIds(n).some((id) => selectedIds.has(id))
    )
  );
  const canUngroup =
    softMemberSelected ||
    selectedNodes.some(
      (node) =>
        Boolean(node.parentId) ||
        (node.type === 'vvs_comment_node' && commentMemberIds(node).length > 0)
    );

  return {
    selectedNodes,
    primaryNode,
    anchorFlowPoint: resolveSelectionAnchorFlowPoint(selectedNodes, getAbsolutePosition),
    isVisible: selectedNodes.length > 0,
    canGroup,
    canUngroup,
    count: selectedNodes.length,
  };
}

function selectedNodesEqual(a: VVSNode[], b: VVSNode[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].position.x !== b[i].position.x || a[i].position.y !== b[i].position.y) {
      return false;
    }
  }
  return true;
}

export function useGraphNodeSelection(
  nodes: VVSNode[],
  getAbsolutePosition?: (nodeId: string) => { x: number; y: number } | undefined
): GraphNodeSelection {
  return useMemo(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    return buildGraphNodeSelection(selectedNodes, getAbsolutePosition, nodes);
  }, [nodes, getAbsolutePosition]);
}

/** Subscribe only to selected nodes — avoids re-renders when unrelated nodes move. */
export function useGraphNodeSelectionFromStore(
  getAbsolutePosition?: (nodeId: string) => { x: number; y: number } | undefined
): GraphNodeSelection {
  const selectSelectedNodes = useCallback(
    (state: { nodes: readonly { id: string; selected?: boolean; position: { x: number; y: number }; type?: string; parentId?: string }[] }) =>
      state.nodes.filter((node) => node.selected) as VVSNode[],
    []
  );

  const selectedNodes = useStore(selectSelectedNodes, selectedNodesEqual);

  return useMemo(
    () => buildGraphNodeSelection(selectedNodes, getAbsolutePosition),
    [selectedNodes, getAbsolutePosition]
  );
}
