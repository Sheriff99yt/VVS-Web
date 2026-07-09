import type { IrStatement, IrSwitch } from '../../ir/types';
import { createDefaultExprPrinter } from '../expr';
import { blockPlaceholder, nestedIndent } from '../template';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createVerseSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx).text;
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const lines = [`${ctx.indent}# switch (${selector})`];
    s.cases.forEach((c) => {
      lines.push(`${ctx.indent}if (${selector} = ${JSON.stringify(c.label)}):`);
      const body = printStatements(c.body, inner);
      lines.push(
        body.length > 0
          ? body.map((p) => p.text).join('\n')
          : `${inner.indent}${blockPlaceholder(ctx)}`
      );
    });
    if (s.defaultBody.length > 0) {
      lines.push(`${ctx.indent}else:`);
      const body = printStatements(s.defaultBody, inner);
      lines.push(body.map((p) => p.text).join('\n'));
    }
    return { text: lines.join('\n'), expressionSpans: [] };
  };
}
