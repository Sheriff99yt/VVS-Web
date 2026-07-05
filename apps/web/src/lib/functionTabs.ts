import type { GraphTab, FunctionSymbol } from '@vvs/graph-types';
import { createDefaultOverload } from '@vvs/graph-types';
import type { Dispatch, SetStateAction } from 'react';

export type { FunctionSymbol };
export type ProjectFunction = FunctionSymbol;

export function createFunctionId(): string {
  return `func-${Date.now()}`;
}

export function createFunctionSymbol(name: string, id?: string): FunctionSymbol {
  const funcId = id ?? createFunctionId();
  const overload = createDefaultOverload();
  return {
    kind: 'function',
    id: funcId,
    name,
    binding: 'instance',
    visibility: 'public',
    overloads: [{ ...overload, graphTabId: funcId }],
  };
}

export function formatFunctionTabName(name: string): string {
  return name.startsWith('Function:') ? name : `Function: ${name}`;
}

export function openFunctionTab(
  func: FunctionSymbol,
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
  functions: FunctionSymbol[],
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

export function overloadTabId(func: FunctionSymbol, overloadId: string): string {
  const overload = func.overloads.find((o) => o.id === overloadId);
  if (!overload) return func.id;
  if (func.overloads.length === 1) return func.id;
  return overload.graphTabId ?? `${func.id}::${overload.id}`;
}

export function overloadDisplayLabel(overload: FunctionSymbol['overloads'][number]): string {
  if (overload.parameters.length === 0) return '( )';
  const parts = overload.parameters.map((p) => p.label || p.id);
  return `( ${parts.join(', ')} )`;
}
