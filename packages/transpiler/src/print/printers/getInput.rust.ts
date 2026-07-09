import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';

export function printGetInputRust(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const { indent } = ctx;
  const promptOffset = `${indent}print!("{}", `.length;

  if (inputKind === 'number') {
    const lines = [
      `${indent}print!("{}", ${prompt.text});`,
      `${indent}let mut _vvs_line = String::new();`,
      `${indent}std::io::stdin().read_line(&mut _vvs_line).unwrap();`,
      `${indent}let ${varName} = _vvs_line.trim().parse::<f64>().unwrap();`,
    ];
    return {
      text: lines.join('\n'),
      expressionSpans: offsetSpans(prompt.spans, promptOffset),
    };
  }

  const lines = [
    `${indent}print!("{}", ${prompt.text});`,
    `${indent}let mut ${varName} = String::new();`,
    `${indent}std::io::stdin().read_line(&mut ${varName}).unwrap();`,
    `${indent}${varName} = ${varName}.trim_end().to_string();`,
  ];
  return {
    text: lines.join('\n'),
    expressionSpans: offsetSpans(prompt.spans, promptOffset),
  };
}
