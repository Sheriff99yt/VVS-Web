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
import { createDefaultExprPrinter } from '../print/expr';
import { printStatement } from '../print';
import type { PrintContext } from '../print/types';

const NESTED_BODY_KINDS = new Set(['IfBranch', 'ForLoop', 'WhileLoop', 'Switch', 'Sequence']);

function innerIndent(ctx: PrintContext): PrintContext {
  return { ...ctx, indent: `${ctx.indent}    ` };
}

function caseLabelLiteral(label: string): string {
  if (/^-?\d+(\.\d+)?$/.test(label)) return label;
  return JSON.stringify(label);
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

function appendIfBranch(sink: CodeSink, stmt: IrIfBranch, ctx: PrintContext): void {
  const printExpr = createDefaultExprPrinter();
  const condPrinted = printExpr(stmt.condition, ctx);
  const cond = condPrinted.text;
  const { indent, family } = ctx;
  const inner = innerIndent(ctx);
  const startLine = sink.lineCount + 1;

  if (family === 'python') {
    const header = `${indent}if ${cond}:`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'if '.length);
    appendBodyOrPlaceholder(sink, stmt.trueBody, inner, `${inner.indent}pass`);
    if (stmt.falseBody.length > 0) {
      sink.appendRaw(`${indent}else:`);
      appendBodyOrPlaceholder(sink, stmt.falseBody, inner, `${inner.indent}pass`);
    }
  } else if (family === 'javascript') {
    const header = `${indent}if (${cond}) {`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'if ('.length);
    appendBodyOrPlaceholder(sink, stmt.trueBody, inner, `${inner.indent}// empty`);
    if (stmt.falseBody.length > 0) {
      sink.appendRaw(`${indent}} else {`);
      appendBodyOrPlaceholder(sink, stmt.falseBody, inner, `${inner.indent}// empty`);
      sink.appendRaw(`${indent}};`);
    } else {
      sink.appendRaw(`${indent}};`);
    }
  } else if (family === 'cpp') {
    const header = `${indent}if (${cond}) {`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'if ('.length);
    appendBodyOrPlaceholder(sink, stmt.trueBody, inner, `${inner.indent}// empty`);
    if (stmt.falseBody.length > 0) {
      sink.appendRaw(`${indent}} else {`);
      appendBodyOrPlaceholder(sink, stmt.falseBody, inner, `${inner.indent}// empty`);
    }
    sink.appendRaw(`${indent}}`);
  } else if (family === 'verse') {
    const header = `${indent}if (${cond}):`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'if ('.length);
    appendBodyOrPlaceholder(sink, stmt.trueBody, inner, `${inner.indent}# empty`);
    if (stmt.falseBody.length > 0) {
      sink.appendRaw(`${indent}else:`);
      appendBodyOrPlaceholder(sink, stmt.falseBody, inner, `${inner.indent}# empty`);
    }
  } else {
    sink.appendRaw(`${indent}// if (${cond})`);
  }

  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `if ${cond}`);
}

function appendForLoop(sink: CodeSink, stmt: IrForLoop, ctx: PrintContext): void {
  const printExpr = createDefaultExprPrinter();
  const firstPrinted = printExpr(stmt.first, ctx);
  const lastPrinted = printExpr(stmt.last, ctx);
  const first = firstPrinted.text;
  const last = lastPrinted.text;
  const { indent, family } = ctx;
  const inner = innerIndent(ctx);
  const startLine = sink.lineCount + 1;

  if (family === 'python') {
    const header = `${indent}for ${stmt.indexVar} in range(${first}, ${last} + 1):`;
    appendRawWithExprSpans(sink, header, [...firstPrinted.spans, ...offsetSpans(lastPrinted.spans, first.length + ', '.length)], indent.length + `for ${stmt.indexVar} in range(`.length);
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}pass`);
  } else if (family === 'javascript') {
    sink.appendRaw(
      `${indent}for (let ${stmt.indexVar} = ${first}; ${stmt.indexVar} <= ${last}; ${stmt.indexVar}++) {`
    );
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}// empty`);
    sink.appendRaw(`${indent}};`);
  } else if (family === 'cpp') {
    sink.appendRaw(
      `${indent}for (int ${stmt.indexVar} = ${first}; ${stmt.indexVar} <= ${last}; ${stmt.indexVar}++) {`
    );
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}// empty`);
    sink.appendRaw(`${indent}}`);
  } else if (family === 'verse') {
    sink.appendRaw(`${indent}loop:`);
    appendBodyOrPlaceholder(
      sink,
      stmt.body,
      inner,
      `${inner.indent}# empty  # for ${stmt.indexVar} in ${first}..${last}`
    );
  } else {
    sink.appendRaw(`${indent}// for ${stmt.indexVar} = ${first}..${last}`);
  }

  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `for ${stmt.indexVar}`);
}

