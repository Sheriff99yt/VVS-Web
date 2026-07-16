import type { VVSNode } from '@/types/graph';

/** Clear parenting fields when a child no longer has a live parent. */
export function detachFromParent<T extends VVSNode>(node: T): T {
  if (
    !node.parentId &&
    node.extent === undefined &&
    node.expandParent === undefined &&
    node.draggable === undefined
  ) {
    return node;
  }
  return {
    ...node,
    parentId: undefined,
    extent: undefined,
    expandParent: undefined,
    draggable: undefined,
  };
}

/**
 * Drop parentId / extent when the parent is missing from the node list.
 * Prevents xyflow `getNodeDimensions(undefined)` crashes (extent: 'parent').
 */
export function sanitizeParentRefs(nodes: VVSNode[]): VVSNode[] {
  const ids = new Set(nodes.map((n) => n.id));
  let changed = false;
  const next = nodes.map((n) => {
    if (!n.parentId || ids.has(n.parentId)) return n;
    changed = true;
    return detachFromParent(n);
  });
  return changed ? next : nodes;
}

/**
 * xyflow's clampPositionToParent calls getNodeDimensions(parent) without a null
 * check. Prefer draggable/expandParent for comment lock instead of extent:'parent'.
 */
export function stripParentExtent(nodes: VVSNode[]): VVSNode[] {
  let changed = false;
  const next = nodes.map((n) => {
    if (n.extent !== 'parent') return n;
    changed = true;
    return {
      ...n,
      extent: undefined,
      // Preserve grouped feel: non-draggable children that expand the parent.
      expandParent: n.expandParent ?? true,
      draggable: n.draggable === undefined ? false : n.draggable,
    };
  });
  return changed ? next : nodes;
}

/**
 * Parents must appear before their children in the nodes array (xyflow requirement).
 */
export function orderParentsBeforeChildren(nodes: VVSNode[]): VVSNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const ordered: VVSNode[] = [];

  const visit = (id: string) => {
    if (visited.has(id)) return;
    const node = byId.get(id);
    if (!node) return;
    visited.add(id);
    if (node.parentId && byId.has(node.parentId)) {
      visit(node.parentId);
    }
    ordered.push(node);
  };

  for (const node of nodes) {
    visit(node.id);
  }

  if (ordered.length !== nodes.length) return nodes;
  for (let i = 0; i < nodes.length; i++) {
    if (ordered[i] !== nodes[i]) return ordered;
  }
  return nodes;
}

export function normalizeParenting(nodes: VVSNode[]): VVSNode[] {
  return orderParentsBeforeChildren(stripParentExtent(sanitizeParentRefs(nodes)));
}
