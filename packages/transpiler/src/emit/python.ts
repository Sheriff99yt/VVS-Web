import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule, IrStatement } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  appendPythonEventHelper,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';

function appendPythonStartHandler(sink: CodeSink, ir: IrModule, sourceGraphNodeId: string, body: IrStatement[]): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n    def on_start(self):');
  const ctx = printContextForIr(ir, bodyIndent('python'), ir.environmentManifest);
  if (body.length === 0) sink.appendRaw('        pass');
  else appendIrStatements(sink, body, ctx);
  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, 'def on_start(self):');
}

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
  sink.appendRaw(`class ${ir.moduleName}${bases}:`);
  if (ir.needsEventHelper) {
    appendPythonEventHelper(sink);
  }
  if (ir.variables.length > 0) {
    sink.appendRaw('    # Variables');
    for (const v of ir.variables) {
      const val =
        typeof v.defaultValue === 'string'
          ? `"${v.defaultValue}"`
          : typeof v.defaultValue === 'boolean'
            ? v.defaultValue
              ? 'True'
              : 'False'
            : v.defaultValue;
      sink.appendRaw(`        self.${v.name} = ${val}`);
    }
  }
  for (const f of ir.functions) {
    sink.appendRaw(`\n${formatFunctionDefHeader(f, 'python', functionNeedsAsync(ir, f.id))}`);
    appendFunctionBody(sink, ir, f.id, '        pass', ir.environmentManifest);
  }
  const bodyCtx = printContextForIr(ir, bodyIndent('python'), ir.environmentManifest);
  if (ir.startEvent?.isExplicitStartEvent) {
    appendPythonStartHandler(sink, ir, ir.startEvent.sourceGraphNodeId, ir.onStartBody);
  } else {
    sink.appendRaw('\n    def on_start(self):');
    if (ir.onStartBody.length === 0) sink.appendRaw('        pass');
    else appendIrStatements(sink, ir.onStartBody, bodyCtx);
  }
  for (const handler of ir.eventHandlers) {
    appendPythonEventHandler(sink, ir, handler);
  }
}

export function emitPythonFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'python', functionNeedsAsync(ir, func.id)));
  appendFunctionBody(sink, ir, func.id, '        pass', ir.environmentManifest);
}
