import { VVSNode, VVSEdge } from '@/types/graph';

export function buildExecutionOrder(
  startId: string,
  nodes: VVSNode[],
  edges: VVSEdge[]
): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes.find((n) => n.id === id);
    if (!node || node.type === 'vvs_comment_node') continue;

    if (node.type !== 'vvs_reroute_node') {
      order.push(id);
    }

    const execEdges = edges.filter(
      (e) => e.source === id && e.data?.pinType === 'execution'
    );
    for (const edge of execEdges) {
      if (!visited.has(edge.target)) queue.push(edge.target);
    }
  }

  return order;
}

export function findSimulationStartNode(nodes: VVSNode[]): VVSNode | undefined {
  return (
    nodes.find(
      (n) =>
        n.type === 'vvs_standard_node' &&
        (n.data.kindId === 'event_on_start' || n.data.label === 'On Start')
    ) ??
    nodes.find((n) => n.type === 'vvs_standard_node' && n.data.category === 'Events')
  );
}
