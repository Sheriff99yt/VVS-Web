import type { LanguageFamily } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import type { ExprSpan } from '../codeExpr';
import type { IrExpr, IrExprKind } from '../ir/types';
import type { ResolvedPrintProfile } from '@vvs/syntax-packs';

export interface PrintedExpr {
  text: string;
  spans: ExprSpan[];
}

export interface PrintedStmt {
  text: string;
  expressionSpans: ExprSpan[];
}

export interface PrintContext {
  family: LanguageFamily;
  capabilities: string[];
  indent: string;
  profile?: ResolvedPrintProfile;
  environmentManifest?: ProjectEnvironmentManifest;
}

export type ExprPrinter = (expr: IrExpr, ctx: PrintContext) => PrintedExpr;
export type StmtPrinterKey = string;

export interface PrinterRegistry {
  registerExpr(kind: IrExprKind, family: LanguageFamily, printer: ExprPrinter): void;
  registerStmt(kind: string, family: LanguageFamily, printer: StmtPrinter): void;
  getExprPrinter(kind: IrExprKind, family: LanguageFamily): ExprPrinter | undefined;
  getStmtPrinter(kind: string, family: LanguageFamily): StmtPrinter | undefined;
}

export type StmtPrinter = (stmt: import('../ir/types').IrStructuredStatement, ctx: PrintContext) => PrintedStmt | null;
