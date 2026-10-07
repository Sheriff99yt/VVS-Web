/** Transient predefined C# integral facts. Authored tokens remain the source of truth. */
export const CSHARP_INTEGER_TYPES = ['sbyte', 'byte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong', 'char'] as const;
export type CSharpIntegerType = typeof CSHARP_INTEGER_TYPES[number];
export interface CSharpIntegerFact { type: CSharpIntegerType; constant?: string }
export type CSharpOverflowContext = 'default' | 'checked' | 'unchecked';
export type CSharpIntegerOperator = '+' | '-' | '*' | '/' | '%' | '&' | '|' | '^' | '<<' | '>>' | '>>>';
export class CSharpIntegerError extends Error {
  constructor(code: string) { super(`NATIVE_CSHARP_INTEGER_${code}`); }
}
const widths: Record<CSharpIntegerType, [number, boolean]> = {
  sbyte: [8, true], byte: [8, false], short: [16, true], ushort: [16, false],
  int: [32, true], uint: [32, false], long: [64, true], ulong: [64, false], char: [16, false],
};
const widening: Record<CSharpIntegerType, readonly CSharpIntegerType[]> = {
  sbyte: ['short', 'int', 'long'], byte: ['short', 'ushort', 'int', 'uint', 'long', 'ulong'],
  short: ['int', 'long'], ushort: ['int', 'uint', 'long', 'ulong'], int: ['long'],
  uint: ['long', 'ulong'], long: [], ulong: [], char: ['ushort', 'int', 'uint', 'long', 'ulong'],
};
export function csharpIntegerDescriptor(type: CSharpIntegerType) {
  if (!Object.hasOwn(widths, type)) throw new CSharpIntegerError('TYPE');
  const [bits, signed] = widths[type];
  return { bits, signed, min: signed ? -(BigInt(1) << BigInt(bits - 1)) : BigInt(0), max: (BigInt(1) << BigInt(signed ? bits - 1 : bits)) - BigInt(1) };
}
function valueOf(fact: CSharpIntegerFact): bigint | undefined {
  const descriptor = csharpIntegerDescriptor(fact.type);
  if (fact.constant === undefined) return undefined;
  if (typeof fact.constant !== 'string' || fact.constant.length > 21 || !/^(?:0|-?[1-9][0-9]*)$/.test(fact.constant)) throw new CSharpIntegerError('CONSTANT');
  const value = BigInt(fact.constant);
  if (value < descriptor.min || value > descriptor.max) throw new CSharpIntegerError('OVERFLOW');
  return value;
}
function contextChecked(context: CSharpOverflowContext): boolean {
  if (!['default', 'checked', 'unchecked'].includes(context)) throw new CSharpIntegerError('CONTEXT');
  return context !== 'unchecked'; // Default compile-time constant evaluation is checked.
}
function result(type: CSharpIntegerType, value: bigint, checked: boolean): CSharpIntegerFact {
  const { min, max, bits } = csharpIntegerDescriptor(type);
  if (checked && (value < min || value > max)) throw new CSharpIntegerError('OVERFLOW');
  const modulo = BigInt(1) << BigInt(bits);
  const unsigned = ((value % modulo) + modulo) % modulo;
  return { type, constant: (unsigned > max ? unsigned - modulo : unsigned).toString() };
}
/** Exactly one unsigned lexer token. Signs/parentheses belong to visible expressions. */
export function csharpIntegerLiteral(token: string): CSharpIntegerFact {
  if (typeof token !== 'string' || token.length > 1024) throw new CSharpIntegerError('TOKEN_BUDGET');
  const match = token.match(/^(0[xX]_*[0-9a-fA-F](?:[0-9a-fA-F_]*[0-9a-fA-F])?|0[bB]_*[01](?:[01_]*[01])?|[0-9](?:[0-9_]*[0-9])?)([uU][lL]?|[lL][uU]?)?$/);
  if (!match) throw new CSharpIntegerError('TOKEN');
  const clean = match[1].replaceAll('_', '');
  const value = BigInt(/^0[xXbB]/.test(clean) ? clean : clean.replace(/^0+(?=[0-9])/, ''));
  const suffix = (match[2] ?? '').toLowerCase();
  const candidates: CSharpIntegerType[] = suffix.includes('u') && suffix.includes('l') ? ['ulong'] : suffix === 'u' ? ['uint', 'ulong'] : suffix === 'l' ? ['long', 'ulong'] : ['int', 'uint', 'long', 'ulong'];
  const type = candidates.find(type => value <= csharpIntegerDescriptor(type).max);
  if (!type) throw new CSharpIntegerError('LITERAL_OVERFLOW');
  return { type, constant: value.toString() };
}
function implicitlyConverts(fact: CSharpIntegerFact, target: CSharpIntegerType): boolean {
  const value = valueOf(fact), descriptor = csharpIntegerDescriptor(target);
  if (fact.type === target || widening[fact.type].includes(target)) return true;
  const constantConversion = fact.type === 'int' && ['sbyte', 'byte', 'short', 'ushort', 'uint', 'ulong'].includes(target) || fact.type === 'long' && target === 'ulong';
  return constantConversion && value !== undefined && value >= descriptor.min && value <= descriptor.max;
}
export function csharpIntegerAssignable(fact: CSharpIntegerFact, target: CSharpIntegerType): CSharpIntegerFact {
  if (!implicitlyConverts(fact, target)) throw new CSharpIntegerError('ASSIGNMENT');
  return fact.constant === undefined ? { type: target } : { type: target, constant: fact.constant };
}
export function csharpIntegerConvert(fact: CSharpIntegerFact, target: CSharpIntegerType, context: CSharpOverflowContext = 'default'): CSharpIntegerFact {
  const value = valueOf(fact); csharpIntegerDescriptor(target);
  const checked = contextChecked(context);
  return value === undefined ? { type: target } : result(target, value, checked);
}
function promoted(fact: CSharpIntegerFact, negate = false): CSharpIntegerType {
  valueOf(fact);
  if (negate && fact.type === 'ulong') throw new CSharpIntegerError('UNARY_TYPE');
  return negate && fact.type === 'uint' ? 'long' : ['sbyte', 'byte', 'short', 'ushort', 'char'].includes(fact.type) ? 'int' : fact.type;
}
export function csharpIntegerUnary(operator: '+' | '-' | '~', operand: CSharpIntegerFact, context: CSharpOverflowContext = 'default'): CSharpIntegerFact {
  if (!['+', '-', '~'].includes(operator)) throw new CSharpIntegerError('OPERATOR');
  const checked = contextChecked(context), type = promoted(operand, operator === '-'), value = valueOf(operand);
  return value === undefined ? { type } : result(type, operator === '+' ? value : operator === '-' ? -value : ~value, operator === '~' ? false : checked);
}
/** Only for an authored unary minus directly followed by this integer token. */
export function csharpIntegerNegatedLiteral(token: string, context: CSharpOverflowContext = 'default'): CSharpIntegerFact {
  const fact = csharpIntegerLiteral(token); contextChecked(context);
  if (!/[uUlL]$/.test(token) && fact.constant === '2147483648') return { type: 'int', constant: '-2147483648' };
  if (!/[uU]/.test(token) && fact.constant === '9223372036854775808') return { type: 'long', constant: '-9223372036854775808' };
  return csharpIntegerUnary('-', fact, context);
}
export function csharpIntegerBinary(operator: CSharpIntegerOperator, left: CSharpIntegerFact, right: CSharpIntegerFact, context: CSharpOverflowContext = 'default'): CSharpIntegerFact {
  if (!['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '>>>'].includes(operator)) throw new CSharpIntegerError('OPERATOR');
  const checked = contextChecked(context), a = valueOf(left), b = valueOf(right);
  const shift = ['<<', '>>', '>>>'].includes(operator);
  let type: CSharpIntegerType;
  if (shift) {
    type = promoted(left);
    if (!implicitlyConverts(right, 'int')) throw new CSharpIntegerError('SHIFT_TYPE');
  } else {
    // Predefined operator applicability includes constant-expression conversions.
    const selected = (['int', 'uint', 'long', 'ulong'] as const).find(candidate => implicitlyConverts(left, candidate) && implicitlyConverts(right, candidate));
    if (!selected) throw new CSharpIntegerError('BINARY_TYPE');
    type = selected;
  }
  if ((operator === '/' || operator === '%') && b === BigInt(0) && a !== undefined) throw new CSharpIntegerError('DIVIDE_ZERO');
  if (a === undefined || b === undefined) return { type };
  const descriptor = csharpIntegerDescriptor(type);
  const count = shift ? b & BigInt(descriptor.bits - 1) : BigInt(0);
  let value: bigint;
  switch (operator) {
    case '+': value = a + b; break;
    case '-': value = a - b; break;
    case '*': value = a * b; break;
    case '/': value = a / b; break;
    case '%': value = a % b; break;
    case '&': value = a & b; break;
    case '|': value = a | b; break;
    case '^': value = a ^ b; break;
    case '<<': value = a << count; break;
    case '>>': value = a >> count; break;
    case '>>>': value = (a & ((BigInt(1) << BigInt(descriptor.bits)) - BigInt(1))) >> count; break;
  }
  return result(type, value, shift || ['&', '|', '^'].includes(operator) ? false : checked);
}
