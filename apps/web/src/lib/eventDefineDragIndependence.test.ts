import { describe, expect, test } from 'bun:test';
import { applyNodeChanges, type NodeChange } from '@xyflow/react';
import { createFirstGraphUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/firstGraphUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

/**
 * Regression: dragging the Start On handler must not yank Declare start or
 * Call SayHello (former U79 On→Declare Y teleport made Declare jump onto the
 * Call row, looking like the Call moved with the handler).
 */
describe('event Define drag independence (First Graph)', () => {
  test('moving Start handler only updates that node position', () => {
    const snapshot = createFirstGraphUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const before = {
      handler: home.nodes.find((n) => n.id === 'fg-start-handler')!,
      declare: home.nodes.find((n) => n.id === 'fg-start-member')!,
      call: home.nodes.find((n) => n.id === 'fg-call-hello')!,
    };
    expect(before.handler.data.kindId).toBe('event_define');
    expect(before.declare.data.kindId).toBe('event_member_define');
    expect(before.call.data.kindId).toBe('vvs.project.call_function');
    expect(before.handler.parentId).toBeUndefined();
    expect(before.call.parentId).toBeUndefined();

    const changes: NodeChange[] = [
      {
        type: 'position',
        id: 'fg-start-handler',
        position: { x: before.handler.position.x, y: before.handler.position.y + 120 },
        dragging: false,
      },
    ];
    const after = applyNodeChanges(changes, home.nodes);
    const handler = after.find((n) => n.id === 'fg-start-handler')!;
    const declare = after.find((n) => n.id === 'fg-start-member')!;
    const call = after.find((n) => n.id === 'fg-call-hello')!;

    expect(handler.position.y).toBe(before.handler.position.y + 120);
    expect(declare.position).toEqual(before.declare.position);
    expect(call.position).toEqual(before.call.position);
  });
});
