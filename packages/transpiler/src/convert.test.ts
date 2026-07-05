import { describe, expect, test } from 'bun:test';
import { generateMockCode, generateMockTranspileResult } from './generate';

describe('convert nodes codegen', () => {
  const getResult = {
    id: 'get-result',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'Get Result',
      category: 'Variables',
      kindId: 'variable_get',
      graphBinding: { kind: 'variable_ref' as const, symbolId: 'var-result' },
      properties: { variableName: 'Result' },
      inputs: [],
      outputs: [{ id: 'val', label: 'Result', type: 'data_number' as const }],
      inlineValues: {},
    },
  };

  const toString = {
    id: 'to-str',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'To String',
      category: 'Conversion',
      kindId: 'convert_to_string',
      inputs: [{ id: 'value', label: 'Value', type: 'data_any' as const }],
      outputs: [{ id: 'result', label: 'String', type: 'data_string' as const }],
      inlineValues: {},
    },
  };

  const print = {
    id: 'print-result',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'Print String',
      category: 'Action',
      kindId: 'action_print',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' as const },
        { id: 'in_str', label: 'String', type: 'data_string' as const },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
    },
  };

  const start = {
    id: 'start',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'On Start',
      category: 'Events',
      kindId: 'event_on_start',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
    },
  };

  const edges = [
    {
      id: 'e1',
      source: 'start',
      target: 'print-result',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge' as const,
      data: { pinType: 'execution' as const },
    },
    {
      id: 'e2',
      source: 'get-result',
      target: 'to-str',
      sourceHandle: 'val',
      targetHandle: 'value',
      type: 'vvs_standard_edge' as const,
      data: { pinType: 'data_number' as const },
    },
    {
      id: 'e3',
      source: 'to-str',
      target: 'print-result',
      sourceHandle: 'result',
      targetHandle: 'in_str',
      type: 'vvs_standard_edge' as const,
      data: { pinType: 'data_string' as const },
    },
  ];

  test('python emits explicit str() call — not folded into print', () => {
    const code = generateMockCode({
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: 'python',
      variables: [{ id: 'var-result', name: 'Result', type: 'data_number' }],
      projectEvents: [],
      functions: [],
      nodes: [start, getResult, toString, print],
      edges,
      tabId: 'main',
    });
    expect(code).toContain('print(str(self.Result))');
  });

  test('javascript emits explicit String() call', () => {
    const code = generateMockCode({
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: 'javascript',
      variables: [{ id: 'var-result', name: 'Result', type: 'data_number' }],
      projectEvents: [],
      functions: [],
      nodes: [start, getResult, toString, print],
      edges,
      tabId: 'main',
    });
    expect(code).toContain('console.log(String(this.Result))');
  });

  test('to-string node is highlighted in sourceMap on print line', () => {
    const result = generateMockTranspileResult({
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: 'python',
      variables: [{ id: 'var-result', name: 'Result', type: 'data_number' }],
      projectEvents: [],
      functions: [],
      nodes: [start, getResult, toString, print],
      edges,
      tabId: 'main',
    });
    expect(result.sourceMap['to-str']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['to-str']).toContain('str(');
    expect(result.fragments?.['get-result']).toContain('Result');
  });
});
