import { CodeSink } from '../codeSink';
import type { IrMemberDecl, IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  appendImportStatement,
  formatFunctionDefHeader,
  functionNeedsAsync,
} from './helpers';
import { emptyFunctionBodyLine } from './layout';
import {
  appendIrMembersInOrder,
  tagClassDeclLine,
  tagClassStructuralLine,
  type MemberState,
} from './members';
import {
  appendEventHandlerDefinition,
  renderClassModuleClose,
  renderClassModuleOpen,
  renderClassImplOpen,
  renderFunctionTabClose,
} from './shell';

/**
 * Emit a class module with **canvas member-chain order = source order** (1:1).
 * No declare-then-implement two-phase: each define node emits its full construct
 * when encountered on the chain.
 */
export function emitClassModule(
  sink: CodeSink,
  ir: IrModule,
  options?: { skipImports?: boolean }
): void {
  const classDecl = ir.members.find(
    (m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl'
  );

  const lang = ir.targetLanguage;
  // Imports emit in member-chain order (appendIrMembersInOrder). Only leftover
  // `ir.imports` not represented on the chain are written here.
  if (!options?.skipImports && ir.imports.length > 0) {
    appendHoistedImports(sink, ir);
  }

  const supportedClassLang = [
    'python',
    'javascript',
    'cpp',
    'verse',
    'gdscript',
    'rust',
    'csharp',
  ].includes(lang);

  if (classDecl && !supportedClassLang) {
    sink.appendRaw(`// class ${ir.moduleName}`);
    return;
  }

  const state: MemberState = {
    cppVisibility: '',
    classOpened: false,
    rustImplOpened: false,
  };

  const openClassShell = () => {
    if (!classDecl || state.classOpened) return;
    const classLineStart = sink.lineCount + 1;
    const properties = classDecl.properties ?? {};
    const extendsType = classDecl.extendsType || ir.extendsType || '';
    sink.appendRaw(renderClassModuleOpen(lang, ir.moduleName, extendsType, properties));
    tagClassDeclLine(sink, ir, classLineStart);
    state.classOpened = true;
  };

  /** Rust: close struct fields and open `impl` before the first method. */
  const ensureRustImpl = () => {
    if (lang !== 'rust' || !state.classOpened || state.rustImplOpened) return;
    if (sink.lineCount > 0) sink.appendRaw('}');
    const implOpen = renderClassImplOpen(lang, ir.moduleName);
    if (implOpen) sink.appendRaw(implOpen);
    state.rustImplOpened = true;
  };

  appendIrMembersInOrder(sink, ir, state, {
    onClassDecl: openClassShell,
    // Rust layout only — never invent a class shell from fields/methods without ClassDecl.
    onBeforeMethod: () => {
      ensureRustImpl();
    },
  });

  // Orphan event handlers (not paired to an event_member_define on the chain).
  // Do not auto-open a class shell here — shell opens only on ClassDecl.
  if (ir.eventHandlers.length > 0) {
    if (state.classOpened) ensureRustImpl();
    for (const handler of ir.eventHandlers) {
      appendEventHandlerDefinition(sink, ir, handler, handler.sourceGraphNodeId, {
        leadingBlankLine: true,
        memberProperties: handler.properties,
      });
    }
  }

  // Script body when there is no class shell (no class_define).
  if (!classDecl && ir.onStartBody.length > 0) {
    const { printContextForIr } = require('./shell');
    const { appendIrStatements } = require('./sinkStatements');
    const ctx = printContextForIr(ir, '');
    appendIrStatements(sink, ir.onStartBody, ctx);
  }

  if (state.classOpened && supportedClassLang) {
    // Rust already closed the struct when opening impl; ClassModuleClose closes impl (or struct if no methods).
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
    formatFunctionDefHeader(func, lang, functionNeedsAsync(ir, func.id, {
      isAsync: Boolean(func.flags?.async),
      isVirtual: Boolean(func.flags?.virtual),
      visibility: func.visibility,
      binding: func.binding,
    }), {
      isVirtual: Boolean(func.flags?.virtual),
      isAsync: Boolean(func.flags?.async),
      visibility: func.visibility,
      binding: func.binding,
    })
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
