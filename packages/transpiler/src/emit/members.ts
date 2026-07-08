import { variableDataTypeToLegacyEmitKind, type VariableSymbol } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrMemberDecl, IrModule, IrStatement } from '../ir/types';
import {
  appendFunctionBody,
  formatFunctionDeclPrototype,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { appendIrStatements } from './sinkStatements';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';
import {
  appendGraphNodePlaceholder,
  declareLabel,
  supportsNativeMemberDeclare,
} from './memberDeclare';

function formatVariableDefault(
  variable: VariableSymbol,
  targetLanguage: IrModule['targetLanguage']
): string {
  const val = variable.defaultValue;
  if (targetLanguage === 'python') {
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    return String(val ?? 0);
  }
  if (typeof val === 'string') return `"${val}"`;
  return String(val ?? 0);
}

function verseType(variable: VariableSymbol): string {
  const emitKind = variableDataTypeToLegacyEmitKind(variable.type);
  if (emitKind === 'number') return 'float';
  if (emitKind === 'string') return 'string';
  if (emitKind === 'boolean') return 'logic';
  return 'any';
}

function appendVariableDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'VariableDecl' }>
): void {
  const { symbol, sourceGraphNodeId } = member;
  const startLine = sink.lineCount + 1;
  const val = formatVariableDefault(symbol, ir.targetLanguage);

  if (ir.targetLanguage === 'python') {
    sink.appendRaw(`        self.${symbol.name} = ${val}`);
    sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, `self.${symbol.name}`);
    return;
  }
  if (ir.targetLanguage === 'javascript') {
    sink.appendRaw(`    this.${symbol.name} = ${val};`);
    sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, `this.${symbol.name}`);
    return;
  }
  if (ir.targetLanguage === 'cpp') {
    const emitKind = variableDataTypeToLegacyEmitKind(symbol.type);
    const type =
      emitKind === 'number'
        ? 'float'
        : emitKind === 'string'
          ? 'std::string'
          : emitKind === 'boolean'
            ? 'bool'
            : 'auto';
    sink.appendRaw(`    ${type} ${symbol.name};`);
    sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, symbol.name);
    return;
  }
  if (ir.targetLanguage === 'verse') {
    sink.appendRaw(`    var ${symbol.name} : ${verseType(symbol)} = ${val}`);
    sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, symbol.name);
  }
}

function appendFunctionMemberDeclare(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>
): void {
  const { symbol, sourceGraphNodeId } = member;
  const label = declareLabel(symbol.name);

  if (supportsNativeMemberDeclare('function', ir.targetLanguage)) {
    const proto = formatFunctionDeclPrototype(
      symbol,
      ir.targetLanguage,
      Boolean(symbol.flags?.virtual)
    );
    if (proto) {
      if (sink.lineCount > 0) sink.appendRaw('');
      const line = sink.lineCount + 1;
      sink.appendRaw(proto);
      sink.tagRange(sourceGraphNodeId, line, line, symbol.name);
      return;
    }
  }

  appendGraphNodePlaceholder(sink, ir.targetLanguage, sourceGraphNodeId, label);
}

function appendEventMemberDeclare(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'EventDecl' }>
): void {
  const label = declareLabel(member.symbol.name);
  const params = member.paramNames.map((p) => `float ${p}`).join(', ');
  const cppProto =
    params.length > 0
      ? `void on_${member.handlerName}(${params});`
      : `void on_${member.handlerName}();`;

  if (supportsNativeMemberDeclare('event', ir.targetLanguage)) {
    if (sink.lineCount > 0) sink.appendRaw('');
    const line = sink.lineCount + 1;
    sink.appendRaw(`    ${cppProto}`);
    sink.tagRange(member.sourceGraphNodeId, line, line, cppProto);
    return;
  }

  appendGraphNodePlaceholder(sink, ir.targetLanguage, member.sourceGraphNodeId, label);
}

