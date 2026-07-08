import type {
  ClassSymbol,
  FunctionSymbol,
  GraphDocument,
  GraphNode,
  ProjectEventDefinition,
  VariableSymbol,
} from './symbols';
import {
  collectMemberDefineNodeIds,
  defineNodeSymbolId,
  isMemberDefineNode,
  resolveNodeKindId,
} from './defineNodes';
import { classHomeGraphId } from './symbols';

export type ClassMemberDeclKind = 'class' | 'variable' | 'function' | 'event';

export interface ClassMemberEntry {
  kind: ClassMemberDeclKind;
  nodeId: string;
  symbolId?: string;
}

export interface ClassMemberAnalysis {
  classId: string;
  graphTabId: string;
  orderedNodeIds: string[];
  members: ClassMemberEntry[];
}

export interface ClassMembersSnapshot {
  classes: ClassSymbol[];
  documents: Record<string, GraphDocument>;
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
}

function memberKindFromNode(node: GraphNode): ClassMemberDeclKind | undefined {
  const kindId = resolveNodeKindId(node.data);
  switch (kindId) {
    case 'class_define':
      return 'class';
    case 'var_define':
      return 'variable';
    case 'function_define':
      return 'function';
    case 'event_member_define':
      return 'event';
    default:
      return undefined;
  }
}

function memberEntryFromNode(node: GraphNode): ClassMemberEntry | undefined {
  const kind = memberKindFromNode(node);
  if (!kind) return undefined;
  const symbolId = kind === 'class' ? undefined : defineNodeSymbolId(node);
  return { kind, nodeId: node.id, symbolId };
}

export function analyzeClassMembers(
  snapshot: ClassMembersSnapshot,
  classId: string
): ClassMemberAnalysis | null {
  const cls = snapshot.classes.find((c) => c.id === classId);
  if (!cls) return null;

  const graphTabId = classHomeGraphId(cls);
  const doc = snapshot.documents[graphTabId];
  if (!doc) {
    return { classId, graphTabId, orderedNodeIds: [], members: [] };
  }

  const orderedNodeIds = collectMemberDefineNodeIds(doc);
  const nodeById = new Map(doc.nodes.map((n) => [n.id, n]));
  const members: ClassMemberEntry[] = [];

  for (const nodeId of orderedNodeIds) {
    const node = nodeById.get(nodeId);
    if (!node || !isMemberDefineNode(node)) continue;
    const entry = memberEntryFromNode(node);
    if (entry) members.push(entry);
  }

  return { classId, graphTabId, orderedNodeIds, members };
}

export function analyzeAllClassMembers(
  snapshot: ClassMembersSnapshot
): ClassMemberAnalysis[] {
  return snapshot.classes
    .map((cls) => analyzeClassMembers(snapshot, cls.id))
    .filter((result): result is ClassMemberAnalysis => result !== null);
}
