import { GraphTab } from '@/contexts/ProjectContext';
import { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNodeData } from '@/types/graph';
import { graphDisplayName } from './graphTabs';

export type GraphReferenceKind =
  | 'calls'
  | 'imports'
  | 'module_import'
  | 'uses_variable'
  | 'shared_event';

export interface GraphReference {
  fromGraphId: string;
  toGraphId: string;
  kind: GraphReferenceKind;
  label: string;
}

export interface GraphReferenceEdges {
  incoming: GraphReference[];
  outgoing: GraphReference[];
}

const EVENT_ROOT_LABELS = new Set(['On Start', 'On Update']);

function graphLabel(
  graphId: string,
  openTabs: GraphTab[],
  functions: { id: string; name: string }[]
): string {
  if (graphId === 'main') return 'Main graph';
  const tab = openTabs.find((t) => t.id === graphId);
  if (tab) return graphDisplayName(tab);
  const func = functions.find((f) => f.id === graphId);
  return func?.name ?? graphId;
}

function addRef(refs: GraphReference[], ref: GraphReference, seen: Set<string>): void {
  const key = `${ref.fromGraphId}:${ref.toGraphId}:${ref.kind}:${ref.label}`;
  if (seen.has(key)) return;
  seen.add(key);
  refs.push(ref);
}

/**
 * Detects cross-graph relationships for the reference viewer (UE-style).
 */
export function detectGraphReferences(
  documents: Record<string, GraphDocument>,
  functions: { id: string; name: string }[] = [],
  macros: { id: string; name: string }[] = []
): GraphReference[] {
  const refs: GraphReference[] = [];
  const seen = new Set<string>();

  // Shared variables via Get/Set node labels
  for (const [graphId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const label = node.data.label ?? '';
      if (!label.startsWith('Get ') && !label.startsWith('Set ')) continue;

      const varName = label.replace(/^(Get|Set)\s+/, '');
      for (const [otherId] of Object.entries(documents)) {
        if (otherId === graphId) continue;
        const usesSame = documents[otherId].nodes.some(
          (n) =>
            n.type === 'vvs_standard_node' &&
            (n.data.label === `Get ${varName}` || n.data.label === `Set ${varName}`)
        );
        if (usesSame) {
          addRef(
            refs,
            {
              fromGraphId: graphId,
              toGraphId: otherId,
              kind: 'uses_variable',
              label: `Shared variable: ${varName}`,
            },
            seen
          );
        }
      }
    }
  }

  // Explicit graph links (Call Function, etc.)
  for (const [graphId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node' || !node.data.linkedGraphId) continue;
      const targetId = node.data.linkedGraphId;
      if (targetId === graphId) continue;

      if (node.data.linkKind === 'call_function') {
        const func = functions.find((f) => f.id === targetId);
        addRef(
          refs,
          {
            fromGraphId: graphId,
            toGraphId: targetId,
            kind: 'calls',
            label: `Calls ${func?.name ?? targetId}`,
          },
          seen
        );
      } else if (node.data.linkKind === 'use_macro') {
        const macro = macros.find((m) => m.id === targetId);
        addRef(
          refs,
          {
            fromGraphId: graphId,
            toGraphId: targetId,
            kind: 'imports',
            label: `Uses macro: ${macro?.name ?? targetId}`,
          },
          seen
        );
      } else if (node.data.linkKind === 'import_module') {
        const func = functions.find((f) => f.id === targetId);
        const macro = macros.find((m) => m.id === targetId);
        const moduleName =
          targetId === 'main'
            ? 'Main graph'
            : func?.name ?? macro?.name ?? targetId;
        addRef(
          refs,
          {
            fromGraphId: graphId,
            toGraphId: targetId,
            kind: 'module_import',
            label: `Imports module: ${moduleName}`,
          },
          seen
        );
      }
    }
  }

  // Function calls — node label matches a function name in another graph (legacy)
  for (const func of functions) {
    for (const [graphId, doc] of Object.entries(documents)) {
      if (graphId === func.id) continue;
      const calls = doc.nodes.some(
        (n) =>
          n.type === 'vvs_standard_node' &&
          !n.data.linkedGraphId &&
          (n.data.label === func.name || n.data.label === `Call ${func.name}`)
      );
      if (calls) {
        addRef(
          refs,
          {
            fromGraphId: graphId,
            toGraphId: func.id,
            kind: 'calls',
            label: `Calls ${func.name}`,
          },
          seen
        );
      }
    }
  }

  // Macro usage — node references macro by name
  for (const macro of macros) {
    for (const [graphId, doc] of Object.entries(documents)) {
      if (graphId === macro.id) continue;
      const usesMacro = doc.nodes.some(
        (n) =>
          n.type === 'vvs_standard_node' &&
          !n.data.linkedGraphId &&
          (n.data.label === macro.name ||
            n.data.label === `Macro: ${macro.name}` ||
            n.data.label?.includes(macro.name))
      );
      if (usesMacro) {
        addRef(
          refs,
          {
            fromGraphId: graphId,
            toGraphId: macro.id,
            kind: 'imports',
            label: `Uses macro: ${macro.name}`,
          },
          seen
        );
      }
    }
  }

  // Custom events shared across graphs (same event label, not root lifecycle events)
  const eventsByLabel = new Map<string, Set<string>>();
  for (const [graphId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node' || node.data.category !== 'Events') continue;
      const label = node.data.label ?? '';
      if (!label || EVENT_ROOT_LABELS.has(label)) continue;
      if (!eventsByLabel.has(label)) eventsByLabel.set(label, new Set());
      eventsByLabel.get(label)!.add(graphId);
    }
  }
  for (const [eventLabel, graphIds] of eventsByLabel) {
    const ids = Array.from(graphIds);
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        addRef(
          refs,
          {
            fromGraphId: ids[i],
            toGraphId: ids[j],
            kind: 'shared_event',
            label: `Shared event: ${eventLabel}`,
          },
          seen
        );
      }
    }
  }

  return refs;
}

