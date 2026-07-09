import type { LanguageFamily } from '@vvs/graph-types';
import {
  PackTemplateMissingError,
  renderTemplate,
  requireTemplate,
  type RenderSlotValue,
  type ResolvedPrintProfile,
} from '@vvs/syntax-packs';
import { offsetSpans } from '../codeExpr';
import type { PrintContext, PrintedStmt } from './types';

/** Families that must use syntax packs — no silent fallback to hardcoded emitters. */
export const PACK_DRIVEN_FAMILIES = new Set<LanguageFamily>(['python', 'cpp', 'javascript', 'verse']);

export function isPackDrivenFamily(family: LanguageFamily): boolean {
  return PACK_DRIVEN_FAMILIES.has(family);
}

export function getPackLayout(ctx: PrintContext) {
  return ctx.profile?.layout;
}

export function blockPlaceholder(ctx: PrintContext): string {
  return getPackLayout(ctx)?.blockPlaceholder ?? 'pass';
}

export function commentPrefixFromPack(ctx: PrintContext): string {
  return getPackLayout(ctx)?.commentPrefix ?? '# ';
}

export function instanceReceiver(ctx: PrintContext): string {
  return getPackLayout(ctx)?.instanceReceiver ?? '';
}

export function statementSuffix(ctx: PrintContext): string {
  return getPackLayout(ctx)?.statementSuffix ?? '';
}

export function innerIndentUnit(ctx: PrintContext): string {
  return getPackLayout(ctx)?.indentUnit ?? '    ';
}

export function nestedIndent(ctx: PrintContext): string {
  return `${ctx.indent}${innerIndentUnit(ctx)}`;
}

/** Body indent for on_start / function bodies (from pack layout). */
export function bodyIndentFor(ctx: PrintContext): string {
  return getPackLayout(ctx)?.bodyIndent ?? '        ';
}

/** Body indent for event handler statements (from pack layout). */
export function handlerBodyIndentFor(ctx: PrintContext): string {
  return getPackLayout(ctx)?.handlerBodyIndent ?? '        ';
}

export function memberChainIndentFor(ctx: PrintContext): string {
  return getPackLayout(ctx)?.memberChainIndent ?? '    ';
}

/** Render a pack template and apply statement indent + span offsets. */
export function printFromTemplate(
  ctx: PrintContext,
  key: string,
  slots: Record<string, string | RenderSlotValue>,
  options?: { noIndent?: boolean }
): PrintedStmt {
  const row = requireTemplate(ctx.profile, key, ctx.family);
  const rendered = renderTemplate(row, slots, ctx.profile?.layout);
  const prefix = options?.noIndent ? '' : ctx.indent;
  const text = `${prefix}${rendered.text}`;
  return {
    text,
    expressionSpans: offsetSpans(rendered.expressionSpans, prefix.length),
  };
}

export function tryPrintFromTemplate(
  ctx: PrintContext,
  key: string,
  slots: Record<string, string | RenderSlotValue>,
  options?: { noIndent?: boolean }
): PrintedStmt | null {
  const row = ctx.profile?.templates[key];
  if (!row) return null;
  return printFromTemplate(ctx, key, slots, options);
}

export function requirePackTemplate(
  ctx: PrintContext,
  key: string
): NonNullable<ResolvedPrintProfile['templates'][string]> {
  const row = ctx.profile?.templates[key];
  if (!row) throw new PackTemplateMissingError(key, ctx.family);
  return row;
}

export { PackTemplateMissingError };
