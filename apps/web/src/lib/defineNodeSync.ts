import type { GraphDocument } from '@/lib/graphDefaults';
import type {
  ClassSymbol,
  FunctionSymbol,
  ProjectEventDefinition,
  VariableSymbol,
  VVSNode,
  VVSEdge,
  VVSNodeData,
} from '@/types/graph';
import {
  findMemberChainTail,
  isMemberDefineKind,
  MEMBER_DEFINE_KINDS,
} from '@vvs/graph-types';
import { normalizeNodeData } from '@/lib/nodeKind';
import { resolve as resolveKind } from '@/lib/nodeRegistry';
import { classHomeGraphId } from '@vvs/graph-types';
import { createUniqueEdgeId } from '@/lib/graphWiring';
import { applyVariableRefBinding } from '@/lib/variableHelpers';
import { resolveOverloadForCall } from '@/lib/functionHelpers';
import { eventDisplayName } from '@/lib/eventHelpers';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

let defineEdgeCounter = 0;

function createEdge(source: string, target: string): VVSEdge {
  return {
    id: createUniqueEdgeId(source, target, { prefix: 'edge', index: defineEdgeCounter++ }),
    source,
    target,
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_wire_edge',
    data: { pinType: 'execution' },
  };
}

function findOnStartNode(doc: GraphDocument): VVSNode | undefined {
  return doc.nodes.find(
    (n) =>
      n.type === 'vvs_standard_node' &&
      (n.data.kindId === 'event_on_start' || n.data.label === 'On Start')
  );
}

function buildVarDefineData(variable: VariableSymbol): VVSNodeData {
  const def = resolveKind('var_define');
  const base = applyVariableRefBinding(
    {
      label: `Define ${variable.name}`,
      category: 'Variables',
      kindId: 'var_define',
      inputs: def?.inputs ?? [EXEC_IN],
      outputs: def?.outputs ?? [EXEC_OUT],
      inlineValues: {},
      properties: {
        symbolId: variable.id,
        name: variable.name,
        type: variable.type,
        default: variable.defaultValue,
        binding: variable.binding,
      },
    },
    variable,
    'get'
  );
  return normalizeNodeData({ ...base, kindId: 'var_define' });
}

function buildFunctionDefineData(func: FunctionSymbol): VVSNodeData {
  const def = resolveKind('function_define');
  const overload = resolveOverloadForCall(func);
  return normalizeNodeData({
    label: `Define ${func.name}`,
    category: 'Project',
    kindId: 'function_define',
    inputs: def?.inputs ?? [EXEC_IN],
    outputs: def?.outputs ?? [EXEC_OUT],
    inlineValues: {},
    linkedGraphId: func.id,
    linkKind: 'call_function',
    graphBinding: { kind: 'call_function', symbolId: func.id, overloadId: overload.id },
    properties: {
      symbolId: func.id,
      name: func.name,
      binding: func.binding,
      returnType: overload.returnType,
      graphTabId: overload.graphTabId ?? func.id,
    },
  });
}

function buildEventDefineData(event: ProjectEventDefinition): VVSNodeData {
  const def = resolveKind('event_member_define');
  return normalizeNodeData({
    label: `Define ${event.name}`,
    category: 'Events',
    kindId: 'event_member_define',
    inputs: def?.inputs ?? [EXEC_IN],
    outputs: def?.outputs ?? [EXEC_OUT],
    inlineValues: {},
    properties: {
      symbolId: event.id,
      name: event.name,
      eventId: event.id,
      eventName: eventDisplayName(event.name),
    },
  });
}

function buildClassDefineData(cls: ClassSymbol): VVSNodeData {
  const def = resolveKind('class_define');
  return normalizeNodeData({
    label: `Class ${cls.name}`,
    category: 'Project',
    kindId: 'class_define',
    inputs: def?.inputs ?? [EXEC_IN],
    outputs: def?.outputs ?? [EXEC_OUT],
    inlineValues: {},
    properties: {
      name: cls.name,
      extendsType: cls.extendsType ?? '',
      visibility: cls.visibility ?? 'public',
    },
  });
}

function insertNodeOnMemberChain(
  doc: GraphDocument,
  node: VVSNode
): GraphDocument {
  const nodes = [...doc.nodes, node];
  let edges = [...doc.edges];

  const tail = findMemberChainTail(doc);
  if (tail) {
    const tailOutTargets = edges.filter(
      (e) =>
        e.source === tail.id &&
        e.data?.pinType === 'execution' &&
        (e.sourceHandle === 'exec_out' || e.sourceHandle == null)
    );
    edges = edges.filter((e) => !tailOutTargets.includes(e));
    edges.push(createEdge(tail.id, node.id));
    for (const outEdge of tailOutTargets) {
      edges.push(createEdge(node.id, outEdge.target));
    }
    return { ...doc, nodes, edges };
  }

  const onStart = findOnStartNode(doc);
  if (onStart) {
    const intoStart = edges.filter(
      (e) =>
        e.target === onStart.id &&
        e.data?.pinType === 'execution' &&
        (e.targetHandle === 'exec_in' || e.targetHandle == null)
    );
    edges = edges.filter((e) => !intoStart.includes(e));
    for (const inEdge of intoStart) {
      edges.push(createEdge(inEdge.source, node.id));
    }
    edges.push(createEdge(node.id, onStart.id));
    return { ...doc, nodes, edges };
  }

  return { ...doc, nodes, edges };
}

