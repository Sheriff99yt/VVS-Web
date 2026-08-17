import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function switchGraph(lang: TargetLanguage) {
  const sw = {
    id: 'sw-1',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'flow_switch',
      label: 'Switch',
      category: 'Flow Control',
      inputs: [
        EXEC_IN,
        { id: 'selector', label: 'Value', type: 'data_any' as const },
      ],
      outputs: [
        { id: 'case_0', label: 'A', type: 'execution' as const },
        { id: 'case_1', label: 'B', type: 'execution' as const },
        { id: 'default_exec', label: 'Default', type: 'execution' as const },
        EXEC_OUT,
      ],
      inlineValues: { case0: 'A', case1: 'B' },
      properties: {},
    },
  };
  const printA = {
    id: 'print-a',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'action_print',
      label: 'Print',
      inputs: [EXEC_IN, { id: 'in_str', label: 'String', type: 'data_string' as const }],
      outputs: [EXEC_OUT],
      inlineValues: { in_str: 'a' },
      properties: {},
    },
  };
  const printB = {
    id: 'print-b',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'action_print',
      label: 'Print',
      inputs: [EXEC_IN, { id: 'in_str', label: 'String', type: 'data_string' as const }],
      outputs: [EXEC_OUT],
      inlineValues: { in_str: 'b' },
      properties: {},
    },
  };
  const printD = {
    id: 'print-d',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'action_print',
      label: 'Print',
      inputs: [EXEC_IN, { id: 'in_str', label: 'String', type: 'data_string' as const }],
      outputs: [EXEC_OUT],
      inlineValues: { in_str: 'd' },
      properties: {},
    },
  };
  const getSel = {
    id: 'get-sel',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'variable_get',
      label: 'Get value',
      inputs: [],
      outputs: [{ id: 'val', label: '', type: 'data_any' as const }],
      properties: { variableName: 'value' },
    },
  };
  return withTestEntryGraph({
    moduleName: 'Demo',
    extendsType: '',
    targetLanguage: lang,
    variables: [],
    functions: [],
    nodes: [sw, printA, printB, printD, getSel],
    edges: [
      {
        id: 'e-sel',
        source: 'get-sel',
        target: 'sw-1',
        sourceHandle: 'val',
        targetHandle: 'selector',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'data_any' as const },
      },
      {
        id: 'e-a',
        source: 'sw-1',
        target: 'print-a',
        sourceHandle: 'case_0',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
      {
        id: 'e-b',
        source: 'sw-1',
        target: 'print-b',
        sourceHandle: 'case_1',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
      {
        id: 'e-d',
        source: 'sw-1',
        target: 'print-d',
        sourceHandle: 'default_exec',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
    ],
  });
}

describe('Switch native match lowering', () => {
  test('python emits match / case / case _', () => {
    const code = transpileGraphCode(switchGraph('python'));
    expect(code).toContain('match self.value:');
    expect(code).toContain('case A:');
    expect(code).toContain('case B:');
    expect(code).toContain('case _:');
    expect(code).not.toContain('_vvs_sel');
  });

  test('rust emits match on value-equality cases', () => {
    const code = transpileGraphCode(switchGraph('rust'));
    expect(code).toContain('match self.value {');
    expect(code).toContain('A => {');
    expect(code).toContain('_ => {');
    expect(code).not.toContain('_vvs_sel');
  });

  test('csharp / javascript keep native switch; gdscript stays if-cascade', () => {
    const cs = transpileGraphCode(switchGraph('csharp'));
    expect(cs).toContain('switch (');
    expect(cs).toContain('case A:');
    const js = transpileGraphCode(switchGraph('javascript'));
    expect(js).toContain('switch (');
    const gd = transpileGraphCode(switchGraph('gdscript'));
    expect(gd).toContain('_vvs_sel');
    expect(gd).toContain('if ');
    expect(gd).not.toContain('match ');
  });
});
