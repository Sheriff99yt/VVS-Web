import { describe, expect, test } from 'bun:test';
import {
  defineNodeOutputs,
  dispatchNodeInputs,
  eventHandlerName,
  inferEventsFromDocuments,
  parameterCodegenName,
  resolveEventForDrop,
} from './eventHelpers';
import { createCoverageLabUsabilityTestSnapshot } from './usabilityExampleTests/coverageLabUsabilityTest';

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

  test('inferEventsFromDocuments repairs legacy graphs', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const { events: _removed, ...withoutEvents } = snapshot;
    const inferred = inferEventsFromDocuments(withoutEvents.documents!);
    expect(inferred.some((e) => e.name.toLowerCase() === 'pulse')).toBe(true);
    expect(inferred.some((e) => e.name.toLowerCase() === 'start')).toBe(true);
  });

  test('resolveEventForDrop matches symbol id or legacy dispatcher label', () => {
    const events = [{ id: 'evt-pulse', name: 'pulse', parameters: [] }];
    expect(resolveEventForDrop({ eventId: 'evt-pulse' }, events)?.id).toBe('evt-pulse');
    expect(
      resolveEventForDrop({ eventId: 'dispatcher-pulse', eventName: 'pulse' }, events)?.id
    ).toBe('evt-pulse');
  });
});
