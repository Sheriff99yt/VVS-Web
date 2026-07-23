import type { IrStatement, IrSwitch } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import { formatSwitchCaseLabel } from '../blocks';
import { nestedIndent } from '../template';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createGoSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx);
    const open = `${ctx.indent}switch `;
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const caseLines = s.cases.map((c) => {
      const body = printStatements(c.body, inner);
      const bodyText =
        body.length > 0
          ? body.map((p) => p.text).join('\n')
          : `${inner.indent}// empty`;
      return `${ctx.indent}case ${formatSwitchCaseLabel(c, ctx.family)}:\n${bodyText}`;
    });
    const defaultBody = printStatements(s.defaultBody, inner);
    const defaultClause =
      defaultBody.length > 0
        ? `\n${ctx.indent}default:\n${defaultBody.map((p) => p.text).join('\n')}`
        : '';
    return {
      text: `${open}${selector.text} {\n${caseLines.join('\n')}${defaultClause}\n${ctx.indent}}`,
      expressionSpans: offsetSpans(selector.spans, open.length),
    };
  };
}
