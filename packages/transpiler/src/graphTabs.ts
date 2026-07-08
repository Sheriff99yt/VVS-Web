import type { GraphTab, TargetLanguage } from '@vvs/graph-types';

export function generatedFileName(
  tab: Pick<GraphTab, 'type' | 'name' | 'id'>,
  moduleName: string,
  targetLanguage: TargetLanguage,
  className?: string
): string {
  const ext =
    targetLanguage === 'python'
      ? 'py'
      : targetLanguage === 'javascript'
        ? 'js'
        : targetLanguage === 'cpp'
          ? 'cpp'
          : targetLanguage === 'verse'
            ? 'verse'
            : 'json';
  if (tab.type === 'main' || (tab.type === 'container' && className)) {
    return `${className ?? moduleName}.${ext}`;
  }
  const base = tab.name.replace(/^Function:\s*/, '').replace(/^Macro:\s*/, '');
  return `${base}.${ext}`;
}
