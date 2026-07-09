import type { IrSwitch, IrStatement } from '../../ir/types';
import { createDefaultExprPrinter } from '../expr';
import { blockPlaceholder, nestedIndent } from '../template';
import { caseLabelLiteral } from '../blocks';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createGdscriptSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx);
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const selTemp = '_vvs_sel';
    const lines = [`${ctx.indent}${selTemp} = ${selector.text}`];
    s.cases.forEach((c, i) => {
      const kw = i === 0 ? 'if' : 'elif';
      lines.push(`${ctx.indent}${kw} ${selTemp} == ${caseLabelLiteral(c.label)}:`);
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
