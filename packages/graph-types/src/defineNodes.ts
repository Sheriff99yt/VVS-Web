import type { GraphEdge, GraphNode, VVSNodeData } from './nodes';
import type { ClassSymbol, GraphDocument } from './symbols';

/** Canvas member-declaration node kinds (class graph exec chain). */
export const MEMBER_DEFINE_KINDS = [
  'class_define',
  'var_define',
  'function_define',
  'event_member_define',
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

export function collectMemberDefineNodeIds(doc: GraphDocument): string[] {
  const head = findMemberChainHead(doc);
  if (!head) return [];

  const ordered: string[] = [];
  const visited = new Set<string>();
  let current: GraphNode | undefined = head;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (isMemberDefineNode(current)) {
      ordered.push(current.id);
    }
    const targets = execTargetsFrom(doc.edges, current.id, 'exec_out');
    const nextId = targets.find((id) => {
      const node = doc.nodes.find((n) => n.id === id);
      return node && isMemberDefineNode(node);
    });
    current = nextId ? doc.nodes.find((n) => n.id === nextId) : undefined;
  }

  return ordered;
}

export function classGraphHasDefineNodes(doc: GraphDocument | undefined): boolean {
  if (!doc) return false;
  return doc.nodes.some(isMemberDefineNode);
}
