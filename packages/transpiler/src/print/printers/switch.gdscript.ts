import type { IrSwitch, IrStatement } from '../../ir/types';
import { blockPlaceholder, nestedIndent } from '../template';
import { formatSwitchCaseLabel } from '../blocks';
import type { PrintContext, PrintedStmt, StmtPrinter } from '../types';
import { printSwitchSelectBind, SWITCH_SEL_TEMP } from './switchSelectBind';

export function createGdscriptSwitchPrinter(
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): StmtPrinter {
  return (stmt, ctx) => {
    if (stmt.kind !== 'Switch') return null;
    const s = stmt as IrSwitch;
    const bind = printSwitchSelectBind(s, ctx);
    const inner = { ...ctx, indent: nestedIndent(ctx) };
    const lines = [bind.text];
    s.cases.forEach((c, i) => {
      const kw = i === 0 ? 'if' : 'elif';
      lines.push(
        `${ctx.indent}${kw} ${SWITCH_SEL_TEMP} == ${formatSwitchCaseLabel(c, ctx.family)}:`
      );
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
    return { text: lines.join('\n'), expressionSpans: bind.expressionSpans };
  };
}
