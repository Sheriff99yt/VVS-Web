import type { IrSwitch } from '../../ir/types';
import { createDefaultExprPrinter } from '../expr';
import { printFromTemplate } from '../template';
import type { PrintContext, PrintedStmt } from '../types';

/** Synthetic binder for switch selector (pack `SwitchSelectBind`). */
export const SWITCH_SEL_TEMP = '_vvs_sel';

/** Pack-driven selector bind with selector expressionSpans (U64a). */
export function printSwitchSelectBind(stmt: IrSwitch, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const selector = printExpr(stmt.selector, ctx);
  return printFromTemplate(ctx, 'SwitchSelectBind', {
    name: SWITCH_SEL_TEMP,
    value: { text: selector.text, spans: selector.spans },
  });
}
