import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

describe('flow_return, flow_break, flow_continue emit', () => {
  const languages: TargetLanguage[] = [
    'python',
    'javascript',
    'cpp',
    'csharp',
    'rust',
    'gdscript',
    'verse',
    'go',
  ];

  test.each(languages)('emits return statement with value for %s', (lang) => {
    const returnNode = {
      id: 'ret-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_return',
        label: 'Return',
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
          { id: 'value', label: 'Value', type: 'data_number' as const },
        ],
        outputs: [],
      },
    };

    const numNode = {
      id: 'num-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'literal_number',
        label: 'Number',
        inputs: [],
        outputs: [{ id: 'value', label: '', type: 'data_number' as const }],
        properties: { value: 42 },
      },
    };

    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: lang,
        variables: [],
        functions: [],
        nodes: [returnNode, numNode],
        edges: [
          {
            id: 'e-num-ret',
            source: 'num-1',
            target: 'ret-1',
            sourceHandle: 'value',
            targetHandle: 'value',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_number' },
          },
        ],
      })
    );

    expect(code.toLowerCase()).toContain('return');
    expect(code).toContain('42');
  });

  test.each(languages)('emits multiple return values statement for %s', (lang) => {
    const returnNode = {
      id: 'ret-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_return',
        label: 'Return',
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
          { id: 'val-1', label: 'Sum', type: 'data_number' as const },
          { id: 'val-2', label: 'Valid', type: 'data_boolean' as const },
        ],
        outputs: [],
      },
    };

    const numNode = {
      id: 'num-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'literal_number',
        label: 'Number',
        inputs: [],
        outputs: [{ id: 'value', label: '', type: 'data_number' as const }],
        properties: { value: 100 },
      },
    };

    const boolNode = {
      id: 'bool-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'literal_boolean',
        label: 'Boolean',
        inputs: [],
        outputs: [{ id: 'value', label: '', type: 'data_boolean' as const }],
        properties: { value: true },
      },
    };

    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: lang,
        variables: [],
        functions: [],
        nodes: [returnNode, numNode, boolNode],
        edges: [
          {
            id: 'e1',
            source: 'num-1',
            target: 'ret-1',
            sourceHandle: 'value',
            targetHandle: 'val-1',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_number' },
          },
          {
            id: 'e2',
            source: 'bool-1',
            target: 'ret-1',
            sourceHandle: 'value',
            targetHandle: 'val-2',
            type: 'vvs_standard_edge',
            data: { pinType: 'data_boolean' },
          },
        ],
      })
    );

    expect(code.toLowerCase()).toContain('return');
    expect(code).toContain('100');
    expect(code.toLowerCase()).toContain('true');
  });

  test.each(languages)('emits void return statement for %s', (lang) => {
    const returnNode = {
      id: 'ret-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_return',
        label: 'Return',
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
        ],
        outputs: [],
      },
    };

    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: lang,
        variables: [],
        functions: [],
        nodes: [returnNode],
        edges: [],
      })
    );

    expect(code.toLowerCase()).toContain('return');
  });

  test.each(languages)('emits break statement for %s', (lang) => {
    const breakNode = {
      id: 'break-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_break',
        label: 'Break',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [],
      },
    };

    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: lang,
        variables: [],
        functions: [],
        nodes: [breakNode],
        edges: [],
      })
    );

    expect(code.toLowerCase()).toContain('break');
  });

  test.each(languages)('emits continue statement for %s', (lang) => {
    const continueNode = {
      id: 'cont-1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        kindId: 'flow_continue',
        label: 'Continue',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [],
      },
    };

    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: lang,
        variables: [],
        functions: [],
        nodes: [continueNode],
        edges: [],
      })
    );

    // Verse maps continue to break in loop context
    if (lang === 'verse') {
      expect(code.toLowerCase()).toContain('break');
    } else {
      expect(code.toLowerCase()).toContain('continue');
    }
  });
});
