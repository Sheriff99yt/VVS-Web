import type { GraphTab, TargetLanguage, TargetFileExtensions } from '@vvs/graph-types';
import { resolveTargetFileExtension } from '@vvs/graph-types';

export function generatedFileName(
  tab: Pick<GraphTab, 'type' | 'name' | 'id'>,
  moduleName: string,
  targetLanguage: TargetLanguage,
  targetFileExtensions?: TargetFileExtensions,
  className?: string
): string {
  const ext = resolveTargetFileExtension(targetLanguage, targetFileExtensions);
  if (tab.type === 'main' || (tab.type === 'container' && className)) {
    const base = (className ?? moduleName).replace(/\s+/g, '_').toLowerCase() || 'module';
    return `${base}.${ext}`;
  }
  const base =
    tab.name.replace(/^Function:\s*/, '').replace(/^Macro:\s*/, '').replace(/\s+/g, '_').toLowerCase() ||
    'graph';
  return `${base}.${ext}`;
}
