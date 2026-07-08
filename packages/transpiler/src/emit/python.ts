import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  appendPythonEventHelper,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { appendIrMembers, tagClassDeclLine } from './members';
import { handlerBodyIndent } from '../lower/graphToIr';

function appendPythonEventHandler(sink: CodeSink, ir: IrModule, handler: IrEventHandler): void {
  const params = handler.paramNames.length > 0 ? `self, ${handler.paramNames.join(', ')}` : 'self';
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    def on_${handler.handlerName}(${params}):`);
  const ctx = printContextForIr(ir, handlerBodyIndent('python'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        pass');
  else appendIrStatements(sink, handler.body, ctx);
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, `def on_${handler.handlerName}(`);
}

export function emitPythonModule(sink: CodeSink, ir: IrModule): void {
  appendHoistedImports(sink, ir);
  const bases = ir.extendsType ? `(${ir.extendsType})` : '';
  const classLineStart = sink.lineCount + 1;
  sink.appendRaw(`class ${ir.moduleName}${bases}:`);
  tagClassDeclLine(sink, ir, classLineStart);
  if (ir.needsEventHelper) {
    appendPythonEventHelper(sink);
  }
  appendIrMembers(sink, ir);
  for (const handler of ir.eventHandlers) {
    appendPythonEventHandler(sink, ir, handler);
  }
}

export function emitPythonFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'python', functionNeedsAsync(ir, func.id), Boolean(func.flags?.virtual)));
  appendFunctionBody(sink, ir, func.id, '        pass', ir.environmentManifest);
}
