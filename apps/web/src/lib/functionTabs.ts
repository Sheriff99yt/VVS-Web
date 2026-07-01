import { GraphTab } from '@/contexts/ProjectContext';
import type { Dispatch, SetStateAction } from 'react';

export interface ProjectFunction {
  id: string;
  name: string;
}

export function createFunctionId(): string {
  return `func-${Date.now()}`;
}

export function formatFunctionTabName(name: string): string {
  return name.startsWith('Function:') ? name : `Function: ${name}`;
}

export function openFunctionTab(
  func: ProjectFunction,
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>,
  setActiveGraphTab: Dispatch<SetStateAction<string>>
) {
  const tabName = formatFunctionTabName(func.name);
  setOpenTabs((prev) => {
    if (prev.find((t) => t.id === func.id)) return prev;
    return [...prev, { id: func.id, type: 'function', name: tabName }];
  });
  setActiveGraphTab(func.id);
}

export function syncFunctionTabNames(
  functions: ProjectFunction[],
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>
) {
  setOpenTabs((prev) =>
    prev.map((tab) => {
      if (tab.type !== 'function') return tab;
      const func = functions.find((f) => f.id === tab.id);
      if (!func) return tab;
      return { ...tab, name: formatFunctionTabName(func.name) };
    })
  );
}
