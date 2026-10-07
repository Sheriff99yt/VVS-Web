import { goFloatLiteral, goRationalCompare, goRationalFromInteger, goRationalInteger, goRationalAssignable, goRationalBinary, goRationalUnary, type GoRationalFact } from './goRationalSemantics';
import { GO_INTEGER_TYPES, goDefaultInteger, goIntegerAssignable, goIntegerBinary, goIntegerUnary, GoIntegerError, type GoIntegerFact, type GoIntegerOperator, type GoWordBits } from './goIntegerSemantics';
import { GO_SCALAR_PINS, sameGoScalarType, type GoScalarType } from './nativeSignatures';
export type GoValueFact = { type: GoScalarType | 'untyped-integer' | 'inline-number' | 'unknown' | 'contextual-integer' | 'untyped-float' | 'untyped-bool' | 'untyped-string'; constant?: string; context?: { operator: string; left: GoValueFact; right?: GoValueFact; defaultType?: 'float64' } };
const primitiveType = (type: GoValueFact['type']) => type === 'untyped-bool' ? 'bool' : type === 'untyped-string' ? 'string' : type;
export const goValuePinType = (fact: GoValueFact) => ['bool', 'untyped-bool'].includes(fact.type) ? 'data_boolean' : ['string', 'untyped-string'].includes(fact.type) ? 'data_string' : fact.type === 'unknown' ? undefined : 'data_number';
export const isGoInteger = (fact: GoValueFact): fact is GoIntegerFact => fact.type === 'untyped-integer' || GO_INTEGER_TYPES.includes(fact.type as typeof GO_INTEGER_TYPES[number]);
export const isGoIntegerValue = (fact: GoValueFact): boolean => isGoInteger(fact) || fact.type === 'contextual-integer';
const floatValue = (fact: GoRationalFact): GoValueFact => {
  return { type: fact.type, ...(fact.constant === undefined ? {} : { constant: fact.constant }) };
};
const floatEvidence = (fact: GoValueFact): GoRationalFact => {
  if (fact.type === 'float64' || fact.type === 'float32' || fact.type === 'untyped-float') return fact as GoRationalFact;
  if (fact.type === 'untyped-integer' && fact.constant !== undefined) return goRationalFromInteger(fact.constant);
  if (fact.type === 'inline-number' && fact.constant !== undefined) {
    const negative = fact.constant.startsWith('-'), token = negative ? fact.constant.slice(1) : fact.constant;
    const value = /[.eE]/.test(token) ? goFloatLiteral(token) : goRationalFromInteger(token);
    return negative ? goRationalUnary('-', value) : value;
  }
  throw new Error('NATIVE_GO_FLOAT_EVIDENCE: Floating operands require native identity and exact constant evidence.');
};
/** Resolve native Go typing context; no context is persisted or emitted as a conversion. */
export function resolveGoValueContext(fact: GoValueFact, target: GoScalarType, bits: GoWordBits, depth = 0): GoValueFact {
  if (fact.type !== 'contextual-integer') return fact;
  if (depth >= 64 || !fact.context) throw new GoIntegerError('CONTEXT_DEPTH');
  if (!GO_INTEGER_TYPES.includes(target as typeof GO_INTEGER_TYPES[number])) throw new GoIntegerError('SHIFT_CONTEXT_TYPE');
  const { operator, left, right } = fact.context;
  let a = resolveGoValueContext(left, target, bits, depth + 1);
  if (!right) return goValueUnary(operator, a, bits);
  const shift = ['<<', '>>'].includes(operator);
  const b = shift ? right : resolveGoValueContext(right, target, bits, depth + 1);
  if (shift && b.constant === undefined && (a.type === 'untyped-integer' || a.type === 'untyped-float')) {
    if (a.type === 'untyped-float') a = { type: 'untyped-integer', constant: goRationalInteger(a as GoRationalFact) };
    a = goIntegerAssignable(a as GoIntegerFact, target as GoIntegerFact['type'] & GoScalarType, bits);
  }
  return goValueBinary(operator, a, b, bits);
}
/** Go keeps a nonconstant untyped shift count untyped. Validate the pinned
 * compiler's literal storage bounds without inventing a runtime type or value.
 * Compound count expressions need a separate compiler-conformance contract. */
