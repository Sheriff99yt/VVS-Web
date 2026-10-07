import { CSHARP_GRAPH_EXPRESSIONS, csharpExpressionGraph } from './csharpExpressionGraphs';
import type { GraphNode, GraphEdge } from '@vvs/graph-types';
export const CSHARP_LOCAL_GRAPHS = [
  { id: 'constant-byte-chain', expression: 'unchecked-cast', constant: true, chain: true },
  { id: 'constant-int-min', expression: 'direct-int-min', constant: true, chain: false },
  { id: 'runtime-byte-promotion', expression: 'byte-promotion', constant: false, chain: true },
  { id: 'runtime-char-complement', expression: 'complement', constant: false, chain: true },
] as const;
export function csharpLocalGraph(spec: typeof CSHARP_LOCAL_GRAPHS[number]) {
  const expression = CSHARP_GRAPH_EXPRESSIONS.find(row => row.id === spec.expression)!;
  const graph = csharpExpressionGraph(expression);
  const doc = graph.documents!['identity-int'];
  const entry = doc.nodes.find(node => node.data.kindId === 'function_entry')!;
  const ret = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
  const value = doc.edges.find(edge => edge.target === ret.id && edge.targetHandle === 'return_val')!;
  doc.edges = doc.edges.filter(edge => edge.id !== value.id && edge.data?.pinType !== 'execution');
  const edge = (source: string, sourceHandle: string, target: string, targetHandle: string, execution = false): GraphEdge => ({ id: `${source}-${sourceHandle}-${target}-${targetHandle}`, source, sourceHandle, target, targetHandle, type: 'vvs_standard_edge', data: { pinType: execution ? 'execution' : 'data_number' } });
  let previous = entry.id, initializer = { id: value.source, handle: value.sourceHandle! };
  const declarations = spec.chain ? ['@First', 'Second', 'Third'] : ['@First'];
  declarations.forEach((name, index) => {
    const id = `local-${index}`; const nodeId = `${id}-define`; const readonly = index === 0 && spec.constant;
    graph.variables.push({ kind: 'variable', id, name, type: 'data_number', classId: graph.functions[0].classId, binding: 'instance', visibility: 'private', graphTabId: 'identity-int', flags: { readonly } });
    const node: GraphNode = { id: nodeId, type: 'vvs_standard_node', position: { x: index * 350 + 280, y: 0 }, data: { label: `Declare ${name}`, category: 'Variables', kindId: 'var_define', inputs: [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'value', label: 'Value', type: 'data_number', required: true }], outputs: [{ id: 'exec_out', label: '', type: 'execution' }], inlineValues: {}, properties: { symbolId: id, name, type: 'data_number', nativeLocalStyle: readonly ? 'csharp-const' : index === 1 ? 'csharp-var' : 'csharp-typed', nativeType: index === 1 ? 'var' : expression.result, isConst: readonly, declarationKind: readonly ? 'const' : 'var', hasInitializer: true } } };
    const get: GraphNode = { id: `${id}-get`, type: 'vvs_standard_node', position: { x: index * 350 + 300, y: 180 }, data: { label: `Get ${name}`, category: 'Variables', kindId: 'variable_get', inputs: [], outputs: [{ id: 'val', label: 'Value', type: 'data_number' }], inlineValues: {}, graphBinding: { kind: 'variable_ref', symbolId: id }, properties: { symbolId: id, name, variableName: name } } };
    doc.nodes.push(node, get);
    doc.edges.push(edge(previous, 'exec_out', nodeId, 'exec_in', true), edge(initializer.id, initializer.handle, nodeId, 'value'));
    previous = nodeId; initializer = { id: get.id, handle: 'val' };
  });
  doc.edges.push(edge(previous, 'exec_out', ret.id, 'exec_in', true), edge(initializer.id, initializer.handle, ret.id, 'return_val'));
  return graph;
}
