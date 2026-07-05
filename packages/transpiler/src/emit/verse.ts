import { variableDataTypeToLegacyEmitKind, type VariableSymbol } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule, IrStatement } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  formatFunctionDefHeader,
  printContextForIr,
} from './helpers';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';

function verseType(variable: VariableSymbol): string {
  const emitKind = variableDataTypeToLegacyEmitKind(variable.type);
  if (emitKind === 'number') return 'float';
  if (emitKind === 'string') return 'string';
  if (emitKind === 'boolean') return 'logic';
  return 'any';
}

function appendVerseStartHandler(sink: CodeSink, ir: IrModule, sourceGraphNodeId: string, body: IrStatement[]): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n    on_start<override>() : void =');
  const ctx = printContextForIr(ir, bodyIndent('verse'), ir.environmentManifest);
  if (body.length === 0) sink.appendRaw('        # empty');
  else appendIrStatements(sink, body, ctx);
  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, 'on_start()');
}

function appendVerseEventHandler(sink: CodeSink, ir: IrModule, handler: IrEventHandler): void {
  const params = handler.paramNames.map((p) => `${p} : float`).join(', ');
  const signature = params
    ? `on_${handler.handlerName}<override>(${params}) : void =`
    : `on_${handler.handlerName}<override>() : void =`;
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    ${signature}`);
  const ctx = printContextForIr(ir, handlerBodyIndent('verse'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        # empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, `on_${handler.handlerName}`);
}

export function emitVerseModule(sink: CodeSink, ir: IrModule): void {
  appendHoistedImports(sink, ir);
  const base = ir.extendsType ? `(${ir.extendsType})` : '';
  sink.appendRaw(`${ir.moduleName} := class${base}:`);
  for (const v of ir.variables) {
    const val = typeof v.defaultValue === 'string' ? `"${v.defaultValue}"` : v.defaultValue;
    sink.appendRaw(`    var ${v.name} : ${verseType(v)} = ${val}`);
  }
  for (const f of ir.functions) {
    sink.appendRaw(`\n${formatFunctionDefHeader(f, 'verse')}`);
    appendFunctionBody(sink, ir, f.id, '        # empty', ir.environmentManifest);
  }
  const bodyCtx = printContextForIr(ir, bodyIndent('verse'), ir.environmentManifest);
  if (ir.startEvent?.isExplicitStartEvent) {
    appendVerseStartHandler(sink, ir, ir.startEvent.sourceGraphNodeId, ir.onStartBody);
  } else {
    sink.appendRaw('\n    on_start<override>() : void =');
    if (ir.onStartBody.length === 0) sink.appendRaw('        # empty');
    else appendIrStatements(sink, ir.onStartBody, bodyCtx);
  }
  for (const handler of ir.eventHandlers) {
    appendVerseEventHandler(sink, ir, handler);
  }
}

export function emitVerseFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'verse'));
  appendFunctionBody(sink, ir, func.id, '        # empty', ir.environmentManifest);
}
