import { resolvePrintProfile } from '@vvs/syntax-packs';
import type { TargetLanguage } from '@vvs/graph-types';
import { targetLanguageToFamily } from '@vvs/graph-types';

export function emptyHandlerBodyLine(lang: TargetLanguage): string {
  const family = targetLanguageToFamily(lang) ?? 'python';
  const layout = resolvePrintProfile(family).layout;
  return layout?.emptyHandlerBody ?? `${layout?.handlerBodyIndent ?? '        '}${layout?.blockPlaceholder ?? 'pass'}`;
}

export function emptyFunctionBodyLine(lang: TargetLanguage): string {
  const family = targetLanguageToFamily(lang) ?? 'python';
  const layout = resolvePrintProfile(family).layout;
  return layout?.emptyFunctionBody ?? `${layout?.bodyIndent ?? '        '}${layout?.blockPlaceholder ?? 'pass'}`;
}
