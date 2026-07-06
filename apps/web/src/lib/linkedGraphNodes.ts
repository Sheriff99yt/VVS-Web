import type { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNodeData } from '@/types/graph';

export function isLinkedGraphNode(data: VVSNodeData): boolean {
  if (data.linkKind === 'graph_ref') return false;
  return Boolean(data.linkedGraphId && data.linkKind);
}

/** Human-readable target name shown under linked graph node titles. */
export function linkedGraphTargetLabel(data: VVSNodeData): string | null {
  if (!data.linkedGraphId || !data.linkKind) return null;

  switch (data.linkKind) {
    case 'call_function':
      return data.label.replace(/^Call\s+/, '') || data.linkedGraphId;
    case 'import_module':
      return data.label.replace(/^Import\s+/, '') || data.linkedGraphId;
    case 'use_macro':
      return data.label.replace(/^(Macro:|Use\s+)/, '') || data.linkedGraphId;
    case 'graph_ref':
      return (
        (typeof data.properties?.refLabel === 'string' && data.properties.refLabel) ||
        data.label ||
        data.linkedGraphId
      );
    default:
      return data.linkedGraphId;
  }
}

export function findGraphEntryNodeId(
  documents: Record<string, GraphDocument>,
  graphId: string
): string | null {
  const doc = documents[graphId];
  if (!doc) return null;
  const entry = doc.nodes.find(
    (n) => n.type === 'vvs_standard_node' && n.data.category === 'Events'
  );
  return entry?.id ?? null;
}

export function linkedGraphInspectorLabel(linkKind: VVSNodeData['linkKind']): string {
  switch (linkKind) {
    case 'call_function':
      return 'Target function';
    case 'import_module':
      return 'Imported module';
    case 'use_macro':
      return 'Target macro';
    case 'graph_ref':
      return 'Referenced graph';
    default:
      return 'Linked graph';
  }
}