function spawnDefineNode(
  doc: GraphDocument,
  data: VVSNodeData,
  yOffset: number
): GraphDocument {
  const node: VVSNode = {
    id: `define-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'vvs_standard_node',
    position: { x: 80, y: 40 + yOffset },
    data: {
      ...data,
      resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
    },
  };
  return insertNodeOnMemberChain(doc, node);
}

export function hasDefineNodeForVariable(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  variableId: string
): boolean {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId];
  return (
    doc?.nodes.some(
      (n) => n.data.kindId === 'var_define' && n.data.properties?.symbolId === variableId
    ) ?? false
  );
}

export function hasDefineNodeForFunction(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  functionId: string
): boolean {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId];
  return (
    doc?.nodes.some(
      (n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === functionId
    ) ?? false
  );
}

export function hasDefineNodeForClass(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol
): boolean {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId];
  return doc?.nodes.some((n) => n.data.kindId === 'class_define') ?? false;
}

export function insertDefineNodeForVariable(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  variable: VariableSymbol
): Record<string, GraphDocument> {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  const existing = doc.nodes.filter(
    (n) => n.data.kindId === 'var_define' && n.data.properties?.symbolId === variable.id
  );
  if (existing.length > 0) return documents;

  const defineCount = doc.nodes.filter((n) =>
    isMemberDefineKind(n.data.kindId ?? '')
  ).length;

  return {
    ...documents,
    [tabId]: spawnDefineNode(doc, buildVarDefineData(variable), defineCount * 72),
  };
}

export function insertDefineNodeForFunction(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  func: FunctionSymbol
): Record<string, GraphDocument> {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  const existing = doc.nodes.filter(
    (n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === func.id
  );
  if (existing.length > 0) return documents;

  const defineCount = doc.nodes.filter((n) =>
    isMemberDefineKind(n.data.kindId ?? '')
  ).length;

  return {
    ...documents,
    [tabId]: spawnDefineNode(doc, buildFunctionDefineData(func), defineCount * 72),
  };
}

export function insertDefineNodeForEvent(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  event: ProjectEventDefinition
): Record<string, GraphDocument> {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  const existing = doc.nodes.filter(
    (n) =>
      n.data.kindId === 'event_member_define' && n.data.properties?.symbolId === event.id
  );
  if (existing.length > 0) return documents;

  const defineCount = doc.nodes.filter((n) =>
    isMemberDefineKind(n.data.kindId ?? '')
  ).length;

  return {
    ...documents,
    [tabId]: spawnDefineNode(doc, buildEventDefineData(event), defineCount * 72),
  };
}

export function insertClassDefineNode(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol
): Record<string, GraphDocument> {
  const tabId = classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  if (doc.nodes.some((n) => n.data.kindId === 'class_define')) return documents;

  return {
    ...documents,
    [tabId]: spawnDefineNode(doc, buildClassDefineData(cls), 0),
  };
}

function syncDefineNodeData(
  node: VVSNode,
  kind: 'variable' | 'function' | 'event',
  symbol: VariableSymbol | FunctionSymbol | ProjectEventDefinition
): VVSNode {
  if (kind === 'variable') {
    return {
      ...node,
      data: buildVarDefineData(symbol as VariableSymbol),
    };
  }
  if (kind === 'function') {
    return {
      ...node,
      data: buildFunctionDefineData(symbol as FunctionSymbol),
    };
  }
  return {
    ...node,
    data: buildEventDefineData(symbol as ProjectEventDefinition),
  };
}

export function syncDefineNodesForSymbol(
  documents: Record<string, GraphDocument>,
  kind: 'variable' | 'function' | 'event',
  symbol: VariableSymbol | FunctionSymbol | ProjectEventDefinition
): Record<string, GraphDocument> {
  const expectedKind =
    kind === 'variable'
      ? 'var_define'
      : kind === 'function'
        ? 'function_define'
        : 'event_member_define';

  let changed = false;
  const next: Record<string, GraphDocument> = { ...documents };

  for (const [tabId, doc] of Object.entries(documents)) {
    let docChanged = false;
    const nodes = doc.nodes.map((node) => {
      if (node.data.kindId !== expectedKind) return node;
      if (node.data.properties?.symbolId !== symbol.id) return node;
      docChanged = true;
      return syncDefineNodeData(node, kind, symbol);
    });
    if (docChanged) {
      changed = true;
      next[tabId] = { ...doc, nodes };
    }
  }

  return changed ? next : documents;
}

export function removeDefineNodesForSymbol(
  documents: Record<string, GraphDocument>,
  kind: 'variable' | 'function' | 'event',
  symbolId: string
): Record<string, GraphDocument> {
  const expectedKind =
    kind === 'variable'
      ? 'var_define'
      : kind === 'function'
        ? 'function_define'
        : 'event_member_define';

  let changed = false;
  const next: Record<string, GraphDocument> = { ...documents };

  for (const [tabId, doc] of Object.entries(documents)) {
    const removeIds = new Set(
      doc.nodes
        .filter(
          (n) => n.data.kindId === expectedKind && n.data.properties?.symbolId === symbolId
        )
        .map((n) => n.id)
    );
    if (removeIds.size === 0) continue;

    changed = true;
    const nodes = doc.nodes.filter((n) => !removeIds.has(n.id));
    const edges = doc.edges.filter(
      (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
    );
    next[tabId] = { ...doc, nodes, edges };
  }

  return changed ? next : documents;
}

export { MEMBER_DEFINE_KINDS };
