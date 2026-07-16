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
  collectMemberDefineNodeIds,
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
  variables: VariableSymbol[];
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

function findFunctionDeclareNode(
  documents: Record<string, GraphDocument> | undefined,
  graphNodes: GraphNode[],
  funcId: string
): GraphNode | undefined {
  const seen = new Set<string>();
  const candidates: GraphNode[] = [];
  for (const node of graphNodes) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      candidates.push(node);
    }
  }
  for (const doc of Object.values(documents ?? {})) {
    for (const node of doc.nodes) {
      if (!seen.has(node.id)) {
        seen.add(node.id);
        candidates.push(node);
      }
    }
  }
  return candidates.find((node) => {
    if (resolveNodeKindId(node.data) !== 'function_define') return false;
    const symbolId =
      (typeof node.data.properties?.symbolId === 'string' && node.data.properties.symbolId) ||
      node.data.graphBinding?.symbolId;
    return symbolId === funcId;
  });
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
  lowerCtx: BuildMembersContext,
  documents?: Record<string, GraphDocument>
): IrMemberDecl | undefined {
  switch (entry.kind) {
    case 'class':
      return {
        kind: 'ClassDecl',
        sourceGraphNodeId: entry.nodeId,
        name: classNameFromNode(node, cls.name),
        extendsType: extendsFromNode(node, cls.extendsType ?? ''),
        properties: node.data.properties,
      };
    case 'variable': {
      const symbol = variables.find((v) => v.id === entry.symbolId);
      if (!symbol) return undefined;
      return {
        kind: 'VariableDecl',
        sourceGraphNodeId: entry.nodeId,
        symbol,
        properties: node.data.properties,
      };
    }
    case 'function': {
      // Declare — existence / signature (U81). Body waits for Define.
      // C++ emit prints a prototype; other langs emit U66 `(x)` when comments on.
      const symbol = functions.find((f) => f.id === entry.symbolId);
      if (!symbol) return undefined;
      return {
        kind: 'FunctionDecl',
        sourceGraphNodeId: entry.nodeId,
        declareSourceGraphNodeId: entry.nodeId,
        emitBody: false,
        symbol,
        properties: node.data.properties,
      };
    }
    case 'function_implement': {
      // Define — body placement (U81). C++ emits out-of-line after class close.
      const symbol = functions.find((f) => f.id === entry.symbolId);
      if (!symbol) return undefined;
      const declareNode = findFunctionDeclareNode(documents, graphNodes, symbol.id);
      return {
        kind: 'FunctionDecl',
        sourceGraphNodeId: entry.nodeId,
        declareSourceGraphNodeId: declareNode?.id,
        implementSourceGraphNodeId: entry.nodeId,
        emitBody: true,
        symbol,
        properties: {
          ...(declareNode?.data.properties ?? {}),
          ...node.data.properties,
        },
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
        properties: {
          ...node.data.properties,
          ...(handlerNode?.data.properties ?? {}),
        },
      };
    }
    case 'enum': {
      const name =
        typeof node.data.properties?.name === 'string' && node.data.properties.name.trim()
          ? node.data.properties.name.trim()
          : 'Enum';
      const rawMembers = node.data.properties?.members;
      const members = Array.isArray(rawMembers)
        ? rawMembers.filter((m): m is string => typeof m === 'string')
        : [];
      return {
        kind: 'EnumDecl',
        sourceGraphNodeId: entry.nodeId,
        name,
        members,
        properties: node.data.properties,
      };
    }
    case 'import_module': {
      const fromProps = node.data.properties?.modulePath;
      const mod =
        typeof fromProps === 'string' && fromProps.trim()
          ? fromProps.trim()
          : node.data.label.replace(/^Import\s+/, '').trim().replace(/\s+/g, '_').toLowerCase() ||
            'module';
      const style = node.data.properties?.importStyle;
      const importStyle =
        style === 'from' || style === 'include_system' || style === 'module' ? style : 'module';
      const namesRaw = node.data.properties?.importNames;
      const importNames =
        typeof namesRaw === 'string' && namesRaw.trim()
          ? namesRaw
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      const langsRaw = node.data.properties?.targetLanguages;
      const targetLanguages =
        typeof langsRaw === 'string' && langsRaw.trim()
          ? langsRaw
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean)
          : undefined;
      const ownerRaw = node.data.properties?.ownerClassId;
      const label = typeof node.data.label === 'string' ? node.data.label.trim() : '';
      return {
        kind: 'ModuleImport',
        sourceGraphNodeId: entry.nodeId,
        moduleSlug: mod,
        displayLabel: label || undefined,
        importStyle:
          importNames?.length && importStyle === 'module' ? 'from' : importStyle,
        importNames,
        targetLanguages: targetLanguages?.length ? targetLanguages : undefined,
        ownerClassId:
          typeof ownerRaw === 'string' && ownerRaw.trim() ? ownerRaw.trim() : undefined,
      };
    }
    case 'import_class': {
      const targetClassId =
        (typeof node.data.properties?.targetClassId === 'string' &&
          node.data.properties.targetClassId) ||
        (typeof node.data.graphBinding?.targetClassId === 'string' &&
          node.data.graphBinding.targetClassId) ||
        '';
      const targetCls = lowerCtx.classes?.find((c) => c.id === targetClassId);
      if (!targetCls) return undefined;
      const aliasRaw = node.data.properties?.alias;
      return {
        kind: 'ImportClass',
        sourceGraphNodeId: entry.nodeId,
        className: targetCls.name,
        moduleName:
          targetCls.id === MAIN_CLASS_ID && lowerCtx.projectModuleName?.trim()
            ? lowerCtx.projectModuleName
            : targetCls.name,
        alias: typeof aliasRaw === 'string' && aliasRaw.trim() ? aliasRaw.trim() : undefined,
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

function documentHasFunctionImplement(doc: GraphDocument): boolean {
  return doc.nodes.some(
    (n) => n.type === 'vvs_standard_node' && resolveNodeKindId(n.data) === 'function_implement'
  );
}

function entriesFromOrderedIds(
  orderedIds: string[],
  nodeById: Map<string, GraphNode>
): ClassMemberEntry[] {
  const members: ClassMemberEntry[] = [];
  for (const nodeId of orderedIds) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    const kindId = resolveNodeKindId(node.data);
    if (kindId === 'function_implement') {
      const symbolId =
        (typeof node.data.properties?.symbolId === 'string' && node.data.properties.symbolId) ||
        node.data.graphBinding?.symbolId;
      members.push({
        kind: 'function_implement',
        nodeId,
        symbolId: typeof symbolId === 'string' ? symbolId : undefined,
      });
      continue;
    }
    if (
      kindId === 'vvs.project.import_module' ||
      kindId.startsWith('import_module_') ||
      node.data.linkKind === 'import_module'
    ) {
      members.push({ kind: 'import_module', nodeId });
      continue;
    }
    if (kindId === 'import_class') {
      members.push({ kind: 'import_class', nodeId });
    }
  }
  return members;
}

/** Impl-only graph: Import Module + function_implement chain, no ClassDecl (C++ .cpp companion). */
function buildIrMembersImplOnly(
  ctx: CodegenContext,
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  lowerCtx: BuildMembersContext
): BuildMembersResult {
  const analysisDoc: GraphDocument = { nodes: graphNodes, edges };
  const orderedIds = collectMemberDefineNodeIds(
    analysisDoc,
    undefined,
    ctx.variables,
    ctx.functions,
    ctx.projectEvents ?? []
  );
  const nodeById = new Map(graphNodes.map((n) => [n.id, n]));
  const entries = entriesFromOrderedIds(orderedIds, nodeById);
  if (entries.length === 0) {
    return { members: [], memberEventIds: new Set() };
  }

  const firstFn = entries.find((e) => e.kind === 'function_implement' && e.symbolId);
  const owner =
    (firstFn?.symbolId
      ? ctx.functions.find((f) => f.id === firstFn.symbolId)
      : undefined) ?? undefined;
  const cls =
    (owner?.classId
      ? ctx.classes?.find((c) => c.id === owner.classId)
      : undefined) ?? resolveActiveClass(ctx);

  const classVariables = symbolsForClass(ctx.variables, cls.id);
  const classFunctions = symbolsForClass(ctx.functions, cls.id);
  const classEvents = symbolsForClass(ctx.projectEvents ?? [], cls.id);

  const members: IrMemberDecl[] = [];
  for (const entry of entries) {
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
      lowerCtx,
      ctx.documents
    );
    if (decl) members.push(decl);
  }

  return { members, memberEventIds: new Set() };
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
    if (documentHasFunctionImplement(analysisDoc)) {
      return buildIrMembersImplOnly(ctx, graphNodes, edges, lowerCtx);
    }
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
      lowerCtx,
      ctx.documents
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

export { resolveActiveClass, documentHasFunctionImplement };
