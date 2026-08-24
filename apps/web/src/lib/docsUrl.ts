/** In-app and site docs URLs. Pathname only; Next.js Link prefixes basePath on Pages. */
export type DocsTarget =
  | { type: 'home'; hash?: string }
  | { type: 'node'; id: string; hash?: string }
  | { type: 'feature'; id: string; hash?: string };

export const DOCS_HOME_PATH = '/docs';

/** Stable in-page hash for a registry category on the docs home. */
export function docsCategoryHash(category: string): string {
  return `cat-${category.toLowerCase().replace(/\s+/g, '-')}`;
}

export function docsPath(target: DocsTarget): string {
  if (target.type === 'home') {
    return target.hash ? `${DOCS_HOME_PATH}#${target.hash}` : DOCS_HOME_PATH;
  }
  const id = encodeURIComponent(target.id);
  const base =
    target.type === 'node' ? `${DOCS_HOME_PATH}/nodes/${id}` : `${DOCS_HOME_PATH}/features/${id}`;
  return target.hash ? `${base}#${target.hash}` : base;
}