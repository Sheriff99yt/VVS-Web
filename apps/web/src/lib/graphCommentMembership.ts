import type { NodeChange } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
import type { VVSNode } from '@/types/graph';
import { detachFromParent, normalizeParenting } from '@/lib/graphParenting';

export const COMMENT_PADDING = 50;
export const COMMENT_HEADER = 40;

type CommentProps = Record<string, unknown>;

function propsOf(node: VVSNode): CommentProps {
  return (node.data.properties ?? {}) as CommentProps;
}

export function isCommentNode(node: VVSNode | undefined): node is VVSNode {
  return Boolean(node && node.type === 'vvs_comment_node');
}

export function isCommentLocked(node: VVSNode): boolean {
  return Boolean(propsOf(node).commentLocked);
}

export function getCommentMemberIds(node: VVSNode): string[] {
  const raw = propsOf(node).commentMemberIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function withCommentProps(node: VVSNode, patch: CommentProps): VVSNode {
  return {
    ...node,
    data: {
      ...node.data,
      properties: {
        ...propsOf(node),
        ...patch,
      },
    },
  };
}

function nodeSize(node: VVSNode): { width: number; height: number } {
  return {
    width: node.measured?.width ?? node.width ?? 200,
    height: node.measured?.height ?? node.height ?? 150,
  };
}

/** Absolute top-left of a node (accounts for parent offset when locked). */
export function absolutePosition(
  node: VVSNode,
  byId: Map<string, VVSNode>
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  const guard = new Set<string>();
  while (parentId && !guard.has(parentId)) {
    guard.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

export type CommentFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Bounding frame for members in absolute space (includes padding + header). */
export function frameForMembers(
  members: VVSNode[],
  byId: Map<string, VVSNode>,
  padding = COMMENT_PADDING,
  header = COMMENT_HEADER
): CommentFrame | null {
  if (members.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of members) {
    const { x, y } = absolutePosition(n, byId);
    const { width, height } = nodeSize(n);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }
  return {
    x: minX - padding,
    y: minY - padding - header,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2 + header,
  };
}

function followOffset(node: VVSNode): { x: number; y: number } | null {
  const raw = propsOf(node).commentFollowOffset;
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { x?: unknown; y?: unknown };
  if (typeof o.x !== 'number' || typeof o.y !== 'number') return null;
  return { x: o.x, y: o.y };
}

export function applyCommentFrame(comment: VVSNode, frame: CommentFrame): VVSNode {
  return {
    ...comment,
    position: { x: frame.x, y: frame.y },
    width: frame.width,
    height: frame.height,
    style: { ...(comment.style ?? {}), width: frame.width, height: frame.height },
  };
}

function numericDim(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

/** Current on-canvas rectangle of a comment (absolute peers only — comments are never nested). */
export function commentVisualFrame(comment: VVSNode): CommentFrame {
  const width = numericDim(
    comment.measured?.width ?? comment.width ?? comment.style?.width,
    200
  );
  const height = numericDim(
    comment.measured?.height ?? comment.height ?? comment.style?.height,
    100
  );
  return {
    x: comment.position.x,
    y: comment.position.y,
    width,
    height,
  };
}

/** Body area under the title bar — used when locking to capture “nodes inside”. */
export function commentBodyFrame(comment: VVSNode, header = COMMENT_HEADER): CommentFrame {
  const full = commentVisualFrame(comment);
  const bodyHeight = Math.max(24, full.height - header);
  return {
    x: full.x,
    y: full.y + header,
    width: full.width,
    height: bodyHeight,
  };
}

function pointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/**
 * Nodes whose center lies inside the comment **body** (below the header).
 * This is the lock recapture source of truth — not the soft member list.
 */
export function nodesInsideCommentBody(nodes: VVSNode[], commentId: string): VVSNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const comment = byId.get(commentId);
  if (!comment || !isCommentNode(comment)) return [];
  const body = commentBodyFrame(comment);
  return nodes.filter((n) => {
    if (n.id === commentId || isCommentNode(n)) return false;
    const abs = absolutePosition(n, byId);
    const size = nodeSize(n);
    const cx = abs.x + size.width / 2;
    const cy = abs.y + size.height / 2;
    return pointInRect(cx, cy, body);
  });
}

/** @deprecated Prefer nodesInsideCommentBody — kept for callers expecting overlap. */
export function nodesOverlappingComment(nodes: VVSNode[], commentId: string): VVSNode[] {
  return nodesInsideCommentBody(nodes, commentId);
}

/**
 * Lock capture: **replace** membership with nodes currently inside the comment body.
 * Soft memberIds that have left the box are dropped; newcomers inside are included.
 */
export function recaptureMemberIds(nodes: VVSNode[], commentId: string): string[] {
  return nodesInsideCommentBody(nodes, commentId).map((n) => n.id);
}

/** On-demand resize: fit comment position + size to current soft/locked members' AABB. */
export function resizeCommentToFitMembers(nodes: VVSNode[], commentId: string): VVSNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const comment = byId.get(commentId);
  if (!comment || !isCommentNode(comment)) return nodes;

  const fromSoft = getCommentMemberIds(comment).filter((id) => byId.has(id));
  const fromChildren = nodes
    .filter((n) => n.parentId === commentId && n.type !== 'vvs_comment_node')
    .map((n) => n.id);
  const memberIds = [...new Set([...fromSoft, ...fromChildren])];
  const members = memberIds.map((id) => byId.get(id)!).filter(Boolean);
  const frame = frameForMembers(members, byId);
  if (!frame) {
    return nodes.map((n) =>
      n.id === commentId ? withCommentProps(n, { commentFollowOffset: undefined }) : n
    );
  }

  // When locked, reparent relative coords to the new frame origin.
  if (isCommentLocked(comment)) {
    const memberSet = new Set(memberIds);
    const next = nodes.map((n) => {
      if (n.id === commentId) {
        return applyCommentFrame(
          withCommentProps(n, {
            commentMemberIds: memberIds,
            commentFollowOffset: undefined,
          }),
          frame
        );
      }
      if (!memberSet.has(n.id)) return n;
      const abs = absolutePosition(n, byId);
      return {
        ...n,
        parentId: commentId,
        position: { x: abs.x - frame.x, y: abs.y - frame.y },
        expandParent: true,
        extent: undefined,
      };
    });
    return normalizeParenting(next);
  }

  return nodes.map((n) => {
    if (n.id !== commentId) return n;
    return applyCommentFrame(
      withCommentProps(n, {
        commentMemberIds: memberIds,
        commentFollowOffset: undefined,
      }),
      frame
    );
  });
}

/** @deprecated Use resizeCommentToFitMembers — snap is now on-demand resize. */
export const snapCommentToMembers = resizeCommentToFitMembers;

/**
 * Lock: parent whatever nodes are currently inside the comment body.
 * Members stay independently draggable. Comment box size/position is kept as-is.
 */
export function lockCommentMembers(nodes: VVSNode[], commentId: string): VVSNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const comment = byId.get(commentId);
  if (!comment || !isCommentNode(comment)) return nodes;

  const memberIds = recaptureMemberIds(nodes, commentId);
  const frame = commentVisualFrame(comment);
  const memberSet = new Set(memberIds);

  const framed = withCommentProps(
    {
      ...comment,
      width: frame.width,
      height: frame.height,
      style: { ...(comment.style ?? {}), width: frame.width, height: frame.height },
    },
    {
      commentLocked: true,
      commentMemberIds: memberIds,
      commentFollowOffset: undefined,
    }
  );

  const next = nodes.map((n) => {
    if (n.id === commentId) return framed;
    if (!memberSet.has(n.id)) {
      // Drop parenting if this node was a child of this comment but left the body.
      if (n.parentId === commentId) {
        const abs = absolutePosition(n, byId);
        return { ...detachFromParent(n), position: abs };
      }
      return n;
    }
    const abs = absolutePosition(n, byId);
    return {
      ...detachFromParent(n),
      parentId: commentId,
      position: { x: abs.x - frame.x, y: abs.y - frame.y },
      extent: undefined,
      expandParent: true,
      draggable: undefined,
    };
  });
  return normalizeParenting(next);
}

/**
 * Unlock: release RF parenting; keep soft membership; comment stays free to move.
 */
export function unlockCommentMembers(nodes: VVSNode[], commentId: string): VVSNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const comment = byId.get(commentId);
  if (!comment || !isCommentNode(comment)) return nodes;

  const childIds = nodes
    .filter((n) => n.parentId === commentId && n.type !== 'vvs_comment_node')
    .map((n) => n.id);
  const softIds = getCommentMemberIds(comment);
  const memberIds = [...new Set([...softIds, ...childIds])].filter(
    (id) => byId.has(id) && id !== commentId
  );

  const next = nodes.map((n) => {
    if (n.id === commentId) {
      return withCommentProps(n, {
        commentLocked: false,
        commentMemberIds: memberIds,
        commentFollowOffset: undefined,
      });
    }
    if (n.parentId !== commentId) return n;
    const abs = absolutePosition(n, byId);
    return {
      ...detachFromParent(n),
      position: abs,
    };
  });

  // Keep comment size/position — resize is on-demand via resizeCommentToFitMembers.
  return normalizeParenting(next);
}

