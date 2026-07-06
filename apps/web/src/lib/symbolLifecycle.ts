import type { GraphDocument } from '@/lib/graphDefaults';
import type { GraphDocument as CoreGraphDocument } from '@vvs/graph-types';
import type {
  FunctionSymbol,
  ProjectEventDefinition,
  VariableSymbol,
  GraphTab,
} from '@/types/graph';
import type { GraphNode } from '@vvs/graph-types';
import type { VVSNodeData } from '@/types/graph';
import {
  collectSymbolUsages,
  mapDocuments,
  removeSymbolReferencesFromDocuments,
  removeNodesAndEdges,
  resolveNodeSymbolRef,
  findUnresolvedNodes,
  unresolvedRefGroupKey,
  buildProjectSymbolIndex,
  type SymbolRefKind,
  type ResolvedSymbolRef,
} from '@vvs/graph-types';
import { createVariableSymbol } from '@vvs/graph-types';
import { applyVariableRefBinding } from '@/lib/variableHelpers';
import { applyFunctionCallBinding } from '@/lib/functionHelpers';
import { applyEventDefineBinding, applyEventDispatchBinding, applyEventEmitBinding, applyEventSubscribeBinding, createEventId } from '@/lib/eventHelpers';
import { createFunctionSymbol } from '@/lib/functionTabs';
import { formatFunctionTabName } from '@/lib/functionTabs';
import { resolveNodeKindId } from '@/lib/nodeKind';
import {
  removeDefineNodesForSymbol,
  syncDefineNodesForSymbol,
} from '@/lib/defineNodeSync';

function asCoreDocuments(docs: Record<string, GraphDocument>): Record<string, CoreGraphDocument> {
  return docs as unknown as Record<string, CoreGraphDocument>;
}

function fromCoreDocuments(docs: Record<string, CoreGraphDocument>): Record<string, GraphDocument> {
  return docs as unknown as Record<string, GraphDocument>;
}

export type SymbolDeleteMode = 'symbol_only' | 'symbol_and_refs';

export interface ProjectSymbolsState {
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  openTabs: GraphTab[];
}

export interface SymbolDeletePlan {
  nextSymbols: ProjectSymbolsState;
  nextDocuments: Record<string, GraphDocument>;
  closeTabIds: string[];
}

export function countSymbolUsage(
  documents: Record<string, GraphDocument>,
  kind: SymbolRefKind,
  symbolId: string
): { nodeCount: number; graphCount: number } {
  const nodes = collectSymbolUsages(asCoreDocuments(documents), kind, symbolId);
  const graphIds = new Set(nodes.map((n) => n.tabId));
  return { nodeCount: nodes.length, graphCount: graphIds.size };
}

export function planSymbolDelete(
  kind: SymbolRefKind,
  symbolId: string,
  mode: SymbolDeleteMode,
  symbols: ProjectSymbolsState,
  documents: Record<string, GraphDocument>
): SymbolDeletePlan {
  const nextSymbols: ProjectSymbolsState = {
    variables: [...symbols.variables],
    functions: [...symbols.functions],
    events: [...symbols.events],
    openTabs: [...symbols.openTabs],
  };
  let nextDocuments = { ...documents };
  const closeTabIds: string[] = [];

  if (kind === 'variable') {
    nextSymbols.variables = nextSymbols.variables.filter((v) => v.id !== symbolId);
  } else if (kind === 'function' || kind === 'macro') {
    if (kind === 'function') {
      nextSymbols.functions = nextSymbols.functions.filter((f) => f.id !== symbolId);
    }
    if (mode === 'symbol_and_refs') {
      closeTabIds.push(symbolId);
      nextSymbols.openTabs = nextSymbols.openTabs.filter((t) => t.id !== symbolId);
    }
  } else if (kind === 'event') {
    nextSymbols.events = nextSymbols.events.filter((e) => e.id !== symbolId);
  }

  if (mode === 'symbol_and_refs') {
    nextDocuments = fromCoreDocuments(
      removeSymbolReferencesFromDocuments(asCoreDocuments(nextDocuments), kind, symbolId)
    );
    if (kind === 'function' || kind === 'macro') {
      const { [symbolId]: _fnDoc, ...rest } = nextDocuments;
      nextDocuments = rest;
    }
  }

  if (kind === 'variable' || kind === 'function' || kind === 'event') {
    nextDocuments = removeDefineNodesForSymbol(
      nextDocuments,
      kind,
      symbolId
    );
  }

  return { nextSymbols, nextDocuments, closeTabIds };
}

