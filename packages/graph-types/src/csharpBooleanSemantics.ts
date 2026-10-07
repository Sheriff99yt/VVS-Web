import { CSharpIntegerError, csharpIntegerBinary, type CSharpIntegerFact } from './csharpIntegerSemantics';

/** Transient predefined Boolean facts; never replace authored expression nodes. */
export interface CSharpBooleanFact { type: 'bool'; constant?: boolean }
export type CSharpComparisonOperator = '==' | '!=' | '<' | '<=' | '>' | '>=';
export function csharpIntegerComparison(operator: CSharpComparisonOperator, left: CSharpIntegerFact, right: CSharpIntegerFact): CSharpBooleanFact {
  if (!['==', '!=', '<', '<=', '>', '>='].includes(operator)) throw new CSharpIntegerError('COMPARISON_OPERATOR');
  // The predefined integral comparisons use the same operand applicability as
  // integral bitwise operators. This validates width/constant conversions without
  // introducing arithmetic overflow or changing the authored operands.
  csharpIntegerBinary('|', left, right);
  if (left.constant === undefined || right.constant === undefined) return { type: 'bool' };
  const a = BigInt(left.constant), b = BigInt(right.constant);
  return { type: 'bool', constant: operator === '==' ? a === b : operator === '!=' ? a !== b : operator === '<' ? a < b : operator === '<=' ? a <= b : operator === '>' ? a > b : a >= b };
}
export function csharpBooleanUnary(operand: CSharpBooleanFact): CSharpBooleanFact {
  if (operand.type !== 'bool' || operand.constant !== undefined && typeof operand.constant !== 'boolean') throw new CSharpIntegerError('BOOLEAN_TYPE');
  return operand.constant === undefined ? { type: 'bool' } : { type: 'bool', constant: !operand.constant };
}
export function csharpBooleanBinary(operator: '&&' | '||' | '&' | '|' | '^' | '==' | '!=', left: CSharpBooleanFact, right: CSharpBooleanFact): CSharpBooleanFact {
  csharpBooleanUnary(left); csharpBooleanUnary(right);
  if (!['&&', '||', '&', '|', '^', '==', '!='].includes(operator)) throw new CSharpIntegerError('BOOLEAN_OPERATOR');
  if (left.constant === undefined || right.constant === undefined) return { type: 'bool' };
  const a = left.constant, b = right.constant;
  return { type: 'bool', constant: ['&&', '&'].includes(operator) ? a && b : ['||', '|'].includes(operator) ? a || b : ['^', '!='].includes(operator) ? a !== b : a === b };
}
