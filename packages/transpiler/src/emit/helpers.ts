import type { FunctionSymbol, TargetLanguage } from '@vvs/graph-types';
import { defaultCodegenTarget } from '@vvs/graph-types';
import { parameterCodegenName } from '../nodeHelpers';
import { CodeSink } from '../codeSink';
import type { IrAwaitWait, IrEventHandler, IrModule, IrStatement } from '../ir/types';
import { createPrintContext, type PrintContext } from '../print';
import { appendIrStatements } from './sinkStatements';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';

export function overloadParamNames(func: FunctionSymbol): string[] {
  return func.overloads[0]?.parameters.map((p) => parameterCodegenName(p)) ?? [];
}

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
  const params = overloadParamNames(func);
  const binding = func.binding ?? 'instance';
  if (targetLanguage === 'python') {
    const args = binding === 'instance' ? ['self', ...params].join(', ') : params.join(', ');
    const prefix = binding === 'static' ? '    @staticmethod\n    ' : '    ';
    const asyncKw = isAsync ? 'async ' : '';
    return `${prefix}${asyncKw}def ${func.name}(${args}):`;
  }
  if (targetLanguage === 'javascript') {
    const prefix = binding === 'static' ? '  static ' : '  ';
    const args = params.join(', ');
    const asyncKw = isAsync ? 'async ' : '';
    return `${prefix}${asyncKw}${func.name}(${args}) {`;
  }
  if (targetLanguage === 'cpp') {
    const prefix = binding === 'static' ? '    static ' : isVirtual ? '    virtual ' : '    ';
    const args = params.join(', ');
    return `${prefix}void ${func.name}(${args}) {`;
  }
  if (targetLanguage === 'verse') {
    const args = params.map((p, i) => {
      const param = func.overloads[0]!.parameters[i]!;
      const t = param.type === 'data_number' ? 'float' : param.type === 'data_string' ? 'string' : 'logic';
      return `${p} : ${t}`;
    }).join(', ');
    return `    ${func.name}<override>(${args}) : void =`;
  }
  return `    // ${func.name}`;
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

export function appendStartHandlerDefault(
  sink: CodeSink,
  ir: IrModule,
  openLine: string,
  closeLine: string | null,
  emptyLine: string,
  environmentManifest?: ProjectEnvironmentManifest
): void {
  sink.appendRaw(openLine);
  const family = ir.codegenTarget?.family ?? 'python';
  const ctx = printContextForIr(ir, bodyIndent(family), environmentManifest);
  if (ir.onStartBody.length === 0) sink.appendRaw(emptyLine);
  else appendIrStatements(sink, ir.onStartBody, ctx);
  if (closeLine) sink.appendRaw(closeLine);
}

export function appendEventHandlers(
  sink: CodeSink,
  handlers: IrEventHandler[],
  appender: EventHandlerAppender
): void {
  for (const handler of handlers) {
    appender(sink, handler);
  }
}
