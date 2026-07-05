import { describe, expect, test } from 'bun:test';
import { pinInlineWidgetKind } from './pinInlineWidget';

describe('pinInlineWidgetKind', () => {
  test('boolean condition pin uses checkbox widget', () => {
    expect(
      pinInlineWidgetKind({
        id: 'condition',
        label: 'Condition',
        type: 'data_boolean',
      })
    ).toBe('checkbox');
  });

  test('number pin uses number widget', () => {
    expect(
      pinInlineWidgetKind({ id: 'b', label: 'B', type: 'data_number' })
    ).toBe('number');
  });

  test('string pin uses text widget', () => {
    expect(
      pinInlineWidgetKind({ id: 'in_str', label: 'String', type: 'data_string' })
    ).toBe('text');
  });
});
