import type {
  ClassSymbol,
  FunctionSymbol,
  GraphDocument,
  GraphNode,
  ProjectEventDefinition,
  VariableSymbol,
} from '@vvs/graph-types';
import {
  collectMemberDefineNodeIds,
  defineNodeSymbolId,
  resolveNodeKindId,
  classHomeGraphId,
  findClassDefineNode,
} from '@vvs/graph-types';

export type ClassMemberDeclKind =
  | 'class'
  | 'variable'
  | 'function'
  | 'function_implement'
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
    case 'function_implement':
      return 'function_implement';
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
  if (kind === 'import_module' || kind === 'import_class' || kind === 'enum') {
    return { kind, nodeId: node.id, symbolId: defineNodeSymbolId(node) };
  }
  const symbolId = kind === 'class' ? undefined : defineNodeSymbolId(node);
  return { kind, nodeId: node.id, symbolId };
}

export function analyzeClassMembers(
  snapshot: ClassMembersSnapshot,
  classId: string
): ClassMemberAnalysis | null {
  const cls = snapshot.classes.find((c) => c.id === classId);
  if (!cls) return null;

  let targetTabId = classHomeGraphId(cls);
  let targetDoc = snapshot.documents[targetTabId];

  // Search across all documents for the actual class_define node.
  // We prefer the home graph if it has it, otherwise any graph that contains it.
  if (!targetDoc || !findClassDefineNode(targetDoc, cls)) {
    for (const [tabId, doc] of Object.entries(snapshot.documents)) {
      if (findClassDefineNode(doc, cls)) {
        targetTabId = tabId;
        targetDoc = doc;
        break;
      }
    }
  }

  if (!targetDoc) {
    return { classId, graphTabId: targetTabId, orderedNodeIds: [], members: [] };
  }

  const orderedNodeIds = collectMemberDefineNodeIds(
    targetDoc,
    cls,
    snapshot.variables,
    snapshot.functions,
    snapshot.events
  );
  
  const nodeById = new Map(targetDoc.nodes.map((n) => [n.id, n]));
  const members: ClassMemberEntry[] = [];

  for (const nodeId of orderedNodeIds) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    const entry = memberEntryFromNode(node);
    if (entry) members.push(entry);
  }

  return { classId, graphTabId: targetTabId, orderedNodeIds, members };
}

export function analyzeAllClassMembers(
  snapshot: ClassMembersSnapshot
): ClassMemberAnalysis[] {
  return snapshot.classes
    .map((cls) => analyzeClassMembers(snapshot, cls.id))
    .filter((result): result is ClassMemberAnalysis => result !== null);
}
