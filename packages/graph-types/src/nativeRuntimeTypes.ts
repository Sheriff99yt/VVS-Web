import type { NativeScalarLanguage } from './nativeScalarContracts';
import { canonicalNativeScalarSignatureType } from './nativeScalarSignatures';

export class NativeRuntimeTypeFailure extends Error {
  constructor(public readonly code: string) { super(`NATIVE_RUNTIME_TYPE_${code}`); }
}
export interface NativeRuntimeTypeFact {
  readonly nativeType: string;
  readonly domain: 'native-integer' | 'native-bool';
  readonly evaluation: 'ordinary' | 'short-circuit';
  readonly values: 'unknown';
}
const cppIntegers: Record<string, readonly [number, boolean, number]> = {
  'signed char': [8, true, 0], 'unsigned char': [8, false, 0], short: [16, true, 0], 'unsigned short': [16, false, 0],
  int: [32, true, 1], 'unsigned int': [32, false, 1], long: [32, true, 2], 'unsigned long': [32, false, 2],
  'long long': [64, true, 3], 'unsigned long long': [64, false, 3],
};
const fail = (code: string): never => { throw new NativeRuntimeTypeFailure(code); };
const promoteCpp = (type: string) => type === 'bool' || cppIntegers[type][0] < 32 ? 'int' : type;
function cppCommon(left: string, right: string): string {
  left = promoteCpp(left); right = promoteCpp(right);
  const a = cppIntegers[left], b = cppIntegers[right];
  if (a[1] === b[1]) return a[2] >= b[2] ? left : right;
  const unsigned = a[1] ? right : left, signed = a[1] ? left : right;
  if (cppIntegers[unsigned][2] >= cppIntegers[signed][2]) return unsigned;
  return cppIntegers[signed][0] > cppIntegers[unsigned][0] ? signed : `unsigned ${signed}`;
}

/** Type applicability only: never invent runtime values or prove overflow/effect safety. */
export function nativeRuntimeOperatorType(language: NativeScalarLanguage, form: 'unary' | 'binary' | 'conversion', operator: string, operands: readonly string[]): Readonly<NativeRuntimeTypeFact> {
  if (!['cpp', 'rust', 'gdscript'].includes(language)) fail('PROFILE');
  if (operands.length !== (form === 'binary' ? 2 : 1) || operands.some(type => canonicalNativeScalarSignatureType(type, language) !== type)) fail('OPERANDS');
  const [left, right] = operands;
  const fact = (nativeType: string, evaluation: NativeRuntimeTypeFact['evaluation'] = 'ordinary') => Object.freeze({ nativeType, domain: nativeType === 'bool' ? 'native-bool' as const : 'native-integer' as const, evaluation, values: 'unknown' as const });
  if (form === 'conversion') {
    const destination = canonicalNativeScalarSignatureType(operator, language);
    if (!destination || language === 'rust' && destination === 'bool' && left !== 'bool') return fail('CONVERSION');
    return fact(destination);
  }
  if (form === 'unary') {
    if (operator === '!' && (language !== 'rust' || left === 'bool')) return fact('bool');
    if (left === 'bool' && language !== 'cpp') return fail('UNARY_DOMAIN');
    if (operator === '+' && language !== 'rust' || operator === '~' && language !== 'rust') return fact(language === 'cpp' ? promoteCpp(left) : left);
    if (operator === '!' && language === 'rust') return fact(left);
    if (operator === '-' && !(language === 'rust' && left.startsWith('u'))) return fact(language === 'cpp' ? promoteCpp(left) : left);
    return fail('UNARY_OPERATOR');
  }
  if (['&&', '||', 'and', 'or'].includes(operator)) {
    if (language === 'gdscript' ? !['and', 'or', '&&', '||'].includes(operator) : !['&&', '||'].includes(operator)) return fail('LOGICAL_SPELLING');
    if (language === 'rust' && (left !== 'bool' || right !== 'bool')) return fail('LOGICAL_DOMAIN');
    return fact('bool', 'short-circuit');
  }
  if (['<<', '>>'].includes(operator)) {
    if (language !== 'cpp' && (left === 'bool' || right === 'bool')) return fail('SHIFT_DOMAIN');
    return fact(language === 'cpp' ? promoteCpp(left) : left);
  }
  if (language !== 'cpp' && left !== right) return fail('BINARY_TYPE_MISMATCH');
  if (['==', '!=', '<', '<=', '>', '>='].includes(operator)) {
    return fact('bool');
  }
  if (['&', '|', '^'].includes(operator) && language === 'rust' && left === 'bool') return fact('bool');
  if (language !== 'cpp' && left === 'bool') return fail('BINARY_DOMAIN');
  if (!['+', '-', '*', '/', '%', '&', '|', '^'].includes(operator)) return fail('BINARY_OPERATOR');
  return fact(language === 'cpp' ? cppCommon(left, right) : left);
}
