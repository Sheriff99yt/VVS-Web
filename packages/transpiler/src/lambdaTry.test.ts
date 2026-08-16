import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

const LAMBDA_LANGS: TargetLanguage[] = ['python', 'javascript', 'csharp', 'rust', 'gdscript'];
const TRY_LANGS: TargetLanguage[] = ['python', 'javascript', 'cpp', 'csharp', 'gdscript'];

function literalNumber(id: string, value: number) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'literal_number',
      label: 'Number',
      inputs: [],
      outputs: [{ id: 'value', label: '', type: 'data_number' as const }],
      properties: { value },
    },
  };
}

function printNode(id: string) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'action_print',
      label: 'Print String',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' as const },
        { id: 'in_str', label: 'String', type: 'data_any' as const },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
    },
  };
}

describe('lambda_define print', () => {
  test.each(LAMBDA_LANGS)('prints lambda expression for %s', (lang) => {
    const lambda = {
      id: 'lam-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'lambda_define',
        label: 'Lambda',
        inputs: [{ id: 'body', label: 'Body', type: 'data_any' as const }],
        outputs: [{ id: 'result', label: 'Result', type: 'data_any' as const }],
        properties: { params: 'x', capture: false },
      },
    };
    const print = printNode('print-1');
    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: lang,
        variables: [],
        functions: [],
        nodes: [lambda, literalNumber('num-1', 1), print],
        edges: [
          {
            id: 'e-num-lam',
            source: 'num-1',
            target: 'lam-1',
            sourceHandle: 'value',
            targetHandle: 'body',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_number' },
          },
          {
            id: 'e-lam-print',
            source: 'lam-1',
            target: 'print-1',
            sourceHandle: 'result',
            targetHandle: 'in_str',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_any' },
          },
        ],
      })
    );
    if (lang === 'python') expect(code).toContain('lambda x: 1');
    else if (lang === 'javascript' || lang === 'csharp') expect(code).toContain('(x) => 1');
    else if (lang === 'rust') expect(code).toContain('|x| 1');
    else expect(code).toContain('func(x): return 1');
  });

  test('rust capture emits move closure', () => {
    const lambda = {
      id: 'lam-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'lambda_define',
        label: 'Lambda',
        inputs: [{ id: 'body', label: 'Body', type: 'data_any' as const }],
        outputs: [{ id: 'result', label: 'Result', type: 'data_any' as const }],
        properties: { params: 'x', capture: true },
      },
    };
    const print = printNode('print-1');
    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'rust',
        variables: [],
        functions: [],
        nodes: [lambda, literalNumber('num-1', 1), print],
        edges: [
          {
            id: 'e-num-lam',
            source: 'num-1',
            target: 'lam-1',
            sourceHandle: 'value',
            targetHandle: 'body',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_number' },
          },
          {
            id: 'e-lam-print',
            source: 'lam-1',
            target: 'print-1',
            sourceHandle: 'result',
            targetHandle: 'in_str',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_any' },
          },
        ],
      })
    );
    expect(code).toContain('move |x| 1');
  });
});

describe('flow_try print', () => {
  test.each(TRY_LANGS)('prints try/catch for %s and omits empty finally', (lang) => {
    const tryNode = {
      id: 'try-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_try',
        label: 'Try',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [
          { id: 'try_exec', label: 'Try', type: 'execution' as const },
          { id: 'catch_exec', label: 'Catch', type: 'execution' as const },
          { id: 'finally_exec', label: 'Finally', type: 'execution' as const },
          { id: 'exec_out', label: '', type: 'execution' as const },
        ],
        properties: { catchType: '', catchName: '' },
      },
    };
    const tryPrint = {
      ...printNode('print-try'),
      data: {
        ...printNode('print-try').data,
        inlineValues: { in_str: 'try' },
      },
    };
    const catchPrint = {
      ...printNode('print-catch'),
      data: {
        ...printNode('print-catch').data,
        inlineValues: { in_str: 'catch' },
      },
    };
    const code = transpileGraphCode(
      withTestEntryGraph(
        {
          moduleName: 'Demo',
          extendsType: '',
          targetLanguage: lang,
          variables: [],
          functions: [],
          nodes: [tryNode, tryPrint, catchPrint],
          edges: [
            {
              id: 'e-try-body',
              source: 'try-1',
              target: 'print-try',
              sourceHandle: 'try_exec',
              targetHandle: 'exec_in',
              type: 'vvs_standard_edge',
              data: { pinType: 'execution' },
            },
            {
              id: 'e-catch-body',
              source: 'try-1',
              target: 'print-catch',
              sourceHandle: 'catch_exec',
              targetHandle: 'exec_in',
              type: 'vvs_standard_edge',
              data: { pinType: 'execution' },
            },
          ],
        },
        'try-1'
      )
    );
    expect(code.toLowerCase()).toContain('try');
    expect(code.toLowerCase()).toMatch(/catch|except/);
    expect(code.toLowerCase()).not.toContain('finally');
  });

  test('python finally emits only when wired', () => {
    const tryNode = {
      id: 'try-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_try',
        label: 'Try',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [
          { id: 'try_exec', label: 'Try', type: 'execution' as const },
          { id: 'catch_exec', label: 'Catch', type: 'execution' as const },
          { id: 'finally_exec', label: 'Finally', type: 'execution' as const },
          { id: 'exec_out', label: '', type: 'execution' as const },
        ],
      },
    };
    const finallyPrint = {
      ...printNode('print-fin'),
      data: {
        ...printNode('print-fin').data,
        inlineValues: { in_str: 'done' },
      },
    };
    const code = transpileGraphCode(
      withTestEntryGraph(
        {
          moduleName: 'Demo',
          extendsType: '',
          targetLanguage: 'python',
          variables: [],
          functions: [],
          nodes: [tryNode, finallyPrint],
          edges: [
            {
              id: 'e-fin',
              source: 'try-1',
              target: 'print-fin',
              sourceHandle: 'finally_exec',
              targetHandle: 'exec_in',
              type: 'vvs_standard_edge',
              data: { pinType: 'execution' },
            },
          ],
        },
        'try-1'
      )
    );
    expect(code).toContain('finally:');
    expect(code).toContain('done');
  });
});
