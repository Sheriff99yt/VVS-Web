import type {
  ClassSymbol,
  FunctionSymbol,
  GraphEdge,
  GraphNode,
  ProjectEventDefinition,
  VariableSymbol,
} from '@vvs/graph-types';
import {
  classGraphHasDefineNodes,
  classHomeGraphId,
  eventCodegenHandlerName,
  MAIN_CLASS_ID,
  resolveNodeKindId,
  type GraphDocument,
} from '@vvs/graph-types';
import { analyzeClassMembers, type ClassMemberEntry } from '../analyze/classMembers';
import { buildExecutionOrder } from '../analyze/graphOrder';
import type { CodegenContext } from '../generate';
import type { IrMemberDecl, IrStatement } from '../ir/types';
import { parameterCodegenName, resolveEventForNode as resolveEventForNodeHelper } from '../nodeHelpers';
import { buildIrStatements } from './graphToIr';

interface BuildMembersContext {
  nodes: GraphNode[];
  edges: GraphEdge[];
  functions: FunctionSymbol[];
  projectEvents: ProjectEventDefinition[];
  environmentManifest?: import('@vvs/environment-templates').ProjectEnvironmentManifest;
  classes?: ClassSymbol[];
  activeClassId?: string;
  projectModuleName?: string;
}

function resolveActiveClass(ctx: CodegenContext): ClassSymbol {
  if (ctx.classes?.length) {
    const id = ctx.activeClassId ?? ctx.classes[0]!.id;
    return ctx.classes.find((c) => c.id === id) ?? ctx.classes[0]!;
  }
  return {
    kind: 'class',
    id: MAIN_CLASS_ID,
    name: ctx.moduleName,
    graphTabId: ctx.tabId ?? 'main',
    extendsType: ctx.extendsType || undefined,
  };
}

function symbolsForClass<T extends { classId?: string }>(
  items: T[],
  classId: string
): T[] {
  return items.filter((item) => !item.classId || item.classId === classId);
}

function classNameFromNode(node: GraphNode, fallback: string): string {
  const name = node.data.properties?.name;
  return typeof name === 'string' && name.trim() ? name.trim() : fallback;
}

function extendsFromNode(node: GraphNode, fallback: string): string {
  const extendsType = node.data.properties?.extendsType;
  if (typeof extendsType === 'string') return extendsType;
  return fallback;
}

function findEventHandlerNode(
  graphNodes: GraphNode[],
  event: ProjectEventDefinition
): GraphNode | undefined {
  return graphNodes.find((node) => {
    const kindId = resolveNodeKindId(node.data);
    if (kindId !== 'event_define' && kindId !== 'event_custom') return false;
    const eventId = node.data.properties?.eventId;
    if (typeof eventId === 'string' && eventId === event.id) return true;
    return resolveEventForNodeHelper(node.data, [event])?.id === event.id;
  });
}

function handlerParamNamesForEvent(
  event: ProjectEventDefinition,
  handlerNode?: GraphNode
): string[] {
  if (event.parameters.length > 0) {
    return event.parameters.map(parameterCodegenName);
  }
  if (!handlerNode) return [];
  return (handlerNode.data.outputs ?? [])
    .filter((p) => p.type !== 'execution')
    .map((p) => parameterCodegenName({ id: p.id, label: p.label, type: p.type }));
}

function eventHandlerBody(
  memberNode: GraphNode,
  event: ProjectEventDefinition,
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  lowerCtx: BuildMembersContext
): IrStatement[] {
  const handlerNode = findEventHandlerNode(graphNodes, event);
  const entryId = handlerNode?.id ?? memberNode.id;
  const subOrder = buildExecutionOrder(entryId, graphNodes, edges);
  const skipIds = new Set<string>([entryId]);
  return buildIrStatements(
    subOrder,
    { ...lowerCtx, nodes: graphNodes, edges },
    skipIds
  );
}

function memberDeclFromEntry(
  entry: ClassMemberEntry,
  node: GraphNode,
  cls: ClassSymbol,
  variables: VariableSymbol[],
  functions: FunctionSymbol[],
  events: ProjectEventDefinition[],
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  lowerCtx: BuildMembersContext
): IrMemberDecl | undefined {
  switch (entry.kind) {
    case 'class':
      return {
        kind: 'ClassDecl',
        sourceGraphNodeId: entry.nodeId,
        name: classNameFromNode(node, cls.name),
        extendsType: extendsFromNode(node, cls.extendsType ?? ''),
      };
    case 'variable': {
      const symbol = variables.find((v) => v.id === entry.symbolId);
      if (!symbol) return undefined;
      return {
        kind: 'VariableDecl',
        sourceGraphNodeId: entry.nodeId,
        symbol,
      };
    }
    case 'function': {
      const symbol = functions.find((f) => f.id === entry.symbolId);
      if (!symbol) return undefined;
      return {
        kind: 'FunctionDecl',
        sourceGraphNodeId: entry.nodeId,
        symbol,
      };
    }
    case 'event': {
      const symbol = events.find((e) => e.id === entry.symbolId);
      if (!symbol) return undefined;
      const handlerName = eventCodegenHandlerName(symbol);
      const handlerNode = findEventHandlerNode(graphNodes, symbol);
      return {
        kind: 'EventDecl',
        sourceGraphNodeId: entry.nodeId,
        handlerSourceGraphNodeId: handlerNode?.id,
        symbol,
        handlerName,
        paramNames: handlerParamNamesForEvent(symbol, handlerNode),
        body: eventHandlerBody(node, symbol, graphNodes, edges, lowerCtx),
      };
    }
    default:
      return undefined;
  }
}

export interface BuildMembersResult {
  members: IrMemberDecl[];
  memberEventIds: Set<string>;
}

export function buildIrMembers(
  ctx: CodegenContext,
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  lowerCtx: BuildMembersContext
): BuildMembersResult {
  const cls = resolveActiveClass(ctx);
  const tabId = classHomeGraphId(cls);
  const analysisDoc: GraphDocument = { nodes: graphNodes, edges };

  if (!classGraphHasDefineNodes(analysisDoc)) {
    return {
      members: [],
      memberEventIds: new Set(),
    };
  }

  const snapshot = {
    classes: ctx.classes ?? [cls],
    documents: { ...(ctx.documents ?? {}), [tabId]: analysisDoc },
    variables: ctx.variables,
    functions: ctx.functions,
    events: ctx.projectEvents ?? [],
  };

  const analysis = analyzeClassMembers(snapshot, cls.id);
  if (!analysis || analysis.members.length === 0) {
    return {
      members: [],
      memberEventIds: new Set(),
    };
  }

  const nodeById = new Map(graphNodes.map((n) => [n.id, n]));
  const classVariables = symbolsForClass(ctx.variables, cls.id);
  const classFunctions = symbolsForClass(ctx.functions, cls.id);
  const classEvents = symbolsForClass(ctx.projectEvents ?? [], cls.id);

  const members: IrMemberDecl[] = [];
  const memberEventIds = new Set<string>();

  for (const entry of analysis.members) {
    const node = nodeById.get(entry.nodeId);
    if (!node) continue;
    const decl = memberDeclFromEntry(
      entry,
      node,
      cls,
      classVariables,
      classFunctions,
      classEvents,
      graphNodes,
      edges,
      lowerCtx
    );
    if (!decl) continue;
    members.push(decl);
    if (decl.kind === 'EventDecl') {
      memberEventIds.add(decl.symbol.id);
    }
  }

  return {
    members,
    memberEventIds,
  };
}

export { resolveActiveClass };
