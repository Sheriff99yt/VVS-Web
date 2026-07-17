import type { PinDefinition, VVSEdge, VVSNode } from '@/types/graph';
import {
  applyWireConnection,
  evaluateWireConnection,
  type WireConnectionAttempt,
} from './graphWiring';

export type AutoConnectPair = {
  connection: WireConnectionAttempt;
  score: number;
  pinType: string;
};

function pinList(
  node: VVSNode,
  direction: 'input' | 'output'
): PinDefinition[] {
  if (node.type === 'vvs_comment_node') return [];
  if (node.type === 'vvs_reroute_node') {
    return direction === 'output'
      ? node.data.outputs?.length
        ? node.data.outputs
        : [{ id: 'out', label: '', type: node.data.pinType ?? 'data_any' }]
      : node.data.inputs?.length
        ? node.data.inputs
        : [{ id: 'in', label: '', type: node.data.pinType ?? 'data_any' }];
  }
  return direction === 'output' ? node.data.outputs ?? [] : node.data.inputs ?? [];
}

function alreadyWired(
  edges: VVSEdge[],
  sourceId: string,
  sourceHandle: string,
  targetId: string,
  targetHandle: string
): boolean {
  return edges.some(
    (e) =>
      e.source === sourceId &&
      e.target === targetId &&
      (e.sourceHandle ?? null) === sourceHandle &&
      (e.targetHandle ?? null) === targetHandle
  );
}

/**
 * Score a candidate wire: prefer execution, then exact type match, then left→right geometry.
 */
function scoreCandidate(
  a: VVSNode,
  b: VVSNode,
  connection: WireConnectionAttempt,
  pinType: string
): number {
  let score = 0;
  if (pinType === 'execution') score += 100;
  else score += 40;

  const ax = a.position.x;
  const bx = b.position.x;
  // Prefer left → right flow (source left of target).
  if (connection.source === a.id && ax <= bx) score += 20;
  if (connection.source === b.id && bx <= ax) score += 20;

  // Prefer shorter vertical distance.
  const dy = Math.abs(a.position.y - b.position.y);
  score += Math.max(0, 15 - Math.floor(dy / 40));

  return score;
}

/**
 * Best single wire between two selected nodes (tries both directions / all pin pairs).
 * Returns null when nothing compatible exists.
 */
export function findBestAutoConnect(
  nodeA: VVSNode,
  nodeB: VVSNode,
  edges: VVSEdge[],
  allNodes: VVSNode[]
): AutoConnectPair | null {
  if (nodeA.id === nodeB.id) return null;
  if (nodeA.type === 'vvs_comment_node' || nodeB.type === 'vvs_comment_node') return null;

  const candidates: AutoConnectPair[] = [];

  const tryDirection = (source: VVSNode, target: VVSNode) => {
    const outs = pinList(source, 'output');
    const ins = pinList(target, 'input');
    for (const out of outs) {
      for (const inn of ins) {
        if (alreadyWired(edges, source.id, out.id, target.id, inn.id)) continue;
        const connection: WireConnectionAttempt = {
          source: source.id,
          target: target.id,
          sourceHandle: out.id,
          targetHandle: inn.id,
        };
        const evaluation = evaluateWireConnection(connection, allNodes, edges);
        if (!evaluation.ok) continue;
        candidates.push({
          connection,
          pinType: evaluation.pinType,
          score: scoreCandidate(source, target, connection, evaluation.pinType),
        });
      }
    }
  };

  tryDirection(nodeA, nodeB);
  tryDirection(nodeB, nodeA);

  if (candidates.length === 0) return null;
  candidates.sort((x, y) => y.score - x.score);
  return candidates[0]!;
}

/** Apply best auto-connect between exactly two selected nodes. */
export function autoConnectTwoNodes(
  selected: VVSNode[],
  nodes: VVSNode[],
  edges: VVSEdge[]
):
  | { ok: true; edges: VVSEdge[]; edge: VVSEdge }
  | { ok: false; reason: 'need_two_nodes' | 'no_compatible_pins' | 'wire_rejected' } {
  const pair = selected.filter((n) => n.type !== 'vvs_comment_node');
  if (pair.length !== 2) return { ok: false, reason: 'need_two_nodes' };
  const [a, b] = pair as [VVSNode, VVSNode];
  const best = findBestAutoConnect(a, b, edges, nodes);
  if (!best) return { ok: false, reason: 'no_compatible_pins' };
  const applied = applyWireConnection(best.connection, nodes, edges);
  if ('error' in applied) return { ok: false, reason: 'wire_rejected' };
  return { ok: true, edges: applied.edges, edge: applied.edge };
}