function syncNodeForVariable(node: GraphNode, variable: VariableSymbol): GraphNode {
  const kindId = resolveNodeKindId(node.data);
  const role = kindId === 'variable_set' ? 'set' : 'get';
  return {
    ...node,
    data: applyVariableRefBinding(node.data, variable, role),
  };
}

function syncNodeForFunction(node: GraphNode, func: FunctionSymbol): GraphNode {
  const overloadId = node.data.graphBinding?.overloadId;
  return {
    ...node,
    data: applyFunctionCallBinding(node.data, func, overloadId),
  };
}

function syncNodeForEvent(node: GraphNode, event: ProjectEventDefinition): GraphNode {
  const kindId = resolveNodeKindId(node.data);
  if (kindId === 'event_subscribe') {
    return { ...node, data: applyEventSubscribeBinding(node.data, event) };
  }
  if (kindId === 'event_emit') {
    return { ...node, data: applyEventEmitBinding(node.data, event) };
  }
  if (kindId === 'event_dispatch') {
    return { ...node, data: applyEventDispatchBinding(node.data, event) };
  }
  return { ...node, data: applyEventDefineBinding(node.data, event) };
}

export function applyVariableRenameToDocuments(
  documents: Record<string, GraphDocument>,
  variable: VariableSymbol
): Record<string, GraphDocument> {
  const renamed = fromCoreDocuments(
    mapDocuments(asCoreDocuments(documents), (_tabId, node) => {
      const ref = resolveNodeSymbolRef(node);
      if (!ref || ref.kind !== 'variable' || ref.symbolId !== variable.id) return node;
      return syncNodeForVariable(node as GraphNode, variable);
    })
  );
  return syncDefineNodesForSymbol(renamed, 'variable', variable);
}

export function applyFunctionUpdateToDocuments(
  documents: Record<string, GraphDocument>,
  func: FunctionSymbol
): Record<string, GraphDocument> {
  const updated = fromCoreDocuments(
    mapDocuments(asCoreDocuments(documents), (_tabId, node) => {
      const ref = resolveNodeSymbolRef(node);
      if (!ref || ref.kind !== 'function' || ref.symbolId !== func.id) return node;
      return syncNodeForFunction(node as GraphNode, func);
    })
  );
  return syncDefineNodesForSymbol(updated, 'function', func);
}

export function applyEventUpdateToDocuments(
  documents: Record<string, GraphDocument>,
  event: ProjectEventDefinition
): Record<string, GraphDocument> {
  const updated = fromCoreDocuments(
    mapDocuments(asCoreDocuments(documents), (_tabId, node) => {
      const ref = resolveNodeSymbolRef(node);
      if (!ref || ref.kind !== 'event' || ref.symbolId !== event.id) return node;
      return syncNodeForEvent(node as GraphNode, event);
    })
  );
  return syncDefineNodesForSymbol(updated, 'event', event);
}

export function deleteBrokenNodeFromDocuments(
  documents: Record<string, GraphDocument>,
  tabId: string,
  nodeId: string
): Record<string, GraphDocument> {
  const doc = documents[tabId];
  if (!doc) return documents;
  return {
    ...documents,
    [tabId]: fromCoreDocuments({
      [tabId]: removeNodesAndEdges(asCoreDocuments({ [tabId]: doc })[tabId]!, [nodeId]),
    })[tabId]!,
  };
}

export function deleteAllBrokenNodesForRef(
  documents: Record<string, GraphDocument>,
  ref: ResolvedSymbolRef
): Record<string, GraphDocument> {
  return fromCoreDocuments(
    mapDocuments(asCoreDocuments(documents), (_tabId, node) => {
      const nodeRef = resolveNodeSymbolRef(node);
      if (!nodeRef) return node;
      if (unresolvedRefGroupKey(nodeRef) !== unresolvedRefGroupKey(ref)) return node;
      return null;
    })
  );
}

