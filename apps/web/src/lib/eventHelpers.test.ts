import { describe, expect, test } from 'bun:test';
import {
  defineNodeOutputs,
  dispatchNodeInputs,
  eventHandlerName,
  inferEventsFromDocuments,
  parameterCodegenName,
  resolveEventForDrop,
} from './eventHelpers';
import { createCalculatorUsabilityTestSnapshot } from './usabilityExampleTests/calculatorUsabilityTest';

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
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const { events: _removed, ...withoutEvents } = snapshot;
    const inferred = inferEventsFromDocuments(withoutEvents.documents!);
    expect(inferred.some((e) => e.name.toLowerCase() === 'calculate')).toBe(true);
    expect(inferred.some((e) => e.name.toLowerCase() === 'clear')).toBe(true);
  });

  test('resolveEventForDrop matches symbol id or legacy dispatcher label', () => {
    const events = [
      { id: 'evt-calc', name: 'calculate', parameters: [] },
      { id: 'evt-clear', name: 'clear', parameters: [] },
    ];
    expect(resolveEventForDrop({ eventId: 'evt-calc' }, events)?.id).toBe('evt-calc');
    expect(
      resolveEventForDrop({ eventId: 'dispatcher-calculate', eventName: 'calculate' }, events)?.id
    ).toBe('evt-calc');
  });
});
