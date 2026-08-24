/** In-app and site docs URLs. Relative paths; Next prefixes basePath on Pages. */
export type DocsTarget =
  | { type: 'home' }
  | { type: 'node'; id: string; hash?: string }
  | { type: 'feature'; id: string; hash?: string };

export const DOCS_HOME_PATH = '/docs';

export function docsPath(target: DocsTarget): string {
  if (target.type === 'home') return DOCS_HOME_PATH;
  const id = encodeURIComponent(target.id);
  const base =
    target.type === 'node' ? `${DOCS_HOME_PATH}/nodes/${id}` : `${DOCS_HOME_PATH}/features/${id}`;
  return target.hash ? `${base}#${target.hash}` : base;
}
