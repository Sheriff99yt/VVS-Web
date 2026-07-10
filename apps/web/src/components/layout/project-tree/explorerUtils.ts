import { INDENT, type SectionViewMode } from './constants';

export function matchesExplorerFilter(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query);
}

export function sectionGridSpan(viewMode?: SectionViewMode): string | undefined {
  return viewMode === 'grid' ? 'col-span-2' : undefined;
}

export function sectionVisible(matchCount: number, isAdding: boolean, query: string): boolean {
  return !query || matchCount > 0 || isAdding;
}

export function explorerEmptyHintClassName(viewMode?: SectionViewMode): string {
  return `${INDENT.l1} text-[10px] text-zinc-600 italic py-1 pr-2 ${sectionGridSpan(viewMode) ?? ''}`;
}

export function eventRowMeta(entry: { dispatchCount: number; subscriberCount: number }): string | undefined {
  if (entry.subscriberCount <= 0) return undefined;
  return `${entry.subscriberCount} sub${entry.subscriberCount === 1 ? '' : 's'}`;
}

export function getVariableColor(type: string): string {
  switch (type) {
    case 'data_string':
    case 'string':
      return '#38bdf8';
    case 'data_number':
    case 'number':
      return '#4ade80';
    case 'data_boolean':
    case 'boolean':
      return '#f87171';
    case 'data_object':
    case 'object':
      return '#a78bfa';
    case 'data_array':
    case 'array':
      return '#fbbf24';
    case 'data_any':
    case 'any':
      return '#94a3b8';
    default:
      return '#71717a';
  }
}
