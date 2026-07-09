import type { IrAssignVariable } from '../../ir/types';
import { offsetSpans } from '../../codeExpr';
import { createDefaultExprPrinter } from '../expr';
import type { PrintContext, PrintedStmt } from '../types';

export function printGetInputCpp(stmt: IrAssignVariable, ctx: PrintContext): PrintedStmt {
  const printExpr = createDefaultExprPrinter();
  const prompt = stmt.prompt ? printExpr(stmt.prompt, ctx) : { text: '""', spans: [] };
  const varName = stmt.targetName;
  const inputKind = stmt.inputKind ?? 'text';
  const { indent } = ctx;

  if (inputKind === 'number') {
    const lines = [
      `${indent}std::cout << ${prompt.text};`,
      `${indent}float ${varName};`,
      `${indent}std::cin >> ${varName};`,
    ];
    return { text: lines.join('\n'), expressionSpans: [] };
  }
  const lines = [
    `${indent}std::cout << ${prompt.text};`,
    `${indent}std::string ${varName};`,
    `${indent}std::getline(std::cin, ${varName});`,
  ];
  return { text: lines.join('\n'), expressionSpans: [] };
}
