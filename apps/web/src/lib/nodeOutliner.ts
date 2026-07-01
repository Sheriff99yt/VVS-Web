import { Node } from '@xyflow/react';
import { VVSNode } from '@/types/graph';

export function isOutlinerNode(node: Node): node is VVSNode {
  return node.type === 'vvs_standard_node' || node.type === 'vvs_comment_node';
}

export function nodeDisplayLabel(node: VVSNode): string {
  return node.data.label || node.id;
}

export function nodeCategoryColor(category?: string): string {
  switch (category) {
    case 'Events':
      return 'var(--vvs-cat-events)';
    case 'Math':
      return 'var(--vvs-cat-math)';
    case 'Variables':
      return 'var(--vvs-cat-action)';
    case 'Flow Control':
      return 'var(--vvs-cat-flow)';
    case 'Action':
      return 'var(--vvs-cat-action)';
    default:
      return 'var(--vvs-cat-action)';
  }
}

export function filterOutlinerNodes(nodes: Node[], query: string): VVSNode[] {
  const q = query.trim().toLowerCase();
  return nodes.filter((node): node is VVSNode => {
    if (!isOutlinerNode(node)) return false;
    if (!q) return true;
    const label = nodeDisplayLabel(node).toLowerCase();
    const category = (node.data.category || '').toLowerCase();
    const id = node.id.toLowerCase();
    return label.includes(q) || category.includes(q) || id.includes(q);
  });
}

export function groupOutlinerNodesByCategory(nodes: VVSNode[]): { category: string; nodes: VVSNode[] }[] {
  const groups = new Map<string, VVSNode[]>();
  for (const node of nodes) {
    const category = node.data.category || 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(node);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupNodes]) => ({
      category,
      nodes: groupNodes.sort((a, b) => nodeDisplayLabel(a).localeCompare(nodeDisplayLabel(b))),
    }));
}
