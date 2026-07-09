import type { IrStatement, IrSwitch } from '../../ir/types';
import { createDefaultExprPrinter } from '../expr';
import { caseLabelLiteral } from '../blocks';
import { nestedIndent } from '../template';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createCsharpSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx).text;
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const caseLines = s.cases.map((c) => {
      const body = printStatements(c.body, inner);
      const bodyText =
        body.length > 0
          ? body.map((p) => p.text).join('\n')
          : `${inner.indent}// empty`;
      return `${ctx.indent}    case ${caseLabelLiteral(c.label)}:\n${bodyText}\n${inner.indent}        break;`;
    });
    const defaultBody = printStatements(s.defaultBody, inner);
    const defaultClause =
      defaultBody.length > 0
        ? `\n${ctx.indent}    default:\n${defaultBody.map((p) => p.text).join('\n')}\n${inner.indent}        break;`
        : '';
    return {
      text: `${ctx.indent}switch (${selector}) {\n${caseLines.join('\n')}${defaultClause}\n${ctx.indent}}`,
      expressionSpans: [],
    };
  };
}
