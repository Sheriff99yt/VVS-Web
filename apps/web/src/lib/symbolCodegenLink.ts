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
import type { SelectionState, TreeSymbolSelectionKey } from '@/contexts/ProjectContext';
import { symbolClassId } from '@/lib/classScope';
import { resolveNodeKindId } from '@/lib/nodeKind';
import { findClassDefineNode } from '@/lib/defineNodeSync';

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

function uniqueNodeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

type ResolveInput = {
  documents: Record<string, GraphDocument>;
  classes: ClassSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  variables: VariableSymbol[];
  activeGraphTab: string;
};

function resolveTreeSymbolLink(
  key: TreeSymbolSelectionKey,
  input: ResolveInput
): SymbolCodegenLink | null {
  const { documents, classes, functions, events, variables, activeGraphTab } = input;

  if (key.kind === 'class') {
    const cls = findClass(classes, key.id);
    if (!cls) return null;
    const loc = findClassDefineNode(documents, cls);
    const tabId = loc?.tabId ?? classHomeGraphId(cls);
    const highlightNodeIds = loc ? [loc.nodeId] : [];
    return {
      tabId,
      highlightNodeIds,
      primaryNodeId: highlightNodeIds[0],
    };
  }

  if (key.kind === 'graph') {
    return null;
  }

  if (key.kind === 'event') {
    const event = events.find((e) => e.id === key.id);
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

  if (key.kind === 'variable') {
    const variable = variables.find((v) => v.id === key.id);
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

  const func = functions.find((f) => f.id === key.id);
  if (!func) return null;

  const classHomeTabId = resolveClassHomeTabId(symbolClassId(func), classes);
  const overloadTabIds = new Set(func.overloads.map((overload) => overload.graphTabId ?? func.id));
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

function mergeSymbolLinks(
  links: SymbolCodegenLink[],
  activeGraphTab: string
): SymbolCodegenLink | null {
  if (links.length === 0) return null;
  if (links.length === 1) return links[0]!;

  const tabId =
    links.find((link) => link.tabId === activeGraphTab)?.tabId ?? links[0]!.tabId;
  const highlightNodeIds = uniqueNodeIds(links.flatMap((link) => link.highlightNodeIds));
  return {
    tabId,
    highlightNodeIds,
    primaryNodeId: links[0]!.primaryNodeId ?? highlightNodeIds[0],
  };
}

function selectionToTreeKey(selection: SelectionState): TreeSymbolSelectionKey | null {
  if (
    (selection.type === 'variable' ||
      selection.type === 'function' ||
      selection.type === 'event' ||
      selection.type === 'class') &&
    selection.id
  ) {
    return { kind: selection.type, id: selection.id };
  }
  return null;
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
  selectedTreeSymbols?: TreeSymbolSelectionKey[];
}): SymbolCodegenLink | null {
  const {
    selection,
    documents,
    classes,
    functions,
    events,
    variables,
    activeGraphTab,
    selectedNodeIds,
    selectedTreeSymbols,
  } = input;

  if (!documents) return null;

  if (selection.type === 'node' && selectedNodeIds.length > 0) {
    return {
      tabId: activeGraphTab,
      highlightNodeIds: selectedNodeIds,
      primaryNodeId: selectedNodeIds[0],
    };
  }

  const resolveInput: ResolveInput = {
    documents,
    classes,
    functions,
    events,
    variables,
    activeGraphTab,
  };

  const keys =
    selectedTreeSymbols && selectedTreeSymbols.length > 0
      ? selectedTreeSymbols
      : (() => {
          const single = selectionToTreeKey(selection);
          return single ? [single] : [];
        })();

  if (keys.length === 0) return null;

  const links = keys
    .map((key) => resolveTreeSymbolLink(key, resolveInput))
    .filter((link): link is SymbolCodegenLink => link != null);

  return mergeSymbolLinks(links, activeGraphTab);
}
