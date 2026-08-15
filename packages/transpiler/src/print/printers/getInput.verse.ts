import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import { commentPrefixFromPack } from '../template';
import type { PrintContext, PrintedStmt } from '../types';

/**
 * Verse has no blocking stdin / string-read API on a plain class.
 * Emit the prompt (real Print), an honest (x) marker, and a typed local
 * so the GetInput value pin stays locatable. inputKind only changes the
 * binding type — not a hidden runtime.
 */
export function printGetInputVerse(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const inputKind = stmt.inputKind ?? 'text';
  const comment = commentPrefixFromPack(ctx);
  const prefix = `${ctx.indent}Print(`;
  const suffix = ')';
  const varType = inputKind === 'number' ? 'float = 0.0' : 'string = ""';
  const text =
    `${prefix}${prompt.text}${suffix}\n` +
    `${ctx.indent}${comment}(x) Get User Input\n` +
    `${ctx.indent}var ${stmt.targetName} : ${varType}`;
  return {
    text,
    expressionSpans: offsetSpans(prompt.spans, prefix.length),
  };
}
