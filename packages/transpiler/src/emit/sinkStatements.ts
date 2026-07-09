import { CodeSink } from '../codeSink';
import { offsetSpans } from '../codeExpr';
import type {
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
} from '../print/template';
import type { PrintContext } from '../print/types';

const NESTED_BODY_KINDS = new Set(['IfBranch', 'ForLoop', 'WhileLoop', 'Switch', 'Sequence']);

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
  placeholder: string
): void {
  if (statements.length === 0) sink.appendRaw(placeholder);
  else appendIrStatements(sink, statements, ctx);
}

function appendLeafStatement(sink: CodeSink, stmt: IrStatement, ctx: PrintContext): void {
  const printed = printStatement(stmt, ctx);
  sink.appendTagged({
    nodeId: stmt.sourceGraphNodeId,
    text: printed.text,
    expressionSpans: printed.expressionSpans,
  });
}

function appendIfBranch(sink: CodeSink, stmt: IrIfBranch, ctx: PrintContext): void {
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
    appendBodyOrPlaceholder(sink, stmt.trueBody, inner, placeholder);
    if (stmt.falseBody.length > 0) {
      sink.appendRaw(ifElseLine(ctx));
      appendBodyOrPlaceholder(sink, stmt.falseBody, inner, placeholder);
    }
    if (ctx.family === 'javascript' || ctx.family === 'cpp') {
      sink.appendRaw(blockCloseLine(ctx, 'IfBranchClose'));
    }
  } else {
    sink.appendRaw(`${ctx.indent}// if (${condPrinted.text})`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, 'if');
}

function appendForLoop(sink: CodeSink, stmt: IrForLoop, ctx: PrintContext): void {
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
    appendBodyOrPlaceholder(sink, stmt.body, inner, placeholder);
    if (ctx.family === 'javascript' || ctx.family === 'cpp') {
      sink.appendRaw(blockCloseLine(ctx, 'ForLoopClose'));
    }
  } else {
    sink.appendRaw(`${ctx.indent}// for ${stmt.indexVar}`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `for ${stmt.indexVar}`);
}

function appendWhileLoop(sink: CodeSink, stmt: IrWhileLoop, ctx: PrintContext): void {
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
    appendBodyOrPlaceholder(sink, stmt.body, inner, placeholder);
    if (ctx.family === 'javascript' || ctx.family === 'cpp') {
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

function appendSequence(sink: CodeSink, stmt: IrSequence, ctx: PrintContext): void {
  const inner = innerIndentCtx(ctx);
  const startLine = sink.lineCount + 1;
  const steps = stmt.steps.filter((step) => step.length > 0);

  if (isPackDrivenFamily(ctx.family)) {
    if (ctx.family === 'python' || ctx.family === 'verse') {
      sink.appendRaw(printFromTemplate(ctx, 'SequenceHeader', {}).text);
      for (const step of steps) {
        appendIrStatements(sink, step, inner);
      }
    } else {
      sink.appendRaw(printFromTemplate(ctx, 'SequenceHeader', {}).text);
      sink.appendRaw(printFromTemplate(ctx, 'SequenceComment', {}).text);
      for (const step of steps) {
        appendIrStatements(sink, step, inner);
      }
      sink.appendRaw(printFromTemplate(ctx, 'SequenceClose', {}).text);
    }
  } else {
    sink.appendRaw(`${ctx.indent}// sequence`);
  }
  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, 'sequence');
}

function appendIrStatement(sink: CodeSink, stmt: IrStatement, ctx: PrintContext): void {
  if (stmt.kind === 'IfBranch') {
    appendIfBranch(sink, stmt as IrIfBranch, ctx);
    return;
  }
  if (stmt.kind === 'ForLoop') {
    appendForLoop(sink, stmt as IrForLoop, ctx);
    return;
  }
  if (stmt.kind === 'WhileLoop') {
    appendWhileLoop(sink, stmt as IrWhileLoop, ctx);
    return;
  }
  if (stmt.kind === 'Switch') {
    appendSwitch(sink, stmt as IrSwitch, ctx);
    return;
  }
  if (stmt.kind === 'Sequence') {
    appendSequence(sink, stmt as IrSequence, ctx);
    return;
  }
  appendLeafStatement(sink, stmt, ctx);
}

/** Emit IR statements with per-node sourceMap entries, including nested control-flow bodies. */
export function appendIrStatements(
  sink: CodeSink,
  statements: IrStatement[],
  printCtx: PrintContext
): void {
  for (const stmt of statements) {
    if (NESTED_BODY_KINDS.has(stmt.kind)) {
      appendIrStatement(sink, stmt, printCtx);
    } else {
      appendLeafStatement(sink, stmt, printCtx);
    }
  }
}

export { innerIndentCtx, blockPlaceholder, innerIndentUnit };
