import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendIrStatements,
  appendJavascriptEventHelper,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { appendIrMembers, tagClassDeclLine } from './members';
import { handlerBodyIndent } from '../lower/graphToIr';

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
  appendIrMembers(sink, ir);
  for (const handler of ir.eventHandlers) {
    appendJsEventHandler(sink, ir, handler);
  }
  sink.appendRaw('}');
}

export function emitJavascriptFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(
    formatFunctionDefHeader(func, 'javascript', functionNeedsAsync(ir, func.id), Boolean(func.flags?.virtual))
  );
  appendFunctionBody(sink, ir, func.id, '    // empty', ir.environmentManifest);
  sink.appendRaw('  }');
}
