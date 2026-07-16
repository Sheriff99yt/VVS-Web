import type { VVSNode } from '@/types/graph';
import { resolveNodeKindId } from '@vvs/graph-types';

function eventSymbolId(node: VVSNode): string | null {
  const props = (node.data?.properties ?? {}) as Record<string, unknown>;
  const binding = node.data?.graphBinding as { symbolId?: string; eventId?: string } | undefined;
  const raw =
    (typeof props.eventId === 'string' && props.eventId) ||
    (typeof props.symbolId === 'string' && props.symbolId) ||
    binding?.eventId ||
    binding?.symbolId ||
    null;
  return raw && raw.trim() ? raw : null;
}

/**
 * U79 UX: authors rearrange visible On handlers; emit order uses Event Declare Y.
 * After an On handler drag, mirror each On's Y onto its matching event_member_define
 * so Code panel order matches what they just moved.
 */
export function syncEventDeclareYFromOnHandlers(nodes: VVSNode[]): VVSNode[] {
  const onByEvent = new Map<string, VVSNode>();
  for (const n of nodes) {
    if (resolveNodeKindId(n.data) !== 'event_define') continue;
    const id = eventSymbolId(n);
    if (!id) continue;
    onByEvent.set(id, n);
  }
  if (onByEvent.size === 0) return nodes;

  let changed = false;
  const next = nodes.map((n) => {
    if (resolveNodeKindId(n.data) !== 'event_member_define') return n;
    const id = eventSymbolId(n);
    if (!id) return n;
    const on = onByEvent.get(id);
    if (!on) return n;
    if (n.position.y === on.position.y) return n;
    changed = true;
    return { ...n, position: { ...n.position, y: on.position.y } };
  });
  return changed ? next : nodes;
}

export function dragEndedEventDefineIds(changes: { type: string; id: string }[]): string[] {
  return changes.filter((c) => c.type === 'position').map((c) => c.id);
}
