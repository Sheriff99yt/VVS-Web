import type {
  ClassSymbol,
  FunctionSymbol,
  GraphDocument,
  ProjectEventDefinition,
  VariableSymbol,
} from './symbols';
import type { GraphNode } from './nodes';
import {
  collectMemberDefineNodeIds,
  defineNodeSymbolId,
  resolveNodeKindId,
} from './defineNodes';
import { classHomeGraphId } from './symbols';

export type ClassMemberDeclKind =
  | 'class'
  | 'variable'
  | 'function'
  | 'event'
  | 'enum'
  | 'import_module'
  | 'import_class';

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

function isImportChainKind(kindId: string, linkKind?: string): boolean {
  return (
    kindId === 'vvs.project.import_module' ||
    kindId.startsWith('import_module_') ||
    kindId === 'import_class' ||
    linkKind === 'import_module'
  );
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
    case 'enum_define':
      return 'enum';
    case 'import_class':
      return 'import_class';
    default:
      if (isImportChainKind(kindId, node.data.linkKind)) return 'import_module';
      return undefined;
  }
}

function memberEntryFromNode(node: GraphNode): ClassMemberEntry | undefined {
  const kind = memberKindFromNode(node);
  if (!kind) return undefined;
  if (kind === 'import_module' || kind === 'import_class' || kind === 'enum' || kind === 'class') {
    return { kind, nodeId: node.id, symbolId: kind === 'class' ? undefined : defineNodeSymbolId(node) };
  }
  return { kind, nodeId: node.id, symbolId: defineNodeSymbolId(node) };
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

  const orderedNodeIds = collectMemberDefineNodeIds(
    doc,
    cls,
    snapshot.variables,
    snapshot.functions,
    snapshot.events
  );
  const nodeById = new Map(doc.nodes.map((n) => [n.id, n]));
  const members: ClassMemberEntry[] = [];

  for (const nodeId of orderedNodeIds) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
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