export function findGraphIdsUsingVariable(
  documents: Record<string, GraphDocument>,
  variableName: string
): string[] {
  const ids = new Set<string>();
  const getLabel = `Get ${variableName}`;
  const setLabel = `Set ${variableName}`;

  for (const [graphId, doc] of Object.entries(documents)) {
    const uses = doc.nodes.some(
      (n) =>
        n.type === 'vvs_standard_node' &&
        (n.data.label === getLabel || n.data.label === setLabel)
    );
    if (uses) ids.add(graphId);
  }

  return Array.from(ids);
}

export function buildReferenceIndex(
  documents: Record<string, GraphDocument>,
  functions: { id: string; name: string }[],
  macros: { id: string; name: string }[]
): Map<string, GraphReferenceEdges> {
  const refs = detectGraphReferences(documents, functions, macros);
  const index = new Map<string, GraphReferenceEdges>();

  const ensure = (graphId: string): GraphReferenceEdges => {
    if (!index.has(graphId)) {
      index.set(graphId, { incoming: [], outgoing: [] });
    }
    return index.get(graphId)!;
  };

  for (const ref of refs) {
    ensure(ref.fromGraphId).outgoing.push(ref);
    ensure(ref.toGraphId).incoming.push(ref);
  }

  return index;
}

export function formatReferenceEndpoint(
  graphId: string,
  openTabs: GraphTab[],
  functions: { id: string; name: string }[]
): string {
  return graphLabel(graphId, openTabs, functions);
}

export function formatReferenceLabel(
  ref: GraphReference,
  direction: 'incoming' | 'outgoing',
  openTabs: GraphTab[],
  functions: { id: string; name: string }[]
): string {
  const peerId = direction === 'outgoing' ? ref.toGraphId : ref.fromGraphId;
  const peer = formatReferenceEndpoint(peerId, openTabs, functions);

  if (ref.kind === 'uses_variable') {
    const varName = ref.label.replace(/^Shared variable:\s*/, '');
    return direction === 'outgoing' ? `${varName} → ${peer}` : `${varName} ← ${peer}`;
  }

  return `${ref.label} → ${peer}`;
}

