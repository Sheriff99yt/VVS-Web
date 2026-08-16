import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

const LAMBDA_LANGS: TargetLanguage[] = ['python', 'javascript', 'csharp', 'rust', 'gdscript'];

function lambdaGraph(lang: TargetLanguage, capture = false) {
  const lambda = {
    id: 'lambda-1',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'lambda_define',
      label: 'Lambda',
      category: 'Expressions',
      inputs: [{ id: 'body', label: 'Body', type: 'data_any' as const }],
      outputs: [{ id: 'result', label: 'Result', type: 'data_any' as const }],
      properties: { params: 'x', capture },
      inlineValues: {},
    },
  };
  const num = {
    id: 'num-1',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'literal_number',
      label: 'Number',
      inputs: [],
      outputs: [{ id: 'value', label: '', type: 'data_number' as const }],
      properties: { value: 1 },
      inlineValues: {},
    },
  };
  const print = {
    id: 'print-1',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'action_print',
      label: 'Print',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' as const },
        { id: 'in_str', label: 'String', type: 'data_string' as const },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
    },
  };
  return withTestEntryGraph({
    moduleName: 'Demo',
    extendsType: '',
    targetLanguage: lang,
    variables: [],
    functions: [],
    nodes: [lambda, num, print],
    edges: [
      {
        id: 'e-num-body',
        source: 'num-1',
        target: 'lambda-1',
        sourceHandle: 'value',
        targetHandle: 'body',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'data_number' },
      },
      {
        id: 'e-lambda-print',
        source: 'lambda-1',
        target: 'print-1',
        sourceHandle: 'result',
        targetHandle: 'in_str',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'data_any' },
      },
    ],
  });
}

describe('lambda_define print', () => {
  test.each(LAMBDA_LANGS)('prints lambda for %s', (lang) => {
    const code = transpileGraphCode(lambdaGraph(lang));
    if (lang === 'python') expect(code).toContain('lambda x: 1');
    if (lang === 'javascript' || lang === 'csharp') expect(code).toContain('(x) => 1');
    if (lang === 'rust') {
      expect(code).toContain('|x| 1');
      expect(code).not.toContain('move |x|');
    }
    if (lang === 'gdscript') expect(code).toContain('func(x): return 1');
  });

  test('rust capture uses move closure', () => {
    const code = transpileGraphCode(lambdaGraph('rust', true));
    expect(code).toContain('move |x| 1');
  });
});
