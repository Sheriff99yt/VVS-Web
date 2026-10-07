import { CSHARP_INTEGER_TYPES, csharpIntegerLiteral } from './csharpIntegerSemantics';
import { goFloatLiteral } from './goRationalSemantics';
import { GO_INTEGER_TYPES, goIntegerLiteral } from './goIntegerSemantics';
import type { VVSNodeData } from './nodes';
import type { PinDefinition } from './pins';
import { NATIVE_SCALAR_SIGNATURE_TYPES } from './nativeScalarSignatures';

export const NATIVE_EXPRESSION_KINDS = ['expr_native_literal', 'expr_native_collection', 'expr_native_access', 'expr_native_operator'] as const;
export const NATIVE_FORMS = ['scalar', 'array', 'object', 'list', 'tuple', 'set', 'dict', 'named-entry', 'quoted-entry', 'computed-entry', 'dict-entry', 'shorthand-entry', 'spread', 'dict-spread', 'hole', 'index', 'member', 'binary', 'unary', 'slice', 'conversion', 'parentheses', 'overflow'] as const;
export interface NativeExpressionSettings {
  language: 'javascript' | 'python' | 'go' | 'csharp' | 'cpp' | 'rust' | 'gdscript'; form: typeof NATIVE_FORMS[number]; count: number;
  domain: string; payload: string; name: string; operator: string; targetType?: string;
}
export const NATIVE_OPERATORS = {
  csharp: ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '>>>', '==', '!=', '<', '<=', '>', '>=', '&&', '||'],
  go: ['+', '-', '*', '/', '%', '&', '|', '^', '&^', '<<', '>>', '&&', '||'],
  javascript: ['+', '-', '*', '/', '%', '**', '==', '!=', '===', '!==', '<', '<=', '>', '>=', '&', '|', '^', '<<', '>>', '>>>', 'in', 'instanceof'],
  python: ['+', '-', '*', '/', '//', '%', '**', '==', '!=', '<', '<=', '>', '>=', '&', '|', '^', '<<', '>>', 'in', 'not in', 'is', 'is not'],
  cpp: ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '==', '!=', '<', '<=', '>', '>=', '&&', '||'],
  rust: ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '==', '!=', '<', '<=', '>', '>=', '&&', '||'],
  gdscript: ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '==', '!=', '<', '<=', '>', '>=', 'and', 'or', '&&', '||'],
};
export function nativeExpressionSettings(data: VVSNodeData): NativeExpressionSettings {
  const p = data.properties ?? {};
  return { language: p.nativeLanguage as NativeExpressionSettings['language'], form: p.nativeForm as NativeExpressionSettings['form'], count: Number(p.operandCount), domain: String(p.nativeDomain ?? ''), payload: String(p.payload ?? ''), name: String(p.memberName ?? ''), operator: String(p.operator ?? ''), targetType: String(p.nativeTargetType ?? '') };
}
export function nativeExpressionPins(settings: NativeExpressionSettings): PinDefinition[] {
  const count = settings.form === 'slice' ? 1 + [...settings.payload].filter(bit => bit === '1').length : ['scalar', 'hole'].includes(settings.form) ? 0 : ['parentheses', 'overflow', 'conversion', 'unary', 'member', 'spread', 'dict-spread', 'shorthand-entry'].includes(settings.form) ? 1 : ['named-entry'].includes(settings.form) ? 1 : ['index', 'binary', 'quoted-entry', 'computed-entry', 'dict-entry'].includes(settings.form) ? 2 : settings.count;
  if (!Number.isSafeInteger(count) || count < 0 || count > 32) return [];
  return Array.from({ length: count }, (_, index) => ({ id: `operand-${index}`, label: `Operand ${index + 1}`, type: 'data_any', required: true }));
}
/** Result pin carries only domains established by graph-owned evidence. */
export function nativeExpressionOutputType(s: NativeExpressionSettings): PinDefinition['type'] {
  if (['cpp', 'rust', 'gdscript'].includes(s.language)) return s.domain === 'native-bool' ? 'data_boolean' : s.domain === 'native-integer' ? 'data_number' : 'data_any';
  if (s.language === 'csharp' && s.domain === 'csharp-integer') return 'data_number';
  if (s.language === 'csharp' && s.domain === 'csharp-bool') return 'data_boolean';
  if (['binary', 'unary'].includes(s.form) && s.language === 'go' && s.domain === 'go-bool') return 'data_boolean';
  if (s.form === 'binary' && s.language === 'go' && s.domain === 'go-string') return 'data_string';
  if (s.form === 'scalar' && ['javascript-number', 'python-float', 'python-integer', 'go-integer', 'go-float'].includes(s.domain)) return 'data_number';
  if (s.form === 'scalar' && s.domain === 'string') return 'data_string';
  if (s.form === 'binary' && ['==', '!=', '===', '!==', '<', '<=', '>', '>=', 'in', 'not in', 'is', 'is not', 'instanceof'].includes(s.operator)) return 'data_boolean';
  if (['binary', 'unary', 'conversion'].includes(s.form) && ['number', 'go-integer', 'go-number'].includes(s.domain)) return 'data_number';
  return 'data_any';
}
export function nativeExpressionProblem(data: VVSNodeData, language: string): string | undefined {
  const s = nativeExpressionSettings(data);
  if (['cpp', 'rust', 'gdscript'].includes(s.language)) {
    if (language !== s.language) return 'Native constants require their declared target.';
    if (!['scalar', 'binary', 'unary', 'parentheses', 'conversion'].includes(s.form) || !['native-integer', 'native-bool'].includes(s.domain)) return 'Native constants require their reviewed form and result domain.';
    if (data.kindId !== (s.form === 'scalar' ? 'expr_native_literal' : 'expr_native_operator')) return 'Native form does not match its node kind.';
    if (s.form === 'scalar' && (!/^(?:true|false|[0-9][A-Za-z0-9_']*)$/.test(s.payload) || s.payload.length > 4096)) return 'Native scalar requires an exact bounded integer/Boolean token.';
    if (s.form === 'binary' && !NATIVE_OPERATORS[s.language].includes(s.operator)) return 'Unreviewed native constant operator.';
    if (s.form === 'unary' && !(s.language === 'rust' ? ['-', '!'] : ['+', '-', '~', '!']).includes(s.operator)) return 'Unreviewed native constant unary operator.';
    if (s.form === 'conversion' && !(NATIVE_SCALAR_SIGNATURE_TYPES[s.language as 'cpp' | 'rust' | 'gdscript'] as readonly string[]).includes(s.targetType ?? '')) return 'Native conversion requires an explicit reviewed scalar type.';
    const pins = nativeExpressionPins(s);
    if (!Number.isSafeInteger(s.count) || s.count !== pins.length || s.count > 2 || JSON.stringify(data.inputs.map(pin => [pin.id, pin.type])) !== JSON.stringify(pins.map(pin => [pin.id, pin.type]))) return 'Native constant operand pins/arity disagree.';
    if (data.outputs.length !== 1 || data.outputs[0].id !== 'result' || data.outputs[0].type !== nativeExpressionOutputType(s)) return 'Native constant result requires its declared visible domain.';
    if (Object.keys(data.inlineValues ?? {}).length || data.graphBinding) return 'Native constants require graph-owned operands.';
    return;
  }
  if (!['javascript', 'python', 'go', 'csharp'].includes(s.language) || language !== s.language) return 'Native expressions require their declared source-language target.';
  if (!NATIVE_FORMS.includes(s.form)) return 'Unknown native expression form.';
  const forms = s.language === 'csharp' ? ['scalar', 'binary', 'unary', 'conversion', 'parentheses', 'overflow'] : s.language === 'go' ? ['scalar', 'binary', 'unary', 'conversion'] : s.language === 'javascript' ? ['scalar', 'array', 'object', 'named-entry', 'quoted-entry', 'computed-entry', 'shorthand-entry', 'spread', 'hole', 'index', 'member', 'binary', 'unary'] : ['scalar', 'list', 'tuple', 'set', 'dict', 'dict-entry', 'spread', 'dict-spread', 'index', 'member', 'binary', 'unary', 'slice'];
  if (!forms.includes(s.form)) return 'This form has no reviewed native target mapping.';
  const expectedKind = s.form === 'scalar' ? 'expr_native_literal' : ['binary', 'unary', 'conversion', 'parentheses', 'overflow'].includes(s.form) ? 'expr_native_operator' : ['index', 'member', 'slice'].includes(s.form) ? 'expr_native_access' : 'expr_native_collection';
  if (data.kindId !== expectedKind) return 'Native form does not match its node kind.';
  if (!Number.isSafeInteger(s.count) || s.count < 0 || s.count > 32 || (s.form === 'set' && s.count === 0)) return 'Native collection arity must be explicit and within its 32-operand budget.';
  if (['member', 'named-entry', 'shorthand-entry'].includes(s.form) && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s.name)) return 'A native member/key requires a valid identifier.';
  if (s.language === 'python' && ['member'].includes(s.form) && /[$]/.test(s.name)) return 'Python members require Python identifiers.';
  if (s.language === 'csharp' && !['csharp-integer', 'csharp-bool'].includes(s.domain)) return 'C# expressions require their reviewed native domain.';
  if (s.form === 'overflow' && (s.language !== 'csharp' || !['checked', 'unchecked'].includes(s.payload))) return 'C# overflow expression requires an explicit checked or unchecked context.';
  if (s.form === 'parentheses' && s.language !== 'csharp') return 'Native parentheses need reviewed target semantics.';
  if (['binary', 'unary', 'conversion'].includes(s.form) && !(s.language === 'csharp' ? ['csharp-integer', 'csharp-bool'].includes(s.domain) : s.language === 'go' ? ['go-integer', 'go-number', 'go-bool', 'go-string'].includes(s.domain) : ['', 'unknown', 'number'].includes(s.domain))) return 'Unreviewed native operator evidence domain.';
  if (s.language === 'csharp' && (s.domain === 'csharp-bool' && (s.form === 'conversion' || s.form === 'unary' && s.operator !== '!' || s.form === 'binary' && !['==', '!=', '<', '<=', '>', '>=', '&&', '||', '&', '|', '^'].includes(s.operator)) || s.domain === 'csharp-integer' && ['!', '==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(s.operator))) return 'C# operator does not match its native result domain.';
  if (s.language === 'go' && ((s.domain === 'go-bool' && !(s.form === 'unary' ? s.operator === '!' : s.form === 'binary' && ['&&', '||'].includes(s.operator))) || (s.domain === 'go-string' && !(s.form === 'binary' && s.operator === '+')))) return 'Native boolean/string evidence must match its operator.';
  if (s.language === 'go' && ['!', '&&', '||'].includes(s.operator) && s.domain !== 'go-bool') return 'Native boolean operators require boolean evidence.';
  if (s.form === 'conversion' && (s.language === 'csharp' ? !CSHARP_INTEGER_TYPES.includes(s.targetType as typeof CSHARP_INTEGER_TYPES[number]) : s.language !== 'go' || s.domain !== 'go-number' || ![...GO_INTEGER_TYPES, 'float32', 'float64'].includes(s.targetType ?? ''))) return 'Numeric conversion requires a reviewed visible native target type.';
  if (s.form === 'binary' && !NATIVE_OPERATORS[s.language].includes(s.operator)) return 'Unreviewed native operator.';
  if (s.form === 'unary' && !(s.language === 'csharp' ? ['+', '-', '~', '!'] : s.language === 'go' ? ['+', '-', '^', '!'] : ['+', '-']).includes(s.operator)) return 'Unreviewed native unary operator.';
  if (s.form === 'slice' && !/^[01]{2,3}$/.test(s.payload)) return 'Slice bounds must declare two or three explicit present/absent slots.';
  if (s.form === 'scalar') {
    if (s.language === 'csharp') {
      if (s.domain === 'csharp-bool') { if (!['true', 'false'].includes(s.payload)) return 'Invalid C# Boolean token.'; }
      else try { csharpIntegerLiteral(s.payload); } catch { return 'Invalid or over-budget C# integral token.'; }
    } else if (s.language === 'go') {
      if (!['go-integer', 'go-float'].includes(s.domain)) return 'Go scalar expressions require exact native numeric tokens.';
      try { if (s.domain === 'go-float') goFloatLiteral(s.payload); else goIntegerLiteral(s.payload); } catch { return 'Invalid or over-budget Go numeric token.'; }
    } else if (['javascript-number', 'python-float'].includes(s.domain)) {
      if ((s.domain.startsWith('javascript') ? 'javascript' : 'python') !== s.language || !/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s.payload)) return 'Exact numeric value or target is invalid.';
    } else if (['javascript-bigint', 'python-integer', 'go-integer', 'go-float'].includes(s.domain)) {
      if ((s.domain.startsWith('javascript') ? 'javascript' : 'python') !== s.language || !/^(?:0|-?[1-9][0-9]*)$/.test(s.payload)) return 'Exact integer payload or target is invalid.';
    } else if (s.domain === 'javascript-null' || s.domain === 'python-none') {
      if ((s.domain === 'javascript-null' ? 'javascript' : 'python') !== s.language || s.payload !== '') return 'Native null/None payload or target is invalid.';
    } else if (s.domain !== 'string') return 'Unknown native scalar domain.';
  }
  if (s.payload.length > 128 * 1024) return 'Native payload exceeds the source budget.';
  if (data.outputs.length !== 1 || data.outputs[0].id !== 'result' || data.outputs[0].type !== nativeExpressionOutputType(s)) return 'Native expressions require one explicit value output.';
  const pins = nativeExpressionPins(s);
  if (s.count !== pins.length) return 'Operand count does not match the native form.';
  if (JSON.stringify(data.inputs.map(pin => [pin.id, pin.type])) !== JSON.stringify(pins.map(pin => [pin.id, pin.type]))) return 'Native operand pins do not match the declared form and arity.';
}