function goShiftCountContext(fact: GoValueFact, bits: GoWordBits, depth = 0): void {
  if (depth >= 64 || !fact.context) throw new GoIntegerError('CONTEXT_DEPTH');
  const { operator, left, right } = fact.context;
  if (!['<<', '>>'].includes(operator) || !right) throw new GoIntegerError('SHIFT_COUNT_CONTEXT_UNSUPPORTED');
  if (left.type === 'contextual-integer') goShiftCountContext(left, bits, depth + 1);
  else if (left.type === 'untyped-integer' && left.constant !== undefined) {
    goIntegerAssignable(left as GoIntegerFact, left.constant.startsWith('-') ? 'int64' : 'uint64', 64);
  } else throw new GoIntegerError('SHIFT_COUNT_CONTEXT_UNSUPPORTED');
  if (right.type === 'contextual-integer') goShiftCountContext(right, bits, depth + 1);
  else {
    if (!isGoInteger(right)) throw new GoIntegerError('SHIFT_CONTEXT_TYPE');
    // Check constant count validity independently of the deferred left operand.
    goIntegerBinary('<<', { type: 'uint64' }, right, bits);
  }
}

export function goValueAssignable(fact: GoValueFact, target: GoScalarType, bits: GoWordBits): boolean {
  fact = resolveGoValueContext(fact, target, bits);
  if (GO_INTEGER_TYPES.includes(target as typeof GO_INTEGER_TYPES[number])) {
    if (fact.type === 'untyped-float') fact = { type: 'untyped-integer', constant: goRationalInteger(fact as GoRationalFact) };
    if (!isGoInteger(fact)) return false;
    goIntegerAssignable(fact, target as GoIntegerFact['type'] & GoScalarType, bits); return true;
  }
  if (target === 'float64' || target === 'float32') { goRationalAssignable(floatEvidence(fact), target); return true; }
  return sameGoScalarType(primitiveType(fact.type), target);
}
export function goValueDefault(fact: GoValueFact, bits: GoWordBits): GoValueFact {
  if (fact.type === 'untyped-bool' || fact.type === 'untyped-string') return { ...fact, type: primitiveType(fact.type) as GoScalarType };
  if (fact.type === 'inline-number') {
    if (fact.constant === undefined) throw new Error('NATIVE_GO_INLINE_CONSTANT: Default inference needs the emitted token value.');
    return /[.eE]/.test(fact.constant) ? goRationalAssignable(floatEvidence(fact), 'float64') : goDefaultInteger({ type: 'untyped-integer', constant: fact.constant }, bits);
  }
  fact = resolveGoValueContext(fact, fact.context?.defaultType ?? 'int', bits);
  return fact.type === 'untyped-float' ? goRationalAssignable(fact as GoRationalFact, 'float64') : isGoInteger(fact) ? goDefaultInteger(fact, bits) : fact;
}
export function goValueBinary(operator: string, left: GoValueFact, right: GoValueFact, bits: GoWordBits): GoValueFact {
  if ((operator === '+' && primitiveType(left.type) === 'string' && primitiveType(right.type) === 'string') || (['&&', '||'].includes(operator) && primitiveType(left.type) === 'bool' && primitiveType(right.type) === 'bool')) {
    const type = left.type.startsWith('untyped-') ? right.type : left.type;
    if (left.constant === undefined || right.constant === undefined) return { type };
    const constant = operator === '+' ? left.constant + right.constant : String(operator === '&&' ? left.constant === 'true' && right.constant === 'true' : left.constant === 'true' || right.constant === 'true');
    if (new TextEncoder().encode(constant).length > 128 * 1024) throw new Error('NATIVE_GO_CONSTANT_BUDGET');
    return { type, constant };
  }
  const shift = ['<<', '>>'].includes(operator);
  const defaultType = left.context?.defaultType ?? right.context?.defaultType;
  if (shift && right.type === 'untyped-float') right = { type: 'untyped-integer', constant: goRationalInteger(right as GoRationalFact) };
  if (shift && left.type === 'untyped-float') {
    if (right.constant === undefined) return { type: 'contextual-integer', context: { operator, left, right, defaultType: 'float64' } };
    left = { type: 'untyped-integer', constant: goRationalInteger(left as GoRationalFact) };
  }
  if (!shift) {
    if (isGoInteger(left) && left.type !== 'untyped-integer' && right.type === 'untyped-float') right = { type: 'untyped-integer', constant: goRationalInteger(right as GoRationalFact) };
    if (isGoInteger(right) && right.type !== 'untyped-integer' && left.type === 'untyped-float') left = { type: 'untyped-integer', constant: goRationalInteger(left as GoRationalFact) };
  }
  if (shift && right.type === 'contextual-integer') {
    goShiftCountContext(right, bits);
    if (left.type === 'untyped-integer' || left.type === 'contextual-integer') return { type: 'contextual-integer', context: { operator, left, right, defaultType } };
    if (!isGoInteger(left)) throw new GoIntegerError('SHIFT_CONTEXT_TYPE');
    goIntegerUnary('+', left, bits);
    return { type: left.type }; // Preserve the left type; the count remains untyped and nonconstant.
  }
  if (left.type === 'contextual-integer' || right.type === 'contextual-integer') {
    const peer = left.type === 'contextual-integer' ? right : left;
    if (!shift && peer.type !== 'contextual-integer' && peer.type !== 'untyped-integer') {
      left = resolveGoValueContext(left, peer.type as GoScalarType, bits); right = resolveGoValueContext(right, peer.type as GoScalarType, bits);
    } else return { type: 'contextual-integer', context: { operator, left, right, defaultType } };
  }
  if (isGoInteger(left) && isGoInteger(right)) {
    if (shift && left.type === 'untyped-integer' && right.constant === undefined) return { type: 'contextual-integer', context: { operator, left, right, defaultType } };
    return goIntegerBinary(operator as GoIntegerOperator, left, right, bits);
  }
  return floatValue(goRationalBinary(operator, floatEvidence(left), floatEvidence(right)));
}
export function goValueUnary(operator: string, value: GoValueFact, bits: GoWordBits): GoValueFact {
  if (operator === '!' && primitiveType(value.type) === 'bool') return { type: value.type, ...(value.constant === undefined ? {} : { constant: String(value.constant !== 'true') }) };
  if (value.type === 'contextual-integer') return { type: 'contextual-integer', context: { operator, left: value, defaultType: value.context?.defaultType } };
  if (isGoInteger(value)) return goIntegerUnary(operator as '+' | '-' | '^', value, bits);
  return floatValue(goRationalUnary(operator, floatEvidence(value)));
}
export function goValuesComparable(left: GoValueFact, right: GoValueFact, bits: GoWordBits): boolean {
  if (left.type === 'contextual-integer' || right.type === 'contextual-integer') {
    const peer = left.type === 'contextual-integer' ? right : left;
    const target = peer.type === 'contextual-integer' || peer.type === 'untyped-integer' ? 'int' : peer.type as GoScalarType;
    left = resolveGoValueContext(left, target, bits); right = resolveGoValueContext(right, target, bits);
  }
  if (isGoInteger(left) && isGoInteger(right)) {
    const target = left.type === 'untyped-integer' ? right.type : left.type;
    if (target !== 'untyped-integer') { goIntegerAssignable(left, target, bits); goIntegerAssignable(right, target, bits); }
    return true;
  }
  if (left.type === 'untyped-float' || right.type === 'untyped-float' || left.type === 'float64' || right.type === 'float64' || left.type === 'float32' || right.type === 'float32') {
    // A typed integer peer requires integral, representable untyped floats.
    const peer = isGoInteger(left) && left.type !== 'untyped-integer' ? left : isGoInteger(right) && right.type !== 'untyped-integer' ? right : undefined;
    if (peer) return goValueAssignable(left, peer.type as GoScalarType, bits) && goValueAssignable(right, peer.type as GoScalarType, bits);
    const a = floatEvidence(left), b = floatEvidence(right);
    const target = a.type !== 'untyped-float' ? a.type : b.type !== 'untyped-float' ? b.type : undefined;
    if (target) { goRationalAssignable(a, target); goRationalAssignable(b, target); }
    return true;
  }
  return sameGoScalarType(primitiveType(left.type), primitiveType(right.type));
}

