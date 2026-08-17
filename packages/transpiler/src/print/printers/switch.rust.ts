import type { IrStatement, IrSwitch } from '../../ir/types';
import { blockPlaceholder, nestedIndent } from '../template';
import { formatSwitchCaseLabel } from '../blocks';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';

export function createRustSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const printExpr = createDefaultExprPrinter();
    const selector = printExpr(s.selector, ctx);
    const caseIndent = nestedIndent(ctx);
    const bodyCtx = { ...ctx, indent: nestedIndent({ ...ctx, indent: caseIndent }) };
    const lines = [`${ctx.indent}match ${selector.text} {`];
    for (const c of s.cases) {
      lines.push(`${caseIndent}${formatSwitchCaseLabel(c, ctx.family)} => {`);
      const body = printStatements(c.body, bodyCtx);
      lines.push(
        body.length > 0
          ? body.map((p) => p.text).join('\n')
          : `${bodyCtx.indent}${blockPlaceholder(ctx)}`
      );
      lines.push(`${caseIndent}}`);
    }
    if (s.defaultBody.length > 0) {
      lines.push(`${caseIndent}_ => {`);
      const body = printStatements(s.defaultBody, bodyCtx);
      lines.push(body.map((p) => p.text).join('\n'));
      lines.push(`${caseIndent}}`);
    }
    lines.push(`${ctx.indent}}`);
    const matchPrefix = `${ctx.indent}match `;
    return {
      text: lines.join('\n'),
      expressionSpans: selector.spans.map((span) => ({
        ...span,
        start: span.start + matchPrefix.length,
        end: span.end + matchPrefix.length,
      })),
    };
  };
}
