import { VVSNode, VVSEdge } from '@/types/graph';
import { GraphDocument } from '@/lib/graphDefaults';

export interface ValidationMessage {
  level: 'error' | 'warning';
  message: string;
  tabId?: string;
  nodeId?: string;
}

export interface ValidationResult {
  ok: boolean;
  messages: ValidationMessage[];
}

function isGraphNode(node: VVSNode): boolean {
  return node.type !== 'vvs_comment_node' && node.type !== 'vvs_reroute_node';
}

function hasIncomingExecution(edges: VVSEdge[], nodeId: string, pinId: string): boolean {
  return edges.some(
    (e) =>
      e.target === nodeId &&
      e.data?.pinType === 'execution' &&
      (e.targetHandle === pinId || e.targetHandle == null)
  );
}

function validateDocument(tabId: string, doc: GraphDocument): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const { nodes, edges } = doc;

  for (const node of nodes) {
    if (!isGraphNode(node)) continue;

    const execInputs = node.data.inputs?.filter((pin) => pin.type === 'execution') ?? [];
    for (const pin of execInputs) {
      if (!hasIncomingExecution(edges, node.id, pin.id)) {
        messages.push({
          level: 'error',
          message: `Unconnected execution pin on "${node.data.label}"`,
          tabId,
          nodeId: node.id,
        });
      }
    }
  }

  if (tabId === 'main') {
    const standardNodes = nodes.filter((n) => n.type === 'vvs_standard_node');
    const hasEntry =
      standardNodes.some((n) => n.data.label === 'On Start' || n.data.category === 'Events') ??
      false;
    if (standardNodes.length > 0 && !hasEntry) {
      messages.push({
        level: 'warning',
        message: 'Main graph has no event entry node (On Start / Events)',
        tabId: 'main',
      });
    }
  }

  return messages;
}

export function validateProjectDocuments(
  documents: Record<string, GraphDocument>
): ValidationResult {
  const messages: ValidationMessage[] = [];

  for (const [tabId, doc] of Object.entries(documents)) {
    messages.push(...validateDocument(tabId, doc));
  }

  return {
    ok: !messages.some((m) => m.level === 'error'),
    messages,
  };
}
