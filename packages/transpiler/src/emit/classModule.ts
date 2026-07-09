import { CodeSink } from '../codeSink';
import type { IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  formatFunctionDefHeader,
  functionNeedsAsync,
} from './helpers';
import { emptyFunctionBodyLine } from './layout';
import {
  appendIrMembers,
  appendMemberImplementations,
  tagClassDeclLine,
  tagClassStructuralLine,
} from './members';
import {
  appendEventHandlerDefinition,
  renderClassModuleClose,
  renderClassModuleOpen,
  renderClassPublicSection,
  renderFunctionTabClose,
} from './shell';

export function emitClassModule(sink: CodeSink, ir: IrModule): void {
  const lang = ir.targetLanguage;
  appendHoistedImports(sink, ir);
  const classLineStart = sink.lineCount + 1;

  if (!['python', 'javascript', 'cpp', 'verse', 'gdscript', 'rust', 'csharp'].includes(lang)) {
    sink.appendRaw(`// class ${ir.moduleName}`);
    return;
  }

  sink.appendRaw(renderClassModuleOpen(lang, ir.moduleName, ir.extendsType));
  tagClassDeclLine(sink, ir, classLineStart);

  const publicSection = renderClassPublicSection(lang);
  if (publicSection) {
    const publicLine = sink.lineCount + 1;
    sink.appendRaw(publicSection);
    tagClassStructuralLine(sink, ir, publicLine);
  }

  appendIrMembers(sink, ir);
  appendMemberImplementations(sink, ir);
  for (const handler of ir.eventHandlers) {
    appendEventHandlerDefinition(sink, ir, handler, handler.sourceGraphNodeId, {
      leadingNewline: true,
    });
  }

  const classClose = renderClassModuleClose(lang);
  if (classClose) {
    const closeLine = sink.lineCount + 1;
    sink.appendRaw(classClose);
    if (lang === 'cpp') tagClassStructuralLine(sink, ir, closeLine);
  }
}

export function emitFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  const lang = ir.targetLanguage;
  const emptyLine = emptyFunctionBodyLine(lang);

  sink.appendRaw(
    formatFunctionDefHeader(
      func,
      lang,
      functionNeedsAsync(ir, func.id),
      Boolean(func.flags?.virtual)
    )
  );
  appendFunctionBody(sink, ir, func.id, emptyLine, ir.environmentManifest);

  const tabClose = renderFunctionTabClose(lang);
  if (tabClose) sink.appendRaw(tabClose);
}

/** @deprecated Use emitClassModule — kept for callers keyed by language name. */
export const emitPythonModule = emitClassModule;
export const emitJavascriptModule = emitClassModule;
export const emitCppModule = emitClassModule;
export const emitVerseModule = emitClassModule;

export const emitPythonFunctionTab = emitFunctionTab;
export const emitJavascriptFunctionTab = emitFunctionTab;
export const emitCppFunctionTab = emitFunctionTab;
export const emitVerseFunctionTab = emitFunctionTab;
