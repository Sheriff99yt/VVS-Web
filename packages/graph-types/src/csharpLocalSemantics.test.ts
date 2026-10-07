import { expect, test } from 'bun:test';
import { csharpIntegralLocal, csharpIntegralMutation, inferCSharpLinearLocals } from './csharpLocalSemantics';
import { inferCSharpGraphExpression } from './csharpGraphExpressions';
import type { GraphDocument } from './symbols';
import type { GraphNode, GraphEdge } from './graphCodegen';
import saved from '../../transpiler/test/csharp-expression.fixture.json';

test('predefined C# compound assignments retain target type without accepting arbitrary narrowing', () => {
  expect(csharpIntegralMutation('byte', false, '+=', { type: 'int', constant: '1' })).toEqual({ type: 'byte' });
  expect(() => csharpIntegralMutation('byte', false, '+=', { type: 'int' })).toThrow('ASSIGNMENT');
  expect(() => csharpIntegralMutation('byte', false, '+=', { type: 'int', constant: '256' })).toThrow('ASSIGNMENT');
  expect(csharpIntegralMutation('byte', false, '<<=', { type: 'int' })).toEqual({ type: 'byte' });
  expect(csharpIntegralMutation('char', false, '++')).toEqual({ type: 'char' });
  expect(() => csharpIntegralMutation('uint', false, '+=', { type: 'int' })).toThrow('ASSIGNMENT');
  expect(() => csharpIntegralMutation('long', false, '^=', { type: 'ulong' })).toThrow('BINARY_TYPE');
  expect(() => csharpIntegralMutation('byte', true, '++')).toThrow('ASSIGN_READONLY');
  expect(() => csharpIntegralMutation('int', false, '++', { type: 'int' })).toThrow('UPDATE_VALUE');
});

function fixture() {
  const doc = structuredClone(saved.documents['identity-int']) as GraphDocument;
  const entry = doc.nodes.find(node => node.data.kindId === 'function_entry')!;
  const ret = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
  const value = doc.edges.find(edge => edge.target === ret.id && edge.targetHandle === 'return_val')!;
  const edge = (source: string, sourceHandle: string, target: string, targetHandle: string, execution = false): GraphEdge => ({ id: `${source}-${sourceHandle}-${target}-${targetHandle}`, source, sourceHandle, target, targetHandle, data: { pinType: execution ? 'execution' : 'data_number' } });
  const declaration = (id: string, name: string, constant: boolean): GraphNode => ({ id, type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { kindId: 'var_define', label: name, category: 'Variables', inputs: [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'value', label: 'Value', type: 'data_number' }], outputs: [{ id: 'exec_out', label: '', type: 'execution' }], inlineValues: {}, properties: { symbolId: id, name, isConst: constant, declarationKind: constant ? 'const' : 'var', nativeLocalStyle: constant ? 'csharp-const' : 'csharp-var', nativeType: constant ? 'byte' : 'var', hasInitializer: true } } });
  const get = (id: string, symbolId: string): GraphNode => ({ id, type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { kindId: 'variable_get', label: symbolId, category: 'Variables', inputs: [], outputs: [{ id: 'val', label: 'Value', type: 'data_number' }], inlineValues: {}, graphBinding: { kind: 'variable_ref', symbolId }, properties: { symbolId, variableName: symbolId === 'x' ? '@First' : 'Second' } } });
  doc.nodes.push(declaration('x', '@First', true), declaration('y', 'Second', false), get('get-x', 'x'), get('get-y', 'y'));
  doc.edges = doc.edges.filter(edge => edge.data?.pinType !== 'execution' && edge.id !== value.id);
  doc.edges.push(edge(entry.id, 'exec_out', 'x', 'exec_in', true), edge('x', 'exec_out', 'y', 'exec_in', true), edge('y', 'exec_out', ret.id, 'exec_in', true), edge(value.source, value.sourceHandle!, 'x', 'value'), edge('get-x', 'val', 'y', 'value'), edge('get-y', 'val', ret.id, 'return_val'));
  return { doc, entry, ret };
}

