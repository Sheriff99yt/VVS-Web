import type { Diagnostic } from './diagnostic';
import type { GraphDocument, GraphNode } from './nodes';
import { isMemberDefineKind, resolveNodeKindId } from './defineNodes';

/**
 * U79 — canvas Y is a secondary order key (unconnected heads / event peers).
 * Connected exec chains are primary. When height and wires disagree, emit still
 * follows the locked rules; we only teach via warnings (never reorder).
 */

function nodeLabel(node: GraphNode): string {
  const label = node.data?.label;
  return typeof label === 'string' && label.trim() ? label.trim() : node.id;
}

function isSkippableNode(node: GraphNode | undefined): boolean {
  return !node || node.type === 'vvs_comment_node' || node.type === 'vvs_reroute_node';
}

/** Smaller Y = higher on canvas (React Flow). */
function isVisuallyAbove(a: GraphNode, b: GraphNode): boolean {
  return a.position.y < b.position.y;
}

/**
 * Warn when vertical layout and execution wiring disagree with the locked
 * order rules — so the Compiler Log can teach fundamentals without changing emit.
 */
export function validateCanvasOrderYHints(
  documents: Record<string, GraphDocument>
): Diagnostic[] {
  const messages: Diagnostic[] = [];

  for (const [tabId, doc] of Object.entries(documents)) {
    const byId = new Map(doc.nodes.map((n) => [n.id, n]));

    for (const edge of doc.edges) {
      if (edge.data?.pinType !== 'execution') continue;

      const source = byId.get(edge.source);
      const target = byId.get(edge.target);
      if (isSkippableNode(source) || isSkippableNode(target)) continue;

      const sourceKind = resolveNodeKindId(source!.data);
      const targetKind = resolveNodeKindId(target!.data);
      const bothEvents =
        sourceKind === 'event_member_define' && targetKind === 'event_member_define';

      // Event→event: emit order is Y among peers; wire does not force order.
      if (bothEvents) {
        if (isVisuallyAbove(target!, source!)) {
          messages.push({
            level: 'warning',
            code: 'EVENT_PEER_Y_ORDER',
            message:
              `Event Declares order by vertical position (higher first), not by the wire. ` +
              `"${nodeLabel(target!)}" sits above "${nodeLabel(source!)}" so it emits first — ` +
              `rearrange vertically to change order.`,
            tabId,
            nodeId: target!.id,
            edgeId: edge.id,
            source: 'semantic',
          });
        }
        continue;
      }

      // Connected chain (primary): wire A→B emits A then B even if B is drawn higher.
      if (isVisuallyAbove(target!, source!)) {
        const memberish =
          isMemberDefineKind(sourceKind) || isMemberDefineKind(targetKind);
        messages.push({
          level: 'warning',
          code: 'CHAIN_ORDER_Y_MISMATCH',
          message: memberish
            ? `Code order follows the execution chain, not vertical height. ` +
              `"${nodeLabel(target!)}" is wired after "${nodeLabel(source!)}" but sits higher — ` +
              `it still emits later. Rewire or move nodes so top-to-bottom matches the chain, ` +
              `or use unconnected chain heads (Y orders those).`
            : `Execution chain order beats vertical height. ` +
              `"${nodeLabel(target!)}" runs after "${nodeLabel(source!)}" even though it sits higher. ` +
              `Rewire or rearrange so the chain reads top-to-bottom.`,
          tabId,
          nodeId: target!.id,
          edgeId: edge.id,
          source: 'semantic',
        });
      }
    }
  }

  return messages;
}
