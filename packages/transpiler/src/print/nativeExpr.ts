import { offsetSpans } from '../codeExpr';
import type { IrNativeExpression } from '../ir/types';
import type { ExprPrinter, PrintContext, PrintedExpr } from './types';

type Render = (ctx: PrintContext, key: string, slots: Record<string, PrintedExpr>, nodeId: string) => PrintedExpr;
const text = (value: string): PrintedExpr => ({ text: value, spans: [] });

export function printNativeExpression(expr: IrNativeExpression, ctx: PrintContext, print: ExprPrinter, render: Render): PrintedExpr {
  const s = expr.settings;
  if (ctx.family !== s.language) throw new Error('NATIVE_EXPRESSION_TARGET: Native expressions cannot be translated without a reviewed mapping.');
  const args = expr.operands.map(operand => print(operand, ctx));
  const emit = (key: string, slots: Record<string, PrintedExpr>) => render(ctx, key, slots, expr.sourceGraphNodeId);
  if (s.form === 'scalar') {
    let value: string;
    if (s.domain === 'string') value = JSON.stringify(s.payload);
    else if (s.domain === 'javascript-null' || s.domain === 'python-none') value = s.language === 'python' ? 'None' : 'null';
    else if (s.domain === 'javascript-bigint') value = `${s.payload}n`;
    else if (s.domain === 'native-integer' || s.domain === 'native-bool' || s.domain === 'python-integer' || s.domain === 'go-integer' || s.domain === 'go-float' || s.domain === 'csharp-integer' || s.domain === 'csharp-bool') value = s.payload;
    else {
      const number = Number(s.payload);
      value = Object.is(number, -0) ? (s.language === 'python' ? '-0.0' : '-0') : !Number.isFinite(number) ? (number < 0 ? '-1e309' : '1e309') : String(number);
      if (s.domain === 'python-float' && Number.isFinite(number) && !/[.eE]/.test(value)) value += '.0';
    }
    return emit('NativeScalar', { value: text(value) });
  }
  if (s.form === 'parentheses') return emit('NativeParentheses', { value: args[0] });
  if (s.form === 'overflow') return emit(s.payload === 'checked' ? 'NativeChecked' : 'NativeUnchecked', { value: args[0] });
  if (s.form === 'conversion') return emit('NativeNumericConversion', { target: text(s.targetType!), value: args[0] });
  if (s.form === 'binary') return emit('NativeOperatorBinary', { left: args[0], operator: text(s.operator), right: args[1] });
  if (s.form === 'unary') return s.language === 'gdscript' && s.operator === '!' ? emit('NativeLogicalNot', { value: args[0] }) : emit(['cpp', 'rust', 'gdscript'].includes(s.language) && ['+', '-'].includes(s.operator) && args[0].text.startsWith(s.operator) ? 'NativeUnarySeparated' : 'NativeUnary', { operator: text(s.operator), value: args[0] });
  if (s.form === 'slice') {
    const index: PrintedExpr = { text: '', spans: [] }; let operand = 1;
    [...s.payload].forEach((bit, slot) => {
      if (slot) index.text += ':';
      if (bit === '1') { const part = args[operand++]; index.spans.push(...offsetSpans(part.spans, index.text.length)); index.text += part.text; }
    });
    return emit('NativeIndex', { receiver: args[0], index });
  }
  if (s.form === 'index') return emit('NativeIndex', { receiver: args[0], index: args[1] });
  if (s.form === 'member') return emit('NativeMember', { receiver: args[0], name: text(s.name) });
  if (s.form === 'hole') return { text: '', spans: [] }; // Owning comma is registered by the array printer.
  if (s.form === 'spread' || s.form === 'dict-spread') return emit(s.form === 'spread' ? 'NativeSpread' : 'NativeDictSpread', { value: args[0] });
  if (s.form === 'shorthand-entry') {
    if (args[0].text !== s.name) throw new Error('NATIVE_SHORTHAND_BINDING: Key must match its resolved value binding.');
    return emit('NativeScalar', { value: args[0] });
  }
  if (['named-entry', 'quoted-entry', 'computed-entry', 'dict-entry'].includes(s.form)) return emit(s.form === 'computed-entry' ? 'NativeComputedEntry' : 'NativeEntry', { key: s.form === 'named-entry' ? text(s.name) : args[0], value: s.form === 'named-entry' ? args[0] : args[1] });
  const items: PrintedExpr = { text: '', spans: [] };
  args.forEach((part, index) => {
    const start = items.text.length;
    items.text += part.text;
    items.spans.push(...offsetSpans(part.spans, start));
    const hole = expr.operands[index].kind === 'NativeExpression' && (expr.operands[index] as IrNativeExpression).settings.form === 'hole';
    if (index < args.length - 1 || hole || (s.form === 'tuple' && args.length === 1)) {
      if (hole) items.spans.push({ nodeId: expr.operands[index].sourceGraphNodeId, start: items.text.length, end: items.text.length + 1 });
      items.text += ', ';
    }
  });
  return emit(['object', 'dict', 'set'].includes(s.form) ? 'NativeObject' : s.form === 'tuple' ? 'NativeTuple' : 'NativeArray', { items });
}
