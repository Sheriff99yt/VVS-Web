import type { GraphNode } from '@vvs/graph-types';
import { isMemberChainNode } from '@vvs/graph-types';
import type { IrEventHandler, IrMemberDecl, IrStatement, IrUserComment } from '../ir/types';

function commentText(node: GraphNode): string {
  const fromProps = node.data.properties?.commentText;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  const label = typeof node.data.label === 'string' ? node.data.label.trim() : '';
  return label || 'Comment';
}

function nodeParentId(node: GraphNode): string | undefined {
  const raw = node.parentId;
  return typeof raw === 'string' && raw ? raw : undefined;
}

function absoluteY(node: GraphNode, byId: Map<string, GraphNode>): number {
  let y = node.position.y;
  let parentId = nodeParentId(node);
  const guard = new Set<string>();
  while (parentId && !guard.has(parentId)) {
    guard.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    y += parent.position.y;
    parentId = nodeParentId(parent);
  }
  return y;
}

function softMemberIds(comment: GraphNode): string[] {
  const raw = comment.data.properties?.commentMemberIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string');
}

function resolveMembers(
  comment: GraphNode,
  nodes: GraphNode[],
  byId: Map<string, GraphNode>
): GraphNode[] {
  const children = nodes.filter(
    (n) => nodeParentId(n) === comment.id && n.type !== 'vvs_comment_node'
  );
  if (children.length > 0) return children;
  return softMemberIds(comment)
    .map((id) => byId.get(id))
    .filter((n): n is GraphNode => n != null && n.type !== 'vvs_comment_node');
}

function pickAttachTarget(members: GraphNode[], byId: Map<string, GraphNode>): GraphNode {
  // Prefer member-chain declare/define nodes (always appear in ir.members).
  const chain = members.filter((n) => isMemberChainNode(n));
  const pool = chain.length > 0 ? chain : members;
  let best = pool[0]!;
  let bestY = absoluteY(best, byId);
  for (let i = 1; i < pool.length; i++) {
    const child = pool[i]!;
    const y = absoluteY(child, byId);
    if (y < bestY) {
      best = child;
      bestY = y;
    }
  }
  return best;
}

/** Collect every sourceGraphNodeId that this IR will visit during emit. */
export function collectIrEmitNodeIds(parts: {
  members: IrMemberDecl[];
  onStartBody: IrStatement[];
  eventHandlers: IrEventHandler[];
  functionBodies: Record<string, IrStatement[]>;
}): Set<string> {
  const ids = new Set<string>();

  const walkStatements = (statements: IrStatement[]) => {
    for (const stmt of statements) {
      if (stmt.sourceGraphNodeId) ids.add(stmt.sourceGraphNodeId);
      switch (stmt.kind) {
        case 'IfBranch':
          walkStatements(stmt.trueBody);
          walkStatements(stmt.falseBody);
          break;
        case 'ForLoop':
        case 'ForEach':
        case 'WhileLoop':
          walkStatements(stmt.body);
          break;
        case 'Sequence':
          for (const step of stmt.steps) walkStatements(step);
          break;
        case 'Switch':
          for (const c of stmt.cases) walkStatements(c.body);
          walkStatements(stmt.defaultBody);
          break;
        default:
          break;
      }
    }
  };

  for (const member of parts.members) {
    if ('sourceGraphNodeId' in member && member.sourceGraphNodeId) {
      ids.add(member.sourceGraphNodeId);
    }
    if (member.kind === 'FunctionDecl') {
      if (member.declareSourceGraphNodeId) ids.add(member.declareSourceGraphNodeId);
      if (member.implementSourceGraphNodeId) ids.add(member.implementSourceGraphNodeId);
    }
    if (member.kind === 'EventDecl') {
      if (member.handlerSourceGraphNodeId) ids.add(member.handlerSourceGraphNodeId);
      walkStatements(member.body);
    }
  }

  walkStatements(parts.onStartBody);
  for (const handler of parts.eventHandlers) {
    if (handler.sourceGraphNodeId) ids.add(handler.sourceGraphNodeId);
    walkStatements(handler.body);
  }
  for (const body of Object.values(parts.functionBodies)) {
    walkStatements(body);
  }

  return ids;
}

/**
 * Keep comments whose attach target is emitted by this IR.
 * Orphans (no beforeNodeId) stay unless `includeOrphans` is false (multi-class follow-ups).
 */
export function filterUserCommentsForIr(
  comments: IrUserComment[],
  emitNodeIds: Set<string>,
  options?: { includeOrphans?: boolean }
): IrUserComment[] {
  const includeOrphans = options?.includeOrphans !== false;
  return comments.filter((c) => {
    if (!c.beforeNodeId) return includeOrphans;
    return emitNodeIds.has(c.beforeNodeId);
  });
}

/**
 * Collect author Comment [C] boxes for U68 emit.
 *
 * U79 comment order lock:
 * - Prefer attach to topmost **member-chain** node among members (ir.members emit).
 * - Else attach to topmost soft/locked peer (flow statement emit / remaining flush).
 * - Empty membership → orphan (file-scope).
 */
export function collectUserComments(nodes: GraphNode[]): IrUserComment[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const comments = nodes.filter((n) => n.type === 'vvs_comment_node');
  const out: IrUserComment[] = [];

  for (const comment of comments) {
    const text = commentText(comment);
    const members = resolveMembers(comment, nodes, byId);
    const commentY = absoluteY(comment, byId);

    if (members.length === 0) {
      out.push({
        sourceGraphNodeId: comment.id,
        text,
        absoluteY: commentY,
      });
      continue;
    }

    const best = pickAttachTarget(members, byId);
    out.push({
      sourceGraphNodeId: comment.id,
      text,
      absoluteY: absoluteY(best, byId),
      beforeNodeId: best.id,
    });
  }

  return out.sort(
    (a, b) => a.absoluteY - b.absoluteY || a.sourceGraphNodeId.localeCompare(b.sourceGraphNodeId)
  );
}
