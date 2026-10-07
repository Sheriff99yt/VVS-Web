import { NativeScalarFailure, type NativeScalarLanguage } from './nativeScalarContracts';

export interface NativeIntegerLiteralOptions { expectedType?: string; negated?: boolean }
export type NativeScalarLiteral = Readonly<{
  analysisOnly: true; graphAdmission: 'blocked'; token: string; nativeType: string;
  encoding: 'decimal-integer'; payload: string; bits: number; signed: boolean; negated: boolean;
  nativeWarnings: readonly string[];
}> | Readonly<{
  analysisOnly: true; graphAdmission: 'blocked'; token: string; nativeType: 'bool'; encoding: 'boolean'; payload: boolean;
}>;
const fail = (language: NativeScalarLanguage, code: string): never => { throw new NativeScalarFailure(`${language.toUpperCase()}_${code}`, 'This literal requires its native scalar token/type/range contract.'); };
const maximum = (bits: number, signed: boolean) => (BigInt(1) << BigInt(bits - (signed ? 1 : 0))) - BigInt(1);
const cppTypes: Record<string, [number, boolean]> = { int: [32, true], 'unsigned int': [32, false], long: [32, true], 'unsigned long': [32, false], 'long long': [64, true], 'unsigned long long': [64, false] };

/** Exact literal facts for pinned LLP64/64-bit profiles. No assigned conversions or graph receipts. */
export function nativeScalarLiteral(token: string, language: NativeScalarLanguage, options: NativeIntegerLiteralOptions = {}): NativeScalarLiteral {
  if (!['cpp', 'rust', 'gdscript'].includes(language)) return fail(language, 'UNSUPPORTED_LITERAL_PROFILE');
  if (token.length > 1024) return fail(language, 'UNSUPPORTED_LITERAL_BUDGET');
  if (['true', 'false'].includes(token)) {
    if (options.negated || (options.expectedType && options.expectedType !== 'bool')) return fail(language, 'LITERAL_CONTEXT_TYPE');
    return Object.freeze({ analysisOnly: true, graphAdmission: 'blocked', token, nativeType: 'bool', encoding: 'boolean', payload: token === 'true' });
  }
  let value: bigint, nativeType: string, bits: number, signed: boolean;
  const nativeWarnings: string[] = [];
  const negated = options.negated === true;
  if (language === 'rust') {
    const match = /^(0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|[0-9][0-9_]*)([iu](?:8|16|32|64|128|size))?$/.exec(token);
    if (!match || !/[0-9a-fA-F]/.test(match[1].replace(/^0[xob]/, '').replaceAll('_', ''))) return fail(language, 'UNSUPPORTED_LITERAL_TOKEN');
    const digits = match[1].replaceAll('_', ''); value = BigInt(digits);
    nativeType = match[2] ?? options.expectedType ?? 'i32';
    if (!/^[iu](?:8|16|32|64|128|size)$/.test(nativeType)) return fail(language, 'UNSUPPORTED_LITERAL_TYPE');
    if (match[2] && options.expectedType && options.expectedType !== match[2]) return fail(language, 'LITERAL_CONTEXT_TYPE');
    signed = nativeType.startsWith('i'); bits = nativeType.endsWith('size') ? 64 : Number(nativeType.slice(1));
    if (negated && !signed) return fail(language, 'LITERAL_UNSIGNED_NEGATION');
    if (value > maximum(bits, signed) + (negated && signed ? BigInt(1) : BigInt(0))) return fail(language, 'LITERAL_OVERFLOW');
    if (negated) value = -value;
  } else if (language === 'cpp') {
    if (options.expectedType) return fail(language, 'UNSUPPORTED_LITERAL_CONTEXT');
    const match = /^(0[xX][0-9a-fA-F](?:'?[0-9a-fA-F])*|0[bB][01](?:'?[01])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)([uU](?:[lL]|ll|LL)?|(?:[lL]|ll|LL)[uU]?)?$/.exec(token);
    if (!match) return fail(language, 'UNSUPPORTED_LITERAL_TOKEN');
    const raw = match[1].replaceAll("'", ''), suffix = (match[2] ?? '').toLowerCase();
    const decimal = !/^0[xXbB]/.test(raw) && !(raw.length > 1 && raw.startsWith('0'));
    value = BigInt(!decimal && /^0[0-7]+$/.test(raw) ? `0o${raw.slice(1)}` : raw);
    const unsigned = suffix.includes('u'), longs = suffix.replace('u', '').length;
    let candidates: string[];
    if (unsigned) candidates = longs === 2 ? ['unsigned long long'] : longs === 1 ? ['unsigned long', 'unsigned long long'] : ['unsigned int', 'unsigned long', 'unsigned long long'];
    else if (longs === 2) candidates = decimal ? ['long long'] : ['long long', 'unsigned long long'];
    else if (longs === 1) candidates = decimal ? ['long', 'long long'] : ['long', 'unsigned long', 'long long', 'unsigned long long'];
    else candidates = decimal ? ['int', 'long', 'long long'] : ['int', 'unsigned int', 'long', 'unsigned long', 'long long', 'unsigned long long'];
    let selected = candidates.find(type => value <= maximum(...cppTypes[type]));
    if (!selected && decimal && !unsigned && value <= maximum(64, false)) { selected = 'unsigned long long'; nativeWarnings.push('CLANG_DECIMAL_UNSIGNED_EXTENSION'); }
    if (!selected) return fail(language, 'UNSUPPORTED_LITERAL_EXTENDED_RANGE');
    nativeType = selected; [bits, signed] = cppTypes[selected];
    if (negated) value = signed ? -value : BigInt.asUintN(bits, -value);
  } else {
    if (options.expectedType && options.expectedType !== 'int') return fail(language, 'LITERAL_CONTEXT_TYPE');
    if (!/^(?:0x[0-9a-fA-F](?:_?[0-9a-fA-F])*|0b[01](?:_?[01])*|[0-9](?:_?[0-9])*)$/.test(token)) return fail(language, 'UNSUPPORTED_LITERAL_TOKEN');
    const cleaned = token.replaceAll('_', ''), based = /^0[xb]/.test(cleaned);
    value = BigInt(cleaned); bits = 64; signed = true; nativeType = 'int';
    if (based) {
      const limit = maximum(64, true) + (negated ? BigInt(1) : BigInt(0));
      if (value > limit) { value = negated ? -limit : limit; nativeWarnings.push('GODOT_BASED_LITERAL_SATURATION'); }
      else if (negated) value = -value;
    } else {
      // Godot4.5.2 String::_to_int checks overflow starting with digit index19.
      // Thus an overflowing 19-digit decimal casts to int64; a later digit may saturate.
      let accumulated = BigInt(0), saturated = false;
      for (const [index, character] of Array.from(cleaned).entries()) {
        const digit = BigInt(character);
        if (index > 18 && (accumulated > maximum(64, true) / BigInt(10) || (accumulated === maximum(64, true) / BigInt(10) && digit > (negated ? BigInt(8) : BigInt(7))))) { saturated = true; break; }
        accumulated = accumulated * BigInt(10) + digit;
      }
      if (saturated) { value = negated ? -(BigInt(1) << BigInt(63)) : maximum(64, true); nativeWarnings.push('GODOT_DECIMAL_LITERAL_SATURATION'); }
      else value = BigInt.asIntN(64, negated ? -accumulated : accumulated);
    }
  }
  return Object.freeze({ analysisOnly: true, graphAdmission: 'blocked', token, nativeType, encoding: 'decimal-integer', payload: value.toString(), bits, signed, negated, nativeWarnings: Object.freeze(nativeWarnings) });
}
