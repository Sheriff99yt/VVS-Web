import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule, IrStatement } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  formatFunctionDefHeader,
  printContextForIr,
} from './helpers';
import { appendIrMembers, appendLegacyPreamble, tagClassDeclLine } from './members';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';

function appendCppStartHandler(sink: CodeSink, ir: IrModule, sourceGraphNodeId: string, body: IrStatement[]): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n    void on_start() {');
  const ctx = printContextForIr(ir, bodyIndent('cpp'), ir.environmentManifest);
  if (body.length === 0) sink.appendRaw('        // empty');
  else appendIrStatements(sink, body, ctx);
  sink.appendRaw('    }');
  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, 'void on_start()');
}

function appendCppEventHandler(sink: CodeSink, ir: IrModule, handler: IrEventHandler): void {
  const params = handler.paramNames.map((p) => `float ${p}`).join(', ');
  const signature = params ? `void on_${handler.handlerName}(${params})` : `void on_${handler.handlerName}()`;
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    ${signature} {`);
  const ctx = printContextForIr(ir, handlerBodyIndent('cpp'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        // empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.appendRaw('    }');
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, signature);
}

export function emitCppModule(sink: CodeSink, ir: IrModule): void {
  appendHoistedImports(sink, ir);
  const base = ir.extendsType ? ` : public ${ir.extendsType}` : '';
  const classLineStart = sink.lineCount + 1;
  sink.appendRaw(`class ${ir.moduleName}${base} {`);
  tagClassDeclLine(sink, ir, classLineStart);
  sink.appendRaw('public:');
  if (ir.useLegacyPreamble) {
    appendLegacyPreamble(sink, ir);
  } else {
    appendIrMembers(sink, ir);
  }
  const bodyCtx = printContextForIr(ir, bodyIndent('cpp'), ir.environmentManifest);
  if (ir.startEvent?.isExplicitStartEvent) {
    appendCppStartHandler(sink, ir, ir.startEvent.sourceGraphNodeId, ir.onStartBody);
  } else {
    sink.appendRaw('\n    void on_start() {');
    if (ir.onStartBody.length === 0) sink.appendRaw('        // empty');
    else appendIrStatements(sink, ir.onStartBody, bodyCtx);
    sink.appendRaw('    }');
  }
  for (const handler of ir.eventHandlers) {
    appendCppEventHandler(sink, ir, handler);
  }
  sink.appendRaw('};');
}

export function emitCppFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'cpp'));
  appendFunctionBody(sink, ir, func.id, '        // empty', ir.environmentManifest);
  sink.appendRaw('    }');
}
