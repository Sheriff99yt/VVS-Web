import { CodeSink } from '../codeSink';
import type { IrMemberDecl, IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendHoistedImports,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { emptyFunctionBodyLine } from './layout';
import {
  appendCppOutOfLineFunction,
  appendIrMembersInOrder,
  tagClassDeclLine,
  tagClassStructuralLine,
  type MemberState,
} from './members';
import {
  buildUserCommentEmitState,
  emitOrphanUserComments,
  emitRemainingUserComments,
  emitUserCommentsBeforeNode,
} from './userComments';
import {
  appendEventHandlerDefinition,
  renderClassModuleClose,
  renderClassModuleOpen,
  renderClassImplOpen,
  renderFunctionTabClose,
} from './shell';
import { appendIrStatements } from './sinkStatements';
import { collectIrEmitNodeIds } from '../lower/userComments';

function resolveCppClassName(ir: IrModule): string {
  const classDecl = ir.members.find(
    (m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl'
  );
  if (classDecl?.name?.trim()) return classDecl.name.trim();
  if (ir.activeClass?.name?.trim()) return ir.activeClass.name.trim();
  return ir.moduleName;
}

/**
 * Emit a class module with **canvas member-chain order = source order** (1:1).
 * C++: Declare → in-class prototype; Define → out-of-line after `};` (U82).
 * Other langs: Define emits full method at chain position; non-abstract Declare → U66 `(x)`.
 * Abstract Declare is real only on C++/C#; elsewhere also U66 `(x)` + dim.
 */
export function emitClassModule(
  sink: CodeSink,
  ir: IrModule,
  options?: {
    skipImports?: boolean;
    /** Multi-class merge: only the first class may flush unowned attach targets as orphans. */
    allowUnownedCommentAttachAsOrphan?: boolean;
  }
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
    'go',
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

  const cppOutOfLine: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>[] = [];

  const userCommentState = buildUserCommentEmitState(ir);
  const beforeUserComment = (nodeId: string | undefined, indent = '') => {
    emitUserCommentsBeforeNode(sink, ir, userCommentState, nodeId, indent);
  };
  emitOrphanUserComments(sink, ir, userCommentState);

  appendIrMembersInOrder(sink, ir, state, {
    onClassDecl: openClassShell,
    // Rust layout only — never invent a class shell from fields/methods without ClassDecl.
    onBeforeMethod: () => {
      ensureRustImpl();
    },
    onBeforeMemberNode: beforeUserComment,
    onBeforeFlowNode: beforeUserComment,
    deferCppOutOfLineMethod: (member) => {
      if (lang !== 'cpp') return false;
      cppOutOfLine.push(member);
      return true;
    },
  });

  // Orphan event handlers (not paired to an event_member_define on the chain).
  // Do not auto-open a class shell here — shell opens only on ClassDecl.
  if (ir.eventHandlers.length > 0) {
    if (state.classOpened) ensureRustImpl();
    for (const handler of ir.eventHandlers) {
      beforeUserComment(handler.sourceGraphNodeId, '');
      appendEventHandlerDefinition(sink, ir, handler, handler.sourceGraphNodeId, {
        leadingBlankLine: true,
        memberProperties: handler.properties,
        onBeforeFlowNode: beforeUserComment,
      });
    }
  }

  // Script body when there is no class shell (no class_define).
  if (!classDecl && ir.onStartBody.length > 0) {
    const ctx = printContextForIr(ir, '');
    appendIrStatements(sink, ir.onStartBody, ctx, {
      emitUnsupportedComments: ir.emitUnsupportedComments,
      onBeforeNode: beforeUserComment,
    });
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

  // C++ U82: out-of-line definitions after class close (or alone on an impl-only graph).
  if (lang === 'cpp' && cppOutOfLine.length > 0) {
    const className = resolveCppClassName(ir);
    for (const member of cppOutOfLine) {
      appendCppOutOfLineFunction(sink, ir, member, className, beforeUserComment);
    }
  }

  // Never silently drop Comment [C] whose attach target was not visited.
  const emitNodeIds = collectIrEmitNodeIds({
    members: ir.members,
    onStartBody: ir.onStartBody,
    eventHandlers: ir.eventHandlers,
    functionBodies: ir.functionBodies,
  });
  emitRemainingUserComments(sink, ir, userCommentState, {
    emitNodeIds,
    allowUnownedAttachAsOrphan: options?.allowUnownedCommentAttachAsOrphan !== false,
  });
}

export function emitFunctionTab(sink: CodeSink, ir: IrModule): void {
  const func = ir.activeFunction!;
  const lang = ir.targetLanguage;
  const emptyLine = emptyFunctionBodyLine(lang);

  const userCommentState = buildUserCommentEmitState(ir);
  const beforeUserComment = (nodeId: string | undefined, indent = '') => {
    emitUserCommentsBeforeNode(sink, ir, userCommentState, nodeId, indent);
  };
  emitOrphanUserComments(sink, ir, userCommentState);

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

  appendFunctionBody(sink, ir, func.id, emptyLine, ir.environmentManifest, undefined, undefined, {
    onBeforeNode: beforeUserComment,
  });

  const tabClose = renderFunctionTabClose(lang);
  if (tabClose) sink.appendRaw(tabClose);

  emitRemainingUserComments(sink, ir, userCommentState);
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
