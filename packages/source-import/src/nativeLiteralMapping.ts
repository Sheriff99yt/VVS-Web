import { ImportFailure, type ExpressionPlan, type MappingEvidence } from './contracts';
import { inventoryNativeValues, type NativeValueProfile } from './nativeValues';

/** Decode ordinary Python string tokens, never evaluate uploaded expressions. */
export function decodePythonString(token: string): string {
  const match = /^([rRuU]*)("""|'''|"|')/.exec(token);
  if (!match || !['', 'r', 'u'].includes(match[1].toLowerCase()) || !token.endsWith(match[2])) throw new ImportFailure('PYTHON_STRING_VARIANT', 'Interpolated/bytes strings require separate native mappings.');
  const value = token.slice(match[0].length, -match[2].length);
  if (match[1].toLowerCase() === 'r') return value;
  return value.replace(/\\(?:\r?\n|[\\'"abfnrtv]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3}|[\s\S])/g, escape => {
    const key = escape.slice(1);
    const simple: Record<string, string> = { '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '\n': '', '\r\n': '' };
    if (key in simple) return simple[key];
    if (/^[xuU]/.test(key)) return String.fromCodePoint(parseInt(key.slice(1), 16));
    if (/^[0-7]/.test(key)) return String.fromCodePoint(parseInt(key, 8));
    if (key.startsWith('N')) throw new ImportFailure('PYTHON_NAMED_ESCAPE', 'Named Unicode escapes need a pinned Unicode-name resolver.');
    return escape;
  });
}

export function nativeScalarPlan(source: string, profile: NativeValueProfile, evidence: MappingEvidence): ExpressionPlan {
  const scalar = inventoryNativeValues(profile === 'javascript.es2022' ? `function value(){return ${source};}` : `def value():\n    return ${source}\n`, profile).facts.find(fact => fact.scalar)?.scalar;
  if (!scalar) throw new ImportFailure('NATIVE_SCALAR_UNSUPPORTED', 'This literal requires a separate native scalar mapping.', evidence);
  let payload: string;
  if (scalar.encoding === 'ieee754-binary64-be') {
    const bytes = Uint8Array.from(scalar.payload.match(/../g)!, pair => parseInt(pair, 16));
    const value = new DataView(bytes.buffer).getFloat64(0, false);
    payload = Object.is(value, -0) ? '-0' : !Number.isFinite(value) ? (value < 0 ? '-1e309' : '1e309') : String(value);
  } else if (scalar.domain === 'string') payload = scalar.encoding === 'source-token' ? decodePythonString(scalar.payload as string) : String(scalar.payload);
  else payload = scalar.payload === null ? '' : String(scalar.payload);
  return { ...evidence, kind: 'native', language: profile === 'javascript.es2022' ? 'javascript' : 'python', form: 'scalar', domain: scalar.domain, payload, operands: [], valueType: scalar.domain === 'string' ? 'string' : scalar.domain === 'javascript-bigint' || scalar.payload === null ? 'unknown' : 'number' };
}
