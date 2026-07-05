import type { GraphTab } from '@vvs/graph-types';
import type { Dispatch, SetStateAction } from 'react';
import { formatFunctionTabName } from './functionTabs';

export function createMacroId(): string {
  return `macro-${Date.now()}`;
}

export function openGraphTab(
  tab: GraphTab,
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>,
  setActiveGraphTab: Dispatch<SetStateAction<string>>
): void {
  setOpenTabs((prev) => {
    if (prev.find((t) => t.id === tab.id)) return prev;
    return [...prev, tab];
  });
  setActiveGraphTab(tab.id);
}

export function openMainGraph(setActiveGraphTab: Dispatch<SetStateAction<string>>): void {
  setActiveGraphTab('main');
}

export function openFunctionGraphTab(
  func: { id: string; name: string },
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>,
  setActiveGraphTab: Dispatch<SetStateAction<string>>
): void {
  openGraphTab(
    { id: func.id, type: 'function', name: formatFunctionTabName(func.name) },
    setOpenTabs,
    setActiveGraphTab
  );
}

export function openMacroGraphTab(
  macro: { id: string; name: string },
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>,
  setActiveGraphTab: Dispatch<SetStateAction<string>>
): void {
  openGraphTab(
    { id: macro.id, type: 'macro', name: macro.name.startsWith('Macro:') ? macro.name : `Macro: ${macro.name}` },
    setOpenTabs,
    setActiveGraphTab
  );
}

export function graphDisplayName(tab: GraphTab): string {
  if (tab.type === 'main') return 'Main graph';
  if (tab.type === 'function') return tab.name.replace(/^Function:\s*/, '');
  return tab.name.replace(/^Macro:\s*/, '');
}

export function generatedFileName(
  tab: GraphTab,
  moduleName: string,
  targetLanguage: string
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
  if (tab.type === 'main') {
    const base = moduleName.replace(/\s+/g, '_').toLowerCase() || 'module';
    return `${base}.${ext}`;
  }
  const base = graphDisplayName(tab).replace(/\s+/g, '_').toLowerCase() || 'graph';
  return `${base}.${ext}`;
}
