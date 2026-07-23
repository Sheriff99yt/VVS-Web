import type { IrAssignVariable } from '../../ir/types';
import { printFromTemplate } from '../template';
import type { PrintContext, PrintedStmt } from '../types';

/** Fixed line buffer for Rust number GetInput (pack-driven). */
export const GET_INPUT_LINE_TEMP = '_vvs_line';

/** C# scopes line buffer per GetInput node id. */
export function getInputLineTempName(stmt: IrAssignVariable, family: string): string {
  if (family === 'csharp' || family === 'go') return `_vvs_line_${stmt.sourceGraphNodeId}`;
  return GET_INPUT_LINE_TEMP;
}

/** Pack `GetInputLineNew` — empty mutable line buffer. */
export function printGetInputLineNew(ctx: PrintContext, name: string): PrintedStmt {
  return printFromTemplate(ctx, 'GetInputLineNew', { name });
}

/** Pack `GetInputLineRead` — read one line into buffer. */
export function printGetInputLineRead(ctx: PrintContext, name: string): PrintedStmt {
  return printFromTemplate(ctx, 'GetInputLineRead', { name });
}

/** Pack `GetInputParseLineF32` — parse line buffer to float target. */
export function printGetInputParseLineF32(
  ctx: PrintContext,
  name: string,
  target: string
): PrintedStmt {
  return printFromTemplate(ctx, 'GetInputParseLineF32', { name, target });
}
