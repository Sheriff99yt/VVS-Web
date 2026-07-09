import { PackTemplateMissingError, renderTemplate, requireTemplate } from '@vvs/syntax-packs';
import { offsetSpans } from '../codeExpr';
import type { IrExpr } from '../ir/types';
import type { ExprPrinter, PrintContext, PrintedExpr } from './types';
import { isPackDrivenFamily } from './template';

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

function renderExprTemplate(
  ctx: PrintContext,
  key: string,
  slots: Record<string, { text: string; spans: PrintedExpr['spans'] }>,
  nodeId: string
): PrintedExpr {
  const row = requireTemplate(ctx.profile, key, ctx.family);
  const rendered = renderTemplate(row, slots, ctx.profile?.layout);
  return {
    text: rendered.text,
    spans: [
      { nodeId, start: 0, end: rendered.text.length },
      ...rendered.expressionSpans,
    ],
  };
}

export function printLiteralExpr(expr: IrExpr, ctx: PrintContext): PrintedExpr {
  if (expr.kind !== 'Literal') throw new Error('expected Literal');
  if (expr.literalType === 'boolean') {
    const key = (expr.value as boolean) ? 'BoolLiteralTrue' : 'BoolLiteralFalse';
    return renderExprTemplate(ctx, key, {}, expr.sourceGraphNodeId);
  }
  if (expr.literalType === 'null') {
    return renderExprTemplate(ctx, 'NullLiteral', {}, expr.sourceGraphNodeId);
  }
  let text: string;
  if (expr.literalType === 'raw') text = String(expr.value);
  else if (expr.literalType === 'string') text = `"${expr.value}"`;
  else text = String(expr.value);
  return { text, spans: [] };
}

export function printInstanceRefExpr(expr: IrExpr, ctx: PrintContext): PrintedExpr {
  if (expr.kind !== 'InstanceRef') throw new Error('expected InstanceRef');
  return renderExprTemplate(
    ctx,
    'InstanceRef',
    { name: { text: expr.name, spans: [] } },
    expr.sourceGraphNodeId
  );
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

export function printConvertToStringExpr(expr: IrExpr, ctx: PrintContext, printExpr: ExprPrinter): PrintedExpr {
  if (expr.kind !== 'ConvertToString') throw new Error('expected ConvertToString');
  const inner = printExpr(expr.value, ctx);
  return renderExprTemplate(ctx, 'ConvertToString', { value: inner }, expr.sourceGraphNodeId);
}

export function printConvertToNumberExpr(expr: IrExpr, ctx: PrintContext, printExpr: ExprPrinter): PrintedExpr {
  if (expr.kind !== 'ConvertToNumber') throw new Error('expected ConvertToNumber');
  const inner = printExpr(expr.value, ctx);
  return renderExprTemplate(ctx, 'ConvertToNumber', { value: inner }, expr.sourceGraphNodeId);
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
        if (isPackDrivenFamily(ctx.family)) {
          throw new PackTemplateMissingError(expr.kind, ctx.family);
        }
        return { text: '/* unknown expr */', spans: [] };
    }
  };
  return printExpr;
}

export { mergeArgs };