/** Wrap selection as an unlocked comment with soft membership (no parentId yet). */
export function wrapSelectionAsComment(nodes: VVSNode[], selectedIds: string[]): VVSNode[] {
  const selected = nodes.filter(
    (n) => selectedIds.includes(n.id) && n.type !== 'vvs_comment_node'
  );
  if (selected.length === 0) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const frame = frameForMembers(selected, byId);
  if (!frame) return nodes;

  const commentId = `comment-${Date.now()}`;
  const memberIds = selected.map((n) => n.id);
  const comment: VVSNode = {
    id: commentId,
    type: 'vvs_comment_node',
    position: { x: frame.x, y: frame.y },
    width: frame.width,
    height: frame.height,
    style: { width: frame.width, height: frame.height },
    data: {
      label: 'New Comment',
      category: 'Comment',
      inputs: [],
      outputs: [],
      inlineValues: {},
      commentColor: '#6366f1',
      properties: {
        commentText: 'New Comment',
        commentLocked: false,
        commentMemberIds: memberIds,
      },
    },
    zIndex: -1,
  };

  const memberSet = new Set(memberIds);
  const detached = nodes.map((n) => {
    if (!memberSet.has(n.id) || !n.parentId) return n;
    const abs = absolutePosition(n, byId);
    return { ...detachFromParent(n), position: abs };
  });

  return normalizeParenting([comment, ...detached]);
}

