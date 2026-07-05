import { describe, expect, test } from 'bun:test';
import {
  defineNodeOutputs,
  dispatchNodeInputs,
  eventHandlerName,
  inferEventsFromDocuments,
  parameterCodegenName,
} from './eventHelpers';
import { createComplexExampleSnapshot } from './examples/complexExample';

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
    const snapshot = createComplexExampleSnapshot();
    const { events: _removed, ...withoutEvents } = snapshot;
    const inferred = inferEventsFromDocuments(withoutEvents.documents!);
    expect(inferred.some((e) => e.name.toLowerCase() === 'damage')).toBe(true);
  });
});
