import { resolvePrintProfile } from '@vvs/syntax-packs';
import type { TargetLanguage } from '@vvs/graph-types';

export function emptyHandlerBodyLine(lang: TargetLanguage): string {
  const layout = resolvePrintProfile(lang).layout;
  return layout?.emptyHandlerBody ?? `${layout?.handlerBodyIndent ?? '        '}${layout?.blockPlaceholder ?? 'pass'}`;
}

export function emptyFunctionBodyLine(lang: TargetLanguage): string {
  const layout = resolvePrintProfile(lang).layout;
  return layout?.emptyFunctionBody ?? `${layout?.bodyIndent ?? '        '}${layout?.blockPlaceholder ?? 'pass'}`;
}
