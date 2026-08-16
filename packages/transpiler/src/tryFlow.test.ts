import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

const TRY_LANGS: TargetLanguage[] = ['python', 'javascript', 'cpp', 'csharp', 'gdscript'];

function printNode(id: string, text: string) {
  return {
    id,
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
      inlineValues: { in_str: text },
      properties: {},
    },
  };
}

function tryGraph(lang: TargetLanguage, withFinally: boolean) {
  const tryNode = {
    id: 'try-1',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'flow_try',
      label: 'Try',
      category: 'Flow Control',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [
        { id: 'try_exec', label: 'Try', type: 'execution' as const },
        { id: 'catch_exec', label: 'Catch', type: 'execution' as const },
        { id: 'finally_exec', label: 'Finally', type: 'execution' as const },
        { id: 'exec_out', label: '', type: 'execution' as const },
      ],
      properties: { catchType: '', catchName: '' },
      inlineValues: {},
    },
  };
  const ok = printNode('print-ok', 'ok');
  const err = printNode('print-err', 'err');
  const done = printNode('print-done', 'done');
  const nodes = withFinally ? [tryNode, ok, err, done] : [tryNode, ok, err];
  const edges = [
    {
      id: 'e-try-ok',
      source: 'try-1',
      target: 'print-ok',
      sourceHandle: 'try_exec',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge' as const,
      data: { pinType: 'execution' as const },
    },
    {
      id: 'e-try-err',
      source: 'try-1',
      target: 'print-err',
      sourceHandle: 'catch_exec',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge' as const,
      data: { pinType: 'execution' as const },
    },
  ];
  if (withFinally) {
    edges.push({
      id: 'e-try-done',
      source: 'try-1',
      target: 'print-done',
      sourceHandle: 'finally_exec',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge' as const,
      data: { pinType: 'execution' as const },
    });
  }
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

describe('flow_try print', () => {
  test.each(TRY_LANGS)('prints try/catch for %s', (lang) => {
    const code = transpileGraphCode(tryGraph(lang, true));
    expect(code.toLowerCase()).toContain('try');
    if (lang === 'python' || lang === 'gdscript') expect(code).toContain('except');
    else expect(code.toLowerCase()).toContain('catch');
    if (lang !== 'cpp') {
      expect(code.toLowerCase()).toContain('finally');
    }
  });

  test.each(TRY_LANGS)('omits finally when the pin is empty for %s', (lang) => {
    const code = transpileGraphCode(tryGraph(lang, false));
    expect(code.toLowerCase()).not.toContain('finally');
    if (lang === 'python' || lang === 'gdscript') expect(code).toContain('except');
    else expect(code.toLowerCase()).toContain('catch');
  });
});
