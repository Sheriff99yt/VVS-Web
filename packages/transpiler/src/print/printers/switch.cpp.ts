import type { IrStatement, IrSwitch } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import { blockPlaceholder, nestedIndent } from '../template';
import { formatSwitchCaseLabel } from '../blocks';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createCppSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx);
    const open = `${ctx.indent}switch (`;
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const lines = [`${open}${selector.text}) {`];
    for (const c of s.cases) {
      lines.push(`${ctx.indent}  case ${formatSwitchCaseLabel(c, ctx.family)}:`);
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
    return {
      text: lines.join('\n'),
      expressionSpans: offsetSpans(selector.spans, open.length),
    };
  };
}
