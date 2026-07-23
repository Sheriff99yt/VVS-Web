import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';
import {
  getInputLineTempName,
  printGetInputLineRead,
  printGetInputParseLineF32,
} from './getInputLineTemp';

export function printGetInputGo(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const { indent } = ctx;
  const promptOffset = `${indent}fmt.Print(`.length;

  if (inputKind === 'number') {
    const line = getInputLineTempName(stmt, 'go');
    const read = printGetInputLineRead(ctx, line);
    const parse = printGetInputParseLineF32(ctx, line, varName);
    const lines = [`${indent}fmt.Print(${prompt.text})`, read.text, parse.text];
    return {
      text: lines.join('\n'),
      expressionSpans: offsetSpans(prompt.spans, promptOffset),
    };
  }

  const lines = [
    `${indent}fmt.Print(${prompt.text})`,
    `${indent}scanner := bufio.NewScanner(os.Stdin)`,
    `${indent}scanner.Scan()`,
    `${indent}${varName} := scanner.Text()`,
  ];
  return {
    text: lines.join('\n'),
    expressionSpans: offsetSpans(prompt.spans, promptOffset),
  };
}
