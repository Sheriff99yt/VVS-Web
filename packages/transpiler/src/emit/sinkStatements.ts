import { CodeSink } from '../codeSink';
import { offsetSpans } from '../codeExpr';
import type {
  IrArrayPush,
  IrForEach,
  IrForLoop,
  IrIfBranch,
  IrSequence,
  IrStatement,
  IrSwitch,
  IrWhileLoop,
} from '../ir/types';
import {
  blockCloseLine,
  condSpanOffset,
  forSpanOffset,
  ifElseLine,
  innerIndentCtx,
} from '../print/blocks';
import { createDefaultExprPrinter } from '../print/expr';
import { printStatement } from '../print';
import {
  blockPlaceholder,
  innerIndentUnit,
  isPackDrivenFamily,
  printFromTemplate,
  tryPrintFromTemplate,
  commentPrefixFromPack,
} from '../print/template';
import type { PrintContext } from '../print/types';
import { typeNameForPin } from './emitTypes';
import type { TargetLanguage } from '@vvs/graph-types';
import { isNodeEffectiveForLanguage } from '@vvs/language-profiles';
import type { IrModuleImport } from '../ir/types';

const NESTED_BODY_KINDS = new Set(['IfBranch', 'ForLoop', 'ForEach', 'WhileLoop', 'Switch', 'Sequence']);
const IMPORT_MODULE_KIND = 'vvs.project.import_module';

export type AppendIrStatementsOptions = {
  emitUnsupportedComments?: boolean;
  /** Author Comment [C] attach — called with each statement's sourceGraphNodeId + indent. */
  onBeforeNode?: (sourceGraphNodeId: string, indent: string) => void;
};

function appendModuleImportStatement(
  sink: CodeSink,
  stmt: IrModuleImport,
  ctx: PrintContext,
  emitUnsupportedComments = true
): void {
  const effective = isNodeEffectiveForLanguage(
    IMPORT_MODULE_KIND,
    { targetLanguages: stmt.targetLanguages },
    ctx.family as TargetLanguage
  );
  if (effective) {
    appendLeafStatement(sink, stmt, ctx);
    return;
  }
  if (!emitUnsupportedComments) return;
  const label = (stmt.displayLabel?.trim() || stmt.moduleSlug).trim();
  sink.appendTagged({
    nodeId: stmt.sourceGraphNodeId,
    text: `${ctx.indent}${commentPrefixFromPack(ctx)}(x) ${label}`,
  });
}

function appendRawWithExprSpans(
  sink: CodeSink,
  line: string,
  spans: { nodeId: string; start: number; end: number }[],
  spanOffset: number
): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw(line);
  if (spans.length > 0) {
    sink.registerExpressionSpans(startLine, [line], offsetSpans(spans, spanOffset));
  }
}

function appendBodyOrPlaceholder(
  sink: CodeSink,
  statements: IrStatement[],
  ctx: PrintContext,
  placeholder: string,
  options?: AppendIrStatementsOptions
): void {
  if (statements.length === 0) sink.appendRaw(placeholder);
  else appendIrStatements(sink, statements, ctx, options);
}

function appendLeafStatement(sink: CodeSink, stmt: IrStatement, ctx: PrintContext): void {
  const printed = printStatement(stmt, ctx);
  sink.appendTagged({
    nodeId: stmt.sourceGraphNodeId,
    text: printed.text,
    expressionSpans: printed.expressionSpans,
  });
}

