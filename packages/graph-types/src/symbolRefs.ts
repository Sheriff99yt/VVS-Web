import type { GraphDocument, FunctionSymbol, ProjectEventDefinition } from './symbols';
import type { GraphNode, VVSNodeData } from './nodes';

export type SymbolRefKind = 'variable' | 'function' | 'event' | 'macro';

export interface ResolvedSymbolRef {
  kind: SymbolRefKind;
  symbolId: string;
  /** Display name inferred from node when symbol is missing. */
  displayName?: string;
}

export interface SymbolUsageLocation {
  tabId: string;
  nodeId: string;
}

export interface SymbolUsage {
  kind: SymbolRefKind;
  symbolId: string;
  displayName?: string;
  nodes: SymbolUsageLocation[];
}

export interface ProjectSymbolIndex {
  variables: { id: string; name: string }[];
  functions: { id: string; name: string }[];
  events: { id: string; name: string }[];
}

function resolveKindId(data: VVSNodeData): string {
  if (typeof data.kindId === 'string' && data.kindId) return data.kindId;
  if (data.graphBinding?.kind === 'variable_ref') return 'variable_get';
  if (data.graphBinding?.kind === 'call_function' || data.linkKind === 'call_function') {
    return 'vvs.project.call_function';
  }
  if (data.graphBinding?.kind === 'use_macro' || data.linkKind === 'use_macro') {
    return 'vvs.project.call_function';
  }
  if (data.label.startsWith('Get ')) return 'variable_get';
  if (data.label.startsWith('Set ')) return 'variable_set';
  if (data.label.startsWith('Call ')) return 'vvs.project.call_function';
  if (data.label.startsWith('Dispatch ')) return 'event_dispatch';
  if (data.label.startsWith('Emit ')) return 'event_emit';
  if (data.label.startsWith('Subscribe ')) return 'event_subscribe';
  if (data.label.match(/^On\s+/i)) return 'event_define';
  return '';
}

/** Resolve a project symbol reference from a graph node, if any. */
export function resolveNodeSymbolRef(node: GraphNode): ResolvedSymbolRef | null {
  if (node.type !== 'vvs_standard_node') return null;
  const data = node.data;
  const kindId = resolveKindId(data);

  if (kindId === 'variable_get' || kindId === 'variable_set') {
    const symbolId =
      data.graphBinding?.kind === 'variable_ref'
        ? data.graphBinding.symbolId
        : undefined;
    if (!symbolId) {
      const name =
        typeof data.properties?.variableName === 'string'
          ? data.properties.variableName
          : data.label.replace(/^(Get|Set)\s+/, '').trim();
      if (!name) return null;
      return { kind: 'variable', symbolId: `name:${name.toLowerCase()}`, displayName: name };
    }
    return { kind: 'variable', symbolId };
  }

  if (
    kindId === 'vvs.project.call_function' ||
    data.linkKind === 'call_function' ||
    data.graphBinding?.kind === 'call_function'
  ) {
    const symbolId =
      data.graphBinding?.symbolId ??
      data.linkedGraphId ??
      (typeof data.properties?.functionId === 'string' ? data.properties.functionId : undefined);
    if (!symbolId) return null;
    const displayName =
      typeof data.properties?.functionName === 'string'
        ? data.properties.functionName
        : data.label.replace(/^Call\s+/, '').trim() || undefined;
    return { kind: 'function', symbolId, displayName };
  }

  if (kindId === 'event_define' || kindId === 'event_custom' || kindId === 'event_dispatch' || kindId === 'event_emit' || kindId === 'event_subscribe') {
    const eventId =
      typeof data.properties?.eventId === 'string' ? data.properties.eventId : undefined;
    if (eventId) {
      const displayName =
        typeof data.properties?.eventName === 'string' ? data.properties.eventName : undefined;
      return { kind: 'event', symbolId: eventId, displayName };
    }
    const eventName =
      typeof data.properties?.eventName === 'string'
        ? data.properties.eventName
        : kindId === 'event_dispatch' || kindId === 'event_emit'
          ? data.label.replace(/^(Dispatch|Emit)\s+/, '').trim()
          : kindId === 'event_subscribe'
            ? data.label.replace(/^Subscribe\s+/, '').trim()
            : data.label.replace(/^On\s+/i, '').trim();
    if (!eventName) return null;
    return { kind: 'event', symbolId: `name:${eventName.toLowerCase()}`, displayName: eventName };
  }

  if (kindId === 'vvs.project.use_macro' || data.linkKind === 'use_macro') {
    const symbolId = data.graphBinding?.symbolId ?? data.linkedGraphId;
    if (!symbolId) return null;
    const displayName =
      data.label.replace(/^(Macro:|Use\s+)/, '').trim() || symbolId;
    return { kind: 'function', symbolId, displayName };
  }

  return null;
}