test('C# local policy retains constant assignment width and removes mutable constant facts', () => {
  expect(csharpIntegralLocal('byte', true, { type: 'int', constant: '1' })).toEqual({ declaredType: 'byte', converted: { type: 'byte', constant: '1' }, read: { type: 'byte', constant: '1' } });
  expect(csharpIntegralLocal('var', false, { type: 'uint', constant: '1' }).read).toEqual({ type: 'uint' });
  expect(csharpIntegralLocal('long', false, { type: 'int' }).read).toEqual({ type: 'long' });
  expect(() => csharpIntegralLocal('byte', false, { type: 'int' })).toThrow('ASSIGNMENT');
  expect(() => csharpIntegralLocal('byte', true, { type: 'byte' })).toThrow('CONST_INITIALIZER');
  expect(() => csharpIntegralLocal('var', true, { type: 'int', constant: '1' })).toThrow('CONST_VAR');
});

test('C# graph local facts follow visible declaration order and exact initializer ownership', () => {
  const { doc, entry, ret } = fixture();
  const locals = inferCSharpLinearLocals(doc, [], entry.id);
  expect(locals.statements).toEqual(['x', 'y']); expect(locals.returnId).toBe(ret.id);
  expect(locals.bindings.get('x')?.fact).toEqual({ type: 'byte', constant: '0' });
  expect(locals.bindings.get('y')?.fact).toEqual({ type: 'byte' });
  expect(inferCSharpGraphExpression(doc, [], entry.id, 'get-y', 'val', 'default', locals.visited, new Set(), locals.bindings)).toEqual({ type: 'byte' });
  doc.nodes.find(node => node.data.properties?.payload === '256')!.data.properties!.payload = '1';
  expect(inferCSharpLinearLocals(doc, [], entry.id).bindings.get('x')?.fact).toEqual({ type: 'byte', constant: '1' });
  const loaded = JSON.parse(JSON.stringify(doc)) as GraphDocument;
  expect([...inferCSharpLinearLocals(loaded, [], entry.id).bindings]).toEqual([...inferCSharpLinearLocals(doc, [], entry.id).bindings]);
});

test('C# graph locals reject self/forward reads, shadowing and changed readonly/type facts', () => {
  for (const change of [
    (doc: GraphDocument) => { doc.edges.find(edge => edge.target === 'x' && edge.targetHandle === 'value')!.source = 'get-x'; },
    (doc: GraphDocument) => { const edge = doc.edges.find(edge => edge.target === 'x' && edge.targetHandle === 'value')!; edge.source = 'get-y'; edge.sourceHandle = 'val'; },
    (doc: GraphDocument) => { doc.nodes.find(node => node.id === 'y')!.data.properties!.name = 'First'; },
    (doc: GraphDocument) => { doc.nodes.find(node => node.id === 'x')!.data.properties!.isConst = false; },
    (doc: GraphDocument) => { doc.nodes.find(node => node.id === 'y')!.data.properties!.nativeType = 'int'; },
    (doc: GraphDocument) => { doc.nodes.find(node => node.id === 'x')!.data.inlineValues.value = 0; },
    (doc: GraphDocument) => { doc.nodes.find(node => node.id === 'get-x')!.data.outputs[0].type = 'data_string'; },
    (doc: GraphDocument) => { doc.nodes.find(node => node.id === 'get-x')!.data.inlineValues.val = 0; },
  ]) { const { doc, entry } = fixture(); change(doc); expect(() => inferCSharpLinearLocals(doc, [], entry.id)).toThrow(); }
  const { doc, entry } = fixture();
  expect(() => inferCSharpLinearLocals(doc, [{ id: 'p', name: 'First', mode: 'positional', nativeType: 'byte' }], entry.id)).toThrow('LOCAL_BINDING');
});

test('C# local inference blocks cycles, ambiguous initializers and invalid overflow edits', () => {
  for (const change of [
    (doc: GraphDocument) => { doc.edges.find(edge => edge.source === 'y' && edge.data?.pinType === 'execution')!.target = 'x'; },
    (doc: GraphDocument) => { doc.edges.push({ ...doc.edges.find(edge => edge.target === 'x' && edge.targetHandle === 'value')!, id: 'duplicate' }); },
    (doc: GraphDocument) => { doc.nodes.find(node => node.data.properties?.nativeForm === 'overflow')!.data.properties!.payload = 'checked'; },
  ]) { const { doc, entry } = fixture(); change(doc); expect(() => inferCSharpLinearLocals(doc, [], entry.id)).toThrow(); }
});
