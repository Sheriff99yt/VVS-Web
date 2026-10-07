export type NativeInferredExpression =
  | { kind: 'parameter'; nativeType: string }
  | { kind: 'local'; nativeType: string }
  | { kind: 'literal'; token: string }
  | { kind: 'convert'; nativeType: string; operand: NativeInferredExpression }
  | { kind: 'group'; operand: NativeInferredExpression }
  | { kind: 'unary'; operand: NativeInferredExpression }
  | { kind: 'binary'; operator: string; left: NativeInferredExpression; right: NativeInferredExpression };

/** No stored literal/type hints: Rust's later-use numeric constraints are a
 * separate contract. This predicate is shared by source and saved graph reads. */
export function fixedNativeRustInitializer(tree: NativeInferredExpression): boolean {
  let visits = 0;
  const hint = (node: NativeInferredExpression, depth = 0): string | undefined => {
    if (++visits > 16384 || depth > 128) return;
    if (node.kind === 'parameter' || node.kind === 'local' || node.kind === 'convert') return node.nativeType;
    if (node.kind === 'literal') return ['true', 'false'].includes(node.token) ? 'bool' : node.token.match(/([iu](?:8|16|32|64|128|size))$/)?.[1];
    if (node.kind === 'binary') return ['==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(node.operator) ? 'bool' : hint(node.left, depth + 1) ?? hint(node.right, depth + 1);
    return hint(node.operand, depth + 1);
  };
  const fixed = (node: NativeInferredExpression, context?: string, depth = 0): boolean => {
    if (++visits > 16384 || depth > 128) return false;
    if (node.kind === 'parameter' || node.kind === 'local') return true;
    if (node.kind === 'literal') return !!hint(node, depth) || !!context && context !== 'bool';
    if (node.kind === 'convert') return fixed(node.operand, undefined, depth + 1);
    if (node.kind === 'group') return fixed(node.operand, context, depth + 1);
    if (node.kind === 'unary') return fixed(node.operand, context ?? hint(node.operand, depth + 1), depth + 1);
    const comparison = ['==', '!=', '<', '<=', '>', '>='].includes(node.operator);
    const expected = (comparison ? undefined : context) ?? hint(node.left, depth + 1) ?? hint(node.right, depth + 1);
    return fixed(node.left, expected, depth + 1) && fixed(node.right, ['<<', '>>'].includes(node.operator) ? hint(node.right, depth + 1) : expected, depth + 1);
  };
  return fixed(tree);
}
