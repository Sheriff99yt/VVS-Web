import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';

export function printGetInputCsharp(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const { indent } = ctx;
  const promptOffset = `${indent}Console.Write(`.length;

  if (inputKind === 'number') {
    const lines = [
      `${indent}Console.Write(${prompt.text});`,
      `${indent}var _vvs_line = Console.ReadLine();`,
      `${indent}var ${varName} = double.Parse(_vvs_line ?? "0");`,
    ];
    return {
      text: lines.join('\n'),
      expressionSpans: offsetSpans(prompt.spans, promptOffset),
    };
  }

  const lines = [
    `${indent}Console.Write(${prompt.text});`,
    `${indent}var ${varName} = Console.ReadLine() ?? "";`,
  ];
  return {
    text: lines.join('\n'),
    expressionSpans: offsetSpans(prompt.spans, promptOffset),
  };
}
