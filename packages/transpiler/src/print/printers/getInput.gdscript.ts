import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';

export function printGetInputGdscript(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const readCall = `OS.read_string_from_stdin()`;
  const rhs = inputKind === 'number' ? `float(${readCall})` : readCall;
  const printPromptLine = `${ctx.indent}print(${prompt.text})\n`;
  const varLine = `${ctx.indent}var ${varName} = ${rhs}`;
  return {
    text: `${printPromptLine}${varLine}`,
    expressionSpans: offsetSpans(prompt.spans, `${ctx.indent}print(`.length),
  };
}
