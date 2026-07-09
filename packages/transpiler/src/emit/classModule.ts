import { CodeSink } from '../codeSink';
import type { IrMemberDecl, IrModule } from '../ir/types';
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
  const classDecl = ir.members.find(
    (m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl'
  );

  const lang = ir.targetLanguage;
  appendHoistedImports(sink, ir);

  const supportedClassLang = [
    'python',
    'javascript',
    'cpp',
    'verse',
    'gdscript',
    'rust',
    'csharp',
  ].includes(lang);

  // Class shell only when a canvas class_define produced ClassDecl in IR.
  // Without it, members and handlers still emit (preview) — export is blocked by DEFINE_NODE_MISSING.
  if (classDecl && supportedClassLang) {
    const classLineStart = sink.lineCount + 1;
    sink.appendRaw(renderClassModuleOpen(lang, ir.moduleName, ir.extendsType));
    tagClassDeclLine(sink, ir, classLineStart);

    const publicSection = renderClassPublicSection(lang);
    if (publicSection) {
      const publicLine = sink.lineCount + 1;
      sink.appendRaw(publicSection);
      tagClassStructuralLine(sink, ir, publicLine);
    }
  } else if (classDecl && !supportedClassLang) {
    sink.appendRaw(`// class ${ir.moduleName}`);
    return;
  }

  appendIrMembers(sink, ir);
  appendMemberImplementations(sink, ir);
  for (const handler of ir.eventHandlers) {
    appendEventHandlerDefinition(sink, ir, handler, handler.sourceGraphNodeId, {
      leadingNewline: true,
    });
  }

  if (classDecl && supportedClassLang) {
    const classClose = renderClassModuleClose(lang);
    if (classClose) {
      const closeLine = sink.lineCount + 1;
      sink.appendRaw(classClose);
      if (lang === 'cpp') tagClassStructuralLine(sink, ir, closeLine);
    }
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
