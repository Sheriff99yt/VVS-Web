import type { GraphContainer, GraphTab } from '@vvs/graph-types';
import { containerTabFor, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { Dispatch, SetStateAction } from 'react';
import { formatFunctionTabName } from './functionTabs';

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

export function openGraphContainerTab(
  container: GraphContainer,
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>,
  setActiveGraphTab: Dispatch<SetStateAction<string>>
): void {
  openGraphTab(containerTabFor(container), setOpenTabs, setActiveGraphTab);
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

export function graphDisplayName(tab: GraphTab): string {
  if (tab.type === 'container') return tab.name;
  if (tab.type === 'main') return 'Main graph';
  if (tab.type === 'class') return tab.name;
  if (tab.type === 'graph') return tab.name;
  return tab.name.replace(/^Function:\s*/, '');
}

export function isPinnedGraphTab(tab: GraphTab): boolean {
  return tab.id === MAIN_GRAPH_CONTAINER_ID;
}

export function isOrgOnlyGraphTab(activeGraphTab: string): boolean {
  return activeGraphTab === MAIN_GRAPH_CONTAINER_ID;
}

export function isContainerGraphTab(activeGraphTab: string, openTabs: GraphTab[]): boolean {
  const tab = openTabs.find((t) => t.id === activeGraphTab);
  return tab?.type === 'container';
}

export function canCloseGraphTab(tab: GraphTab): boolean {
  return tab.id !== MAIN_GRAPH_CONTAINER_ID;
}

export function reorderOpenTabs(tabs: GraphTab[], fromId: string, toId: string): GraphTab[] {
  if (fromId === toId) return tabs;
  const fromIndex = tabs.findIndex((tab) => tab.id === fromId);
  const toIndex = tabs.findIndex((tab) => tab.id === toId);
  if (fromIndex < 0 || toIndex < 0) return tabs;
  const next = [...tabs];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
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
  if (tab.type === 'container') {
    const base = tab.name.replace(/\s+/g, '_').toLowerCase() || 'project_map';
    return `${base}.${ext}`;
  }
  if (tab.type === 'main' || tab.type === 'class') {
    const base = (tab.type === 'class' ? tab.name : moduleName).replace(/\s+/g, '_').toLowerCase() || 'module';
    return `${base}.${ext}`;
  }
  const base = graphDisplayName(tab).replace(/\s+/g, '_').toLowerCase() || 'graph';
  return `${base}.${ext}`;
}
