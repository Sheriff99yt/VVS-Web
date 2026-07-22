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
  findDefineNodesForSymbol,
  findMemberChainTail,
  findProgramEntryEvent,
  isMemberDefineKind,
  MEMBER_DEFINE_KINDS,
  classDefineMatchesClass as graphClassDefineMatchesClass,
  findClassDefineNode as findClassDefineOnDocument,
} from '@vvs/graph-types';
import { normalizeNodeData } from '@/lib/nodeKind';
import { resolve as resolveKind } from '@/lib/nodeRegistry';
import { classHomeGraphId, createClassHomeBootstrap, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { createUniqueEdgeId } from '@/lib/graphWiring';
import { applyVariableRefBinding } from '@/lib/variableHelpers';
import { resolveOverloadForCall, buildFunctionImplementData } from '@/lib/functionHelpers';
import { applyEventDefineBinding } from '@/lib/eventHelpers';
import { getLastGraphFlowPosition } from '@/lib/graphPointerPlacement';

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

function findEntryHandlerNode(doc: GraphDocument): VVSNode | undefined {
  return doc.nodes.find(
    (n) =>
      n.type === 'vvs_standard_node' &&
      (n.data.kindId === 'event_define' || n.data.kindId === 'event_custom')
  );
}

function buildVarDefineData(variable: VariableSymbol, existingProperties?: Record<string, unknown>): VVSNodeData {
  const def = resolveKind('var_define');
  const base = applyVariableRefBinding(
    {
      label: `Declare ${variable.name}`,
      category: 'Variables',
      kindId: 'var_define',
      inputs: def?.inputs ?? [EXEC_IN],
      outputs: def?.outputs ?? [EXEC_OUT],
      inlineValues: {},
      properties: {
        ...(existingProperties ?? {}),
        symbolId: variable.id,
        name: variable.name,
        type: variable.type,
        default: variable.defaultValue,
        binding: variable.binding,
        visibility: variable.visibility,
        isConst: variable.flags?.readonly,
        isAbstract: variable.flags?.abstract,
        isVirtual: variable.flags?.virtual,
        isOverride: variable.flags?.override,
        ...(variable.enumType ? { enumType: variable.enumType } : {}),
        ...(variable.typeRef ? { typeRef: variable.typeRef } : {}),
      },
    },
    variable,
    'get'
  );
  return normalizeNodeData({ ...base, kindId: 'var_define' });
}

function buildFunctionDefineData(
  func: FunctionSymbol,
  overload: FunctionSymbol['overloads'][number],
  existingProperties?: Record<string, unknown>
): VVSNodeData {
  const def = resolveKind('function_define');
  const paramSummary = overload.parameters.map((p) => p.type.replace(/^data_/, '')).join(', ');
  const sigSuffix = paramSummary ? `(${paramSummary})` : '()';
  return normalizeNodeData({
    label: `Declare ${func.name}${sigSuffix}`,
    category: 'Project',
    kindId: 'function_define',
    inputs: def?.inputs ?? [EXEC_IN],
    outputs: def?.outputs ?? [EXEC_OUT],
    inlineValues: {},
    linkedGraphId: func.id,
    graphBinding: { kind: 'call_function', symbolId: func.id, overloadId: overload.id },
    properties: {
      ...(existingProperties ?? {}),
      symbolId: func.id,
      overloadId: overload.id,
      name: func.name,
      binding: func.binding,
      visibility: func.visibility,
      isAsync: func.flags?.async,
      isStatic: func.binding === 'static',
      isVirtual: func.flags?.virtual,
      isOverride: func.flags?.override,
      isAbstract: func.flags?.abstract,
      returnType: overload.returnType,
      graphTabId: overload.graphTabId ?? func.id,
    },
  });
}

function buildEventDefineData(event: ProjectEventDefinition, existingProperties?: Record<string, unknown>): VVSNodeData {
  const def = resolveKind('event_member_define');
  return normalizeNodeData({
    label: `Declare ${event.name}`,
    category: 'Events',
    kindId: 'event_member_define',
    inputs: def?.inputs ?? [EXEC_IN],
    outputs: def?.outputs ?? [EXEC_OUT],
    inlineValues: {},
    properties: {
      ...(existingProperties ?? {}),
      symbolId: event.id,
      name: event.name,
      eventId: event.id,
      eventName: event.name,
    },
  });
}

function buildClassDefineData(cls: ClassSymbol): VVSNodeData {
  const def = resolveKind('class_define');
  return normalizeNodeData({
    label: `Declare ${cls.name}`,
    category: 'Project',
    kindId: 'class_define',
    inputs: def?.inputs ?? [EXEC_IN],
    outputs: def?.outputs ?? [EXEC_OUT],
    inlineValues: {},
    properties: {
      symbolId: cls.id,
      classId: cls.id,
      name: cls.name,
      extendsType: cls.extendsType ?? '',
      visibility: cls.visibility ?? 'public',
    },
  });
}

export function classDefineMatchesClass(
  node: VVSNode,
  cls: ClassSymbol,
  doc?: GraphDocument
): boolean {
  return graphClassDefineMatchesClass(node, cls, doc);
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

  const entryHandler = findEntryHandlerNode(doc);
  if (entryHandler) {
    const intoStart = edges.filter(
      (e) =>
        e.target === entryHandler.id &&
        e.data?.pinType === 'execution' &&
        (e.targetHandle === 'exec_in' || e.targetHandle == null)
    );
    edges = edges.filter((e) => !intoStart.includes(e));
    for (const inEdge of intoStart) {
      edges.push(createEdge(inEdge.source, node.id));
    }
    edges.push(createEdge(node.id, entryHandler.id));
    return { ...doc, nodes, edges };
  }

  return { ...doc, nodes, edges };
}

function spawnDefineNode(
  doc: GraphDocument,
  data: VVSNodeData,
  yOffset: number,
  at?: { x: number; y: number } | null
): GraphDocument {
  const node: VVSNode = {
    id: `define-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'vvs_standard_node',
    position: at ?? { x: 80, y: 40 + yOffset },
    data: {
      ...data,
      resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
    },
  };
  return { ...doc, nodes: [...doc.nodes, node] };
}

export function hasDefineNodeForVariable(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  variableId: string
): boolean {
  return Object.values(documents).some((doc) =>
    doc.nodes.some(
      (n) => n.data.kindId === 'var_define' && n.data.properties?.symbolId === variableId
    )
  );
}

export function hasDefineNodeForFunction(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  functionId: string
): boolean {
  return Object.values(documents).some((doc) =>
    doc.nodes.some(
      (n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === functionId
    )
  );
}

export function hasImplementNodeForFunction(
  documents: Record<string, GraphDocument>,
  functionId: string
): boolean {
  return findImplementNodeForFunction(documents, functionId) != null;
}

export function findImplementNodeForFunction(
  documents: Record<string, GraphDocument>,
  functionId: string
): { tabId: string; nodeId: string } | undefined {
  for (const [tabId, doc] of Object.entries(documents)) {
    const node = doc.nodes.find(
      (n) =>
        n.type === 'vvs_standard_node' &&
        n.data.kindId === 'function_implement' &&
        (n.data.properties?.symbolId === functionId ||
          n.data.graphBinding?.symbolId === functionId)
    );
    if (node) return { tabId, nodeId: node.id };
  }
  return undefined;
}

export function hasDefineNodeForEvent(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  eventId: string
): boolean {
  return Object.values(documents).some((doc) =>
    doc.nodes.some(
      (n) =>
        n.data.kindId === 'event_member_define' && n.data.properties?.symbolId === eventId
    )
  );
}

/**
 * Tab + node id for a class_define (searches the class home graph, then all tabs).
 * For the node on a single document, use `@vvs/graph-types` `findClassDefineNode(doc, cls)`.
 */
export function findClassDefineNode(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol
): { tabId: string; nodeId: string } | undefined {
  const homeTab = classHomeGraphId(cls);
  const homeDoc = documents[homeTab];
  const homeNode = homeDoc ? findClassDefineOnDocument(homeDoc, cls) : undefined;
  if (homeNode) return { tabId: homeTab, nodeId: homeNode.id };

  for (const [tabId, doc] of Object.entries(documents)) {
    if (tabId === homeTab) continue;
    const node = findClassDefineOnDocument(doc, cls);
    if (node) return { tabId, nodeId: node.id };
  }
  return undefined;
}

export function hasDefineNodeForClass(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol
): boolean {
  return findClassDefineNode(documents, cls) != null;
}

export function findHandlerNodeForEvent(
  documents: Record<string, GraphDocument>,
  eventId: string
): { tabId: string; nodeId: string } | undefined {
  for (const [tabId, doc] of Object.entries(documents)) {
    const node = doc.nodes.find(
      (n) =>
        n.type === 'vvs_standard_node' &&
        (n.data.kindId === 'event_define' || n.data.kindId === 'event_custom') &&
        n.data.properties?.eventId === eventId
    );
    if (node) return { tabId, nodeId: node.id };
  }
  return undefined;
}

export function hasHandlerNodeForEvent(
  documents: Record<string, GraphDocument>,
  eventId: string
): boolean {
  return findHandlerNodeForEvent(documents, eventId) !== undefined;
}

export function findMemberDeclareNodeForSymbol(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  kind: 'variable' | 'function' | 'event',
  symbolId: string
): { tabId: string; nodeId: string } | undefined {
  // Prefer the class home graph so Declare focus stays on the class canvas.
  const homeTab = classHomeGraphId(cls);
  const homeDoc = documents[homeTab];
  if (homeDoc) {
    const homeNodes = findDefineNodesForSymbol(homeDoc, kind, symbolId);
    if (homeNodes.length > 0) return { tabId: homeTab, nodeId: homeNodes[0]!.id };
  }
  for (const [tabId, doc] of Object.entries(documents)) {
    if (tabId === homeTab) continue;
    const nodes = findDefineNodesForSymbol(doc, kind, symbolId);
    if (nodes.length > 0) return { tabId, nodeId: nodes[0]!.id };
  }
  return undefined;
}

export function insertDefineNodeForVariable(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  variable: VariableSymbol,
  activeGraphTab?: string
): Record<string, GraphDocument> {
  // Function/node-scoped locals must not become class members.
  if (variable.graphTabId || variable.scopedNodeId) return documents;

  const classNodeLoc = findClassDefineNode(documents, cls);
  const tabId = classNodeLoc?.tabId ?? activeGraphTab ?? classHomeGraphId(cls);
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
    [tabId]: spawnDefineNode(
      doc,
      buildVarDefineData(variable),
      defineCount * 72,
      getLastGraphFlowPosition()
    ),
  };
}

export function insertDefineNodeForFunction(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  func: FunctionSymbol,
  activeGraphTab?: string
): Record<string, GraphDocument> {
  const classNodeLoc = findClassDefineNode(documents, cls);
  const tabId = classNodeLoc?.tabId ?? activeGraphTab ?? classHomeGraphId(cls);
  const nextDocs = { ...documents };

  for (const overload of func.overloads) {
    const doc = nextDocs[tabId] ?? { nodes: [], edges: [] };
    const hasNode = doc.nodes.some(
      (n) =>
        n.data.kindId === 'function_define' &&
        n.data.properties?.symbolId === func.id &&
        (n.data.graphBinding?.overloadId === overload.id || n.data.properties?.overloadId === overload.id)
    );
    if (hasNode) continue;

    const defineCount = doc.nodes.filter((n) =>
      isMemberDefineKind(n.data.kindId ?? '')
    ).length;

    const data = buildFunctionDefineData(func, overload);
    const at = getLastGraphFlowPosition();
    const node: VVSNode = {
      id: `define-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'vvs_standard_node',
      position: at ?? { x: 80, y: 40 + defineCount * 72 },
      data: {
        ...data,
        resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
      },
    };
    nextDocs[tabId] = insertNodeOnMemberChain(doc, node);
  }

  return nextDocs;
}

