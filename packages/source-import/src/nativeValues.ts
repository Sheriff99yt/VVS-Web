import { parser as pythonParser } from '@lezer/python';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan } from './contracts';
import { checkSourceBudget, parseJavaScript } from './parser';

export type NativeValueProfile = 'javascript.es2022' | 'python.3.11';
/** These are transient parser facts, never an alternate editable source or IR. */
export type NativeScalar =
  | { domain: 'javascript-number' | 'python-float'; encoding: 'ieee754-binary64-be'; payload: string }
  | { domain: 'javascript-bigint' | 'python-integer'; encoding: 'decimal-integer'; payload: string }
  | { domain: 'boolean'; encoding: 'boolean'; payload: boolean }
  | { domain: 'javascript-null' | 'python-none'; encoding: 'null'; payload: null }
  | { domain: 'string'; encoding: 'decoded-string' | 'source-token'; payload: string };
export interface NativeValueFact extends SourceSpan {
  syntax: string; kind: 'scalar' | 'collection' | 'operator' | 'access';
  scalar?: NativeScalar;
  /** Ordered syntactic operands; this does not resolve calls, coercions or effects. */
  operands: SourceSpan[];
  mapping: 'not-certified';
}
export interface NativeValueInventory {
  contractVersion: 1; profile: NativeValueProfile;
  parser: { id: string; version: string }; source: string;
  facts: NativeValueFact[];
  acceptance: 'inventory-only';
}

function binary64(value: number): string {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, false);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
function integer(token: string): string {
  const cleaned = token.replaceAll('_', '').replace(/n$/, '');
  const negative = cleaned.startsWith('-');
  const unsigned = cleaned.replace(/^[+-]/, '');
  return (BigInt(unsigned) * BigInt(negative ? -1 : 1)).toString();
}

/** Called only for parser-recognized numeric tokens. */
export function pythonNumericScalar(token: string): NativeScalar | undefined {
  const cleaned = token.replaceAll('_', '').replace(/\s/g, '');
  if (/[jJ]$/.test(cleaned)) return undefined;
  return /^(?:[+-]?0[xob])/i.test(cleaned) || !/[.eE]/.test(cleaned)
    ? { domain: 'python-integer', encoding: 'decimal-integer', payload: integer(cleaned) }
    : { domain: 'python-float', encoding: 'ieee754-binary64-be', payload: binary64(Number(cleaned)) };
}

