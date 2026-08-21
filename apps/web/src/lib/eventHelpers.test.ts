import { describe, expect, test } from 'bun:test';
import {
  applyEventBindBinding,
  applyEventDefineBinding,
  applyEventRoleBinding,
  bindNodeInputs,
  defineNodeOutputs,
  dispatchNodeInputs,
  eventHandlerName,
  eventNodeRoleForKind,
  inferEventNameFromNodeData,
  inferEventsFromDocuments,
  parameterCodegenName,
  resolveEventForDrop,
  resolveEventForNode,
} from './eventHelpers';
import { createAdvancedSnapshot } from './usabilityExampleTests/advancedUsabilityTest';

describe('eventHelpers', () => {
  test('eventHandlerName strips On prefix and snake_cases', () => {
    expect(eventHandlerName('damage')).toBe('damage');
    expect(eventHandlerName('On Player Death')).toBe('player_death');
  });

  test('parameterCodegenName uses label', () => {
    expect(parameterCodegenName({ id: 'damage', label: 'DamageAmount', type: 'data_number' })).toBe(
      'damageamount'
    );
  });

  test('define and dispatch pin builders mirror event parameters', () => {
    const params = [{ id: 'amt', label: 'Amount', type: 'data_number' as const }];
    expect(defineNodeOutputs(params)).toHaveLength(2);
    expect(dispatchNodeInputs(params)).toHaveLength(2);
  });

  test('bind pin builder is the fixed Target/Event/Handler set', () => {
    expect(bindNodeInputs().map((p) => p.id)).toEqual(['exec_in', 'target', 'event', 'handler']);
  });

  test('inferEventsFromDocuments repairs legacy graphs', () => {
    const snapshot = createAdvancedSnapshot();
    const { events: _removed, ...withoutEvents } = snapshot;
    const inferred = inferEventsFromDocuments(withoutEvents.documents!);
    
    expect(inferred.some((e) => e.name.toLowerCase() === 'start')).toBe(true);
  });

  test('resolveEventForDrop matches symbol id or legacy dispatcher label', () => {
    const events = [{ id: 'evt-pulse', name: 'pulse', parameters: [] }];
    expect(resolveEventForDrop({ eventId: 'evt-pulse' }, events)?.id).toBe('evt-pulse');
    expect(
      resolveEventForDrop({ eventId: 'dispatcher-pulse', eventName: 'pulse' }, events)?.id
    ).toBe('evt-pulse');
  });

  test('applyEventDefineBinding copies symbol role onto the handler node', () => {
    const event = { id: 'evt-start', name: 'start', role: 'entry' as const, parameters: [] };
    const bound = applyEventDefineBinding(
      { label: 'start', category: 'Events', inputs: [], outputs: [], inlineValues: {}, properties: {} },
      event
    );
    expect(bound.properties?.role).toBe('entry');
    expect(bound.properties?.eventId).toBe('evt-start');
  });

  test('applyEventDefineBinding leaves role unset when the symbol has none', () => {
    const event = { id: 'evt-pulse', name: 'pulse', parameters: [] };
    const bound = applyEventDefineBinding(
      { label: 'pulse', category: 'Events', inputs: [], outputs: [], inlineValues: {}, properties: {} },
      event
    );
    expect(bound.properties?.role).toBeUndefined();
  });
});

describe('event_bind details picker / binding', () => {
  const event = { id: 'evt-go', name: 'go', parameters: [] };
  const empty = {
    label: 'Bind Event',
    category: 'Events',
    inputs: [],
    outputs: [],
    inlineValues: {},
    properties: {},
  };

  test('eventNodeRoleForKind includes bind on the same picker path as dispatch', () => {
    expect(eventNodeRoleForKind('event_bind')).toBe('bind');
    expect(eventNodeRoleForKind('event_dispatch')).toBe('dispatch');
    expect(eventNodeRoleForKind('event_define')).toBe('define');
    expect(eventNodeRoleForKind('var_define')).toBeNull();
  });

  test('applyEventBindBinding persists eventId/eventName on event_bind', () => {
    const bound = applyEventBindBinding(empty, event);
    expect(bound.kindId).toBe('event_bind');
    expect(bound.label).toBe('Bind go');
    expect(bound.properties?.eventId).toBe('evt-go');
    expect(bound.properties?.eventName).toBe('go');
    expect(bound.inputs.map((p) => p.id)).toEqual(['exec_in', 'target', 'event', 'handler']);
  });

  test('applyEventRoleBinding bind writes the same properties as applyEventBindBinding', () => {
    const viaRole = applyEventRoleBinding(empty, event, 'bind');
    const viaBind = applyEventBindBinding(empty, event);
    expect(viaRole.kindId).toBe('event_bind');
    expect(viaRole.properties).toEqual(viaBind.properties);
    expect(viaRole.label).toBe(viaBind.label);
  });

  test('resolveEventForNode and Bind label inference find the bound event', () => {
    const bound = applyEventBindBinding(empty, event);
    expect(resolveEventForNode(bound, [event])?.id).toBe('evt-go');
    expect(inferEventNameFromNodeData({ ...empty, label: 'Bind go' })).toBe('go');
    expect(inferEventNameFromNodeData({ ...empty, label: 'Bind Event' })).toBeUndefined();
  });
});
