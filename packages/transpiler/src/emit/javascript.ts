import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule, IrStatement } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  appendJavascriptEventHelper,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { appendIrMembers, appendLegacyPreamble, tagClassDeclLine } from './members';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';

function appendJsStartHandler(sink: CodeSink, ir: IrModule, sourceGraphNodeId: string, body: IrStatement[]): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n  on_start() {');
  const ctx = printContextForIr(ir, bodyIndent('javascript'), ir.environmentManifest);
  if (body.length === 0) sink.appendRaw('    // empty');
  else appendIrStatements(sink, body, ctx);
  sink.appendRaw('  }');
  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, 'on_start() {');
}

function appendJsEventHandler(sink: CodeSink, ir: IrModule, handler: IrEventHandler): void {
  const params = handler.paramNames.join(', ');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n  on_${handler.handlerName}(${params}) {`);
  const ctx = printContextForIr(ir, handlerBodyIndent('javascript'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('    // empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.appendRaw('  }');
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, `on_${handler.handlerName}(`);
}

export function emitJavascriptModule(sink: CodeSink, ir: IrModule): void {
  appendHoistedImports(sink, ir);
  const extendsClause = ir.extendsType ? ` extends ${ir.extendsType}` : '';
  const classLineStart = sink.lineCount + 1;
  sink.appendRaw(`class ${ir.moduleName}${extendsClause} {`);
  tagClassDeclLine(sink, ir, classLineStart);
  if (ir.needsEventHelper) {
    appendJavascriptEventHelper(sink);
  }
  if (ir.useLegacyPreamble) {
    appendLegacyPreamble(sink, ir);
  } else {
    appendIrMembers(sink, ir);
  }
  const bodyCtx = printContextForIr(ir, bodyIndent('javascript'), ir.environmentManifest);
  if (ir.startEvent?.isExplicitStartEvent) {
    appendJsStartHandler(sink, ir, ir.startEvent.sourceGraphNodeId, ir.onStartBody);
  } else {
    sink.appendRaw('\n  on_start() {');
    if (ir.onStartBody.length === 0) sink.appendRaw('    // empty');
    else appendIrStatements(sink, ir.onStartBody, bodyCtx);
    sink.appendRaw('  }');
  }
  for (const handler of ir.eventHandlers) {
    appendJsEventHandler(sink, ir, handler);
  }
  sink.appendRaw('}');
}

export function emitJavascriptFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'javascript', functionNeedsAsync(ir, func.id)));
  appendFunctionBody(sink, ir, func.id, '    // empty', ir.environmentManifest);
  sink.appendRaw('  }');
}
