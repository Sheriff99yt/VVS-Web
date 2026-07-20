import type { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNodeData } from '@/types/graph';
import { resolveNodeKindId } from '@/lib/nodeKind';

/** Call / macro style nodes that wire to another graph tab (not Import Module / graph_ref). */
export function isLinkedGraphNode(data: VVSNodeData): boolean {
  if (data.linkKind === 'graph_ref') return false;
  if (data.linkKind === 'import_module') return false;
  return Boolean(data.linkedGraphId && data.linkKind);
}

/**
 * Target graph tab for canvas double-click drill-in.
 * Covers Call / macro links and Declare Function (`linkedGraphId` / `graphTabId`).
 */
export function nestedGraphIdForNode(data: VVSNodeData): string | null {
  if (data.linkKind === 'import_module') return null;
  if (data.linkKind === 'graph_ref') return null;

  const kindId = resolveNodeKindId(data);
  if (kindId === 'function_define' || kindId === 'function_implement') {
    const fromProps =
      typeof data.properties?.graphTabId === 'string' && data.properties.graphTabId.trim()
        ? data.properties.graphTabId.trim()
        : null;
    return fromProps || data.linkedGraphId || null;
  }

  if (isLinkedGraphNode(data) && data.linkedGraphId) return data.linkedGraphId;
  return null;
}

/** Human-readable target name shown under linked graph node titles. */
export function linkedGraphTargetLabel(data: VVSNodeData): string | null {
  if (!data.linkedGraphId || !data.linkKind) return null;

  switch (data.linkKind) {
    case 'call_function':
      // Declare Function / Call Function already show the name in the title — no subtitle.
      return null;
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
  const functionEntry = doc.nodes.find(
    (n) =>
      n.type === 'vvs_standard_node' && resolveNodeKindId(n.data) === 'function_entry'
  );
  if (functionEntry) return functionEntry.id;
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
