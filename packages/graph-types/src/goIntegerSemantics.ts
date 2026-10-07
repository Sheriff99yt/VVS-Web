/** Transient Go integer evidence. Persist literal tokens as strings, never JS Numbers/BigInts. */
export const GO_INTEGER_TYPES = ['int', 'uint', 'uintptr', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'byte', 'rune'] as const;
export type GoIntegerType = typeof GO_INTEGER_TYPES[number];
export type GoWordBits = 32 | 64;
export interface GoIntegerFact { type: GoIntegerType | 'untyped-integer'; constant?: string }
export type GoIntegerOperator = '+' | '-' | '*' | '/' | '%' | '&' | '|' | '^' | '&^' | '<<' | '>>';
export const GO_CONSTANT_SHIFT_LIMIT = 1074; // Pinned go/types constant-expression limit.
export const GO_CONSTANT_BITS = 512; // Pinned gc/go-types fixture profile, not every implementation.
export class GoIntegerError extends Error {
  constructor(code: string) { super(`NATIVE_GO_INTEGER_${code}`); }
}
export function canonicalGoIntegerType(type: GoIntegerType): Exclude<GoIntegerType, 'byte' | 'rune'> {
  return type === 'byte' ? 'uint8' : type === 'rune' ? 'int32' : type;
}
export function goIntegerDescriptor(type: GoIntegerType, wordBits: GoWordBits) {
  if (![32, 64].includes(wordBits) || !GO_INTEGER_TYPES.includes(type)) throw new GoIntegerError('TYPE');
  const canonical = canonicalGoIntegerType(type);
  const signed = canonical.startsWith('int');
  const bits = ['int', 'uint', 'uintptr'].includes(canonical) ? wordBits : Number(canonical.replace(/^(?:u?int)/, ''));
  return { canonical, signed, bits, min: signed ? -(BigInt(1) << BigInt(bits - 1)) : BigInt(0), max: (BigInt(1) << BigInt(signed ? bits - 1 : bits)) - BigInt(1) };
}
function bounded(value: bigint): bigint {
  if ((value < BigInt(0) ? -value : value).toString(2).length > GO_CONSTANT_BITS) throw new GoIntegerError('CONSTANT_BUDGET');
  return value;
}
function valueOf(fact: GoIntegerFact): bigint | undefined {
  if (fact.constant === undefined) return undefined;
  if (fact.constant.length > 160 || !/^(?:0|-?[1-9][0-9]*)$/.test(fact.constant)) throw new GoIntegerError('CONSTANT');
  return bounded(BigInt(fact.constant));
}
/** Exactly one lexer-reviewed integer token; unary signs belong to their own operator nodes. */
export function goIntegerLiteral(token: string): GoIntegerFact {
  if (token.length > 1024) throw new GoIntegerError('CONSTANT_BUDGET');
  const decimal = /^(?:0|[1-9](?:_?[0-9])*)$/;
  const prefixed = /^0(?:[bB]_?[01](?:_?[01])*|[oO]_?[0-7](?:_?[0-7])*|[xX]_?[0-9a-fA-F](?:_?[0-9a-fA-F])*|_?[0-7](?:_?[0-7])*)$/;
  if (!decimal.test(token) && !prefixed.test(token)) throw new GoIntegerError('TOKEN');
  const clean = token.replaceAll('_', '');
  const encoded = /^0[0-7]+$/.test(clean) && clean.length > 1 ? `0o${clean.slice(1)}` : clean;
  return { type: 'untyped-integer', constant: bounded(BigInt(encoded)).toString() };
}
function checked(fact: GoIntegerFact, wordBits: GoWordBits): GoIntegerFact {
  if (![32, 64].includes(wordBits)) throw new GoIntegerError('WORD_SIZE');
  if (fact.type !== 'untyped-integer' && !GO_INTEGER_TYPES.includes(fact.type)) throw new GoIntegerError('TYPE');
  const value = valueOf(fact);
  if (fact.type === 'untyped-integer' && value === undefined) throw new GoIntegerError('UNTYPED_NONCONSTANT');
  if (fact.type !== 'untyped-integer') {
    const bounds = goIntegerDescriptor(fact.type, wordBits);
    if (value !== undefined && (value < bounds.min || value > bounds.max)) throw new GoIntegerError('OVERFLOW');
  }
  return { ...fact };
}
/** Assignment checks representability and type identity; it never introduces a conversion. */
export function goIntegerAssignable(fact: GoIntegerFact, target: GoIntegerType, wordBits: GoWordBits): GoIntegerFact {
  checked(fact, wordBits);
  const descriptor = goIntegerDescriptor(target, wordBits);
  if (fact.type !== 'untyped-integer' && canonicalGoIntegerType(fact.type) !== descriptor.canonical) throw new GoIntegerError('TYPE_MISMATCH');
  return checked({ ...fact, type: target }, wordBits);
}
export function goDefaultInteger(fact: GoIntegerFact, wordBits: GoWordBits): GoIntegerFact {
  return fact.type === 'untyped-integer' ? goIntegerAssignable(fact, 'int', wordBits) : checked(fact, wordBits);
}
export function goIntegerUnary(operator: '+' | '-' | '^', operand: GoIntegerFact, wordBits: GoWordBits): GoIntegerFact {
  checked(operand, wordBits);
  if (!['+', '-', '^'].includes(operator)) throw new GoIntegerError('OPERATOR');
  const value = valueOf(operand);
  if (value === undefined) return { type: operand.type };
  let result = operator === '+' ? value : operator === '-' ? -value : ~value;
  if (operator === '^' && operand.type !== 'untyped-integer') {
    const descriptor = goIntegerDescriptor(operand.type, wordBits);
    if (!descriptor.signed) result &= descriptor.max;
  }
  return checked({ type: operand.type, constant: bounded(result).toString() }, wordBits);
}
export function goIntegerBinary(operator: GoIntegerOperator, left: GoIntegerFact, right: GoIntegerFact, wordBits: GoWordBits): GoIntegerFact {
  if (!['+', '-', '*', '/', '%', '&', '|', '^', '&^', '<<', '>>'].includes(operator)) throw new GoIntegerError('OPERATOR');
  checked(left, wordBits); checked(right, wordBits);
  const shift = ['<<', '>>'].includes(operator);
  let type = left.type;
  if (!shift) {
    type = left.type === 'untyped-integer' ? right.type : left.type;
    if (type !== 'untyped-integer') { goIntegerAssignable(left, type, wordBits); goIntegerAssignable(right, type, wordBits); }
  } else if (right.constant === undefined && type === 'untyped-integer') type = goDefaultInteger(left, wordBits).type;
  const a = valueOf(left), b = valueOf(right);
  if (['/', '%'].includes(operator) && b === BigInt(0)) throw new GoIntegerError('DIVIDE_ZERO');
  if (shift && b !== undefined && b < BigInt(0)) throw new GoIntegerError('NEGATIVE_SHIFT');
  if (shift && right.type === 'untyped-integer') goIntegerAssignable(right, 'uint', wordBits);
  if (shift && a !== undefined && b !== undefined && b > BigInt(GO_CONSTANT_SHIFT_LIMIT)) throw new GoIntegerError('CONSTANT_SHIFT_LIMIT');
  if (a === undefined || b === undefined) return checked({ type }, wordBits); // Runtime overflow stays in native Go.
  let result: bigint;
  switch (operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = a / b; break;
    case '%': result = a % b; break;
    case '&': result = a & b; break;
    case '|': result = a | b; break;
    case '^': result = a ^ b; break;
    case '&^': result = a & ~b; break;
    case '<<': result = a << b; break;
    case '>>': result = a >> b; break;
    default: throw new GoIntegerError('OPERATOR');
  }
  return checked({ type, constant: bounded(result).toString() }, wordBits);
}