/** Place function Define (`function_implement`) on the member chain — body placement (U81). */
export function insertImplementNodeForFunction(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  func: FunctionSymbol,
  activeGraphTab?: string
): Record<string, GraphDocument> {
  if (hasImplementNodeForFunction(documents, func.id)) return documents;

  const classNodeLoc = findClassDefineNode(documents, cls);
  const tabId = classNodeLoc?.tabId ?? activeGraphTab ?? classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  const chainCount = doc.nodes.filter((n) =>
    n.data.kindId === 'function_define' ||
    n.data.kindId === 'function_implement' ||
    isMemberDefineKind(n.data.kindId ?? '')
  ).length;

  const data = buildFunctionImplementData(func);
  const at = getLastGraphFlowPosition();
  const node: VVSNode = {
    id: `impl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'vvs_standard_node',
    position: at ?? { x: 80, y: 40 + chainCount * 72 },
    data: {
      ...data,
      resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
    },
  };
  return {
    ...documents,
    [tabId]: insertNodeOnMemberChain(doc, node),
  };
}

export function insertDefineNodeForEvent(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  event: ProjectEventDefinition,
  activeGraphTab?: string
): Record<string, GraphDocument> {
  const classNodeLoc = findClassDefineNode(documents, cls);
  const tabId = classNodeLoc?.tabId ?? activeGraphTab ?? classHomeGraphId(cls);
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
    [tabId]: spawnDefineNode(
      doc,
      buildEventDefineData(event),
      defineCount * 72,
      getLastGraphFlowPosition()
    ),
  };
}

export function insertProgramEntryHandlerNode(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  event: ProjectEventDefinition,
  targetTabId?: string
): Record<string, GraphDocument> {
  const tabId = targetTabId ?? classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  const exists = doc.nodes.some(
    (n) =>
      (n.data.kindId === 'event_define' || n.data.kindId === 'event_custom') &&
      n.data.properties?.eventId === event.id
  );
  if (exists) return documents;

  const handlerData = applyEventDefineBinding(
    {
      label: event.name,
      category: 'Events',
      kindId: 'event_define',
      inputs: [],
      outputs: [EXEC_OUT],
      inlineValues: {},
      properties: { eventId: event.id, eventName: event.name },
    },
    event
  );

  const node: VVSNode = {
    id: `entry-handler-${event.id}`,
    type: 'vvs_standard_node',
    position: { x: 80, y: 160 },
    data: {
      ...handlerData,
      resolvedPorts: { inputs: handlerData.inputs, outputs: handlerData.outputs },
    },
  };

  return {
    ...documents,
    [tabId]: { ...doc, nodes: [...doc.nodes, node] },
  };
}

export function insertClassDefineNode(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  activeGraphTab?: string
): Record<string, GraphDocument> {
  const tabId = activeGraphTab ?? classHomeGraphId(cls);
  const doc = documents[tabId] ?? { nodes: [], edges: [] };
  if (doc.nodes.some((n) => classDefineMatchesClass(n, cls, doc))) return documents;

  const nodeData = buildClassDefineData(cls);
  const node: VVSNode = {
    id: `class-define-${cls.id}`,
    type: 'vvs_standard_node',
    position: { x: 80, y: 40 },
    data: {
      ...nodeData,
      resolvedPorts: { inputs: nodeData.inputs, outputs: nodeData.outputs },
    },
  };
  return {
    ...documents,
    [tabId]: { ...doc, nodes: [...doc.nodes, node] },
  };
}

export function syncDefineNodesForClass(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol
): Record<string, GraphDocument> {
  let changed = false;
  const next: Record<string, GraphDocument> = { ...documents };

  for (const [tabId, doc] of Object.entries(documents)) {
    let docChanged = false;
    const nodes = doc.nodes.map((node) => {
      if (!classDefineMatchesClass(node, cls, doc)) return node;
      docChanged = true;
      const data = buildClassDefineData(cls);
      return {
        ...node,
        data: {
          ...data,
          resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
        },
      };
    });
    if (docChanged) {
      changed = true;
      next[tabId] = { ...doc, nodes };
    }
  }

  return changed ? next : documents;
}

export function relocateClassHomeGraph(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  fromContainerId: string,
  toContainerId: string,
  allClasses: ClassSymbol[]
): Record<string, GraphDocument> {
  if (fromContainerId === toContainerId) return documents;

  const classesOnSource = allClasses.filter(
    (c) => (c.containerId ?? MAIN_GRAPH_CONTAINER_ID) === fromContainerId
  );
  const soleClassOnSource =
    classesOnSource.length === 1 && classesOnSource[0]?.id === cls.id;

  const sourceDoc = documents[fromContainerId] ?? { nodes: [], edges: [] };
  const targetDoc = documents[toContainerId] ?? { nodes: [], edges: [] };

  if (soleClassOnSource && sourceDoc.nodes.length > 0) {
    return {
      ...documents,
      [fromContainerId]: { nodes: [], edges: [] },
      [toContainerId]: {
        nodes: [...targetDoc.nodes, ...sourceDoc.nodes],
        edges: [...targetDoc.edges, ...sourceDoc.edges],
      },
    };
  }

  const defineLoc = findClassDefineNode(documents, cls);
  if (!defineLoc) {
    return insertClassDefineNode(documents, cls);
  }
  if (defineLoc.tabId === toContainerId) return documents;

  const source = documents[defineLoc.tabId];
  if (!source) return documents;

  const defineNode = source.nodes.find((n) => n.id === defineLoc.nodeId);
  if (!defineNode) return documents;

  const connectedEdges = source.edges.filter(
    (e) => e.source === defineNode.id || e.target === defineNode.id
  );
  const nextSourceNodes = source.nodes.filter((n) => n.id !== defineNode.id);
  const nextSourceEdges = source.edges.filter(
    (e) => e.source !== defineNode.id && e.target !== defineNode.id
  );

  return {
    ...documents,
    [defineLoc.tabId]: { nodes: nextSourceNodes, edges: nextSourceEdges },
    [toContainerId]: {
      nodes: [...targetDoc.nodes, defineNode],
      edges: [...targetDoc.edges, ...connectedEdges],
    },
  };
}

function syncDefineNodeData(
  node: VVSNode,
  kind: 'variable' | 'event',
  symbol: VariableSymbol | ProjectEventDefinition
): VVSNode {
  if (kind === 'variable') {
    return {
      ...node,
      data: buildVarDefineData(symbol as VariableSymbol, node.data.properties),
    };
  }
  return {
    ...node,
    data: buildEventDefineData(symbol as ProjectEventDefinition, node.data.properties),
  };
}

export function syncDefineNodesForSymbol(
  documents: Record<string, GraphDocument>,
  kind: 'variable' | 'function' | 'event',
  symbol: VariableSymbol | FunctionSymbol | ProjectEventDefinition
): Record<string, GraphDocument> {
  if (kind !== 'function') {
    const expectedKind = kind === 'variable' ? 'var_define' : 'event_member_define';
    let changed = false;
    const next: Record<string, GraphDocument> = { ...documents };

    for (const [tabId, doc] of Object.entries(documents)) {
      let docChanged = false;
      const nodes = doc.nodes.map((node) => {
        if (node.data.kindId !== expectedKind) return node;
        if (node.data.properties?.symbolId !== symbol.id) return node;
        docChanged = true;
        return syncDefineNodeData(node, kind as Parameters<typeof syncDefineNodeData>[1], symbol as Parameters<typeof syncDefineNodeData>[2]);
      });
      if (docChanged) {
        changed = true;
        next[tabId] = { ...doc, nodes };
      }
    }
    return changed ? next : documents;
  }

  // Specialized sync for functions (overload aware)
  const func = symbol as FunctionSymbol;
  const nextDocs = { ...documents };
  let docIdWithClass: string | undefined;

  for (const [tabId, doc] of Object.entries(documents)) {
    const hasDefine = doc.nodes.some(
      (n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === func.id
    );
    if (hasDefine) {
      docIdWithClass = tabId;
      break;
    }
  }

  if (!docIdWithClass) {
    return documents;
  }

  const doc = nextDocs[docIdWithClass] ?? { nodes: [], edges: [] };
  let docChanged = false;

  const nextNodes: VVSNode[] = [];
  const activeOverloadIds = new Set(func.overloads.map((o) => o.id));

  for (const node of doc.nodes) {
    if (node.data.kindId === 'function_define' && node.data.properties?.symbolId === func.id) {
      const overloadId = (node.data.properties?.overloadId || node.data.graphBinding?.overloadId) as string | undefined;
      if (!overloadId || !activeOverloadIds.has(overloadId)) {
        // Drop node because overload was deleted
        docChanged = true;
        continue;
      }
      const overload = func.overloads.find((o) => o.id === overloadId)!;
      const updatedData = buildFunctionDefineData(func, overload, node.data.properties);
      nextNodes.push({
        ...node,
        data: {
          ...updatedData,
          resolvedPorts: { inputs: updatedData.inputs, outputs: updatedData.outputs },
        },
      });
      docChanged = true;
    } else {
      nextNodes.push(node);
    }
  }

  let finalDoc = { ...doc, nodes: nextNodes };

  if (docChanged) {
    const nodeIds = new Set(nextNodes.map((n) => n.id));
    const nextEdges = doc.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    if (nextEdges.length !== doc.edges.length) {
      finalDoc.edges = nextEdges;
    }
  }

  for (const overload of func.overloads) {
    const hasNode = finalDoc.nodes.some(
      (n) =>
        n.data.kindId === 'function_define' &&
        n.data.properties?.symbolId === func.id &&
        (n.data.graphBinding?.overloadId === overload.id || n.data.properties?.overloadId === overload.id)
    );
    if (!hasNode) {
      const defineCount = finalDoc.nodes.filter((n) =>
        isMemberDefineKind(n.data.kindId ?? '')
      ).length;
      const data = buildFunctionDefineData(func, overload);
      const at = getLastGraphFlowPosition();
      const node: VVSNode = {
        id: `define-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'vvs_standard_node',
        position: at ?? { x: 80, y: 40 + defineCount * 72 },
        data: {
          ...data,
          resolvedPorts: { inputs: data.inputs, outputs: data.outputs },
        },
      };
      finalDoc = insertNodeOnMemberChain(finalDoc, node);
      docChanged = true;
    }
  }

  if (docChanged) {
    nextDocs[docIdWithClass] = finalDoc;
    return nextDocs;
  }

  return documents;
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

export function bootstrapClassHomeDocuments(
  documents: Record<string, GraphDocument>,
  cls: ClassSymbol,
  entry: ProjectEventDefinition,
  activeGraphTab: string
): Record<string, GraphDocument> {
  const targetTabId = activeGraphTab ?? classHomeGraphId(cls);
  const existing = documents[targetTabId];
  const empty = !existing || (existing.nodes.length === 0 && existing.edges.length === 0);

  // Legacy path: when the target is the class home graph and it's empty,
  // use the full bootstrap (class_define + event handler chain).
  if (empty && targetTabId === classHomeGraphId(cls)) {
    const { document } = createClassHomeBootstrap(cls, entry);
    return { ...documents, [targetTabId]: document as unknown as GraphDocument };
  }

  let next = { ...documents };
  next = insertClassDefineNode(next, cls, targetTabId);
  next = insertDefineNodeForEvent(next, cls, entry, targetTabId);
  next = insertProgramEntryHandlerNode(next, cls, entry, targetTabId);
  return next;
}

export { MEMBER_DEFINE_KINDS };
