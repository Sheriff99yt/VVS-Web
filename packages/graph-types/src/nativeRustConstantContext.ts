import type { NativeConstantExpression } from './nativeConstantExpressions';
import { NativeScalarFailure } from './nativeScalarContracts';

const integerType = (type?: string) => type && /^[iu](?:8|16|32|64|128|size)$/.test(type) ? type : undefined;
/** Derive Rust inference from authored suffixes/casts and the visible function result. */
export function nativeRustConstantContext(tree: NativeConstantExpression, returnType: string): NativeConstantExpression {
  const hint = (node: NativeConstantExpression): string | undefined => {
    if (node.kind === 'literal') return node.token.match(/([iu](?:8|16|32|64|128|size))$/)?.[1];
    if (node.kind === 'convert') return integerType(node.nativeType);
    if (node.kind === 'unary' || node.kind === 'group') return hint(node.operand);
    return !['==', '!=', '<', '<=', '>', '>='].includes(node.operator) ? hint(node.left) ?? hint(node.right) : undefined;
  };
  const visit = (node: NativeConstantExpression, context?: string): NativeConstantExpression => {
    if (node.kind === 'literal') {
      const expectedType = ['true', 'false'].includes(node.token) ? undefined : context;
      const actualType = expectedType ?? hint(node) ?? (['true', 'false'].includes(node.token) ? 'bool' : 'i32');
      if (node.options?.expectedType && node.options.expectedType !== actualType) throw new NativeScalarFailure('RUST_LITERAL_CONTEXT_NOT_ON_GRAPH', 'Saved literal context must follow authored native types and its visible function result.');
      return Object.freeze({ ...node, options: Object.freeze({ ...node.options, expectedType }) });
    }
    if (node.kind === 'group' || node.kind === 'unary') return Object.freeze({ ...node, operand: visit(node.operand, context) });
    if (node.kind === 'convert') return Object.freeze({ ...node, operand: visit(node.operand) });
    const comparison = ['==', '!=', '<', '<=', '>', '>='].includes(node.operator), shift = ['<<', '>>'].includes(node.operator);
    const operandType = (comparison ? undefined : integerType(context)) ?? hint(node.left) ?? hint(node.right);
    return Object.freeze({ ...node, left: visit(node.left, operandType), right: visit(node.right, shift ? hint(node.right) : operandType) });
  };
  return visit(tree, integerType(returnType));
}
