import type { IrModule, IrUserComment } from '../ir/types';
import { CodeSink } from '../codeSink';
import { commentPrefixFromPack } from '../print/template';
import { printContextForIr } from './helpers';

/** Emit one author Comment [C] line (never `(x)`). */
export function appendUserCommentLine(
  sink: CodeSink,
  ir: IrModule,
  comment: IrUserComment,
  indent = ''
): void {
  if (ir.emitUserComments === false) return;
  const text = comment.text.trim();
  if (!text) return;
  const ctx = printContextForIr(ir, '', ir.environmentManifest);
  const prefix = commentPrefixFromPack(ctx);
  sink.appendTagged({
    nodeId: comment.sourceGraphNodeId,
    text: `${indent}${prefix}${text}`,
  });
}

export function buildUserCommentEmitState(ir: IrModule): {
  byBeforeNodeId: Map<string, IrUserComment[]>;
  orphans: IrUserComment[];
  emitted: Set<string>;
} {
  const byBeforeNodeId = new Map<string, IrUserComment[]>();
  const orphans: IrUserComment[] = [];
  for (const c of ir.userComments ?? []) {
    if (c.beforeNodeId) {
      const list = byBeforeNodeId.get(c.beforeNodeId) ?? [];
      list.push(c);
      byBeforeNodeId.set(c.beforeNodeId, list);
    } else {
      orphans.push(c);
    }
  }
  for (const list of byBeforeNodeId.values()) {
    list.sort(
      (a, b) => a.absoluteY - b.absoluteY || a.sourceGraphNodeId.localeCompare(b.sourceGraphNodeId)
    );
  }
  orphans.sort(
    (a, b) => a.absoluteY - b.absoluteY || a.sourceGraphNodeId.localeCompare(b.sourceGraphNodeId)
  );
  return { byBeforeNodeId, orphans, emitted: new Set() };
}

export function emitUserCommentsBeforeNode(
  sink: CodeSink,
  ir: IrModule,
  state: ReturnType<typeof buildUserCommentEmitState>,
  nodeId: string | undefined,
  indent = ''
): void {
  if (!nodeId || ir.emitUserComments === false) return;
  const list = state.byBeforeNodeId.get(nodeId);
  if (!list) return;
  for (const c of list) {
    if (state.emitted.has(c.sourceGraphNodeId)) continue;
    appendUserCommentLine(sink, ir, c, indent);
    state.emitted.add(c.sourceGraphNodeId);
  }
}

export function emitOrphanUserComments(
  sink: CodeSink,
  ir: IrModule,
  state: ReturnType<typeof buildUserCommentEmitState>
): void {
  if (ir.emitUserComments === false) return;
  for (const c of state.orphans) {
    if (state.emitted.has(c.sourceGraphNodeId)) continue;
    appendUserCommentLine(sink, ir, c);
    state.emitted.add(c.sourceGraphNodeId);
  }
}

/**
 * Emit any Comment [C] whose beforeNodeId never appeared in members/flow emit.
 * Guarantees author comments are never silently dropped on single-module graphs.
 *
 * Multi-class merge: pass `emitNodeIds` for this IR and `allowUnownedAttachAsOrphan: false`
 * on follow-up classes so a comment owned by another class is not flushed at file scope.
 */
export function emitRemainingUserComments(
  sink: CodeSink,
  ir: IrModule,
  state: ReturnType<typeof buildUserCommentEmitState>,
  options?: {
    emitNodeIds?: Set<string>;
    /** When false, skip comments whose beforeNodeId is outside this IR's emit set. */
    allowUnownedAttachAsOrphan?: boolean;
  }
): void {
  if (ir.emitUserComments === false) return;
  const emitNodeIds = options?.emitNodeIds;
  const allowUnowned = options?.allowUnownedAttachAsOrphan !== false;
  const pending: IrUserComment[] = [];
  for (const list of state.byBeforeNodeId.values()) {
    for (const c of list) {
      if (state.emitted.has(c.sourceGraphNodeId)) continue;
      if (c.beforeNodeId && emitNodeIds && !emitNodeIds.has(c.beforeNodeId) && !allowUnowned) {
        continue;
      }
      pending.push(c);
    }
  }
  pending.sort(
    (a, b) => a.absoluteY - b.absoluteY || a.sourceGraphNodeId.localeCompare(b.sourceGraphNodeId)
  );
  for (const c of pending) {
    appendUserCommentLine(sink, ir, c);
    state.emitted.add(c.sourceGraphNodeId);
  }
}