function appendWhileLoop(sink: CodeSink, stmt: IrWhileLoop, ctx: PrintContext): void {
  const printExpr = createDefaultExprPrinter();
  const condPrinted = printExpr(stmt.condition, ctx);
  const cond = condPrinted.text;
  const { indent, family } = ctx;
  const inner = innerIndent(ctx);
  const startLine = sink.lineCount + 1;

  if (family === 'python') {
    const header = `${indent}while ${cond}:`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'while '.length);
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}pass`);
  } else if (family === 'javascript') {
    const header = `${indent}while (${cond}) {`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'while ('.length);
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}// empty`);
    sink.appendRaw(`${indent}};`);
  } else if (family === 'cpp') {
    const header = `${indent}while (${cond}) {`;
    appendRawWithExprSpans(sink, header, condPrinted.spans, indent.length + 'while ('.length);
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}// empty`);
    sink.appendRaw(`${indent}}`);
  } else if (family === 'verse') {
    sink.appendRaw(`${indent}loop:`);
    appendBodyOrPlaceholder(sink, stmt.body, inner, `${inner.indent}# empty  # while ${cond}`);
  } else {
    sink.appendRaw(`${indent}// while (${cond})`);
  }

  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `while ${cond}`);
}

function appendSwitch(sink: CodeSink, stmt: IrSwitch, ctx: PrintContext): void {
  const printExpr = createDefaultExprPrinter();
  const selectorPrinted = printExpr(stmt.selector, ctx);
  const selector = selectorPrinted.text;
  const { indent, family } = ctx;
  const inner = innerIndent(ctx);
  const startLine = sink.lineCount + 1;
  const selTemp = '_vvs_sel';

  if (family === 'python') {
    const header = `${indent}${selTemp} = ${selector}`;
    appendRawWithExprSpans(sink, header, selectorPrinted.spans, indent.length + `${selTemp} = `.length);
    stmt.cases.forEach((c, i) => {
      const kw = i === 0 ? 'if' : 'elif';
      sink.appendRaw(`${indent}${kw} ${selTemp} == ${caseLabelLiteral(c.label)}:`);
      appendBodyOrPlaceholder(sink, c.body, inner, `${inner.indent}pass`);
    });
    if (stmt.defaultBody.length > 0) {
      sink.appendRaw(`${indent}else:`);
      appendBodyOrPlaceholder(sink, stmt.defaultBody, inner, `${inner.indent}pass`);
    }
  } else if (family === 'javascript') {
    const header = `${indent}switch (${selector}) {`;
    appendRawWithExprSpans(sink, header, selectorPrinted.spans, indent.length + 'switch ('.length);
    for (const c of stmt.cases) {
      sink.appendRaw(`${indent}  case ${caseLabelLiteral(c.label)}:`);
      appendBodyOrPlaceholder(sink, c.body, inner, `${inner.indent}    // empty`);
      sink.appendRaw(`${inner.indent}    break;`);
    }
    if (stmt.defaultBody.length > 0) {
      sink.appendRaw(`${indent}  default:`);
      appendBodyOrPlaceholder(sink, stmt.defaultBody, inner, `${inner.indent}    // empty`);
      sink.appendRaw(`${inner.indent}    break;`);
    }
    sink.appendRaw(`${indent}};`);
  } else if (family === 'cpp') {
    const header = `${indent}switch (${selector}) {`;
    appendRawWithExprSpans(sink, header, selectorPrinted.spans, indent.length + 'switch ('.length);
    for (const c of stmt.cases) {
      sink.appendRaw(`${indent}  case ${caseLabelLiteral(c.label)}:`);
      appendBodyOrPlaceholder(sink, c.body, inner, `${inner.indent}    // empty`);
      sink.appendRaw(`${inner.indent}    break;`);
    }
    if (stmt.defaultBody.length > 0) {
      sink.appendRaw(`${indent}  default:`);
      appendBodyOrPlaceholder(sink, stmt.defaultBody, inner, `${inner.indent}    // empty`);
      sink.appendRaw(`${inner.indent}    break;`);
    }
    sink.appendRaw(`${indent}}`);
  } else if (family === 'verse') {
    sink.appendRaw(`${indent}# switch (${selector})`);
    for (const c of stmt.cases) {
      sink.appendRaw(`${indent}if (${selector} = ${JSON.stringify(c.label)}):`);
      appendBodyOrPlaceholder(sink, c.body, inner, `${inner.indent}# empty`);
    }
    if (stmt.defaultBody.length > 0) {
      sink.appendRaw(`${indent}else:`);
      appendBodyOrPlaceholder(sink, stmt.defaultBody, inner, `${inner.indent}# empty`);
    }
  } else {
    sink.appendRaw(`${indent}// switch (${selector})`);
  }

  sink.tagRange(stmt.sourceGraphNodeId, startLine, sink.lineCount, `switch ${selector}`);
}

function appendSequence(sink: CodeSink, stmt: IrSequence, ctx: PrintContext): void {
  const { indent, family } = ctx;
  const inner = innerIndent(ctx);
  const startLine = sink.lineCount + 1;

  if (family === 'python' || family === 'verse') {
    sink.appendRaw(`${indent}# sequence`);
    for (const step of stmt.steps) {
      appendIrStatements(sink, step, inner);
    }
  } else if (family === 'javascript') {
    sink.appendRaw(`${indent}{`);
    sink.appendRaw(`${indent}  // sequence`);
    for (const step of stmt.steps) {
      appendIrStatements(sink, step, inner);
    }
    sink.appendRaw(`${indent}};`);
  } else if (family === 'cpp') {
    sink.appendRaw(`${indent}{`);
    sink.appendRaw(`${indent}  // sequence`);
    for (const step of stmt.steps) {
      appendIrStatements(sink, step, inner);
    }
    sink.appendRaw(`${indent}}`);
  } else {
    sink.appendRaw(`${indent}// sequence`);
    for (const step of stmt.steps) {
      appendIrStatements(sink, step, inner);
    }
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
