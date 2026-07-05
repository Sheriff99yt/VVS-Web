import { describe, expect, test } from 'bun:test';
import { normalizeNodeData } from './nodeKind';

describe('normalizeNodeData', () => {
  test('infers variable get kind and property from legacy label', () => {
    const data = normalizeNodeData({
      label: 'Get Score',
      category: 'Variables',
      inputs: [],
      outputs: [{ id: 'val', label: 'Score', type: 'data_number' }],
      inlineValues: {},
    });

    expect(data.kindId).toBe('variable_get');
    expect(data.properties?.variableName).toBe('Score');
    expect(data.label).toBe('Get Score');
  });
});
