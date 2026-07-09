import type { IrStatement, IrSwitch } from '../../ir/types';
import { createDefaultExprPrinter } from '../expr';
import { blockPlaceholder, nestedIndent } from '../template';
import { caseLabelLiteral } from '../blocks';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createRustSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx);
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const selTemp = '_vvs_sel';
    const lines = [`${ctx.indent}let ${selTemp} = ${selector.text};`];
    s.cases.forEach((c, i) => {
      const header =
        i === 0
          ? `${ctx.indent}if ${selTemp} == ${caseLabelLiteral(c.label)} {`
          : `${ctx.indent}} else if ${selTemp} == ${caseLabelLiteral(c.label)} {`;
      lines.push(header);
      const body = printStatements(c.body, inner);
      lines.push(
        body.length > 0
          ? body.map((p) => p.text).join('\n')
          : `${inner.indent}${blockPlaceholder(ctx)}`
      );
    });
    if (s.defaultBody.length > 0) {
      lines.push(`${ctx.indent}} else {`);
      const body = printStatements(s.defaultBody, inner);
      lines.push(body.map((p) => p.text).join('\n'));
      lines.push(`${ctx.indent}}`);
    } else if (s.cases.length > 0) {
      lines.push(`${ctx.indent}}`);
    }
    return { text: lines.join('\n'), expressionSpans: [] };
  };
}
