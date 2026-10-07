import type { GraphDocument } from './symbols';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { evaluateNativeConstant, type NativeConstantExpression, type NativeConstantFact } from './nativeConstantExpressions';
import { nativeRustConstantContext } from './nativeRustConstantContext';

/** Structural pin domain, independently checked against whole-tree native facts. */
export function nativeConstantTreeDomain(tree: NativeConstantExpression, language: NativeScalarLanguage): 'native-bool' | 'native-integer' {
  if (tree.kind === 'literal') return ['true', 'false'].includes(tree.token) ? 'native-bool' : 'native-integer';
  if (tree.kind === 'convert') return tree.nativeType === 'bool' ? 'native-bool' : 'native-integer';
  if (tree.kind === 'group') return nativeConstantTreeDomain(tree.operand, language);
  if (tree.kind === 'unary') return tree.operator === '!' && (language !== 'rust' || nativeConstantTreeDomain(tree.operand, language) === 'native-bool') ? 'native-bool' : 'native-integer';
  return ['==', '!=', '<', '<=', '>', '>='].includes(tree.operator) || language === 'rust' && ['&', '|', '^'].includes(tree.operator) && nativeConstantTreeDomain(tree.left, language) === 'native-bool' && nativeConstantTreeDomain(tree.right, language) === 'native-bool' ? 'native-bool' : 'native-integer';
}

export class NativeConstantGraphFailure extends Error {
  constructor(public readonly code: string, public readonly nodeId: string) {
    super(`NATIVE_CONSTANT_GRAPH_${code}: ${nodeId}`);
  }
}

export interface NativeConstantGraphAnalysis {
  readonly tree: NativeConstantExpression;
  readonly fact: Readonly<NativeConstantFact>;
  readonly nodeIds: readonly string[];
  readonly graphAdmission: 'blocked';
}

/** Reconstruct from saved nodes/edges. No cached facts, inline operands or parser trees. */
export function analyzeNativeConstantGraph(doc: GraphDocument, rootId: string, language: NativeScalarLanguage, visibleReturnType?: string): Readonly<NativeConstantGraphAnalysis> {
  const fail = (code: string, nodeId: string): never => { throw new NativeConstantGraphFailure(code, nodeId); };
  if (!['cpp', 'rust', 'gdscript'].includes(language)) fail('PROFILE', rootId);
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  if (nodes.size !== doc.nodes.length || new Set(doc.edges.map(edge => edge.id)).size !== doc.edges.length) fail('DUPLICATE_ID', rootId);
  const active = new Set<string>(), used = new Set<string>();
  const incomingByNode = new Map<string, typeof doc.edges>();
  for (const edge of doc.edges) {
    const incoming = incomingByNode.get(edge.target) ?? [];
    incoming.push(edge); incomingByNode.set(edge.target, incoming);
  }
  let count = 0;
  const build = (id: string, depth: number): NativeConstantExpression => {
    if (active.has(id)) return fail('CYCLE', id);
    if (depth > 128 || ++count > 4096) return fail('BUDGET', id);
    const node = nodes.get(id);
    if (!node) return fail('NODE_MISSING', id);
    const data = node.data, properties = data.properties ?? {};
    if (properties.nativeLanguage !== language) return fail('LANGUAGE', id);
    const form = properties.nativeForm;
    const arity = form === 'scalar' ? 0 : form === 'binary' ? 2 : ['unary', 'parentheses', 'conversion'].includes(String(form)) ? 1 : -1;
    if (arity < 0 || properties.operandCount !== arity) return fail('FORM_OR_ARITY', id);
    if (data.kindId !== (form === 'scalar' ? 'expr_native_literal' : 'expr_native_operator')) return fail('KIND', id);
    // Old analysis fixtures retain conservative pins; admitted settings carry a typed domain.
    const domain = properties.nativeDomain;
    if (domain !== undefined && !['native-integer', 'native-bool'].includes(String(domain))) return fail('DOMAIN', id);
    const outputType = domain === 'native-bool' ? 'data_boolean' : domain === 'native-integer' ? 'data_number' : 'data_any';
    if (data.outputs.length !== 1 || data.outputs[0].id !== 'result' || data.outputs[0].type !== outputType) return fail('OUTPUT', id);
    if (data.inputs.length !== arity || data.inputs.some((pin, index) => pin.id !== `operand-${index}` || pin.type !== 'data_any')) return fail('INPUT', id);
    if (Object.keys(data.inlineValues ?? {}).length || data.graphBinding) return fail('HIDDEN_OPERAND', id);
    const incoming = incomingByNode.get(id) ?? [];
    if (incoming.length !== arity) return fail('WIRING', id);
    if (incoming.some(edge => !data.inputs.some(pin => pin.id === edge.targetHandle))) return fail('WIRING', id);
    active.add(id); used.add(id);
    const operand = (index: number): NativeConstantExpression => {
      const edges = incoming.filter(edge => edge.targetHandle === `operand-${index}`);
      const sourceType = nodes.get(edges[0]?.source)?.data.outputs.find(pin => pin.id === 'result')?.type;
      if (edges.length !== 1 || edges[0].sourceHandle !== 'result' || edges[0].data && edges[0].data.pinType !== sourceType) return fail('OPERAND', id);
      return build(edges[0].source, depth + 1);
    };
    try {
      let tree: NativeConstantExpression;
      if (form === 'scalar') {
        if (typeof properties.payload !== 'string') return fail('TOKEN', id);
        if (properties.nativeLiteralType !== undefined && (language !== 'rust' || typeof properties.nativeLiteralType !== 'string')) return fail('LITERAL_CONTEXT', id);
        tree = { kind: 'literal', token: properties.payload, ...(properties.nativeLiteralType !== undefined ? { options: Object.freeze({ expectedType: properties.nativeLiteralType as string }) } : {}) };
      } else if (form === 'parentheses') tree = { kind: 'group', operand: operand(0) };
      else if (form === 'conversion') {
        if (typeof properties.nativeTargetType !== 'string') return fail('CONVERSION', id);
        tree = { kind: 'convert', nativeType: properties.nativeTargetType, operand: operand(0) };
      } else {
        if (typeof properties.operator !== 'string') return fail('OPERATOR', id);
        if (form === 'binary') tree = { kind: 'binary', operator: properties.operator, left: operand(0), right: operand(1) };
        else {
          const child = operand(0);
          // Native direct-negative spelling is a structural property, never trusted cached evidence.
          tree = { kind: 'unary', operator: properties.operator, operand: child, directLiteral: child.kind === 'literal' };
        }
      }
      if (domain !== undefined && domain !== nativeConstantTreeDomain(tree, language)) return fail('DOMAIN', id);
      return Object.freeze(tree);
    } finally { active.delete(id); }
  };
  const savedTree = build(rootId, 0);
  const tree = language === 'rust' && visibleReturnType !== undefined ? nativeRustConstantContext(savedTree, visibleReturnType) : savedTree;
  return Object.freeze({ tree, fact: evaluateNativeConstant(tree, language), nodeIds: Object.freeze([...used]), graphAdmission: 'blocked' });
}