function uniqueName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

function inferVariableTypeFromNode(data: VVSNodeData): VariableSymbol['type'] {
  const pin = data.outputs?.find((p) => p.type !== 'execution') ?? data.inputs?.find((p) => p.type !== 'execution');
  const t = pin?.type;
  if (t === 'data_string' || t === 'data_number' || t === 'data_boolean' || t === 'data_object' || t === 'data_array' || t === 'data_any') {
    return t;
  }
  return 'data_string';
}

export function inferSymbolFromOrphanNode(
  node: GraphNode,
  ref: ResolvedSymbolRef
): { kind: SymbolRefKind; symbol: VariableSymbol | FunctionSymbol | ProjectEventDefinition } | null {
  const data = node.data;
  const displayName = ref.displayName ?? ref.symbolId.replace(/^name:/, '');

  if (ref.kind === 'variable') {
    const name = displayName || 'Variable';
    const variable = createVariableSymbol(name, {
      id: ref.symbolId.startsWith('name:') ? undefined : ref.symbolId,
      type: inferVariableTypeFromNode(data),
    });
    return { kind: 'variable', symbol: variable };
  }

  if (ref.kind === 'function') {
    const name = displayName || 'Function';
    const func = createFunctionSymbol(name, {
      id: ref.symbolId.startsWith('name:') ? undefined : ref.symbolId,
    });
    return { kind: 'function', symbol: func };
  }

  if (ref.kind === 'event') {
    const name = displayName || 'event';
    const parameters = (data.inputs ?? [])
      .filter((p) => p.type !== 'execution')
      .map((p) => ({ id: p.id, label: p.label, type: p.type }));
    const outputs = (data.outputs ?? []).filter((p) => p.type !== 'execution');
    const eventParams =
      parameters.length > 0
        ? parameters
        : outputs.map((p) => ({ id: p.id, label: p.label, type: p.type }));
    const event: ProjectEventDefinition = {
      id: ref.symbolId.startsWith('name:') ? createEventId() : ref.symbolId,
      name,
      parameters: eventParams,
    };
    return { kind: 'event', symbol: event };
  }

  if (ref.kind === 'macro') {
    const name = displayName || 'Function';
    const func = createFunctionSymbol(name, {
      id: ref.symbolId.startsWith('name:') ? undefined : ref.symbolId,
    });
    return { kind: 'function', symbol: func };
  }

  return null;
}

export interface RecreateSymbolResult {
  nextSymbols: ProjectSymbolsState;
  nextDocuments: Record<string, GraphDocument>;
}

function rebindNode(
  node: GraphNode,
  kind: SymbolRefKind,
  symbol: VariableSymbol | FunctionSymbol | ProjectEventDefinition
): GraphNode {
  switch (kind) {
    case 'variable':
      return syncNodeForVariable(
        node,
        symbol as VariableSymbol
      );
    case 'function':
      return syncNodeForFunction(node, symbol as FunctionSymbol);
    case 'event':
      return syncNodeForEvent(node, symbol as ProjectEventDefinition);
    default:
      return node;
  }
}

