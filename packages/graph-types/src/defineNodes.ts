import type { GraphEdge, GraphNode, VVSNodeData } from './nodes';
import { type ClassSymbol, type GraphDocument, type VariableSymbol, type FunctionSymbol, type ProjectEventDefinition, MAIN_CLASS_ID } from './symbols';

/** Canvas member-declaration node kinds (class graph exec chain). */
export const MEMBER_DEFINE_KINDS = [
  'class_define',
  'var_define',
  'function_define',
  'event_member_define',
  'enum_define',
] as const;

export type MemberDefineKind = (typeof MEMBER_DEFINE_KINDS)[number];

export function resolveNodeKindId(data: VVSNodeData): string {
  if (typeof data.kindId === 'string' && data.kindId) return data.kindId;
  if (data.label.startsWith('Dispatch ')) return 'event_dispatch';
  if (data.label.startsWith('Emit ')) return 'event_emit';
  if (data.label.startsWith('Subscribe ')) return 'event_subscribe';
  if (data.label === 'Wait') return 'action_wait';
  if (data.label === 'Await Wait') return 'action_await_wait';
  return data.kindId ?? '';
}

export function isMemberDefineKind(kindId: string): kindId is MemberDefineKind {
  return (MEMBER_DEFINE_KINDS as readonly string[]).includes(kindId);
}

export function isMemberDefineNode(node: GraphNode): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  return isMemberDefineKind(resolveNodeKindId(node.data));
}

export function defineNodeSymbolId(node: GraphNode): string | undefined {
  if (!isMemberDefineNode(node)) return undefined;
  const data = node.data;
  const fromBinding = data.graphBinding?.symbolId;
  if (typeof fromBinding === 'string' && fromBinding) return fromBinding;
  const fromProps = data.properties?.symbolId;
  if (typeof fromProps === 'string' && fromProps) return fromProps;
  return undefined;
}

export function classDefineNodeClassId(node: GraphNode): string | undefined {
  if (resolveNodeKindId(node.data) !== 'class_define') return undefined;
  const props = node.data.properties ?? {};
  const fromProps = props.symbolId ?? props.classId;
  if (typeof fromProps === 'string' && fromProps) return fromProps;
  if (node.id.startsWith('class-define-')) {
    return node.id.slice('class-define-'.length);
  }
  return undefined;
}

function legacySingleUnboundClassDefine(doc: GraphDocument, node: GraphNode): boolean {
  if (resolveNodeKindId(node.data) !== 'class_define') return false;
  const defines = doc.nodes.filter((n) => resolveNodeKindId(n.data) === 'class_define');
  if (defines.length !== 1 || defines[0]!.id !== node.id) return false;
  const props = node.data.properties ?? {};
  return !props.symbolId && !props.classId;
}

export function classDefineMatchesClass(
  node: GraphNode,
  cls: ClassSymbol,
  doc?: GraphDocument
): boolean {
  if (resolveNodeKindId(node.data) !== 'class_define') return false;
  const classId = classDefineNodeClassId(node);
  if (classId) return classId === cls.id;
  if (doc && legacySingleUnboundClassDefine(doc, node)) return true;
  return node.id === `class-define-${cls.id}`;
}

export function findClassDefineNode(
  doc: GraphDocument | undefined,
  cls: ClassSymbol
): GraphNode | undefined {
  if (!doc) return undefined;
  return doc.nodes.find((n) => classDefineMatchesClass(n, cls, doc));
}

/** True when the class has a canvas class_define (required for exportable class shell). */
export function classGraphHasClassDefine(
  doc: GraphDocument | undefined,
  cls: ClassSymbol
): boolean {
  return findClassDefineNode(doc, cls) != null;
}

/** Class shell on canvas is required whenever the home graph has any member define chain. */
export function classRequiresClassDefine(doc: GraphDocument | undefined): boolean {
  return classGraphHasDefineNodes(doc);
}

export function findDefineNodesForSymbol(
  doc: GraphDocument,
  kind: 'variable' | 'function' | 'event',
  symbolId: string
): GraphNode[] {
  const expectedKind: MemberDefineKind =
    kind === 'variable'
      ? 'var_define'
      : kind === 'function'
        ? 'function_define'
        : 'event_member_define';

  return doc.nodes.filter((node) => {
    if (node.type !== 'vvs_standard_node') return false;
    if (resolveNodeKindId(node.data) !== expectedKind) return false;
    return defineNodeSymbolId(node) === symbolId;
  });
}

