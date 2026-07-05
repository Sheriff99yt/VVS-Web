import { offsetSpans } from '../codeExpr';
import type { IrExpr } from '../ir/types';
import type { ExprPrinter, PrintContext, PrintedExpr } from './types';

function wrapCall(
  nodeId: string,
  open: string,
  inner: PrintedExpr,
  close: string
): PrintedExpr {
  const text = `${open}${inner.text}${close}`;
  return {
    text,
    spans: [
      { nodeId, start: 0, end: text.length },
      ...offsetSpans(inner.spans, open.length),
    ],
  };
}

function mergeArgs(args: PrintedExpr[]): { text: string; spans: import('../codeExpr').ExprSpan[] } {
  const spans: import('../codeExpr').ExprSpan[] = [];
  const parts: string[] = [];
  let cursor = 0;
  for (let i = 0; i < args.length; i++) {
    const part = args[i]!;
    parts.push(part.text);
    spans.push(...offsetSpans(part.spans, cursor));
    cursor += part.text.length;
    if (i < args.length - 1) {
      cursor += 2;
    }
  }
  return { text: parts.join(', '), spans };
}

function nullLiteral(family: PrintContext['family']): string {
  if (family === 'python') return 'None';
  if (family === 'verse') return '""';
  return 'null';
}

function boolLiteral(family: PrintContext['family'], value: boolean): string {
  if (family === 'python') return value ? 'True' : 'False';
  return String(value);
}

export function printLiteralExpr(expr: IrExpr, ctx: PrintContext): PrintedExpr {
  if (expr.kind !== 'Literal') throw new Error('expected Literal');
  let text: string;
  if (expr.literalType === 'raw') text = String(expr.value);
  else if (expr.literalType === 'string') text = `"${expr.value}"`;
  else if (expr.literalType === 'boolean') text = boolLiteral(ctx.family, expr.value as boolean);
  else if (expr.literalType === 'null') text = nullLiteral(ctx.family);
  else text = String(expr.value);
  return { text, spans: [] };
}

export function printInstanceRefExpr(expr: IrExpr, ctx: PrintContext): PrintedExpr {
  if (expr.kind !== 'InstanceRef') throw new Error('expected InstanceRef');
  const text =
    ctx.family === 'python'
      ? `self.${expr.name}`
      : ctx.family === 'javascript'
        ? `this.${expr.name}`
        : expr.name;
  return {
    text,
    spans: text ? [{ nodeId: expr.sourceGraphNodeId, start: 0, end: text.length }] : [],
  };
}

export function printLocalRefExpr(expr: IrExpr, ctx: PrintContext): PrintedExpr {
  if (expr.kind !== 'LocalRef') throw new Error('expected LocalRef');
  return {
    text: expr.name,
    spans: [{ nodeId: expr.sourceGraphNodeId, start: 0, end: expr.name.length }],
  };
}

export function printBinaryOpExpr(expr: IrExpr, ctx: PrintContext, printExpr: ExprPrinter): PrintedExpr {
  if (expr.kind !== 'BinaryOp') throw new Error('expected BinaryOp');
  const left = printExpr(expr.left, ctx);
  const right = printExpr(expr.right, ctx);
  const inner = `${left.text} ${expr.op} ${right.text}`;
  const open = '(';
  const text = `${open}${inner})`;
  return {
    text,
    spans: [
      { nodeId: expr.sourceGraphNodeId, start: 0, end: text.length },
      ...offsetSpans(left.spans, open.length),
      ...offsetSpans(right.spans, open.length + left.text.length + expr.op.length + 2),
    ],
  };
}

const CONVERT_TO_STRING: Record<PrintContext['family'], string> = {
  python: 'str',
  javascript: 'String',
  cpp: 'std::to_string',
  verse: 'ToString',
};

const CONVERT_TO_NUMBER: Record<PrintContext['family'], string> = {
  python: 'float',
  javascript: 'parseFloat',
  cpp: 'std::stof',
  verse: 'ParseFloat',
};

export function printConvertToStringExpr(expr: IrExpr, ctx: PrintContext, printExpr: ExprPrinter): PrintedExpr {
  if (expr.kind !== 'ConvertToString') throw new Error('expected ConvertToString');
  const fn = CONVERT_TO_STRING[ctx.family];
  const inner = printExpr(expr.value, ctx);
  return wrapCall(expr.sourceGraphNodeId, `${fn}(`, inner, ')');
}

export function printConvertToNumberExpr(expr: IrExpr, ctx: PrintContext, printExpr: ExprPrinter): PrintedExpr {
  if (expr.kind !== 'ConvertToNumber') throw new Error('expected ConvertToNumber');
  const fn = CONVERT_TO_NUMBER[ctx.family];
  const inner = printExpr(expr.value, ctx);
  return wrapCall(expr.sourceGraphNodeId, `${fn}(`, inner, ')');
}

export function printGetInputTempExpr(expr: IrExpr): PrintedExpr {
  if (expr.kind !== 'GetInputTemp') throw new Error('expected GetInputTemp');
  return {
    text: expr.tempName,
    spans: [{ nodeId: expr.sourceGraphNodeId, start: 0, end: expr.tempName.length }],
  };
}

export function createDefaultExprPrinter(): ExprPrinter {
  const printExpr: ExprPrinter = (expr, ctx) => {
    switch (expr.kind) {
      case 'Literal':
        return printLiteralExpr(expr, ctx);
      case 'InstanceRef':
        return printInstanceRefExpr(expr, ctx);
      case 'LocalRef':
        return printLocalRefExpr(expr, ctx);
      case 'BinaryOp':
        return printBinaryOpExpr(expr, ctx, printExpr);
      case 'ConvertToString':
        return printConvertToStringExpr(expr, ctx, printExpr);
      case 'ConvertToNumber':
        return printConvertToNumberExpr(expr, ctx, printExpr);
      case 'GetInputTemp':
        return printGetInputTempExpr(expr);
      default:
        return { text: '/* unknown expr */', spans: [] };
    }
  };
  return printExpr;
}

export { mergeArgs, wrapCall };
