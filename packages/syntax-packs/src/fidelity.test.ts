import { describe, expect, test } from 'bun:test';
import { lintFidelity } from './fidelity';

describe('lintFidelity', () => {
  test('flags missing sourceGraphNodeId', () => {
    const violations = lintFidelity({
      statements: [{ text: 'x = 1' }],
      sourceMap: {},
    });
    expect(violations.some((v) => v.code === 'MISSING_SOURCE_NODE')).toBe(true);
  });

  test('flags duplicate node IDs', () => {
    const violations = lintFidelity({
      statements: [
        { sourceGraphNodeId: 'n1' },
        { sourceGraphNodeId: 'n1' },
      ],
      sourceMap: { n1: {} },
    });
    expect(violations.some((v) => v.code === 'DUPLICATE_NODE_ID')).toBe(true);
  });

  test('passes valid statement set', () => {
    const violations = lintFidelity({
      statements: [{ sourceGraphNodeId: 'n1' }, { sourceGraphNodeId: 'n2' }],
      sourceMap: { n1: {}, n2: {} },
    });
    expect(violations).toEqual([]);
  });

  test('skips synthetic statements', () => {
    const violations = lintFidelity({
      statements: [{ synthetic: true, text: 'scaffold' }],
      sourceMap: {},
    });
    expect(violations).toEqual([]);
  });
});