function appendIfBranch(
  sink: CodeSink,
  stmt: IrIfBranch,
  ctx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  const printExpr = createDefaultExprPrinter();
  const condPrinted = printExpr(stmt.condition, ctx);
  const inner = innerIndentCtx(ctx);
  const startLine = sink.lineCount + 1;
  const placeholder = `${inner.indent}${blockPlaceholder(ctx)}`;

  if (isPackDrivenFamily(ctx.family)) {
    const header = printFromTemplate(ctx, 'IfBranchHeader', {
      cond: { text: condPrinted.text, spans: condPrinted.spans },
    });
    appendRawWithExprSpans(
      sink,
      header.text,
      condPrinted.spans,
      condSpanOffset(ctx.family, ctx.indent, 'if')
    );
    appendBodyOrPlaceholder(sink, stmt.trueBody, inner, placeholder, options);
    if (stmt.falseBody.length > 0) {
      sink.appendRaw(ifElseLine(ctx));
      appendBodyOrPlaceholder(sink, stmt.falseBody, inner, placeholder, options);
    }
    if (['javascript', 'cpp', 'csharp', 'rust'].includes(ctx.family)) {
      sink.appendRaw(blockCloseLine(ctx, 'IfBranchClose'));
    }
  } else {
    sink.appendRaw(`${ctx.indent}// if (${condPrinted.text})`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, 'if');
}

function appendForLoop(
  sink: CodeSink,
  stmt: IrForLoop,
  ctx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  const printExpr = createDefaultExprPrinter();
  const firstPrinted = printExpr(stmt.first, ctx);
  const lastPrinted = printExpr(stmt.last, ctx);
  const inner = innerIndentCtx(ctx);
  const startLine = sink.lineCount + 1;
  const placeholder = `${inner.indent}${blockPlaceholder(ctx)}`;

  if (isPackDrivenFamily(ctx.family)) {
    const header = printFromTemplate(ctx, 'ForLoopHeader', {
      index: stmt.indexVar,
      first: firstPrinted.text,
      last: lastPrinted.text,
    });
    appendRawWithExprSpans(
      sink,
      header.text,
      [...firstPrinted.spans, ...offsetSpans(lastPrinted.spans, firstPrinted.text.length + 2)],
      forSpanOffset(ctx.family, ctx.indent, stmt.indexVar)
    );
    appendBodyOrPlaceholder(sink, stmt.body, inner, placeholder, options);
    if (['javascript', 'cpp', 'csharp', 'rust'].includes(ctx.family)) {
      sink.appendRaw(blockCloseLine(ctx, 'ForLoopClose'));
    }
  } else {
    sink.appendRaw(`${ctx.indent}// for ${stmt.indexVar}`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `for ${stmt.indexVar}`);
}

function appendForEach(
  sink: CodeSink,
  stmt: IrForEach,
  ctx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  const printExpr = createDefaultExprPrinter();
  const collPrinted = printExpr(stmt.collection, ctx);
  const inner = innerIndentCtx(ctx);
  const startLine = sink.lineCount + 1;
  const placeholder = `${inner.indent}${blockPlaceholder(ctx)}`;
  const elementTypeName = typeNameForPin(
    stmt.elementType ?? 'data_number',
    ctx.family as TargetLanguage
  );

  let headerText: string;
  try {
    headerText = printFromTemplate(ctx, 'ForEachHeader', {
      element: stmt.elementVar,
      collection: collPrinted.text,
      elementType: elementTypeName,
    }).text;
  } catch {
    if (ctx.family === 'python' || ctx.family === 'gdscript') {
      headerText = `${ctx.indent}for ${stmt.elementVar} in ${collPrinted.text}:`;
    } else if (ctx.family === 'javascript') {
      headerText = `${ctx.indent}for (const ${stmt.elementVar} of ${collPrinted.text}) {`;
    } else if (ctx.family === 'csharp') {
      headerText = `${ctx.indent}foreach (var ${stmt.elementVar} in ${collPrinted.text}) {`;
    } else if (ctx.family === 'rust') {
      headerText = `${ctx.indent}for ${stmt.elementVar} in ${collPrinted.text}.iter() {`;
    } else {
      headerText = `${ctx.indent}for (${elementTypeName} ${stmt.elementVar} : ${collPrinted.text}) {`;
    }
  }

  if (isPackDrivenFamily(ctx.family)) {
    appendRawWithExprSpans(sink, headerText, collPrinted.spans, ctx.indent.length);
    appendBodyOrPlaceholder(sink, stmt.body, inner, placeholder, options);
    if (['javascript', 'cpp', 'csharp', 'rust'].includes(ctx.family)) {
      sink.appendRaw(blockCloseLine(ctx, 'ForLoopClose'));
    }
  } else {
    sink.appendRaw(`${ctx.indent}// foreach ${stmt.elementVar}`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `foreach ${stmt.elementVar}`);
}

function appendArrayPush(sink: CodeSink, stmt: IrArrayPush, ctx: PrintContext): void {
  const printExpr = createDefaultExprPrinter();
  const arr = printExpr(stmt.array, ctx);
  const val = printExpr(stmt.value, ctx);
  const startLine = sink.lineCount + 1;
  if (isPackDrivenFamily(ctx.family)) {
    const packed = tryPrintFromTemplate(
      ctx,
      'ArrayPush',
      {
        array: { text: arr.text, spans: arr.spans },
        value: { text: val.text, spans: val.spans },
      },
      { noIndent: true }
    );
    if (packed) {
      sink.appendRaw(`${ctx.indent}${packed.text}`);
      sink.tagRange(stmt.sourceGraphNodeId, startLine, startLine, 'push');
      return;
    }
  }
  if (ctx.family === 'cpp') {
    sink.appendRaw(`${ctx.indent}${arr.text}.push_back(${val.text});`);
  } else if (ctx.family === 'python') {
    sink.appendRaw(`${ctx.indent}${arr.text}.append(${val.text})`);
  } else if (ctx.family === 'javascript') {
    sink.appendRaw(`${ctx.indent}${arr.text}.push(${val.text});`);
  } else if (ctx.family === 'csharp') {
    sink.appendRaw(`${ctx.indent}${arr.text}.Add(${val.text});`);
  } else if (ctx.family === 'rust') {
    sink.appendRaw(`${ctx.indent}${arr.text}.push(${val.text});`);
  } else if (ctx.family === 'gdscript') {
    sink.appendRaw(`${ctx.indent}${arr.text}.append(${val.text})`);
  } else {
    sink.appendRaw(`${ctx.indent}// push ${val.text}`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, startLine, 'push');
}

function appendWhileLoop(
  sink: CodeSink,
  stmt: IrWhileLoop,
  ctx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  const printExpr = createDefaultExprPrinter();
  const condPrinted = printExpr(stmt.condition, ctx);
  const inner = innerIndentCtx(ctx);
  const startLine = sink.lineCount + 1;
  const placeholder = `${inner.indent}${blockPlaceholder(ctx)}`;

  if (isPackDrivenFamily(ctx.family)) {
    const header = printFromTemplate(ctx, 'WhileLoopHeader', {
      cond: { text: condPrinted.text, spans: condPrinted.spans },
    });
    appendRawWithExprSpans(
      sink,
      header.text,
      condPrinted.spans,
      condSpanOffset(ctx.family, ctx.indent, 'while')
    );
    appendBodyOrPlaceholder(sink, stmt.body, inner, placeholder, options);
    if (['javascript', 'cpp', 'csharp', 'rust'].includes(ctx.family)) {
      sink.appendRaw(blockCloseLine(ctx, 'WhileLoopClose'));
    }
  } else {
    sink.appendRaw(`${ctx.indent}// while`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, 'while');
}

function appendSwitch(sink: CodeSink, stmt: IrSwitch, ctx: PrintContext): void {
  appendLeafStatement(sink, stmt, ctx);
}

function appendSequence(
  sink: CodeSink,
  stmt: IrSequence,
  ctx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  const inner = innerIndentCtx(ctx);
  const startLine = sink.lineCount + 1;
  const steps = stmt.steps.filter((step) => step.length > 0);

  if (isPackDrivenFamily(ctx.family)) {
    if (ctx.family === 'python' || ctx.family === 'verse' || ctx.family === 'gdscript') {
      sink.appendRaw(printFromTemplate(ctx, 'SequenceHeader', {}).text);
      for (const step of steps) {
        appendIrStatements(sink, step, inner, options);
      }
    } else {
      sink.appendRaw(printFromTemplate(ctx, 'SequenceHeader', {}).text);
      sink.appendRaw(printFromTemplate(ctx, 'SequenceComment', {}).text);
      for (const step of steps) {
        appendIrStatements(sink, step, inner, options);
      }
      sink.appendRaw(printFromTemplate(ctx, 'SequenceClose', {}).text);
    }
  } else {
    sink.appendRaw(`${ctx.indent}// sequence`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, 'sequence');
}

function appendIrStatement(
  sink: CodeSink,
  stmt: IrStatement,
  ctx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  if (stmt.kind === 'IfBranch') {
    appendIfBranch(sink, stmt as IrIfBranch, ctx, options);
    return;
  }
  if (stmt.kind === 'ForLoop') {
    appendForLoop(sink, stmt as IrForLoop, ctx, options);
    return;
  }
  if (stmt.kind === 'ForEach') {
    appendForEach(sink, stmt as IrForEach, ctx, options);
    return;
  }
  if (stmt.kind === 'ArrayPush') {
    appendArrayPush(sink, stmt as IrArrayPush, ctx);
    return;
  }
  if (stmt.kind === 'WhileLoop') {
    appendWhileLoop(sink, stmt as IrWhileLoop, ctx, options);
    return;
  }
  if (stmt.kind === 'Switch') {
    appendSwitch(sink, stmt as IrSwitch, ctx);
    return;
  }
  if (stmt.kind === 'Sequence') {
    appendSequence(sink, stmt as IrSequence, ctx, options);
    return;
  }
  appendLeafStatement(sink, stmt, ctx);
}

/** Emit IR statements with per-node sourceMap entries, including nested control-flow bodies. */
export function appendIrStatements(
  sink: CodeSink,
  statements: IrStatement[],
  printCtx: PrintContext,
  options?: AppendIrStatementsOptions
): void {
  const emitComments = options?.emitUnsupportedComments !== false;
  for (const stmt of statements) {
    options?.onBeforeNode?.(stmt.sourceGraphNodeId, printCtx.indent);
    if (stmt.kind === 'ModuleImport') {
      appendModuleImportStatement(sink, stmt, printCtx, emitComments);
    } else if (stmt.kind === 'ArrayPush' || NESTED_BODY_KINDS.has(stmt.kind)) {
      appendIrStatement(sink, stmt, printCtx, options);
    } else {
      appendLeafStatement(sink, stmt, printCtx);
    }
  }
}

export { innerIndentCtx, blockPlaceholder, innerIndentUnit };
