import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';

export function printGetInputPython(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const rhs =
    inputKind === 'number' ? `float(input(${prompt.text}))` : `input(${prompt.text})`;
  const prefix = `${ctx.indent}${varName} = `;
  return {
    text: `${prefix}${rhs}`,
    expressionSpans: offsetSpans(
      prompt.spans,
      prefix.length + (inputKind === 'number' ? 12 : 6)
    ),
  };
}
