import saved from './csharp-signature.fixture.json';
import type { CodegenContext } from '../src/generate';
import { nativeExpressionPins, nativeExpressionOutputType, type NativeExpressionSettings, type CSharpIntegerType, type GraphNode, type GraphEdge } from '@vvs/graph-types';
export type CSharpExprSpec = { token: string } | { parameter: number } | { form: 'binary' | 'unary' | 'conversion' | 'overflow' | 'parentheses'; operands: CSharpExprSpec[]; operator?: string; target?: CSharpIntegerType; context?: 'checked' | 'unchecked' };
const literal = (token: string): CSharpExprSpec => ({ token });
const unary = (operator: string, value: CSharpExprSpec): CSharpExprSpec => ({ form: 'unary', operator, operands: [value] });
const parentheses = (value: CSharpExprSpec): CSharpExprSpec => ({ form: 'parentheses', operands: [value] });
const cast = (target: CSharpIntegerType, value: CSharpExprSpec): CSharpExprSpec => ({ form: 'conversion', target, operands: [value] });
const overflow = (context: 'checked' | 'unchecked', value: CSharpExprSpec): CSharpExprSpec => ({ form: 'overflow', context, operands: [value] });
const binary = (operator: string, left: CSharpExprSpec, right: CSharpExprSpec): CSharpExprSpec => ({ form: 'binary', operator, operands: [left, right] });
export const CSHARP_GRAPH_EXPRESSIONS: { id: string; parameters: CSharpIntegerType[]; result: CSharpIntegerType; expression: CSharpExprSpec }[] = [
  ...['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '>>>'].map(operator => ({ id: `runtime-${operator.replaceAll('<', 'l').replaceAll('>', 'r').replaceAll('/', 'div').replaceAll('%', 'rem').replaceAll('*', 'mul').replaceAll('&', 'and').replaceAll('|', 'or').replaceAll('^', 'xor').replaceAll('+', 'add').replaceAll('-', 'sub')}`, parameters: ['int'] as CSharpIntegerType[], result: 'int' as const, expression: binary(operator, { parameter: 0 }, literal('3')) })),
  { id: 'direct-int-min', parameters: [], result: 'int', expression: unary('-', literal('2147483648')) },
  { id: 'parenthesized-int-min', parameters: [], result: 'long', expression: unary('-', parentheses(literal('2147483648'))) },
  { id: 'direct-long-min', parameters: [], result: 'long', expression: unary('-', literal('9223372036854775808')) },
  { id: 'exact-ulong', parameters: [], result: 'ulong', expression: literal('0xffff_ffff_ffff_ffffUL') },
  { id: 'unchecked-overflow', parameters: [], result: 'int', expression: overflow('unchecked', binary('+', literal('2147483647'), literal('1'))) },
  { id: 'unchecked-cast', parameters: [], result: 'byte', expression: overflow('unchecked', cast('byte', literal('256'))) },
  { id: 'nested-context', parameters: [], result: 'int', expression: overflow('checked', binary('+', overflow('unchecked', binary('+', literal('2147483647'), literal('1'))), literal('1'))) },
  { id: 'byte-promotion', parameters: ['byte', 'byte'], result: 'int', expression: binary('+', { parameter: 0 }, { parameter: 1 }) },
  { id: 'checked-runtime-cast', parameters: ['long'], result: 'int', expression: overflow('checked', cast('int', { parameter: 0 })) },
  { id: 'char-cast', parameters: [], result: 'char', expression: cast('char', literal('65')) },
  { id: 'masked-shift', parameters: [], result: 'int', expression: overflow('checked', binary('<<', literal('1'), literal('33'))) },
  { id: 'unsigned-shift', parameters: [], result: 'int', expression: binary('>>>', unary('-', literal('1')), literal('1')) },
  { id: 'composed-promotion', parameters: ['byte'], result: 'long', expression: overflow('checked', cast('long', binary('*', binary('+', { parameter: 0 }, literal('1')), literal('10')))) },
  { id: 'complement', parameters: ['char'], result: 'int', expression: unary('~', { parameter: 0 }) },
];
export function csharpExpressionGraph(spec: typeof CSHARP_GRAPH_EXPRESSIONS[number]): CodegenContext {
  const graph = structuredClone(saved) as CodegenContext;
  const id = 'identity-int'; graph.functions = graph.functions.filter(fn => fn.id === id);
  graph.nodes = graph.nodes.filter(node => node.id === 'class' || node.id.startsWith(id));
  const ids = new Set(graph.nodes.map(node => node.id)); graph.edges = graph.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target));
  const edge = (source: string, sourceHandle: string, target: string, targetHandle: string, pinType = 'data_any'): GraphEdge => ({ id: `${source}-${sourceHandle}-${target}-${targetHandle}`, source, target, sourceHandle, targetHandle, type: 'vvs_standard_edge', data: { pinType: pinType as 'data_any' } });
  graph.edges.push(edge('class', 'exec_out', id + '-declare', 'exec_in', 'execution'));
  const body = structuredClone(saved.documents['identity-int']) as CodegenContext['documents'] extends Record<string, infer V> | undefined ? V : never;
  graph.documents = { [id]: body };
  const fn = graph.functions[0]; fn.name = 'Evaluate'; fn.overloads[0].parameters = spec.parameters.map((_, index) => ({ id: `p${index}`, label: `Value${index}`, type: 'data_number' }));
  const definition = graph.nodes.find(node => node.id === id + '-define')!;
  definition.data.properties!.nativeParameters = spec.parameters.map((nativeType, index) => ({ id: `p${index}`, name: `Value${index}`, mode: 'positional', nativeType }));
  definition.data.properties!.nativeReturnType = spec.result;
  const entry = body.nodes[0]; entry.data.outputs = [{ id: 'exec_out', label: '', type: 'execution' }, ...spec.parameters.map((_, index) => ({ id: `p${index}`, label: `Value${index}`, type: 'data_number' as const }))];
  body.edges = body.edges.filter(edge => edge.data?.pinType === 'execution');
  let ordinal = 0;
  const build = (expression: CSharpExprSpec): { id: string; handle: string } => {
    if ('parameter' in expression) return { id: entry.id, handle: `p${expression.parameter}` };
    const token = 'token' in expression;
    const settings: NativeExpressionSettings = { language: 'csharp', domain: 'csharp-integer', form: token ? 'scalar' : expression.form, payload: token ? expression.token : expression.context ?? '', count: token ? 0 : expression.operands.length, name: '', operator: token ? '' : expression.operator ?? '', targetType: token ? '' : expression.target ?? '' };
    const node: GraphNode = { id: `expression-${ordinal++}`, type: 'vvs_standard_node', position: { x: ordinal * 220, y: 180 }, data: { label: token ? expression.token : expression.form, category: 'Native Values', kindId: token ? 'expr_native_literal' : 'expr_native_operator', inputs: nativeExpressionPins(settings), outputs: [{ id: 'result', label: 'Value', type: nativeExpressionOutputType(settings) }], inlineValues: {}, properties: { nativeLanguage: settings.language, nativeDomain: settings.domain, nativeForm: settings.form, payload: settings.payload, operandCount: settings.count, operator: settings.operator, nativeTargetType: settings.targetType } } };
    body.nodes.push(node);
    if (!token) for (const [index, operand] of expression.operands.entries()) { const value = build(operand); body.edges.push(edge(value.id, value.handle, node.id, `operand-${index}`)); }
    return { id: node.id, handle: 'result' };
  };
  const value = build(spec.expression); body.edges.push(edge(value.id, value.handle, id + '-return', 'return_val'));
  return graph;
}