/** Constant bindings retain exact facts, and typed bindings round at their visible declaration. */
export function goValueConstant(fact: GoValueFact, target: GoScalarType | 'untyped', bits: GoWordBits): GoValueFact {
  if (fact.constant === undefined || fact.type === 'unknown' || fact.type === 'contextual-integer') throw new Error('NATIVE_GO_CONSTANT_INITIALIZER: A constant declaration requires constant evidence.');
  if (fact.type === 'inline-number') fact = /[.eE]/.test(fact.constant!) ? floatEvidence(fact) : { type: 'untyped-integer', constant: fact.constant };
  if (target === 'untyped') return fact;
  if (!goValueAssignable(fact, target, bits)) throw new Error('NATIVE_GO_CONSTANT_TYPE');
  return ['bool', 'string'].includes(target) ? { type: target, constant: fact.constant } : goValueConvert(fact, target, bits);
}

/** Go comparisons produce untyped boolean facts; dynamic operands are never evaluated. */
export function goValueCompare(operator: string, left: GoValueFact, right: GoValueFact, bits: GoWordBits): GoValueFact {
  if (!['==', '!=', '<', '<=', '>', '>='].includes(operator) || !goValuesComparable(left, right, bits) || (primitiveType(left.type) === 'bool' && !['==', '!='].includes(operator))) throw new Error('NATIVE_GO_COMPARISON_TYPE');
  if (left.constant === undefined || right.constant === undefined) return { type: 'untyped-bool' };
  let order: number | undefined;
  if (['bool', 'string'].includes(primitiveType(left.type))) {
    // Go orders strings lexicographically by UTF-8 bytes, not UTF-16 code units.
    const a = new TextEncoder().encode(left.constant), b = new TextEncoder().encode(right.constant);
    order = 0;
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      if (a[index] !== b[index]) { order = index >= a.length ? -1 : index >= b.length ? 1 : a[index] < b[index] ? -1 : 1; break; }
    }
  } else {
    const target = Object.hasOwn(GO_SCALAR_PINS, left.type) ? left.type : Object.hasOwn(GO_SCALAR_PINS, right.type) ? right.type : undefined;
    if (target) { left = goValueConstant(left, target as GoScalarType, bits); right = goValueConstant(right, target as GoScalarType, bits); }
    const rational = (value: GoValueFact) => isGoInteger(value) ? goRationalFromInteger(value.constant!) : floatEvidence(value);
    order = goRationalCompare(rational(left), rational(right));
  }
  const result = operator === '==' ? order === 0 : operator === '!=' ? order !== 0 : operator === '<' ? order! < 0 : operator === '<=' ? order! <= 0 : operator === '>' ? order! > 0 : order! >= 0;
  return { type: 'untyped-bool', constant: String(result) };
}

