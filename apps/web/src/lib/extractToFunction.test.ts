import { describe, expect, it } from 'vitest';
import { createClassSymbol, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { VVSNode, VVSEdge } from '@/types/graph';
import {
  applyExtractSelectionToDocuments,
  extractSelectionToFunction,
} from './extractToFunction';

function printNode(id: string, selected = true): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    selected,
    position: { x: 200, y: 120 },
    data: {
      label: 'Print',
      category: 'Actions',
      kindId: 'action_print',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'text', label: 'Text', type: 'data_string' },
      ],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function execEdge(id: string, source: string, target: string): VVSEdge {
  return {
    id,
    source,
    target,
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  };
}

describe('extractSelectionToFunction', () => {
  it('creates a symbol, body tab, and Call without a Declare on the source graph', () => {
    const selected = printNode('print-1');
    const leftover = printNode('print-keep', false);
    leftover.position = { x: 40, y: 40 };
    const result = extractSelectionToFunction(
      [leftover, selected],
      [execEdge('e-keep', leftover.id, selected.id)],
      { name: 'ExtractedFn', classId: 'cls-1' }
    );
    if ('error' in result) throw new Error(result.error);

    expect(result.func.name).toBe('ExtractedFn');
    expect(result.func.classId).toBe('cls-1');
    expect(result.tab.id).toBe(result.func.id);
    expect(result.functionDocument.nodes.some((n) => n.data.kindId === 'function_entry')).toBe(true);
    expect(result.functionDocument.nodes.some((n) => n.data.kindId === 'action_print')).toBe(true);
    expect(result.functionDocument.nodes.some((n) => n.data.kindId === 'function_define')).toBe(false);

    expect(result.nextNodes.some((n) => n.id === 'print-1')).toBe(false);
    expect(result.nextNodes.some((n) => n.id === 'print-keep')).toBe(true);
    const call = result.nextNodes.find((n) => n.data.kindId === 'vvs.project.call_function');
    expect(call).toBeDefined();
    expect(call?.data.graphBinding?.symbolId).toBe(result.func.id);
  });

  it('returns an error when nothing is selected', () => {
    const result = extractSelectionToFunction([printNode('print-1', false)], []);
    expect('error' in result).toBe(true);
  });
});

describe('applyExtractSelectionToDocuments', () => {
  it('writes body to the function tab and Call to the source tab', () => {
    const selected = printNode('print-1');
    const result = extractSelectionToFunction([selected], [], { name: 'ExtractedFn' });
    if ('error' in result) throw new Error(result.error);

    const documents = {
      [MAIN_GRAPH_CONTAINER_ID]: { nodes: [selected], edges: [] },
    };
    const next = applyExtractSelectionToDocuments(documents, result, MAIN_GRAPH_CONTAINER_ID);

    const source = next[MAIN_GRAPH_CONTAINER_ID]!;
    expect(source.nodes.some((n) => n.data.kindId === 'vvs.project.call_function')).toBe(true);
    expect(source.nodes.some((n) => n.id === 'print-1')).toBe(false);
    expect(source.nodes.some((n) => n.data.kindId === 'function_define')).toBe(false);

    const body = next[result.tab.id]!;
    expect(body.nodes.some((n) => n.data.kindId === 'function_entry')).toBe(true);
    expect(body.nodes.some((n) => n.data.kindId === 'action_print')).toBe(true);
    expect(body.nodes.some((n) => n.data.kindId === 'vvs.project.call_function')).toBe(false);
  });

  it('attaches function_define on the class home, not a Call rewrite', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const selected = printNode('print-1');
    const result = extractSelectionToFunction([selected], [], {
      name: 'ExtractedFn',
      classId: cls.id,
    });
    if ('error' in result) throw new Error(result.error);

    const documents = {
      [MAIN_GRAPH_CONTAINER_ID]: { nodes: [selected], edges: [] },
    };
    const next = applyExtractSelectionToDocuments(documents, result, MAIN_GRAPH_CONTAINER_ID, { cls });

    const source = next[MAIN_GRAPH_CONTAINER_ID]!;
    const define = source.nodes.find((n) => n.data.kindId === 'function_define');
    expect(define).toBeDefined();
    expect(define?.data.properties?.symbolId).toBe(result.func.id);
    expect(source.nodes.filter((n) => n.data.kindId === 'vvs.project.call_function')).toHaveLength(1);
    expect(next[result.tab.id]!.nodes.some((n) => n.data.kindId === 'function_entry')).toBe(true);
  });
});
