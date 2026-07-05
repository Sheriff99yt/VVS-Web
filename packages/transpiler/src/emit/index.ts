import type { TranspileResult } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';
import type { IrModule } from '../ir/types';
import { emitCppFunctionTab, emitCppModule } from './cpp';
import { emitJavascriptFunctionTab, emitJavascriptModule } from './javascript';
import { emitPythonFunctionTab, emitPythonModule } from './python';
import { emitVerseFunctionTab, emitVerseModule } from './verse';

export { formatFunctionDefHeader, appendIrStatements } from './helpers';
export { emitPythonModule, emitPythonFunctionTab } from './python';
export { emitJavascriptModule, emitJavascriptFunctionTab } from './javascript';
export { emitCppModule, emitCppFunctionTab } from './cpp';
export { emitVerseModule, emitVerseFunctionTab } from './verse';

export function emitIrModule(ir: IrModule): TranspileResult {
  const sink = new CodeSink(ir.filePath);

  if (ir.isFunctionTab) {
    if (ir.targetLanguage === 'python') {
      emitPythonFunctionTab(sink, ir);
    } else if (ir.targetLanguage === 'javascript') {
      emitJavascriptFunctionTab(sink, ir);
    } else if (ir.targetLanguage === 'cpp') {
      emitCppFunctionTab(sink, ir);
    } else if (ir.targetLanguage === 'verse') {
      emitVerseFunctionTab(sink, ir);
    } else {
      sink.appendRaw('// Unsupported language');
    }
    return {
      language: ir.targetLanguage,
      files: [{ path: ir.filePath, content: sink.content }],
      sourceMap: sink.sourceMap,
      fragments: sink.fragments,
    };
  }

  if (ir.targetLanguage === 'python') {
    emitPythonModule(sink, ir);
  } else if (ir.targetLanguage === 'javascript') {
    emitJavascriptModule(sink, ir);
  } else if (ir.targetLanguage === 'cpp') {
    emitCppModule(sink, ir);
  } else if (ir.targetLanguage === 'verse') {
    emitVerseModule(sink, ir);
  } else {
    sink.appendRaw('// Unsupported language');
  }

  return {
    language: ir.targetLanguage,
    files: [{ path: ir.filePath, content: sink.content }],
    sourceMap: sink.sourceMap,
    fragments: sink.fragments,
  };
}
