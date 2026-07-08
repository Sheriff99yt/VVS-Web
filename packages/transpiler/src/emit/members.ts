import { variableDataTypeToLegacyEmitKind, type VariableSymbol } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrMemberDecl, IrModule, IrStatement } from '../ir/types';
import {
  appendFunctionBody,
  formatFunctionDefHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { appendIrStatements } from './sinkStatements';
import { bodyIndent, handlerBodyIndent } from '../lower/graphToIr';

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

function appendFunctionDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>
): void {
  const { symbol, sourceGraphNodeId } = member;
  const startLine = sink.lineCount + 1;
  const emptyLine =
    ir.targetLanguage === 'python'
      ? '        pass'
      : ir.targetLanguage === 'verse'
        ? '        # empty'
        : '        // empty';

  sink.appendRaw(
    `\n${formatFunctionDefHeader(
      symbol,
      ir.targetLanguage,
      functionNeedsAsync(ir, symbol.id),
      Boolean(symbol.flags?.virtual)
    )}`
  );
  appendFunctionBody(sink, ir, symbol.id, emptyLine, ir.environmentManifest);

  if (ir.targetLanguage === 'javascript') {
    sink.appendRaw('  }');
  } else if (ir.targetLanguage === 'cpp') {
    sink.appendRaw('    }');
  }

  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, symbol.name);
}

function appendEventDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'EventDecl' }>
): void {
  const handler: IrEventHandler = {
    kind: 'EventHandler',
    sourceGraphNodeId: member.sourceGraphNodeId,
    handlerName: member.handlerName,
    paramNames: member.paramNames,
    body: member.body,
  };

  if (ir.targetLanguage === 'python') {
    appendPythonEventHandlerFromMember(sink, ir, handler);
    return;
  }
  if (ir.targetLanguage === 'javascript') {
    appendJsEventHandlerFromMember(sink, ir, handler);
    return;
  }
  if (ir.targetLanguage === 'cpp') {
    appendCppEventHandlerFromMember(sink, ir, handler);
    return;
  }
  if (ir.targetLanguage === 'verse') {
    appendVerseEventHandlerFromMember(sink, ir, handler);
  }
}

function appendPythonEventHandlerFromMember(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler
): void {
  const params = handler.paramNames.length > 0 ? `self, ${handler.paramNames.join(', ')}` : 'self';
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    def on_${handler.handlerName}(${params}):`);
  const ctx = printContextForIr(ir, handlerBodyIndent('python'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        pass');
  else appendIrStatements(sink, handler.body, ctx);
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, `def on_${handler.handlerName}(`);
}

function appendJsEventHandlerFromMember(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler
): void {
  const params = handler.paramNames.join(', ');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n  on_${handler.handlerName}(${params}) {`);
  const ctx = printContextForIr(ir, handlerBodyIndent('javascript'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('    // empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.appendRaw('  }');
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, `on_${handler.handlerName}(`);
}

function appendCppEventHandlerFromMember(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler
): void {
  const params = handler.paramNames.map((p) => `float ${p}`).join(', ');
  const signature = params
    ? `void on_${handler.handlerName}(${params})`
    : `void on_${handler.handlerName}()`;
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    ${signature} {`);
  const ctx = printContextForIr(ir, handlerBodyIndent('cpp'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        // empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.appendRaw('    }');
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, signature);
}

function appendVerseEventHandlerFromMember(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler
): void {
  const params = handler.paramNames.map((p) => `${p} : float`).join(', ');
  const signature = params
    ? `on_${handler.handlerName}<override>(${params}) : void =`
    : `on_${handler.handlerName}<override>() : void =`;
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    ${signature}`);
  const ctx = printContextForIr(ir, handlerBodyIndent('verse'), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw('        # empty');
  else appendIrStatements(sink, handler.body, ctx);
  sink.tagRange(handler.sourceGraphNodeId, startLine, sink.lineCount, `on_${handler.handlerName}`);
}

/** Walk ordered canvas define nodes and emit declarations with sourceMap spans. */
export function appendIrMembers(sink: CodeSink, ir: IrModule): void {
  for (const member of ir.members) {
    switch (member.kind) {
      case 'ClassDecl':
        break;
      case 'VariableDecl':
        appendVariableDecl(sink, ir, member);
        break;
      case 'FunctionDecl':
        appendFunctionDecl(sink, ir, member);
        break;
      case 'EventDecl':
        appendEventDecl(sink, ir, member);
        break;
    }
  }
}

export function tagClassDeclLine(sink: CodeSink, ir: IrModule, classLineStart: number): void {
  const classDecl = ir.members.find((m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl');
  if (!classDecl) return;
  sink.tagRange(classDecl.sourceGraphNodeId, classLineStart, classLineStart, `class ${ir.moduleName}`);
}