function hasIncomingExecution(edges: GraphEdge[], nodeId: string, pinId = 'exec_in'): boolean {
  return edges.some(
    (e) =>
      e.target === nodeId &&
      e.data?.pinType === 'execution' &&
      (e.targetHandle === pinId || e.targetHandle == null)
  );
}

function execTargetsFrom(
  edges: GraphEdge[],
  nodeId: string,
  sourceHandle = 'exec_out'
): string[] {
  return edges
    .filter(
      (e) =>
        e.source === nodeId &&
        e.data?.pinType === 'execution' &&
        (e.sourceHandle === sourceHandle || e.sourceHandle == null)
    )
    .map((e) => e.target);
}

/** Head of the member define chain (no exec_in from another graph node). */
export function findMemberChainHead(doc: GraphDocument): GraphNode | undefined {
  const defineNodes = doc.nodes.filter(isMemberDefineNode);
  return (
    defineNodes.find((node) => !hasIncomingExecution(doc.edges, node.id, 'exec_in')) ??
    defineNodes.find((n) => resolveNodeKindId(n.data) === 'class_define')
  );
}

/** Tail of the member define chain (exec_out does not reach another define node). */
export function findMemberChainTail(doc: GraphDocument): GraphNode | undefined {
  const defineNodes = doc.nodes.filter(isMemberDefineNode);
  if (defineNodes.length === 0) return undefined;

  for (const node of defineNodes) {
    const targets = execTargetsFrom(doc.edges, node.id, 'exec_out');
    const reachesDefine = targets.some((targetId) =>
      defineNodes.some((n) => n.id === targetId)
    );
    if (!reachesDefine) return node;
  }

  return defineNodes[defineNodes.length - 1];
}

