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
  appendIrMembers(sink, ir);
  for (const handler of ir.eventHandlers) {
    appendCppEventHandler(sink, ir, handler);
  }
  sink.appendRaw('};');
}

export function emitCppFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  sink.appendRaw(formatFunctionDefHeader(func, 'cpp', false, Boolean(func.flags?.virtual)));
  appendFunctionBody(sink, ir, func.id, '        // empty', ir.environmentManifest);
  sink.appendRaw('    }');
}
