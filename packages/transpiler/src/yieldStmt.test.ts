import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { list } from '@vvs/syntax-registry';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function yieldNode(id: string) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'yield_stmt',
      label: 'Yield',
      category: 'Flow Control',
      inputs: [
        EXEC_IN,
        { id: 'value', label: 'Value', type: 'data_any' as const },
      ],
      outputs: [EXEC_OUT],
      properties: {},
      inlineValues: {},
    },
  };
}

function getX() {
  return {
    id: 'get-x',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'variable_get',
      label: 'Get x',
      inputs: [],
      outputs: [{ id: 'val', label: '', type: 'data_any' as const }],
      properties: { variableName: 'x' },
    },
  };
}

function yieldGraph(lang: TargetLanguage, withValue: boolean) {
  const y = yieldNode('yield-1');
  const nodes = withValue ? [y, getX()] : [y];
  const edges = withValue
    ? [
        {
          id: 'e-x-yield',
          source: 'get-x',
          target: 'yield-1',
          sourceHandle: 'val',
          targetHandle: 'value',
          type: 'vvs_standard_edge' as const,
          data: { pinType: 'data_any' as const },
        },
      ]
    : [];
  return withTestEntryGraph({
    moduleName: 'Demo',
    extendsType: '',
    targetLanguage: lang,
    variables: [],
    functions: [],
    nodes,
    edges,
  });
}

describe('yield_stmt', () => {
  test('python emits yield x', () => {
    const code = transpileGraphCode(yieldGraph('python', true));
    expect(code).toContain('yield self.x');
  });

  test('python emits bare yield', () => {
    const code = transpileGraphCode(yieldGraph('python', false));
    expect(code).toMatch(/(^|\n)\s*yield\s*$/m);
    expect(code).not.toContain('yield x');
  });

  test('gdscript emits yield when the node is placed', () => {
    const code = transpileGraphCode(yieldGraph('gdscript', true));
    expect(code).toContain('yield self.x');
  });

  test('hidden on cpp (spawn menu)', () => {
    const cats = list({
      currentGraphId: 'main',
      functions: [],
      events: [],
      targetLanguage: 'cpp',
    });
    expect(cats.some((c) => c.items.some((i) => i.kindId === 'yield_stmt'))).toBe(false);
  });

  test('cpp does not invent generator syntax when a Yield node is placed', () => {
    const code = transpileGraphCode(yieldGraph('cpp', true));
    expect(code).toContain('(x) Yield');
    expect(code).not.toMatch(/\byield\b/);
  });
});
