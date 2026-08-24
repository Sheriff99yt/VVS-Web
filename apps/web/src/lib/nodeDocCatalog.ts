import { CORE_NODE_REGISTRY, type NodeKindDefinition } from '@vvs/syntax-registry';

/** Spawn catalog hides these; docs still list them so the icon never 404s. */
export const CUT_OR_LEGACY_KIND_IDS = new Set([
  'event_on_start',
  'event_on_update',
  'event_emit',
  'event_subscribe',
  'flow_sequence',
  'action_await_wait',
  'graph_ref',
]);

export type NodeDocStatus = 'stable' | 'cut';

export interface NodeDocRecord {
  kindId: string;
  title: string;
  category: string;
  semantics: string;
  status: NodeDocStatus;
  inputs: NodeKindDefinition['inputs'];
  outputs: NodeKindDefinition['outputs'];
  options: NonNullable<NodeKindDefinition['propertySchema']>;
}

export function nodeDocStatus(kindId: string): NodeDocStatus {
  return CUT_OR_LEGACY_KIND_IDS.has(kindId) ? 'cut' : 'stable';
}

export function listNodeDocs(): NodeDocRecord[] {
  return Object.values(CORE_NODE_REGISTRY)
    .map((kind) => ({
      kindId: kind.kindId,
      title: kind.title,
      category: kind.category,
      semantics: kind.semantics,
      status: nodeDocStatus(kind.kindId),
      inputs: kind.inputs ?? [],
      outputs: kind.outputs ?? [],
      options: kind.propertySchema ?? [],
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}

export function getNodeDoc(kindId: string): NodeDocRecord | undefined {
  const kind = CORE_NODE_REGISTRY[kindId];
  if (!kind) return undefined;
  return {
    kindId: kind.kindId,
    title: kind.title,
    category: kind.category,
    semantics: kind.semantics,
    status: nodeDocStatus(kind.kindId),
    inputs: kind.inputs ?? [],
    outputs: kind.outputs ?? [],
    options: kind.propertySchema ?? [],
  };
}

export function listNodeDocKindIds(): string[] {
  return Object.keys(CORE_NODE_REGISTRY).sort();
}
