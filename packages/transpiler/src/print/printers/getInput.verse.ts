import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';

/** Verse has no blocking stdin in v1 — emit visible prompt line; temp var wired by follow-up Set. */
export function printGetInputVerse(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const prefix = `${ctx.indent}Print(`;
  const suffix = ')';
  const text = `${prefix}${prompt.text}${suffix}`;
  return {
    text,
    expressionSpans: offsetSpans(prompt.spans, prefix.length),
  };
}
