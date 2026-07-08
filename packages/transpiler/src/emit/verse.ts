import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  formatFunctionDefHeader,
  printContextForIr,
} from './helpers';
import { appendIrMembers, tagClassDeclLine } from './members';
import { handlerBodyIndent } from '../lower/graphToIr';

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
  const classLineStart = sink.lineCount + 1;
  sink.appendRaw(`${ir.moduleName} := class${base}:`);
  tagClassDeclLine(sink, ir, classLineStart);
  appendIrMembers(sink, ir);
  for (const handler of ir.eventHandlers) {
    appendVerseEventHandler(sink, ir, handler);
  }
}

export function emitVerseFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'verse', false, Boolean(func.flags?.virtual)));
  appendFunctionBody(sink, ir, func.id, '        # empty', ir.environmentManifest);
}
