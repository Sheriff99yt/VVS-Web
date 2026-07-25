import type { GraphTab, FunctionSymbol, FunctionBinding } from '@vvs/graph-types';
import { createDefaultOverload, overloadReturnParameters } from '@vvs/graph-types';
import type { Dispatch, SetStateAction } from 'react';
import { reorderById } from '@/lib/symbolOrder';

export type { FunctionSymbol };
export type ProjectFunction = FunctionSymbol;

export function createFunctionId(): string {
  return `func-${Date.now()}`;
}

export function createFunctionSymbol(
  name: string,
  options?: { id?: string; binding?: FunctionBinding; classId?: string }
): FunctionSymbol {
  const funcId = options?.id ?? createFunctionId();
  const overload = createDefaultOverload();
  return {
    kind: 'function',
    id: funcId,
    name,
    binding: options?.binding ?? 'instance',
    visibility: 'public',
    overloads: [{ ...overload, graphTabId: funcId }],
    classId: options?.classId,
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

export function overloadTreeLabel(overload: FunctionSymbol['overloads'][number]): string {
  const sig = overloadDisplayLabel(overload);
  const returns = overloadReturnParameters(overload);
  if (returns.length === 0) {
    return `${sig} → void`;
  }
  if (returns.length === 1) {
    const retLabel = returns[0]!.type.replace(/^data_/, '');
    return `${sig} → ${retLabel}`;
  }
  const retLabels = returns.map((r) => r.type.replace(/^data_/, ''));
  return `${sig} → (${retLabels.join(', ')})`;
}

/** Append a new overload and return ids needed to open its graph tab. */
export function appendFunctionOverload(func: FunctionSymbol): {
  func: FunctionSymbol;
  overloadId: string;
  graphTabId: string;
} {
  const overload = createDefaultOverload();
  const graphTabId =
    func.overloads.length === 0 ? func.id : `${func.id}::${overload.id}`;
  return {
    func: {
      ...func,
      overloads: [...func.overloads, { ...overload, graphTabId }],
    },
    overloadId: overload.id,
    graphTabId,
  };
}

export function reorderFunctionSymbols(
  functions: FunctionSymbol[],
  fromId: string,
  toId: string
): FunctionSymbol[] {
  return reorderById(functions, fromId, toId);
}
