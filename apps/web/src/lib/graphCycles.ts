import type { PinType, VVSEdge } from '@/types/graph';

/** Returns true if adding source→target would close a cycle on the same pin channel. */
export function wouldWireCreateCycle(
  edges: VVSEdge[],
  source: string,
  target: string,
  pinType: PinType
): boolean {
  if (source === target) return true;

  const relevant = edges.filter((e) => e.data?.pinType === pinType);
  return canReach(relevant, target, source);
}

function canReach(edges: VVSEdge[], start: string, goal: string): boolean {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }

  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === goal) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }
  return false;
}
