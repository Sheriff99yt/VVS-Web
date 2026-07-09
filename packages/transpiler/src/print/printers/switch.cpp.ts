import type { IrSwitch, IrStatement } from '../../ir/types';
import { createDefaultExprPrinter } from '../expr';
import { blockPlaceholder, nestedIndent } from '../template';
import { caseLabelLiteral } from '../blocks';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createCppSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx);
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const lines = [`${ctx.indent}switch (${selector.text}) {`];
    for (const c of s.cases) {
      lines.push(`${ctx.indent}  case ${caseLabelLiteral(c.label)}:`);
      const body = printStatements(c.body, inner);
      if (body.length > 0) {
        lines.push(body.map((p) => p.text).join('\n'));
      } else {
        lines.push(`${inner.indent}    ${blockPlaceholder(ctx)}`);
      }
      lines.push(`${inner.indent}    break;`);
    }
    if (s.defaultBody.length > 0) {
      lines.push(`${ctx.indent}  default:`);
      const body = printStatements(s.defaultBody, inner);
      lines.push(body.map((p) => p.text).join('\n'));
      lines.push(`${inner.indent}    break;`);
    }
    lines.push(`${ctx.indent}}`);
    return { text: lines.join('\n'), expressionSpans: [] };
  };
}
