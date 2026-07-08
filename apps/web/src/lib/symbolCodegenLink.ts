import {
  collectSymbolUsages,
  classHomeGraphId,
  type ClassSymbol,
  type FunctionSymbol,
  type SymbolUsageLocation,
  type VariableSymbol,
} from '@vvs/graph-types';
import type { ProjectEventDefinition } from '@/types/graph';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { SelectionState } from '@/contexts/ProjectContext';
import { symbolClassId } from '@/lib/classScope';
import { resolveNodeKindId } from '@/lib/nodeKind';

export interface SymbolCodegenLink {
  tabId: string;
  highlightNodeIds: string[];
  primaryNodeId?: string;
}

const EVENT_KIND_PRIORITY = ['event_member_define', 'event_define', 'event_dispatch', 'event_emit'];
const VARIABLE_KIND_PRIORITY = ['var_define', 'variable_set', 'variable_get'];
const CALL_FUNCTION_KINDS = ['vvs.project.call_function', 'call_function'];

function findClass(classes: ClassSymbol[], classId: string): ClassSymbol | undefined {
  return classes.find((c) => c.id === classId);
}

function resolveClassHomeTabId(classId: string, classes: ClassSymbol[]): string {
  const cls = findClass(classes, classId);
  return cls ? classHomeGraphId(cls) : classHomeGraphId({ kind: 'class', id: classId, name: '', containerId: undefined });
}

function nodeKindAt(
  documents: Record<string, GraphDocument>,
  location: SymbolUsageLocation
): string {
  const doc = documents[location.tabId];
  const node = doc?.nodes.find((n) => n.id === location.nodeId);
  return node ? resolveNodeKindId(node.data) : '';
}

/** Filter usages and return node IDs sorted by kind priority (lowest index = highest priority). */
export function pickNodesByKindPriority(
  usages: SymbolUsageLocation[],
  documents: Record<string, GraphDocument>,
  kindPriority: string[]
): string[] {
  const scored = usages.map((usage) => {
    const kindId = nodeKindAt(documents, usage);
    const priority = kindPriority.indexOf(kindId);
    return {
      nodeId: usage.nodeId,
      priority: priority >= 0 ? priority : kindPriority.length,
    };
  });

  scored.sort((a, b) => a.priority - b.priority || a.nodeId.localeCompare(b.nodeId));

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const entry of scored) {
    if (seen.has(entry.nodeId)) continue;
    seen.add(entry.nodeId);
    ordered.push(entry.nodeId);
  }
  return ordered;
}

function pickHighlightOnTab(
  usages: SymbolUsageLocation[],
  documents: Record<string, GraphDocument>,
  kindPriority: string[],
  tabId: string
): string[] {
  const onTab = usages.filter((u) => u.tabId === tabId);
  const matched = pickNodesByKindPriority(onTab, documents, kindPriority);
  if (matched.length > 0) return matched;
  return pickNodesByKindPriority(usages, documents, kindPriority);
}

function resolveFunctionTabId(
  func: FunctionSymbol,
  documents: Record<string, GraphDocument>,
  classes: ClassSymbol[]
): string {
  const primaryOverload = func.overloads[0];
  const candidate = primaryOverload?.graphTabId ?? func.id;
  if (documents[candidate]) return candidate;
  return resolveClassHomeTabId(symbolClassId(func), classes);
}

function resolveFunctionHighlightNodes(
  usages: SymbolUsageLocation[],
  documents: Record<string, GraphDocument>,
  functionTabId: string,
  classHomeTabId: string
): string[] {
  const entry = pickNodesByKindPriority(
    usages.filter((u) => u.tabId === functionTabId),
    documents,
    ['function_entry']
  );
  if (entry.length > 0) return entry;

  const define = pickNodesByKindPriority(
    usages.filter((u) => u.tabId === classHomeTabId),
    documents,
    ['function_define']
  );
  if (define.length > 0) return define;

  return pickNodesByKindPriority(usages, documents, CALL_FUNCTION_KINDS);
}

export function resolveSymbolCodegenLink(input: {
  selection: SelectionState;
  documents: Record<string, GraphDocument> | null;
  classes: ClassSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  variables: VariableSymbol[];
  activeGraphTab: string;
  selectedNodeIds: string[];
}): SymbolCodegenLink | null {
  const { selection, documents, classes, functions, events, variables, activeGraphTab, selectedNodeIds } =
    input;

  if (!documents) return null;

  if (selection.type === 'node' && selectedNodeIds.length > 0) {
    return {
      tabId: activeGraphTab,
      highlightNodeIds: selectedNodeIds,
      primaryNodeId: selectedNodeIds[0],
    };
  }

  if (selection.type === 'event' && selection.id) {
    const event = events.find((e) => e.id === selection.id);
    if (!event) return null;

    const tabId = resolveClassHomeTabId(symbolClassId(event), classes);
    const usages = collectSymbolUsages(documents, 'event', event.id);
    const highlightNodeIds = pickHighlightOnTab(usages, documents, EVENT_KIND_PRIORITY, tabId);

    return {
      tabId,
      highlightNodeIds,
      primaryNodeId: highlightNodeIds[0],
    };
  }

  if (selection.type === 'variable' && selection.id) {
    const variable = variables.find((v) => v.id === selection.id);
    if (!variable) return null;

    const tabId = resolveClassHomeTabId(symbolClassId(variable), classes);
    const usages = collectSymbolUsages(documents, 'variable', variable.id);
    const highlightNodeIds = pickHighlightOnTab(usages, documents, VARIABLE_KIND_PRIORITY, tabId);

    return {
      tabId,
      highlightNodeIds,
      primaryNodeId: highlightNodeIds[0],
    };
  }

  if (selection.type === 'function' && selection.id) {
    const func = functions.find((f) => f.id === selection.id);
    if (!func) return null;

    const classHomeTabId = resolveClassHomeTabId(symbolClassId(func), classes);
    const overloadTabIds = new Set(
      func.overloads.map((overload) => overload.graphTabId ?? func.id)
    );
    const tabId = overloadTabIds.has(activeGraphTab)
      ? activeGraphTab
      : resolveFunctionTabId(func, documents, classes);
    const usages = collectSymbolUsages(documents, 'function', func.id);
    const highlightNodeIds = resolveFunctionHighlightNodes(
      usages,
      documents,
      tabId,
      classHomeTabId
    );

    return {
      tabId,
      highlightNodeIds,
      primaryNodeId: highlightNodeIds[0],
    };
  }

  return null;
}
