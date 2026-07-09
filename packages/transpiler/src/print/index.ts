import type { LanguageFamily } from '@vvs/graph-types';
import { resolvePrintProfile } from '@vvs/syntax-packs';
import type { IrStatement, IrStructuredStatement } from '../ir/types';
import { createDefaultExprPrinter } from './expr';
import { registerPackPrinters } from './register';
import { createStmtPrinters, printStructuredStatement, printStructuredStatements } from './stmt';
import type { ExprPrinter, PrintContext, PrintedStmt, PrinterRegistry, StmtPrinter } from './types';

class Registry implements PrinterRegistry {
  private exprPrinters = new Map<string, ExprPrinter>();
  private stmtPrinters = new Map<string, StmtPrinter>();

  registerExpr(kind: import('../ir/types').IrExprKind, family: LanguageFamily, printer: ExprPrinter): void {
    this.exprPrinters.set(`${kind}:${family}`, printer);
  }

  registerStmt(kind: string, family: LanguageFamily, printer: StmtPrinter): void {
    this.stmtPrinters.set(`${kind}:${family}`, printer);
  }

  getExprPrinter(kind: import('../ir/types').IrExprKind, family: LanguageFamily): ExprPrinter | undefined {
    return this.exprPrinters.get(`${kind}:${family}`);
  }

  getStmtPrinter(kind: string, family: LanguageFamily): StmtPrinter | undefined {
    return this.stmtPrinters.get(`${kind}:${family}`);
  }
}

export const printerRegistry = new Registry();

function stmtPrinterKey(stmt: IrStatement): string {
  if (stmt.kind === 'AssignVariable' && stmt.assignKind === 'get_input') {
    return 'AssignVariable:get_input';
  }
  return stmt.kind;
}

export function createPrintContext(
  family: LanguageFamily,
  capabilities: string[],
  indent: string,
  packLock?: { base: string; overlays: string[] },
  environmentManifest?: import('@vvs/environment-templates').ProjectEnvironmentManifest
): PrintContext {
  const profile = resolvePrintProfile(family, capabilities, packLock);
  return { family, capabilities, indent, profile, environmentManifest };
}

export function printStatement(stmt: IrStatement, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const key = stmtPrinterKey(stmt);
  const custom = printerRegistry.getStmtPrinter(key, ctx.family);
  if (custom) {
    const result = custom(stmt as IrStructuredStatement, ctx);
    if (result) return result;
  }
  const printers = createStmtPrinters(printExpr, (body, c) =>
    body.map((s) => printStatement(s, c))
  );
  return printStructuredStatement(stmt as IrStructuredStatement, ctx, printers);
}

export function printStatements(stmts: IrStatement[], ctx: PrintContext): PrintedStmt[] {
  return stmts.map((s) => printStatement(s, ctx));
}

registerPackPrinters(printerRegistry, printStatements);

export type { PrintContext, PrintedExpr, PrintedStmt, PrinterRegistry } from './types';
export { createDefaultExprPrinter } from './expr';
