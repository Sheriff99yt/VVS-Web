import { expect, test } from 'bun:test';
import { resolve } from '@vvs/syntax-registry';
import type { GraphNode, GraphEdge, PinType } from '@vvs/graph-types';
import { transpileGraph } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

test('fixed counted-loop graph emits its visible header once and maps every construct', () => {
  const node = (id: string, kindId: string, properties: Record<string, unknown> = {}, inlineValues: Record<string, string | number | boolean> = {}): GraphNode => {
    const kind = resolve(kindId)!;
    return { id, type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { kindId, kindVersion: 1, label: kind.title, category: kind.category, inputs: structuredClone(kind.inputs), outputs: structuredClone(kind.outputs), properties, inlineValues } };
  };
  const loop = node('loop', 'flow_for', { headerMode: 'structured' });
  const initialize = node('initialize', 'var_define', { symbolId: 'index', name: 'index', hasInitializer: true, declarationKind: 'let' }, { value: 0 });
  const get = node('get', 'variable_get', { symbolId: 'index', variableName: 'index' });
  get.data.outputs[0].type = 'data_number';
  const compare = node('compare', 'expr_compare', { comparisonMode: 'number', operator: '<' }, { b: 4 });
  const update = node('update', 'variable_set', { symbolId: 'index', variableName: 'index', assignmentOperator: '++' });
  const body = node('body', 'flow_return', {}, { value: 1 });
  const after = node('after', 'flow_return', {}, { value: 0 });
  const edge = (source: string, sourceHandle: string, target: string, targetHandle: string, pinType: PinType): GraphEdge => ({ id: `${source}-${target}`, source, sourceHandle, target, targetHandle, type: 'vvs_standard_edge', data: { pinType } });
  const context = withTestEntryGraph({ moduleName: 'Demo', extendsType: '', targetLanguage: 'javascript', functions: [], variables: [{ id: 'index', name: 'index', type: 'data_number', graphTabId: 'main-graph', scopedNodeId: 'loop' }], nodes: [loop, initialize, get, compare, update, body, after], edges: [edge('loop', 'init_exec', 'initialize', 'exec_in', 'execution'), edge('loop', 'update_exec', 'update', 'exec_in', 'execution'), edge('loop', 'body_exec', 'body', 'exec_in', 'execution'), edge('loop', 'exec_out', 'after', 'exec_in', 'execution'), edge('get', 'val', 'compare', 'a', 'data_number'), edge('compare', 'result', 'loop', 'condition', 'data_boolean')] }, 'loop');
  const result = transpileGraph(context);
  const code = result.files[0].content;
  expect(code).toContain('for (let index = 0; (index < 4); index++) {');
  expect(code.match(/let index/g)).toHaveLength(1);
  expect(code).not.toContain('    index = 0;');
  expect(code.match(/index\+\+/g)).toHaveLength(1);
  expect(code).toContain('return 1;');
  expect(code).toContain('return 0;');
  for (const id of ['loop', 'initialize', 'get', 'compare', 'update', 'body', 'after']) expect(result.sourceMap[id]?.length, id).toBeGreaterThan(0);
  const indexPinContext = structuredClone(context);
  indexPinContext.edges.push(edge('loop', 'index', 'body', 'value', 'data_number'));
  delete indexPinContext.nodes.find(node => node.id === 'body')!.data.inlineValues.value;
  const indexPinCode = transpileGraph(indexPinContext).files[0].content;
  expect(indexPinCode).toContain('return index;');
  expect(indexPinCode).not.toContain('_vvs_i_loop');
});
