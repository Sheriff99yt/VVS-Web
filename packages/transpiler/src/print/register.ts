import type { PrinterRegistry } from './types';
import { printGetInputCpp } from './printers/getInput.cpp';
import { printGetInputGdscript } from './printers/getInput.gdscript';
import { printGetInputRust } from './printers/getInput.rust';
import { printGetInputCsharp } from './printers/getInput.csharp';
import { printGetInputJavascript } from './printers/getInput.javascript';
import { printGetInputPython } from './printers/getInput.python';
import { printGetInputVerse } from './printers/getInput.verse';
import { createCppSwitchPrinter } from './printers/switch.cpp';
import { createGdscriptSwitchPrinter } from './printers/switch.gdscript';
import { createRustSwitchPrinter } from './printers/switch.rust';
import { createCsharpSwitchPrinter } from './printers/switch.csharp';
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
  registry.registerStmt('AssignVariable:get_input', 'gdscript', wrapAssignGetInput(printGetInputGdscript));
  registry.registerStmt('AssignVariable:get_input', 'rust', wrapAssignGetInput(printGetInputRust));
  registry.registerStmt('AssignVariable:get_input', 'csharp', wrapAssignGetInput(printGetInputCsharp));
  registry.registerStmt('Switch', 'python', createPythonSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'cpp', createCppSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'javascript', createJavascriptSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'verse', createVerseSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'gdscript', createGdscriptSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'rust', createRustSwitchPrinter(printStatements));
  registry.registerStmt('Switch', 'csharp', createCsharpSwitchPrinter(printStatements));
}
