import type { NativeConstantExpression } from './nativeConstantExpressions';
import { nativeConstantTreeDomain, NativeConstantGraphFailure } from './nativeConstantGraphs';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import type { GraphDocument } from './symbols';
import type { GraphNode } from './nodes';

/** Visible native constructs only. The emitted graph must still pass semantic/context validation. */
export function buildNativeConstantGraph(expression: NativeConstantExpression, language: NativeScalarLanguage, prefix = 'native-constant', onNode?: (node: GraphNode, expression: NativeConstantExpression) => void): { document: GraphDocument; rootId: string } {
  const document: GraphDocument = { nodes: [], edges: [] }, active = new Set<object>();
  const add = (tree: NativeConstantExpression, depth: number): string => {
    if (depth > 128 || document.nodes.length >= 4096 || active.has(tree)) throw new NativeConstantGraphFailure('BUDGET_OR_CYCLE', prefix);
    if (tree.kind === 'literal' && tree.options?.negated) return add({ kind: 'unary', operator: '-', operand: { ...tree, options: { ...tree.options, negated: false } }, directLiteral: true }, depth + 1);
    if (language === 'gdscript' && tree.kind === 'unary' && tree.operator === '-' && tree.operand.kind === 'literal' && tree.directLiteral !== true) return add({ ...tree, operand: { kind: 'group', operand: tree.operand } }, depth + 1);
    active.add(tree);
    try {
      const children = tree.kind === 'binary' ? [tree.left, tree.right] : tree.kind === 'literal' ? [] : [tree.operand];
      const ids = children.map(child => add(child, depth + 1));
      if (document.nodes.length >= 4096) throw new NativeConstantGraphFailure('BUDGET_OR_CYCLE', prefix);
      const id = `${prefix}-${document.nodes.length}`, domain = nativeConstantTreeDomain(tree, language);
      const form = tree.kind === 'literal' ? 'scalar' : tree.kind === 'group' ? 'parentheses' : tree.kind === 'convert' ? 'conversion' : tree.kind;
      document.nodes.push({ id, type: 'vvs_standard_node', position: { x: depth * 220, y: document.nodes.length * 80 }, data: {
        label: form, category: 'Native Values', kindId: tree.kind === 'literal' ? 'expr_native_literal' : 'expr_native_operator',
        inputs: ids.map((_, index) => ({ id: `operand-${index}`, label: `Operand ${index + 1}`, type: 'data_any', required: true })),
        outputs: [{ id: 'result', label: 'Result', type: domain === 'native-bool' ? 'data_boolean' : 'data_number' }], inlineValues: {},
        properties: { nativeLanguage: language, nativeForm: form, nativeDomain: domain, operandCount: ids.length,
          ...(tree.kind === 'literal' ? { payload: tree.token, ...(tree.options?.expectedType ? { nativeLiteralType: tree.options.expectedType } : {}) } : {}),
          ...(tree.kind === 'convert' ? { nativeTargetType: tree.nativeType } : {}), ...('operator' in tree ? { operator: tree.operator } : {}),
        },
      } });
      onNode?.(document.nodes[document.nodes.length - 1], tree);
      ids.forEach((source, index) => document.edges.push({ id: `${prefix}-edge-${document.edges.length}`, source, sourceHandle: 'result', target: id, targetHandle: `operand-${index}`, data: { pinType: document.nodes.find(node => node.id === source)!.data.outputs[0].type } }));
      return id;
    } finally { active.delete(tree); }
  };
  return { document, rootId: add(expression, 0) };
}