export function recreateSymbolForNode(
  symbols: ProjectSymbolsState,
  documents: Record<string, GraphDocument>,
  tabId: string,
  nodeId: string
): RecreateSymbolResult | null {
  const doc = documents[tabId];
  const node = doc?.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const index = buildProjectSymbolIndex({
    variables: symbols.variables,
    functions: symbols.functions,
    events: symbols.events,
  });

  const unresolved = findUnresolvedNodes(asCoreDocuments(documents), index).find(
    (entry) => entry.tabId === tabId && entry.node.id === nodeId
  );
  if (!unresolved) return null;

  const inferred = inferSymbolFromOrphanNode(node as GraphNode, unresolved.ref);
  if (!inferred) return null;

  const nextSymbols: ProjectSymbolsState = {
    variables: [...symbols.variables],
    functions: [...symbols.functions],
    events: [...symbols.events],
    openTabs: [...symbols.openTabs],
  };

  if (inferred.kind === 'variable') {
    const v = inferred.symbol as VariableSymbol;
    const taken = new Set(symbols.variables.map((x) => x.name));
    v.name = uniqueName(v.name, taken);
    if (symbols.variables.some((x) => x.id === v.id)) {
      v.id = `var-${Date.now()}`;
    }
    nextSymbols.variables.push(v);
  } else if (inferred.kind === 'function') {
    const f = inferred.symbol as FunctionSymbol;
    const taken = new Set(symbols.functions.map((x) => x.name));
    f.name = uniqueName(f.name, taken);
    if (symbols.functions.some((x) => x.id === f.id)) {
      f.id = `func-${Date.now()}`;
    }
    nextSymbols.functions.push(f);
    if (!nextSymbols.openTabs.some((t) => t.id === f.id)) {
      nextSymbols.openTabs.push({
        id: f.id,
        type: 'function',
        name: formatFunctionTabName(f.name),
      });
    }
  } else if (inferred.kind === 'event') {
    const e = inferred.symbol as ProjectEventDefinition;
    const taken = new Set(symbols.events.map((x) => x.name.toLowerCase()));
    if (taken.has(e.name.toLowerCase())) {
      e.name = uniqueName(e.name, new Set(symbols.events.map((x) => x.name)));
    }
    if (symbols.events.some((x) => x.id === e.id)) {
      e.id = createEventId();
    }
    nextSymbols.events.push(e);
  }

  const groupKey = unresolvedRefGroupKey(unresolved.ref);
  const nextDocuments = fromCoreDocuments(
    mapDocuments(asCoreDocuments(documents), (_tid, n) => {
      const nodeRef = resolveNodeSymbolRef(n);
      if (!nodeRef || unresolvedRefGroupKey(nodeRef) !== groupKey) return n;
      return rebindNode(n as GraphNode, inferred.kind, inferred.symbol);
    })
  );

  return { nextSymbols, nextDocuments };
}

export function recreateAllUnresolvedSymbols(
  symbols: ProjectSymbolsState,
  documents: Record<string, GraphDocument>,
  filterRef?: ResolvedSymbolRef
): RecreateSymbolResult {
  const index = buildProjectSymbolIndex({
    variables: symbols.variables,
    functions: symbols.functions,
    events: symbols.events,
  });

  let unresolved = findUnresolvedNodes(asCoreDocuments(documents), index);
  if (filterRef) {
    const key = unresolvedRefGroupKey(filterRef);
    unresolved = unresolved.filter((u) => unresolvedRefGroupKey(u.ref) === key);
  }

  let nextSymbols = { ...symbols, variables: [...symbols.variables], functions: [...symbols.functions], events: [...symbols.events], openTabs: [...symbols.openTabs] };
  let nextDocuments = documents;

  const seenGroups = new Set<string>();
  for (const entry of unresolved) {
    const key = unresolvedRefGroupKey(entry.ref);
    if (seenGroups.has(key)) continue;
    seenGroups.add(key);
    const result = recreateSymbolForNode(nextSymbols, nextDocuments, entry.tabId, entry.node.id);
    if (result) {
      nextSymbols = result.nextSymbols;
      nextDocuments = result.nextDocuments;
    }
  }

  return { nextSymbols, nextDocuments };
}

export function getSymbolDisplayName(
  kind: SymbolRefKind,
  symbolId: string,
  symbols: ProjectSymbolsState
): string {
  if (kind === 'variable') {
    return symbols.variables.find((v) => v.id === symbolId)?.name ?? symbolId;
  }
  if (kind === 'function' || kind === 'macro') {
    return (
      symbols.functions.find((f) => f.id === symbolId)?.name ??
      symbols.openTabs.find((t) => t.id === symbolId)?.name.replace(/^Function:\s*/, '') ??
      symbolId
    );
  }
  if (kind === 'event') {
    return symbols.events.find((e) => e.id === symbolId)?.name ?? symbolId;
  }
  return symbolId;
}