function appendPythonEventDefinition(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler,
  handlerSourceGraphNodeId: string
): void {
  const params = handler.paramNames.length > 0 ? `self, ${handler.paramNames.join(', ')}` : 'self';
  if (sink.lineCount > 0) sink.appendRaw('');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`    def on_${handler.handlerName}(${params}):`);
  const ctx = printContextForIr(ir, handlerBodyIndent('python'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        pass');
  else appendIrStatements(sink, handler.body, ctx);
  sink.tagRange(handlerSourceGraphNodeId, startLine, sink.lineCount, `def on_${handler.handlerName}(`);
}

function appendJsEventDefinition(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler,
  handlerSourceGraphNodeId: string
): void {
  const params = handler.paramNames.join(', ');
  if (sink.lineCount > 0) sink.appendRaw('');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`  on_${handler.handlerName}(${params}) {`);
  const ctx = printContextForIr(ir, handlerBodyIndent('javascript'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('    // empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.appendRaw('  }');
  sink.tagRange(handlerSourceGraphNodeId, startLine, sink.lineCount, `on_${handler.handlerName}(`);
}

function appendCppEventDefinition(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler,
  handlerSourceGraphNodeId: string
): void {
  const params = handler.paramNames.map((p) => `float ${p}`).join(', ');
  const signature = params
    ? `void on_${handler.handlerName}(${params})`
    : `void on_${handler.handlerName}()`;
  if (sink.lineCount > 0) sink.appendRaw('');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`    ${signature} {`);
  const ctx = printContextForIr(ir, handlerBodyIndent('cpp'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        // empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.appendRaw('    }');
  sink.tagRange(handlerSourceGraphNodeId, startLine, sink.lineCount, signature);
}

function appendVerseEventDefinition(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler,
  handlerSourceGraphNodeId: string
): void {
  const params = handler.paramNames.map((p) => `${p} : float`).join(', ');
  const signature = params
    ? `on_${handler.handlerName}<override>(${params}) : void =`
    : `on_${handler.handlerName}<override>() : void =`;
  if (sink.lineCount > 0) sink.appendRaw('');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`    ${signature}`);
  const ctx = printContextForIr(ir, handlerBodyIndent('verse'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        # empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.tagRange(handlerSourceGraphNodeId, startLine, sink.lineCount, `on_${handler.handlerName}`);
}

function appendEventDefinition(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'EventDecl' }>
): void {
  const handlerNodeId = member.handlerSourceGraphNodeId;
  if (!handlerNodeId) return;

  const handler: IrEventHandler = {
    kind: 'EventHandler',
    sourceGraphNodeId: handlerNodeId,
    handlerName: member.handlerName,
    paramNames: member.paramNames,
    body: member.body,
  };

  if (ir.targetLanguage === 'python') {
    appendPythonEventDefinition(sink, ir, handler, handlerNodeId);
    return;
  }
  if (ir.targetLanguage === 'javascript') {
    appendJsEventDefinition(sink, ir, handler, handlerNodeId);
    return;
  }
  if (ir.targetLanguage === 'cpp') {
    appendCppEventDefinition(sink, ir, handler, handlerNodeId);
    return;
  }
  if (ir.targetLanguage === 'verse') {
    appendVerseEventDefinition(sink, ir, handler, handlerNodeId);
  }
}

function appendFunctionDefinition(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>
): void {
  const { symbol } = member;
  const emptyLine =
    ir.targetLanguage === 'python'
      ? '        pass'
      : ir.targetLanguage === 'verse'
        ? '        # empty'
        : '        // empty';

  if (sink.lineCount > 0) sink.appendRaw('');
  sink.appendRaw(
    formatFunctionDefHeader(
      symbol,
      ir.targetLanguage,
      functionNeedsAsync(ir, symbol.id),
      Boolean(symbol.flags?.virtual)
    )
  );
  appendFunctionBody(sink, ir, symbol.id, emptyLine, ir.environmentManifest);

  if (ir.targetLanguage === 'javascript') {
    sink.appendRaw('  }');
  } else if (ir.targetLanguage === 'cpp') {
    sink.appendRaw('    }');
  }
}

/** Emit member-chain declarations / placeholders only (no event or function bodies). */
export function appendIrMembers(sink: CodeSink, ir: IrModule): void {
  for (const member of ir.members) {
    switch (member.kind) {
      case 'ClassDecl':
        break;
      case 'VariableDecl':
        appendVariableDecl(sink, ir, member);
        break;
      case 'FunctionDecl':
        appendFunctionMemberDeclare(sink, ir, member);
        break;
      case 'EventDecl':
        appendEventMemberDeclare(sink, ir, member);
        break;
    }
  }
}

/** Emit definitions for member-chain functions and paired On handlers (after declarations). */
export function appendMemberImplementations(sink: CodeSink, ir: IrModule): void {
  for (const member of ir.members) {
    if (member.kind === 'FunctionDecl') {
      appendFunctionDefinition(sink, ir, member);
    } else if (member.kind === 'EventDecl') {
      appendEventDefinition(sink, ir, member);
    }
  }
}

export function tagClassDeclLine(sink: CodeSink, ir: IrModule, classLineStart: number): void {
  const classDecl = ir.members.find((m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl');
  if (!classDecl) return;
  sink.tagRange(classDecl.sourceGraphNodeId, classLineStart, classLineStart, `class ${ir.moduleName}`);
}

/** Tag a structural class shell line (e.g. C++ `public:`, closing `};`) to the class define node. */
export function tagClassStructuralLine(sink: CodeSink, ir: IrModule, line: number): void {
  const classDecl = ir.members.find((m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl');
  if (!classDecl) return;
  sink.tagRange(classDecl.sourceGraphNodeId, line, line);
}
