import type { LanguageFamily } from '@vvs/graph-types';
import type { PrintContext } from './types';
import { printFromTemplate } from './template';

export type BlockCloseKey = 'IfBranchClose' | 'ForLoopClose' | 'WhileLoopClose';

/** Column offset for condition expression spans inside `if (` / `while (` headers. */
export function condSpanOffset(
  family: LanguageFamily,
  indent: string,
  keyword: 'if' | 'while'
): number {
  if (family === 'python' || family === 'verse') {
    return indent.length + `${keyword} `.length;
  }
  return indent.length + `${keyword} (`.length;
}

/** Column offset for loop bound expressions inside `for ... range(` / `for (` headers. */
export function forSpanOffset(family: LanguageFamily, indent: string, indexVar: string): number {
  if (family === 'python') {
    return indent.length + `for ${indexVar} in range(`.length;
  }
  return indent.length + 'for '.length;
}

/** Pack-driven closing brace line for brace-family languages (javascript/cpp). */
export function blockCloseLine(ctx: PrintContext, key: BlockCloseKey): string {
  return printFromTemplate(ctx, key, {}).text;
}

/** Pack-driven else branch opener (`} else {`). */
export function ifElseLine(ctx: PrintContext): string {
  return printFromTemplate(ctx, 'IfBranchElse', {}).text;
}

export function appendBraceFamilyClose(
  ctx: PrintContext,
  lines: { text: string }[],
  key: BlockCloseKey
): void {
  if (ctx.family === 'javascript' || ctx.family === 'cpp') {
    lines.push({ text: blockCloseLine(ctx, key) });
  }
}
