import type { FunctionSymbol, TargetLanguage } from '@vvs/graph-types';
import { defaultCodegenTarget } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';
import type { IrAwaitWait, IrEventHandler, IrModule, IrStatement } from '../ir/types';
import { createPrintContext, type PrintContext } from '../print';
import { bodyIndent } from '../lower/graphToIr';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import {
  overloadParamNames,
  renderFunctionDeclPrototype,
  renderFunctionDefHeader,
} from './shell';
import { appendIrStatements } from './sinkStatements';

export { overloadParamNames } from './shell';

export function functionNeedsAsync(ir: IrModule, funcId: string): boolean {
  const func = ir.functions.find((f) => f.id === funcId);
  if (func?.flags?.async) return true;
  const body = ir.functionBodies[funcId] ?? [];
  return body.some((s) => s.kind === 'AwaitWait' && (s as IrAwaitWait).async);
}

export function formatFunctionDefHeader(
  func: FunctionSymbol,
  targetLanguage: TargetLanguage,
  isAsync = false,
  isVirtual = false
): string {
  return renderFunctionDefHeader(func, targetLanguage, isAsync, isVirtual);
}

/** C++-style declaration prototype (`void foo();`) — null when the target has no separate declare form. */
export function formatFunctionDeclPrototype(
  func: FunctionSymbol,
  targetLanguage: TargetLanguage,
  isVirtual = false
): string | null {
  return renderFunctionDeclPrototype(func, targetLanguage, isVirtual);
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

export function appendHoistedImports(sink: CodeSink, ir: IrModule, environmentManifest?: ProjectEnvironmentManifest): void {
  if (ir.imports.length === 0) return;
  const ctx = printContextForIr(ir, '', environmentManifest);
  appendIrStatements(sink, ir.imports, ctx);
  sink.appendRaw('');
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