export function pruneCommentMembership(nodes: VVSNode[]): VVSNode[] {
  const ids = new Set(nodes.map((n) => n.id));
  let changed = false;
  const next = nodes.map((n) => {
    if (!isCommentNode(n)) return n;
    const members = getCommentMemberIds(n).filter((id) => ids.has(id) && id !== n.id);
    const prev = getCommentMemberIds(n);
    if (members.length === prev.length && members.every((id, i) => id === prev[i])) return n;
    changed = true;
    return withCommentProps(n, { commentMemberIds: members });
  });
  return changed ? next : nodes;
}

/**
 * Unlocked comments follow member motion in **position only** (no auto-resize).
 * Size changes are on-demand via resizeCommentToFitMembers / snap button.
 */
export function appendUnlockedCommentFollowChanges(
  nodes: VVSNode[],
  changes: NodeChange<VVSNode>[]
): NodeChange<VVSNode>[] {
  const positionChanges = changes.filter(
    (
      c
    ): c is NodeChange<VVSNode> & {
      type: 'position';
      id: string;
      position?: { x: number; y: number };
      dragging?: boolean;
    } => c.type === 'position'
  );
  if (positionChanges.length === 0) return changes;

  const nextNodes = applyNodeChanges(changes, nodes) as VVSNode[];
  const byId = new Map(nextNodes.map((n) => [n.id, n]));

  const draggingCommentIds = new Set(
    positionChanges
      .filter((c) => c.dragging === true && isCommentNode(byId.get(c.id)))
      .map((c) => c.id)
  );
  const commentDragEnded = positionChanges.filter(
    (c) => c.dragging === false && isCommentNode(byId.get(c.id))
  );

  const extra: NodeChange<VVSNode>[] = [];

  for (const ended of commentDragEnded) {
    const comment = byId.get(ended.id);
    if (!comment || !isCommentNode(comment) || isCommentLocked(comment)) continue;
    const members = getCommentMemberIds(comment)
      .map((id) => byId.get(id))
      .filter((m): m is VVSNode => Boolean(m));
    const frame = frameForMembers(members, byId);
    if (!frame) continue;
    const patched = withCommentProps(comment, {
      commentFollowOffset: {
        x: comment.position.x - frame.x,
        y: comment.position.y - frame.y,
      },
    });
    extra.push({ type: 'replace', id: comment.id, item: patched });
    byId.set(comment.id, patched);
  }

  const movedIds = new Set(positionChanges.map((c) => c.id));
  for (const comment of byId.values()) {
    if (!isCommentNode(comment) || isCommentLocked(comment)) continue;
    if (draggingCommentIds.has(comment.id)) continue;

    const memberIds = getCommentMemberIds(comment);
    if (memberIds.length === 0) continue;
    if (!memberIds.some((id) => movedIds.has(id))) continue;

    const members = memberIds.map((id) => byId.get(id)).filter((m): m is VVSNode => Boolean(m));
    const frame = frameForMembers(members, byId);
    if (!frame) continue;

    const offset = followOffset(comment);
    const nextX = frame.x + (offset?.x ?? 0);
    const nextY = frame.y + (offset?.y ?? 0);
    if (comment.position.x === nextX && comment.position.y === nextY) continue;

    // Position only — preserve width/height (resize is on-demand).
    const moved = {
      ...comment,
      position: { x: nextX, y: nextY },
    };
    extra.push({ type: 'replace', id: comment.id, item: moved });
  }

  return extra.length > 0 ? [...changes, ...extra] : changes;
}