/** Inventory uses complete native parser trees, with no recovery or source execution. */
export function inventoryNativeValues(source: string, profile: NativeValueProfile): NativeValueInventory {
  checkSourceBudget(source);
  const started = performance.now();
  const facts: NativeValueFact[] = [];
  const add = (start: number, end: number, kind: NativeValueFact['kind'], operands: SourceSpan[] = [], scalar?: NativeScalar) => {
    facts.push({ start, end, syntax: source.slice(start, end), kind, operands, ...(scalar ? { scalar } : {}), mapping: 'not-certified' });
  };
  if (profile === 'javascript.es2022') {
    type Node = { type: string; start: number; end: number; value?: unknown; operator?: string; argument?: Node; [key: string]: unknown };
    const visit = (node: Node) => {
      const signed = node.type === 'UnaryExpression' && ['-', '+'].includes(node.operator ?? '') && ['NumericLiteral', 'BigIntLiteral'].includes(node.argument?.type ?? '');
      const literal = signed ? node.argument! : node;
      let scalar: NativeScalar | undefined;
      if (literal.type === 'NumericLiteral') scalar = { domain: 'javascript-number', encoding: 'ieee754-binary64-be', payload: binary64((node.operator === '-' && signed ? -1 : 1) * Number(literal.value)) };
      else if (literal.type === 'BigIntLiteral' && !(signed && node.operator === '+')) scalar = { domain: 'javascript-bigint', encoding: 'decimal-integer', payload: integer(`${signed && node.operator === '-' ? '-' : ''}${source.slice(literal.start, literal.end)}`) };
      else if (literal.type === 'StringLiteral') scalar = { domain: 'string', encoding: 'decoded-string', payload: String(literal.value) };
      else if (literal.type === 'BooleanLiteral') scalar = { domain: 'boolean', encoding: 'boolean', payload: Boolean(literal.value) };
      else if (literal.type === 'NullLiteral') scalar = { domain: 'javascript-null', encoding: 'null', payload: null };
      if (scalar) { add(node.start, node.end, 'scalar', [], scalar); return; }
      const children: Node[] = [];
      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
        for (const child of Array.isArray(value) ? value : [value]) if (child && typeof child === 'object' && 'type' in child) children.push(child as Node);
      }
      children.sort((a, b) => a.start - b.start || a.end - b.end);
      const operands = children.map(child => ({ start: child.start, end: child.end }));
      if (['ArrayExpression', 'ObjectExpression', 'SpreadElement', 'ObjectProperty', 'ObjectMethod'].includes(node.type)) add(node.start, node.end, 'collection', operands);
      else if (['BinaryExpression', 'LogicalExpression', 'UnaryExpression', 'UpdateExpression', 'AssignmentExpression'].includes(node.type)) add(node.start, node.end, 'operator', operands);
      else if (node.type === 'MemberExpression') add(node.start, node.end, 'access', operands);
      children.forEach(visit);
    };
    visit(parseJavaScript(source, 'module').program as unknown as Node);
  } else if (profile === 'python.3.11') {
    const root = pythonParser.parse(source).topNode;
    const cursor = root.cursor(); let scanned = 0;
    do {
      if (cursor.type.isError) throw new ImportFailure('NATIVE_VALUE_PARSE', 'Python inventory requires a complete tree without parser recovery.');
      if (++scanned > IMPORT_LIMITS.astNodes || performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('AST_BUDGET', 'Native value inventory exceeds its tree budget.');
    } while (cursor.next());
    type Node = typeof root;
    let count = 0;
    const visit = (node: Node, depth: number) => {
      if (node.type.isError) throw new ImportFailure('NATIVE_VALUE_PARSE', 'Python inventory requires a complete tree without parser recovery.');
      if (++count > IMPORT_LIMITS.astNodes || depth > IMPORT_LIMITS.depth || performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('AST_BUDGET', 'Native value inventory exceeds its tree budget.');
      const children: Node[] = [];
      for (let child = node.firstChild; child; child = child.nextSibling) children.push(child);
      const signed = node.name === 'UnaryExpression' && children.length === 2 && children[1].name === 'Number' && ['-', '+'].includes(source.slice(children[0].from, children[0].to));
      const literal = signed ? children[1] : node;
      const token = source.slice(node.from, node.to);
      let scalar: NativeScalar | undefined;
      if (literal.name === 'Number') {
        scalar = pythonNumericScalar(token);
      } else if (literal.name === 'Boolean') scalar = { domain: 'boolean', encoding: 'boolean', payload: token === 'True' };
      else if (literal.name === 'None') scalar = { domain: 'python-none', encoding: 'null', payload: null };
      else if (literal.name === 'String') scalar = { domain: 'string', encoding: 'source-token', payload: token };
      if (scalar) { add(node.from, node.to, 'scalar', [], scalar); return; }
      if (literal.name === 'Number') { add(node.from, node.to, 'scalar'); return; }
      const operands = children.filter(child => !['[', ']', '{', '}', '(', ')', ',', ':', 'ArithOp', 'CompareOp', 'LogicOp'].includes(child.name)).map(child => ({ start: child.from, end: child.to }));
      if (['ArrayExpression', 'DictionaryExpression', 'TupleExpression', 'SetExpression'].includes(node.name)) add(node.from, node.to, 'collection', operands);
      else if (['BinaryExpression', 'UnaryExpression', 'CompareExpression'].includes(node.name)) add(node.from, node.to, 'operator', operands);
      else if (['MemberExpression'].includes(node.name)) add(node.from, node.to, 'access', operands);
      children.forEach(child => visit(child, depth + 1));
    };
    visit(root, 0);
  } else throw new ImportFailure('NATIVE_VALUE_PROFILE', 'No native-value inventory is implemented for this profile.');
  facts.sort((a, b) => a.start - b.start || b.end - a.end);
  return { contractVersion: 1, profile, parser: profile === 'javascript.es2022' ? { id: '@babel/parser', version: '7.29.9' } : { id: '@lezer/python', version: '1.1.18' }, source, facts, acceptance: 'inventory-only' };
}
