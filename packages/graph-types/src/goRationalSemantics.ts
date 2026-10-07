/** Transient exact Go constant evidence. Persist original tokens, never fractions. */
export interface GoRationalFact<T extends 'untyped-float' | 'float32' | 'float64' = 'untyped-float' | 'float32' | 'float64'> { type: T; constant?: string }
export class GoRationalError extends Error {
  constructor(code: string) { super(`NATIVE_GO_RATIONAL_${code}`); }
}
type Fraction = { n: bigint; d: bigint };
const zero = BigInt(0), one = BigInt(1), two = BigInt(2);
const bitLength = (x: bigint) => (x < zero ? -x : x).toString(2).length;
function fraction(n: bigint, d = one): Fraction {
  if (d === zero) throw new GoRationalError('DIVIDE_ZERO');
  if (d < zero) { n = -n; d = -d; }
  let a = n < zero ? -n : n, b = d;
  while (b !== zero) { const remainder = a % b; a = b; b = remainder; }
  n /= a; d /= a;
  // go/constant switches to 512-bit big.Float outside this fraction domain.
  if (bitLength(n) >= 4096 || bitLength(d) >= 4096) throw new GoRationalError('BIG_FLOAT_PREREQUISITE');
  return { n, d };
}
const encode = ({ n, d }: Fraction): string => d === one ? String(n) : `${n}/${d}`;
function decode(value: string): Fraction {
  if (value.length > 2500 || !/^(?:0|-?[1-9][0-9]*)(?:\/[1-9][0-9]*)?$/.test(value)) throw new GoRationalError('CONSTANT');
  const [n, d = '1'] = value.split('/'); return fraction(BigInt(n), BigInt(d));
}
export function goFloatLiteral(token: string): GoRationalFact<'untyped-float'> {
  if (token.length > 1024) throw new GoRationalError('TOKEN_BUDGET');
  const digits = '[0-9](?:_?[0-9])*', hex = '[0-9a-fA-F](?:_?[0-9a-fA-F])*';
  const decimal = new RegExp(String.raw`^(?:(?:${digits}\.(?:${digits})?|\.${digits})(?:[eE][+-]?${digits})?|${digits}[eE][+-]?${digits})$`);
  const hexadecimal = new RegExp(String.raw`^0[xX]_?(?:${hex}(?:\.(?:${hex})?)?|\.${hex})[pP][+-]?${digits}$`);
  const isHex = hexadecimal.test(token);
  if (!isHex && !decimal.test(token)) throw new GoRationalError('TOKEN');
  const clean = token.replaceAll('_', '');
  const [mantissa, exponentText = '0'] = clean.split(isHex ? /[pP]/ : /[eE]/);
  if (exponentText.replace(/^[+-]/, '').length > 5) throw new GoRationalError('BIG_FLOAT_PREREQUISITE');
  let exponent = Number(exponentText);
  const parts = (isHex ? mantissa.slice(2) : mantissa).split('.');
  const combined = parts.join('');
  let n = BigInt(isHex ? `0x${combined}` : combined), d = one;
  // A zero token needs no enormous exponent allocation.
  if (n === zero) return { type: 'untyped-float', constant: '0' };
  exponent -= (parts[1]?.length ?? 0) * (isHex ? 4 : 1);
  if (Math.abs(exponent) > (isHex ? 4095 : 1233)) throw new GoRationalError('BIG_FLOAT_PREREQUISITE');
  const scale = BigInt(isHex ? 2 : 10) ** BigInt(Math.abs(exponent));
  if (exponent < 0) d = scale; else n *= scale;
  return { type: 'untyped-float', constant: encode(fraction(n, d)) };
}
export function goRationalFromInteger(constant: string): GoRationalFact<'untyped-float'> { return { type: 'untyped-float', constant: encode(decode(constant)) }; }
export function goRationalCompare(left: GoRationalFact, right: GoRationalFact): number | undefined {
  if (left.constant === undefined || right.constant === undefined) return undefined;
  const a = decode(left.constant), b = decode(right.constant);
  const difference = a.n * b.d - b.n * a.d;
  return difference < zero ? -1 : difference > zero ? 1 : 0;
}
export function goRationalInteger(fact: GoRationalFact): string {
  if (fact.type !== 'untyped-float' || fact.constant === undefined) throw new GoRationalError('INTEGER_TYPE');
  const value = decode(fact.constant);
  if (value.d !== one) throw new GoRationalError('TRUNCATED_INTEGER');
  return String(value.n);
}
/** Round nearest, ties even, including subnormals/underflow. Reject infinity. */
export function goRationalAssignable<T extends 'float32' | 'float64'>(fact: GoRationalFact, target: T): GoRationalFact<T> {
  if (!['float32', 'float64', 'untyped-float'].includes(fact.type) || (fact.type !== 'untyped-float' && fact.type !== target)) throw new GoRationalError('TYPE_MISMATCH');
  if (fact.constant === undefined) {
    if (fact.type === 'untyped-float') throw new GoRationalError('UNTYPED_NONCONSTANT');
    return { type: target };
  }
  const { n, d } = decode(fact.constant);
  if (n === zero) return { type: target, constant: '0' };
  const a = n < zero ? -n : n;
  let exponent = bitLength(a) - bitLength(d);
  if (exponent >= 0 ? a < (d << BigInt(exponent)) : (a << BigInt(-exponent)) < d) exponent--;
  const precision = target === 'float32' ? 24 : 53, minimum = target === 'float32' ? -126 : -1022, maximum = target === 'float32' ? 127 : 1023;
  if (exponent > maximum) throw new GoRationalError('OVERFLOW');
  const unit = Math.max(exponent, minimum) - (precision - 1);
  const numerator = unit < 0 ? a << BigInt(-unit) : a;
  const denominator = unit < 0 ? d : d << BigInt(unit);
  let q = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder * two > denominator || (remainder * two === denominator && q % two !== zero)) q++;
  if (exponent === maximum && q >= (one << BigInt(precision))) throw new GoRationalError('OVERFLOW');
  if (n < zero) q = -q;
  return { type: target, constant: encode(unit < 0 ? fraction(q, one << BigInt(-unit)) : fraction(q << BigInt(unit))) };
}
export function goRationalUnary(operator: string, fact: GoRationalFact): GoRationalFact {
  if (!['+', '-'].includes(operator)) throw new GoRationalError('OPERATOR');
  if (fact.constant === undefined) return { type: fact.type };
  const { n, d } = decode(fact.constant);
  return { type: fact.type, constant: encode(fraction(operator === '-' ? -n : n, d)) };
}
export function goRationalBinary(operator: string, left: GoRationalFact, right: GoRationalFact): GoRationalFact {
  if (!['+', '-', '*', '/'].includes(operator)) throw new GoRationalError('OPERATOR');
  const type = left.type === 'untyped-float' ? right.type : left.type;
  if (type !== 'untyped-float') { left = goRationalAssignable(left, type); right = goRationalAssignable(right, type); }
  if (operator === '/' && right.constant !== undefined && decode(right.constant).n === zero) throw new GoRationalError('DIVIDE_ZERO');
  if (left.constant === undefined || right.constant === undefined) return { type };
  const a = decode(left.constant), b = decode(right.constant);
  const value = operator === '+' ? fraction(a.n * b.d + b.n * a.d, a.d * b.d) : operator === '-' ? fraction(a.n * b.d - b.n * a.d, a.d * b.d) : operator === '*' ? fraction(a.n * b.n, a.d * b.d) : fraction(a.n * b.d, a.d * b.n);
  const fact: GoRationalFact = { type, constant: encode(value) };
  return type === 'untyped-float' ? fact : goRationalAssignable(fact, type);
}
