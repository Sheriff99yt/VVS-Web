import { describe, expect, test } from 'bun:test';
import { syncEventDeclareYFromOnHandlers } from './syncEventDeclareYFromOnHandlers';
import type { VVSNode } from '@/types/graph';

function node(
  id: string,
  kindId: string,
  y: number,
  eventId: string
): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y },
    data: {
      label: id,
      category: 'Events',
      kindId,
      inputs: [],
      outputs: [],
      inlineValues: {},
      properties: { eventId, symbolId: eventId },
    },
  };
}

describe('syncEventDeclareYFromOnHandlers', () => {
  test('mirrors On handler Y onto matching Event Declares', () => {
    const nodes = [
      node('on-start', 'event_define', 100, 'evt-start'),
      node('on-pulse', 'event_define', -50, 'evt-pulse'),
      node('decl-start', 'event_member_define', -400, 'evt-start'),
      node('decl-pulse', 'event_member_define', -400, 'evt-pulse'),
    ];
    const next = syncEventDeclareYFromOnHandlers(nodes);
    expect(next.find((n) => n.id === 'decl-pulse')!.position.y).toBe(-50);
    expect(next.find((n) => n.id === 'decl-start')!.position.y).toBe(100);
  });

  test('no-op when Declare Y already matches On Y', () => {
    const nodes = [
      node('on-start', 'event_define', 100, 'evt-start'),
      node('decl-start', 'event_member_define', 100, 'evt-start'),
    ];
    expect(syncEventDeclareYFromOnHandlers(nodes)).toBe(nodes);
  });
});
