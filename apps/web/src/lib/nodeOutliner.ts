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

export function nodeSymbolRoleLabel(node: VVSNode): { label: string; badgeClass: string } {
  const kindId = node.data.kindId || '';
  const cat = node.data.category || '';
  const label = node.data.label || '';

  if (kindId.includes('define') || kindId.includes('declare') || label.startsWith('Declare ')) {
    if (kindId.includes('event')) {
      return { label: 'On', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
    return { label: 'Declare', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (kindId.includes('dispatch') || label.startsWith('Dispatch ')) {
    return { label: 'Dispatch', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  if (kindId.includes('call') || label.startsWith('Call ')) {
    return { label: 'Call', badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  }
  if (kindId.includes('variable_set') || label.startsWith('Set ')) {
    return { label: 'Set', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
  }
  if (kindId.includes('variable_get') || label.startsWith('Get ')) {
    return { label: 'Get', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  }
  if (cat === 'Events') {
    return { label: 'On', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  return { label: 'Exec', badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
}

/** Split a typed or multi-select find query into OR terms (`a, b` → match any). */
export function parseOutlinerSearchTerms(query: string | readonly string[]): string[] {
  const parts = typeof query === 'string' ? query.split(/,/) : [...query];
  return [...new Set(parts.map((q) => q.trim().toLowerCase()).filter(Boolean))];
}

export function filterOutlinerNodes(
  nodes: Node[],
  query: string | readonly string[]
): VVSNode[] {
  const terms = parseOutlinerSearchTerms(query);
  if (terms.length === 0) return [];
  return nodes.filter((node): node is VVSNode => {
    if (!isOutlinerNode(node)) return false;
    const label = nodeDisplayLabel(node).toLowerCase();
    const category = (node.data.category || '').toLowerCase();
    const id = node.id.toLowerCase();
    return terms.some(
      (q) => label.includes(q) || category.includes(q) || id.includes(q)
    );
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
