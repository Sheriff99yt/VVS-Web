import { describe, expect, test } from 'bun:test';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';
import type { IrForEach } from './ir/types';
import { createPrintContext } from './print';
import { appendIrStatements } from './emit/sinkStatements';
import { CodeSink } from './codeSink';

describe('Verse for / for-each (CL-015)', () => {
  test('range for emits Verse first..last inclusive form', () => {
    const forNode = {
      id: 'for-loop',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'For Loop',
        category: 'Flow Control',
        kindId: 'flow_for',
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
          { id: 'first', label: 'First', type: 'data_number' as const },
          { id: 'last', label: 'Last', type: 'data_number' as const },
        ],
        outputs: [
          { id: 'body_exec', label: 'Body', type: 'execution' as const },
          { id: 'exec_out', label: '', type: 'execution' as const },
          { id: 'index', label: 'Index', type: 'data_number' as const },
        ],
        inlineValues: { first: 0, last: 2 },
      },
    };
    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'verse',
        variables: [],
        functions: [],
        nodes: [forNode],
        edges: [],
      })
    );
    expect(code).toContain('for (_vvs_i_for_loop := 0..2):');
    expect(code).not.toContain('for (_vvs_i_for_loop : 2):');
    expect(code).not.toContain('for (int ');
  });

  test('for-each over array emits Verse for (val : xs):', () => {
    const getReadings = {
      id: 'get-readings',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 100 },
      data: {
        label: 'Get Readings',
        category: 'Variables',
        kindId: 'variable_get',
        graphBinding: { kind: 'variable_ref' as const, symbolId: 'var-readings' },
        properties: { variableName: 'Readings' },
        inputs: [],
        outputs: [{ id: 'val', label: 'Readings', type: 'data_array' as const }],
        inlineValues: {},
      },
    };
    const forEach = {
      id: 'for-each',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'For Loop',
        category: 'Flow Control',
        kindId: 'flow_for',
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
          { id: 'array', label: 'Array', type: 'data_array' as const },
        ],
        outputs: [
          { id: 'loop_body', label: 'Body', type: 'execution' as const },
          { id: 'exec_out', label: '', type: 'execution' as const },
          { id: 'element', label: 'Element', type: 'data_number' as const },
        ],
        inlineValues: {},
      },
    };
    const printNode = {
      id: 'print-val',
      type: 'vvs_standard_node' as const,
      position: { x: 200, y: 0 },
      data: {
        label: 'Print',
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
    const toString = {
      id: 'to-str',
      type: 'vvs_standard_node' as const,
      position: { x: 100, y: 100 },
      data: {
        label: 'To String',
        category: 'Conversion',
        kindId: 'convert_to_string',
        inputs: [{ id: 'value', label: 'Value', type: 'data_any' as const }],
        outputs: [{ id: 'result', label: 'String', type: 'data_string' as const }],
        inlineValues: {},
      },
    };
    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'verse',
        variables: [{ id: 'var-readings', name: 'Readings', type: 'data_array' as const }],
        functions: [],
        nodes: [getReadings, forEach, printNode, toString],
        edges: [
          {
            id: 'e-arr',
            source: 'get-readings',
            target: 'for-each',
            sourceHandle: 'val',
            targetHandle: 'array',
            data: { pinType: 'data' },
          },
          {
            id: 'e-body',
            source: 'for-each',
            target: 'print-val',
            sourceHandle: 'loop_body',
            targetHandle: 'exec_in',
            data: { pinType: 'execution' },
          },
          {
            id: 'e-el',
            source: 'for-each',
            target: 'to-str',
            sourceHandle: 'element',
            targetHandle: 'value',
            data: { pinType: 'data' },
          },
          {
            id: 'e-str',
            source: 'to-str',
            target: 'print-val',
            sourceHandle: 'result',
            targetHandle: 'in_str',
            data: { pinType: 'data' },
          },
        ],
      })
    );
    expect(code).toContain('for (val : Readings):');
    expect(code).not.toContain('for (float val : Readings)');
    expect(code).not.toContain('for (float val : Readings) {');
  });

  test('ForEach sink emit uses colon block, not C++ braces', () => {
    const stmt: IrForEach = {
      kind: 'ForEach',
      sourceGraphNodeId: 'for-each',
      elementVar: 'val',
      elementType: 'data_number',
      collection: { kind: 'InstanceRef', sourceGraphNodeId: 'get-readings', name: 'Readings' },
      body: [],
    };
    const sink = new CodeSink('Demo.verse');
    appendIrStatements(sink, [stmt], createPrintContext('verse', [], '        '));
    expect(sink.content).toContain('for (val : Readings):');
    expect(sink.content).not.toContain('for (float val : Readings) {');
  });
});
