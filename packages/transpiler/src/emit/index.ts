import type { TranspileResult } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';
import type { IrModule } from '../ir/types';
import { emitClassModule, emitFunctionTab } from './classModule';

export { formatFunctionDefHeader, appendIrStatements } from './helpers';
export {
  emitClassModule,
  emitFunctionTab,
  emitPythonModule,
  emitPythonFunctionTab,
  emitJavascriptModule,
  emitJavascriptFunctionTab,
  emitCppModule,
  emitCppFunctionTab,
  emitVerseModule,
  emitVerseFunctionTab,
} from './classModule';

const SUPPORTED_LANGUAGES = new Set(['python', 'javascript', 'cpp', 'verse', 'gdscript', 'rust', 'csharp']);

export function emitIrModule(ir: IrModule): TranspileResult {
  const sink = new CodeSink(ir.filePath);

  if (SUPPORTED_LANGUAGES.has(ir.targetLanguage)) {
    if (ir.isFunctionTab) emitFunctionTab(sink, ir);
    else emitClassModule(sink, ir);
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