export function referenceKindLabel(kind: GraphReferenceKind): string {
  switch (kind) {
    case 'calls':
      return 'Call';
    case 'imports':
      return 'Macro';
    case 'module_import':
      return 'Import';
    case 'uses_variable':
      return 'Variable';
    case 'shared_event':
      return 'Event';
    default:
      return 'Link';
  }
}

const DEPENDENCY_KINDS = new Set<GraphReferenceKind>(['calls', 'imports', 'module_import']);

type CrossGraphLink = Pick<VVSNodeData, 'label' | 'linkedGraphId' | 'linkKind'>;

/** Resolve whether a node implies a call/import to another graph. */
export function resolveCrossGraphTarget(
  graphId: string,
  nodeLabelOrLink: string | CrossGraphLink,
  functions: { id: string; name: string }[],
  macros: { id: string; name: string }[]
): { targetGraphId: string; kind: 'calls' | 'imports' | 'module_import' } | null {
  const link: CrossGraphLink =
    typeof nodeLabelOrLink === 'string'
      ? { label: nodeLabelOrLink }
      : nodeLabelOrLink;

  if (link.linkedGraphId && link.linkedGraphId !== graphId) {
    if (link.linkKind === 'call_function') {
      return { targetGraphId: link.linkedGraphId, kind: 'calls' };
    }
    if (link.linkKind === 'use_macro') {
      return { targetGraphId: link.linkedGraphId, kind: 'imports' };
    }
    if (link.linkKind === 'import_module') {
      return { targetGraphId: link.linkedGraphId, kind: 'module_import' };
    }
  }

  const nodeLabel = link.label;
  for (const func of functions) {
    if (func.id === graphId) continue;
    if (nodeLabel === func.name || nodeLabel === `Call ${func.name}`) {
      return { targetGraphId: func.id, kind: 'calls' };
    }
  }
  for (const macro of macros) {
    if (macro.id === graphId) continue;
    if (
      nodeLabel === macro.name ||
      nodeLabel === `Macro: ${macro.name}` ||
      nodeLabel.includes(macro.name)
    ) {
      return { targetGraphId: macro.id, kind: 'imports' };
    }
  }
  return null;
}

function dependencyAdjacency(
  refs: GraphReference[]
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const ref of refs) {
    if (!DEPENDENCY_KINDS.has(ref.kind)) continue;
    if (!adj.has(ref.fromGraphId)) adj.set(ref.fromGraphId, new Set());
    adj.get(ref.fromGraphId)!.add(ref.toGraphId);
  }
  return adj;
}

function canReachGraph(adj: Map<string, Set<string>>, start: string, goal: string): boolean {
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === goal) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }
  return false;
}

/** True if adding fromGraphId → toGraphId would create a call/macro dependency cycle. */
export function wouldCrossGraphDependencyCycle(
  documents: Record<string, GraphDocument>,
  functions: { id: string; name: string }[],
  macros: { id: string; name: string }[],
  fromGraphId: string,
  toGraphId: string
): boolean {
  if (fromGraphId === toGraphId) return true;
  const refs = detectGraphReferences(documents, functions, macros).filter((r) =>
    DEPENDENCY_KINDS.has(r.kind)
  );
  const adj = dependencyAdjacency(refs);
  if (!adj.has(fromGraphId)) adj.set(fromGraphId, new Set());
  adj.get(fromGraphId)!.add(toGraphId);
  return canReachGraph(adj, toGraphId, fromGraphId);
}

export function wouldNodeLabelCauseCrossGraphCycle(
  documents: Record<string, GraphDocument>,
  functions: { id: string; name: string }[],
  macros: { id: string; name: string }[],
  graphId: string,
  nodeId: string,
  newLabel: string
): boolean {
  const target = resolveCrossGraphTarget(graphId, newLabel, functions, macros);
  if (!target) return false;

  const doc = documents[graphId];
  if (!doc) return false;

  const updatedNodes = doc.nodes.map((n) =>
    n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
  );
  const updatedDocs = {
    ...documents,
    [graphId]: { ...doc, nodes: updatedNodes },
  };

  return wouldCrossGraphDependencyCycle(
    updatedDocs,
    functions,
    macros,
    graphId,
    target.targetGraphId
  );
}
