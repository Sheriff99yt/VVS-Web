import type {
  IrForLoop,
  IrIfBranch,
  IrSequence,
  IrStatement,
  IrWhileLoop,
} from '../ir/types';
import { offsetSpans } from '../codeExpr';
import type { ExprSpan } from '../codeExpr';
import { createDefaultExprPrinter } from './expr';
import {
  appendBraceFamilyClose,
  blockCloseLine,
  condSpanOffset,
  forSpanOffset,
  ifElseLine,
  type BlockCloseKey,
} from './blockHelpers';
import {
  blockPlaceholder,
  innerIndentUnit,
  isPackDrivenFamily,
  nestedIndent,
  printFromTemplate,
} from './template';
import type { PrintContext } from './types';

export interface BlockLineMeta {
  text: string;
  exprSpans?: ExprSpan[];
  exprSpanOffset?: number;
}

export interface BuiltBlock {
  lines: BlockLineMeta[];
}

function caseLabelLiteral(label: string): string {
  if (/^-?\d+(\.\d+)?$/.test(label)) return label;
  return JSON.stringify(label);
}

function bodyLines(
  stmts: IrStatement[],
  ctx: PrintContext,
  printBody: (stmts: IrStatement[], innerCtx: PrintContext) => string[],
  options?: { placeholder?: boolean }
): string[] {
  const printed = printBody(stmts, ctx);
  if (printed.length > 0) return printed;
  if (options?.placeholder === false) return [];
  return [`${ctx.indent}${blockPlaceholder(ctx)}`];
}

function appendBraceClose(ctx: PrintContext, lines: BlockLineMeta[], key: BlockCloseKey): void {
  appendBraceFamilyClose(ctx, lines, key);
}

export function buildIfBranch(
  stmt: IrIfBranch,
  ctx: PrintContext,
  printBody: (stmts: IrStatement[], innerCtx: PrintContext) => string[]
): BuiltBlock {
  const printExpr = createDefaultExprPrinter();
  const condPrinted = printExpr(stmt.condition, ctx);
  const inner = { ...ctx, indent: nestedIndent(ctx) };
  const trueStmts = bodyLines(stmt.trueBody, inner, printBody);
  const falseStmts =
    stmt.falseBody.length > 0 ? bodyLines(stmt.falseBody, inner, printBody) : [];

  if (!isPackDrivenFamily(ctx.family)) {
    return {
      lines: [{ text: `${ctx.indent}// if (${condPrinted.text})` }],
    };
  }

  const lines: BlockLineMeta[] = [];
  const header = printFromTemplate(ctx, 'IfBranchHeader', {
    cond: { text: condPrinted.text, spans: condPrinted.spans },
  });
  lines.push({
    text: header.text,
    exprSpans: condPrinted.spans,
    exprSpanOffset: condSpanOffset(ctx.family, ctx.indent, 'if'),
  });
  lines.push(...trueStmts.map((t) => ({ text: t })));
  if (falseStmts.length > 0) {
    lines.push({ text: ifElseLine(ctx) });
    lines.push(...falseStmts.map((t) => ({ text: t })));
  }
  if (ctx.family === 'javascript' || ctx.family === 'cpp') {
    lines.push({ text: blockCloseLine(ctx, 'IfBranchClose') });
  }
  return { lines };
}

export function buildForLoop(
  stmt: IrForLoop,
  ctx: PrintContext,
  printBody: (stmts: IrStatement[], innerCtx: PrintContext) => string[]
): BuiltBlock {
  const printExpr = createDefaultExprPrinter();
  const firstPrinted = printExpr(stmt.first, ctx);
  const lastPrinted = printExpr(stmt.last, ctx);
  const inner = { ...ctx, indent: nestedIndent(ctx) };
  const bodyStmts = bodyLines(stmt.body, inner, printBody);

  if (!isPackDrivenFamily(ctx.family)) {
    return {
      lines: [{ text: `${ctx.indent}// for ${stmt.indexVar}` }],
    };
  }

  const lines: BlockLineMeta[] = [];
  const header = printFromTemplate(ctx, 'ForLoopHeader', {
    index: stmt.indexVar,
    first: firstPrinted.text,
    last: lastPrinted.text,
  });
  lines.push({
    text: header.text,
    exprSpans: [...firstPrinted.spans, ...offsetSpans(lastPrinted.spans, firstPrinted.text.length + ', '.length)],
    exprSpanOffset: forSpanOffset(ctx.family, ctx.indent, stmt.indexVar),
  });
  lines.push(...bodyStmts.map((t) => ({ text: t })));
  appendBraceClose(ctx, lines, 'ForLoopClose');
  return { lines };
}

export function buildWhileLoop(
  stmt: IrWhileLoop,
  ctx: PrintContext,
  printBody: (stmts: IrStatement[], innerCtx: PrintContext) => string[]
): BuiltBlock {
  const printExpr = createDefaultExprPrinter();
  const condPrinted = printExpr(stmt.condition, ctx);
  const inner = { ...ctx, indent: nestedIndent(ctx) };
  const bodyStmts = bodyLines(stmt.body, inner, printBody);

  if (!isPackDrivenFamily(ctx.family)) {
    return {
      lines: [{ text: `${ctx.indent}// while (${condPrinted.text})` }],
    };
  }

  const lines: BlockLineMeta[] = [];
  const header = printFromTemplate(ctx, 'WhileLoopHeader', {
    cond: { text: condPrinted.text, spans: condPrinted.spans },
  });
  lines.push({
    text: header.text,
    exprSpans: condPrinted.spans,
    exprSpanOffset: condSpanOffset(ctx.family, ctx.indent, 'while'),
  });
  lines.push(...bodyStmts.map((t) => ({ text: t })));
  appendBraceClose(ctx, lines, 'WhileLoopClose');
  return { lines };
}

export function buildSequence(
  stmt: IrSequence,
  ctx: PrintContext,
  printBody: (stmts: IrStatement[], innerCtx: PrintContext) => string[]
): BuiltBlock {
  const inner = { ...ctx, indent: nestedIndent(ctx) };
  const stepLines = stmt.steps.flatMap((step) =>
    bodyLines(step, inner, printBody, { placeholder: false })
  );

  if (!isPackDrivenFamily(ctx.family)) {
    return { lines: [{ text: `${ctx.indent}// sequence` }] };
  }

  const lines: BlockLineMeta[] = [];
  if (ctx.family === 'python' || ctx.family === 'verse') {
    lines.push({ text: printFromTemplate(ctx, 'SequenceHeader', {}).text });
    lines.push(...stepLines.map((t) => ({ text: t })));
    return { lines };
  }

  lines.push({ text: printFromTemplate(ctx, 'SequenceHeader', {}).text });
  lines.push({ text: printFromTemplate(ctx, 'SequenceComment', {}).text });
  lines.push(...stepLines.map((t) => ({ text: t })));
  lines.push({ text: printFromTemplate(ctx, 'SequenceClose', {}).text });
  return { lines };
}

/** Switch uses registered TS printers — re-export case label helper for printers. */
export { caseLabelLiteral };

export function builtBlockToText(block: BuiltBlock): string {
  return block.lines.map((l) => l.text).join('\n');
}

export function innerIndentCtx(ctx: PrintContext): PrintContext {
  return { ...ctx, indent: nestedIndent(ctx) };
}

export { innerIndentUnit, condSpanOffset, forSpanOffset, blockCloseLine, ifElseLine };
