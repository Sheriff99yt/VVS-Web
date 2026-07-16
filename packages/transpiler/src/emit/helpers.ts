import type { FunctionSymbol, TargetLanguage } from '@vvs/graph-types';
import { defaultCodegenTarget } from '@vvs/graph-types';
import { isNodeEffectiveForLanguage } from '@vvs/language-profiles';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule, IrModuleImport, IrStatement } from '../ir/types';
import { createPrintContext, type PrintContext } from '../print';
import { commentPrefixFromPack } from '../print/template';
import { bodyIndent } from '../lower/graphToIr';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import {
  overloadParamNames,
  renderFunctionDeclPrototype,
  renderFunctionDefHeader,
} from './shell';
import { appendIrStatements } from './sinkStatements';

export { overloadParamNames } from './shell';

export function functionNeedsAsync(
  ir: IrModule,
  funcId: string,
  properties?: Record<string, unknown>
): boolean {
  // Async keyword only from define-node `isAsync` (or dual-written symbol flags) — never infer from body.
  if (properties?.isAsync != null) return Boolean(properties.isAsync);
  const member = ir.members.find(
    (m): m is Extract<import('../ir/types').IrMemberDecl, { kind: 'FunctionDecl' }> =>
      m.kind === 'FunctionDecl' && m.symbol.id === funcId
  );
  if (member?.properties?.isAsync != null) return Boolean(member.properties.isAsync);
  const func = ir.functions.find((f) => f.id === funcId);
  return Boolean(func?.flags?.async);
}

export function formatFunctionDefHeader(
  func: FunctionSymbol,
  targetLanguage: TargetLanguage,
  isAsync = false,
  properties?: Record<string, unknown>
): string {
  return renderFunctionDefHeader(func, targetLanguage, isAsync, properties);
}

/** C++-style declaration prototype (`void foo();`) — null when the target has no separate declare form. */
export function formatFunctionDeclPrototype(
  func: FunctionSymbol,
  targetLanguage: TargetLanguage,
  properties?: Record<string, unknown>
): string | null {
  return renderFunctionDeclPrototype(func, targetLanguage, properties);
}

export function printContextForIr(
  ir: IrModule,
  indent: string,
  environmentManifest?: ProjectEnvironmentManifest
): PrintContext {
  const target = ir.codegenTarget ?? defaultCodegenTarget(ir.targetLanguage);
  const family = target?.family ?? 'python';
  return createPrintContext(
    family,
    target?.capabilities ?? [],
    indent,
    target?.packLock,
    environmentManifest
  );
}

export { appendIrStatements } from './sinkStatements';

const IMPORT_MODULE_KIND = 'vvs.project.import_module';

function moduleImportProps(stmt: IrModuleImport): Record<string, unknown> {
  return {
    targetLanguages: stmt.targetLanguages,
  };
}

/**
 * Emit one import statement at the current sink position (canvas chain order).
 * Language-gated imports that do not match the target:
 * - emitUnsupportedComments true (default) → pack `(x)` comment + sourceMap tag
 * - false → omit
 */
export function appendImportStatement(
  sink: CodeSink,
  ir: IrModule,
  stmt: IrStatement,
  environmentManifest?: ProjectEnvironmentManifest
): boolean {
  const emitComments = ir.emitUnsupportedComments !== false;
  const ctx = printContextForIr(ir, '', environmentManifest ?? ir.environmentManifest);
  const prefix = commentPrefixFromPack(ctx);

  if (stmt.kind !== 'ModuleImport') {
    appendIrStatements(sink, [stmt], ctx);
    return true;
  }

  const effective = isNodeEffectiveForLanguage(
    IMPORT_MODULE_KIND,
    moduleImportProps(stmt),
    ir.targetLanguage
  );
  if (effective) {
    appendIrStatements(sink, [stmt], ctx);
    return true;
  }
  if (!emitComments) return false;

  const label = (stmt.displayLabel?.trim() || stmt.moduleSlug).trim();
  sink.appendTagged({
    nodeId: stmt.sourceGraphNodeId,
    text: `${prefix}(x) ${label}`,
  });
  return true;
}

/**
 * @deprecated Prefer emitting Import Module members in canvas chain order via
 * `appendIrMembersInOrder`. Kept for any leftover `ir.imports` not on the chain.
 */
export function appendHoistedImports(
  sink: CodeSink,
  ir: IrModule,
  environmentManifest?: ProjectEnvironmentManifest
): void {
  if (ir.imports.length === 0) return;
  let wroteAny = false;
  for (const stmt of ir.imports) {
    if (appendImportStatement(sink, ir, stmt, environmentManifest)) wroteAny = true;
  }
  if (wroteAny) sink.appendRaw('');
}

export function appendFunctionBody(
  sink: CodeSink,
  ir: IrModule,
  funcId: string,
  emptyLine: string,
  environmentManifest?: ProjectEnvironmentManifest
): void {
  const body = ir.functionBodies[funcId];
  if (!body || body.length === 0) {
    sink.appendRaw(emptyLine);
    return;
  }
  const family = ir.codegenTarget?.family ?? 'python';
  const ctx = printContextForIr(ir, bodyIndent(family), environmentManifest);
  appendIrStatements(sink, body, ctx);
}

export type StartHandlerAppender = (
  sink: CodeSink,
  sourceGraphNodeId: string,
  body: IrStatement[]
) => void;

export type EventHandlerAppender = (
  sink: CodeSink,
  handler: IrEventHandler
) => void;
