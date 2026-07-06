import type { VVSEdge, VVSNode } from '@/types/graph';

/** Strip ephemeral React Flow selection flags before persist or after tab load. */
export function clearNodeSelectionFlags(nodes: VVSNode[]): VVSNode[] {
  return nodes.map((node) => (node.selected ? { ...node, selected: false } : node));
}

export function clearEdgeSelectionFlags(edges: VVSEdge[]): VVSEdge[] {
  return edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge));
}

export function clearGraphSelectionState(
  nodes: VVSNode[],
  edges: VVSEdge[]
): { nodes: VVSNode[]; edges: VVSEdge[] } {
  return {
    nodes: clearNodeSelectionFlags(nodes),
    edges: clearEdgeSelectionFlags(edges),
  };
}