export function collectMemberDefineNodeIds(
  doc: GraphDocument,
  cls: ClassSymbol | undefined,
  variables: VariableSymbol[],
  functions: FunctionSymbol[],
  events: ProjectEventDefinition[]
): string[] {
  // 1. Gather member define nodes belonging to the class (enums attached in step 1b).
  const classNodes = doc.nodes.filter((node) => {
    if (!isMemberDefineNode(node)) return false;

    const symbolId = defineNodeSymbolId(node);
    const kindId = resolveNodeKindId(node.data);

    if (kindId === 'enum_define') {
      // Attached below — only when exec-connected to this class's chain.
      return false;
    }

    if (kindId === 'class_define') {
      return !cls || !symbolId || symbolId === cls.id;
    }

    if (!symbolId) return false;

    const matchesClass = (targetClsId?: string) => {
      if (!cls) return true;
      return (targetClsId ?? MAIN_CLASS_ID) === cls.id;
    };

    return (
      variables.some((v) => v.id === symbolId && matchesClass(v.classId)) ||
      functions.some((f) => f.id === symbolId && matchesClass(f.classId)) ||
      events.some((e) => e.id === symbolId && matchesClass(e.classId))
    );
  });

  // 1b. Include enum_define nodes reachable from this class's define nodes via exec edges
  //     (or that reach them) — so two classes on one graph do not share each other's enums.
  const classNodeIds = new Set(classNodes.map((n) => n.id));
  const enumNodes = doc.nodes.filter((n) => resolveNodeKindId(n.data) === 'enum_define');
  for (const enumNode of enumNodes) {
    const touching = [
      ...execTargetsFrom(doc.edges, enumNode.id, 'exec_out'),
      ...doc.edges
        .filter(
          (e) =>
            e.target === enumNode.id &&
            e.data?.pinType === 'execution' &&
            (e.targetHandle === 'exec_in' || e.targetHandle == null)
        )
        .map((e) => e.source),
    ];
    if (touching.some((id) => classNodeIds.has(id))) {
      classNodes.push(enumNode);
      classNodeIds.add(enumNode.id);
    }
  }

  // 1c. Include Import Module / Import Class nodes that reach this class's define chain
  //     (canvas order = emit order). Prefer placing shared imports once at file top on the
  //     first class chain; flow Import Module nodes (e.g. inside branches) are not members.
  const importNodes = doc.nodes.filter((n) => {
    const kindId = resolveNodeKindId(n.data);
    return (
      kindId === 'vvs.project.import_module' ||
      kindId.startsWith('import_module_') ||
      kindId === 'import_class' ||
      n.data.linkKind === 'import_module'
    );
  });
  const isImportChainNode = (n: GraphNode): boolean => {
    const kindId = resolveNodeKindId(n.data);
    return (
      kindId === 'vvs.project.import_module' ||
      kindId.startsWith('import_module_') ||
      kindId === 'import_class' ||
      n.data.linkKind === 'import_module' ||
      kindId === 'enum_define'
    );
  };
  for (const importNode of importNodes) {
    if (classNodeIds.has(importNode.id)) continue;
    const ownerRaw = importNode.data.properties?.ownerClassId;
    if (typeof ownerRaw === 'string' && ownerRaw.trim() && cls && ownerRaw.trim() !== cls.id) {
      continue;
    }
    const seen = new Set<string>();
    const queue = [importNode.id];
    let reachesClass = false;
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      if (classNodeIds.has(id) && id !== importNode.id) {
        reachesClass = true;
        break;
      }
      for (const t of execTargetsFrom(doc.edges, id, 'exec_out')) {
        if (classNodeIds.has(t)) {
          reachesClass = true;
          break;
        }
        const n = doc.nodes.find((x) => x.id === t);
        if (n && isImportChainNode(n)) queue.push(t);
      }
      if (reachesClass) break;
    }
    if (reachesClass) {
      classNodes.push(importNode);
      classNodeIds.add(importNode.id);
    }
  }

  if (classNodes.length === 0) return [];

  const kindOf = (nodeId: string): string => {
    const n = classNodes.find((x) => x.id === nodeId);
    return n ? resolveNodeKindId(n.data) : '';
  };
  const isEventDefine = (nodeId: string) => kindOf(nodeId) === 'event_member_define';

  /** Nearest non-event member-chain ancestor (walks back through event→event wires). */
  const findNonEventAncestor = (eventId: string): string | undefined => {
    const visited = new Set<string>();
    const queue = doc.edges
      .filter(
        (e) =>
          e.target === eventId &&
          e.data?.pinType === 'execution' &&
          classNodeIds.has(e.source)
      )
      .map((e) => e.source);
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      if (!isEventDefine(id)) return id;
      for (const e of doc.edges) {
        if (
          e.target === id &&
          e.data?.pinType === 'execution' &&
          classNodeIds.has(e.source) &&
          !visited.has(e.source)
        ) {
          queue.push(e.source);
        }
      }
    }
    return undefined;
  };

  // 2. Build Adjacency List and In-Degree Map.
  // Event defines are ordering peers: event→event exec wires keep the chain connected
  // for validation/UI, but emit order among events uses Y (visually higher first).
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of classNodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  const addOrderEdge = (fromId: string, toId: string) => {
    const list = adj.get(fromId)!;
    if (list.includes(toId)) return;
    list.push(toId);
    inDegree.set(toId, inDegree.get(toId)! + 1);
  };

  for (const node of classNodes) {
    const targets = execTargetsFrom(doc.edges, node.id, 'exec_out');
    for (const targetId of targets) {
      if (!classNodeIds.has(targetId)) continue;
      if (isEventDefine(node.id) && isEventDefine(targetId)) continue;
      addOrderEdge(node.id, targetId);
    }
  }

  for (const node of classNodes) {
    if (!isEventDefine(node.id)) continue;
    if ((inDegree.get(node.id) ?? 0) > 0) continue;
    const ancestor = findNonEventAncestor(node.id);
    if (ancestor) addOrderEdge(ancestor, node.id);
  }

  // 3. Topological Sort with Y-coordinate priority
  const ordered: string[] = [];
  const available: GraphNode[] = [];

  for (const node of classNodes) {
    if (inDegree.get(node.id) === 0) {
      available.push(node);
    }
  }

  // Sort available descending by Y so we can easily pop the lowest Y (visually highest)
  available.sort((a, b) => b.position.y - a.position.y);

  while (available.length > 0) {
    const current = available.pop()!;
    ordered.push(current.id);

    const targets = adj.get(current.id)!;
    for (const targetId of targets) {
      const newInDegree = inDegree.get(targetId)! - 1;
      inDegree.set(targetId, newInDegree);
      if (newInDegree === 0) {
        const targetNode = classNodes.find((n) => n.id === targetId)!;
        // Insert targetNode into available maintaining sorted order (descending Y)
        let insertIdx = 0;
        while (insertIdx < available.length && available[insertIdx].position.y > targetNode.position.y) {
          insertIdx++;
        }
        available.splice(insertIdx, 0, targetNode);
      }
    }
  }

  // Handle cycles (append remaining nodes sorted by Y)
  const remaining = classNodes.filter((n) => !ordered.includes(n.id));
  remaining.sort((a, b) => a.position.y - b.position.y);
  for (const node of remaining) {
    ordered.push(node.id);
  }

  return ordered;
}

export function classGraphHasDefineNodes(doc: GraphDocument | undefined): boolean {
  if (!doc) return false;
  return doc.nodes.some(isMemberDefineNode);
}
