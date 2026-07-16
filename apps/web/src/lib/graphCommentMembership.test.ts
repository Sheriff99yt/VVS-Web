import { describe, expect, test } from 'bun:test';
import type { VVSNode } from '@/types/graph';
import {
  appendUnlockedCommentFollowChanges,
  COMMENT_HEADER,
  getCommentMemberIds,
  isCommentLocked,
  lockCommentMembers,
  resizeCommentToFitMembers,
  unlockCommentMembers,
  wrapSelectionAsComment,
} from './graphCommentMembership';

function std(id: string, x: number, y: number, extra: Partial<VVSNode> = {}): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x, y },
    width: 100,
    height: 80,
    data: {
      label: id,
      category: 'Test',
      inputs: [],
      outputs: [],
      inlineValues: {},
    },
    ...extra,
  } as VVSNode;
}

describe('graphCommentMembership', () => {
  test('wrap creates locked comment with parented members', () => {
    const nodes = [std('a', 100, 100), std('b', 300, 200)];
    const next = wrapSelectionAsComment(nodes, ['a', 'b']);
    const comment = next.find((n) => n.type === 'vvs_comment_node')!;
    expect(isCommentLocked(comment)).toBe(true);
    expect(getCommentMemberIds(comment).sort()).toEqual(['a', 'b']);
    expect(next.find((n) => n.id === 'a')!.parentId).toBe(comment.id);
    expect(next.find((n) => n.id === 'b')!.parentId).toBe(comment.id);
    expect(comment.position.y).toBeLessThan(100);
  });

  test('lock parents members; unlock restores absolute peers', () => {
    let nodes = wrapSelectionAsComment([std('a', 100, 100), std('b', 300, 200)], ['a', 'b']);
    const commentId = nodes.find((n) => n.type === 'vvs_comment_node')!.id;
    expect(isCommentLocked(nodes.find((n) => n.id === commentId)!)).toBe(true);
    expect(nodes.find((n) => n.id === 'a')!.parentId).toBe(commentId);
    expect(nodes.find((n) => n.id === 'a')!.draggable).toBeUndefined();
    expect(nodes.find((n) => n.id === 'a')!.extent).toBeUndefined();

    nodes = unlockCommentMembers(nodes, commentId);
    expect(isCommentLocked(nodes.find((n) => n.id === commentId)!)).toBe(false);
    expect(nodes.find((n) => n.id === 'a')!.parentId).toBeUndefined();
    expect(nodes.find((n) => n.id === 'a')!.position.x).toBeGreaterThan(50);
  });

  test('unlocked follow moves position only — does not auto-resize', () => {
    let nodes = wrapSelectionAsComment([std('a', 100, 100)], ['a']);
    const commentId = nodes.find((n) => n.type === 'vvs_comment_node')!.id;
    nodes = unlockCommentMembers(nodes, commentId);
    const before = nodes.find((n) => n.id === commentId)!;
    const beforeW = before.width;
    const beforeH = before.height;

    const changes = appendUnlockedCommentFollowChanges(nodes, [
      {
        type: 'position',
        id: 'a',
        position: { x: 100, y: 400 },
        dragging: false,
      },
    ]);
    const replace = changes.find((c) => c.type === 'replace' && c.id === commentId) as
      | { type: 'replace'; item: VVSNode }
      | undefined;
    expect(replace).toBeTruthy();
    expect(replace!.item.position.y).toBeGreaterThan(before.position.y);
    expect(replace!.item.width).toBe(beforeW);
    expect(replace!.item.height).toBe(beforeH);
  });

  test('resize to fit updates position and size to members AABB', () => {
    let nodes = wrapSelectionAsComment([std('a', 100, 100)], ['a']);
    const commentId = nodes.find((n) => n.type === 'vvs_comment_node')!.id;
    nodes = nodes.map((n) =>
      n.id === commentId
        ? {
            ...n,
            position: { x: 0, y: 0 },
            width: 80,
            height: 60,
            style: { width: 80, height: 60 },
            data: {
              ...n.data,
              properties: {
                ...n.data.properties,
                commentFollowOffset: { x: -50, y: -80 },
              },
            },
          }
        : n
    );
    nodes = resizeCommentToFitMembers(nodes, commentId);
    const comment = nodes.find((n) => n.id === commentId)!;
    expect(comment.data.properties?.commentFollowOffset).toBeUndefined();
    expect(comment.position.y).toBeLessThan(100);
    expect((comment.width ?? 0) > 80).toBe(true);
  });

  test('lock captures nodes inside body and drops soft members that left', () => {
    let nodes = wrapSelectionAsComment([std('a', 100, 100)], ['a']);
    const comment = nodes.find((n) => n.type === 'vvs_comment_node')!;
    nodes = unlockCommentMembers(nodes, comment.id);
    // Soft member a is still listed, but move it far outside the comment body.
    nodes = nodes.map((n) =>
      n.id === 'a' ? { ...n, position: { x: 2000, y: 2000 } } : n
    );
    // New node sitting inside the current comment body.
    const insider = std(
      'c',
      comment.position.x + 60,
      comment.position.y + COMMENT_HEADER + 20
    );
    nodes = [...nodes, insider];

    nodes = lockCommentMembers(nodes, comment.id);
    const locked = nodes.find((n) => n.id === comment.id)!;
    expect(getCommentMemberIds(locked)).toEqual(['c']);
    expect(nodes.find((n) => n.id === 'c')!.parentId).toBe(comment.id);
    expect(nodes.find((n) => n.id === 'a')!.parentId).toBeUndefined();
  });
});
