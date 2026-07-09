import type { PrinterRegistry } from './types';
import { printGetInputCpp } from './printers/getInput.cpp';
import { printGetInputJavascript } from './printers/getInput.javascript';
import { printGetInputPython } from './printers/getInput.python';
import { printGetInputVerse } from './printers/getInput.verse';
import { createCppSwitchPrinter } from './printers/switch.cpp';
import { createJavascriptSwitchPrinter } from './printers/switch.javascript';
import { createPythonSwitchPrinter } from './printers/switch.python';
import { createVerseSwitchPrinter } from './printers/switch.verse';
import type { PrintContext, PrintedStmt } from './types';
import type { IrStatement, IrStructuredStatement } from '../ir/types';

function wrapAssignGetInput(
  fn: (stmt: import('../ir/types').IrAssignVariable, ctx: PrintContext) => PrintedStmt
) {
  return (stmt: IrStructuredStatement, ctx: PrintContext): PrintedStmt | null => {
    if (stmt.kind !== 'AssignVariable' || stmt.assignKind !== 'get_input') return null;
    return fn(stmt, ctx);
  };
}

let registered = false;

/** Register complex TS printers for pack-driven families (get_input, switch). */
export function registerPackPrinters(
  registry: PrinterRegistry,
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): void {
  if (registered) return;
  registered = true;

  registry.registerStmt('AssignVariable:get_input', 'python', wrapAssignGetInput(printGetInputPython));
  registry.registerStmt('AssignVariable:get_input', 'cpp', wrapAssignGetInput(printGetInputCpp));
  registry.registerStmt('AssignVariable:get_input', 'javascript', wrapAssignGetInput(printGetInputJavascript));
  registry.registerStmt('AssignVariable:get_input', 'verse', wrapAssignGetInput(printGetInputVerse));
  registry.registerStmt('Switch', 'python', createPythonSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'cpp', createCppSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'javascript', createJavascriptSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'verse', createVerseSwitchPrinter(printStatements));
}