export function buildProjectSymbolIndex(project: {
  variables?: { id: string; name: string }[];
  functions?: { id: string; name: string }[];
  events?: { id: string; name: string }[];
}): ProjectSymbolIndex {
  return {
    variables: project.variables ?? [],
    functions: project.functions ?? [],
    events: project.events ?? [],
  };
}

function symbolExists(ref: ResolvedSymbolRef, index: ProjectSymbolIndex): boolean {
  switch (ref.kind) {
    case 'variable':
      if (ref.symbolId.startsWith('name:')) {
        const key = ref.symbolId.slice(5);
        return index.variables.some((v) => v.name.toLowerCase() === key);
      }
      return index.variables.some((v) => v.id === ref.symbolId);
    case 'function':
      return index.functions.some((f) => f.id === ref.symbolId);
    case 'event':
      if (ref.symbolId.startsWith('name:')) {
        const key = ref.symbolId.slice(5);
        return index.events.some((e) => e.name.toLowerCase() === key);
      }
      return index.events.some((e) => e.id === ref.symbolId);
    default:
      return false;
  }
}

export function isUnresolvedSymbolRef(
  node: GraphNode,
  index: ProjectSymbolIndex
): ResolvedSymbolRef | null {
  const ref = resolveNodeSymbolRef(node);
  if (!ref) return null;
  if (symbolExists(ref, index)) return null;
  return ref;
}

export function collectSymbolUsages(
  documents: Record<string, GraphDocument>,
  kind: SymbolRefKind,
  symbolId: string
): SymbolUsageLocation[] {
  const locations: SymbolUsageLocation[] = [];
  for (const [tabId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      const ref = resolveNodeSymbolRef(node);
      if (!ref || ref.kind !== kind) continue;
      if (ref.symbolId !== symbolId) continue;
      locations.push({ tabId, nodeId: node.id });
    }
  }
  return locations;
}

export function collectAllSymbolUsages(
  documents: Record<string, GraphDocument>
): SymbolUsage[] {
  const map = new Map<string, SymbolUsage>();

  for (const [tabId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      const ref = resolveNodeSymbolRef(node);
      if (!ref) continue;
      const key = `${ref.kind}:${ref.symbolId}`;
      const existing = map.get(key);
      if (existing) {
        existing.nodes.push({ tabId, nodeId: node.id });
      } else {
        map.set(key, {
          kind: ref.kind,
          symbolId: ref.symbolId,
          displayName: ref.displayName,
          nodes: [{ tabId, nodeId: node.id }],
        });
      }
    }
  }

  return Array.from(map.values());
}

export function removeNodesAndEdges(
  doc: GraphDocument,
  nodeIds: Set<string> | string[]
): GraphDocument {
  const ids = nodeIds instanceof Set ? nodeIds : new Set(nodeIds);
  if (ids.size === 0) return doc;
  return {
    ...doc,
    nodes: doc.nodes.filter((n) => !ids.has(n.id)),
    edges: doc.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
  };
}

export type DocumentNodeMapper = (
  tabId: string,
  node: GraphNode
) => GraphNode | null;

/** Map nodes across all documents; return null to remove a node. */
export function mapDocuments(
  documents: Record<string, GraphDocument>,
  mapper: DocumentNodeMapper
): Record<string, GraphDocument> {
  const result: Record<string, GraphDocument> = {};
  for (const [tabId, doc] of Object.entries(documents)) {
    const removeIds = new Set<string>();
    const nextNodes: GraphNode[] = [];
    for (const node of doc.nodes) {
      const mapped = mapper(tabId, node);
      if (mapped === null) {
        removeIds.add(node.id);
      } else {
        nextNodes.push(mapped);
      }
    }
    result[tabId] = removeNodesAndEdges({ ...doc, nodes: nextNodes }, removeIds);
  }
  return result;
}

export function removeSymbolReferencesFromDocuments(
  documents: Record<string, GraphDocument>,
  kind: SymbolRefKind,
  symbolId: string
): Record<string, GraphDocument> {
  return mapDocuments(documents, (_tabId, node) => {
    const ref = resolveNodeSymbolRef(node);
    if (ref && ref.kind === kind && ref.symbolId === symbolId) return null;
    return node;
  });
}

export function findUnresolvedNodes(
  documents: Record<string, GraphDocument>,
  index: ProjectSymbolIndex
): Array<{ tabId: string; node: GraphNode; ref: ResolvedSymbolRef }> {
  const unresolved: Array<{ tabId: string; node: GraphNode; ref: ResolvedSymbolRef }> = [];
  for (const [tabId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      const ref = isUnresolvedSymbolRef(node, index);
      if (ref) unresolved.push({ tabId, node, ref });
    }
  }
  return unresolved;
}

export function unresolvedRefGroupKey(ref: ResolvedSymbolRef): string {
  return `${ref.kind}:${ref.symbolId}`;
}
