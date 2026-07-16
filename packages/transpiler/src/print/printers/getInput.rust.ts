import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';
import {
  getInputLineTempName,
  printGetInputLineNew,
  printGetInputLineRead,
  printGetInputParseLineF32,
} from './getInputLineTemp';

export function printGetInputRust(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const { indent } = ctx;
  const promptOffset = `${indent}print!("{}", `.length;

  if (inputKind === 'number') {
    const line = getInputLineTempName(stmt, 'rust');
    const decl = printGetInputLineNew(ctx, line);
    const read = printGetInputLineRead(ctx, line);
    const parse = printGetInputParseLineF32(ctx, line, varName);
    const lines = [
      `${indent}print!("{}", ${prompt.text});`,
      `${indent}std::io::Write::flush(&mut std::io::stdout()).unwrap();`,
      decl.text,
      read.text,
      parse.text,
    ];
    return {
      text: lines.join('\n'),
      expressionSpans: offsetSpans(prompt.spans, promptOffset),
    };
  }

  const lines = [
    `${indent}print!("{}", ${prompt.text});`,
    `${indent}std::io::Write::flush(&mut std::io::stdout()).unwrap();`,
    `${indent}let mut ${varName} = String::new();`,
    `${indent}std::io::stdin().read_line(&mut ${varName}).unwrap();`,
    `${indent}${varName} = ${varName}.trim_end().to_string();`,
  ];
  return {
    text: lines.join('\n'),
    expressionSpans: offsetSpans(prompt.spans, promptOffset),
  };
}