/** A visible Go conversion owns runtime truncation/rounding; never synthesize it. */
export function goValueConvert(fact: GoValueFact, target: GoScalarType, bits: GoWordBits): GoValueFact {
  if (!(GO_INTEGER_TYPES as readonly string[]).includes(target) && !['float32', 'float64'].includes(target)) throw new Error('NATIVE_GO_CONVERSION_TARGET: Numeric conversion needs a reviewed native type.');
  fact = resolveGoValueContext(fact, target, bits);
  if (!isGoInteger(fact) && !['float32', 'float64', 'untyped-float', 'inline-number'].includes(fact.type)) throw new Error('NATIVE_GO_CONVERSION_OPERAND: Numeric conversion needs native numeric evidence.');
  if (fact.constant === undefined) {
    if (['untyped-integer', 'untyped-float', 'inline-number'].includes(fact.type)) throw new Error('NATIVE_GO_CONVERSION_CONSTANT: Untyped conversion needs exact constant evidence.');
    return { type: target };
  }
  if (target === 'float32' || target === 'float64') {
    const rational = isGoInteger(fact) ? goRationalFromInteger(fact.constant) : floatEvidence(fact);
    return goRationalAssignable({ type: 'untyped-float', constant: rational.constant }, target);
  }
  const constant = isGoInteger(fact) ? fact.constant : goRationalInteger({ type: 'untyped-float', constant: floatEvidence(fact).constant });
  return goIntegerAssignable({ type: 'untyped-integer', constant }, target as GoIntegerFact['type'] & GoScalarType, bits);
}
