import { describe, expect, test } from 'bun:test';
import { generateMockCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

describe('action_get_input codegen', () => {
  const baseNode = {
    id: 'input-1',
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'Get User Input · Text',
      category: 'Action',
      kindId: 'action_get_input',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' as const },
        { id: 'prompt', label: 'Prompt', type: 'data_string' as const },
      ],
      outputs: [
        { id: 'exec_out', label: '', type: 'execution' as const },
        { id: 'value', label: 'Value', type: 'data_string' as const },
      ],
      inlineValues: { prompt: 'Enter your name:' },
      properties: { inputKind: 'text', required: true },
    },
  };

  test('python emits blocking input with temp variable', () => {
    const code = generateMockCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'python',
        variables: [],
        functions: [],
        nodes: [baseNode],
        edges: [],
      })
    );
    expect(code).toContain('input("Enter your name:")');
    expect(code).toContain('_vvs_input_input_1');
  });

  test('javascript emits prompt for text input', () => {
    const code = generateMockCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'javascript',
        variables: [],
        functions: [],
        nodes: [baseNode],
        edges: [],
      })
    );
    expect(code).toContain('prompt("Enter your name:")');
    expect(code).toContain('const _vvs_input_input_1');
  });

  test('number inputKind emits float parse in python', () => {
    const numberNode = {
      ...baseNode,
      data: {
        ...baseNode.data,
        properties: { inputKind: 'number', required: true },
        outputs: [
          { id: 'exec_out', label: '', type: 'execution' as const },
          { id: 'value', label: 'Value', type: 'data_number' as const },
        ],
      },
    };
    const code = generateMockCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'python',
        variables: [],
        functions: [],
        nodes: [numberNode],
        edges: [],
      })
    );
    expect(code).toContain('float(input("Enter your name:"))');
  });
});
