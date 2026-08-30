import { docsPath } from '@/lib/docsUrl';
import type { NodeDocRecord } from '@/lib/nodeDocCatalog';
import { siteBasePath } from '@/lib/siteOrigin';

export function nodeDocsHref(kindId: string, optionKey?: string): string {
  const path = docsPath({ type: 'node', id: kindId });
  return optionKey ? `${path}#opt-${optionKey}` : path;
}

/** For window.open / raw <a href>. Next <Link> already prefixes basePath; do not use this there. */
export function nodeDocsOpenHref(kindId: string, optionKey?: string): string {
  return `${siteBasePath()}${nodeDocsHref(kindId, optionKey)}`;
}

export function nodeDocsHoverText(node: NodeDocRecord): string {
  const ports = [
    ...node.inputs.map((pin) => `in ${pin.id}`),
    ...node.outputs.map((pin) => `out ${pin.id}`),
  ];
  const options = node.options.map((opt) => opt.key);
  return [
    node.title,
    `${node.kindId} · ${node.category}`,
    `Semantics: ${node.semantics}`,
    ports.length ? `Ports: ${ports.join(', ')}` : 'Ports: none',
    options.length ? `Options: ${options.join(', ')}` : 'Options: none',
  ].join('\n');
}

export function optionDocsHoverText(node: NodeDocRecord, optionKey: string): string {
  const opt = node.options.find((item) => item.key === optionKey);
  if (!opt) {
    return `${optionKey} on ${node.title} (${node.kindId}). Not in the registry option table.`;
  }
  const notes = opt.enumValues?.length
    ? `enum: ${opt.enumValues.join(', ')}`
    : opt.description
      ? opt.description
      : null;
  return [
    opt.key,
    `Type: ${opt.type}`,
    `Default: ${opt.default === undefined ? 'none' : String(opt.default)}`,
    notes,
    `On ${node.title} (${node.kindId})`,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}