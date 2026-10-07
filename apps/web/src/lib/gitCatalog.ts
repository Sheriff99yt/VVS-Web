/**
 * Client-First Git Catalog & URL Import Service
 * Pure TypeScript utilities for parsing, fetching, and validating
 * syntax packs, node packs, and environment templates from GitHub / raw URLs.
 */

export interface GitCatalogRepo {
  id: string;
  owner: string;
  repo: string;
  branch?: string;
  addedAt: string;
  name: string;
  description?: string;
}

export interface GitCatalogAsset {
  id: string;
  title: string;
  author: string;
  description: string;
  type: 'Syntax pack' | 'Node pack' | 'Environment' | 'Template';
  repoUrl: string;
  manifestUrl: string;
  version?: string;
  tags: string[];
  importKind: 'git_release' | 'raw_manifest';
}

export interface PublicGitCatalog {
  schemaVersion: 1;
  assets: GitCatalogAsset[];
}

const SAFE_REPO_SEGMENT = /^[a-zA-Z0-9_.-]+$/;
const SAFE_BRANCH = /^[a-zA-Z0-9._/-]+$/;

export function validatePublicGitCatalog(value: unknown): value is PublicGitCatalog {
  if (!value || typeof value !== 'object') return false;
  const catalog = value as Record<string, unknown>;
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.assets) || catalog.assets.length > 200) return false;
  const ids = new Set<string>();
  return catalog.assets.every((asset) => {
    if (!asset || typeof asset !== 'object') return false;
    const item = asset as Record<string, unknown>;
    if (typeof item.id !== 'string' || ids.has(item.id)) return false;
    ids.add(item.id);
    if (['id', 'title', 'author', 'description', 'repoUrl', 'manifestUrl'].some(key => typeof item[key] !== 'string' || (item[key] as string).length > 4096)) return false;
    if (item.version !== undefined && (typeof item.version !== 'string' || item.version.length > 128)) return false;
    if (!Array.isArray(item.tags) || item.tags.length > 32 || item.tags.some(tag => typeof tag !== 'string' || tag.length > 128)) return false;
    return typeof item.id === 'string' && item.id.length > 0 &&
      typeof item.title === 'string' && typeof item.author === 'string' &&
      typeof item.description === 'string' && typeof item.type === 'string' &&
      ['Syntax pack', 'Node pack', 'Environment', 'Template'].includes(item.type) &&
      typeof item.repoUrl === 'string' && /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/.test(item.repoUrl) &&
      typeof item.manifestUrl === 'string' && /^https:\/\/raw\.githubusercontent\.com\//.test(item.manifestUrl) &&
      Array.isArray(item.tags) && item.tags.every((tag: unknown) => typeof tag === 'string') &&
      ['git_release', 'raw_manifest'].includes(String(item.importKind));
  });
}

export async function fetchPublicGitCatalog(repo: GitCatalogRepo, signal?: AbortSignal): Promise<PublicGitCatalog> {
  const branch = repo.branch ?? 'main';
  if (![repo.owner, repo.repo].every((part) => SAFE_REPO_SEGMENT.test(part) && !part.includes('..')) ||
      !SAFE_BRANCH.test(branch) || branch.includes('..') || branch.startsWith('/')) {
    throw new Error('Invalid catalog repository path.');
  }
  const url = buildRawGitHubUrl(repo.owner, repo.repo, 'catalog/vvs-catalog.json', branch);
  const response = await fetch(url, { signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(10000)]) });
  if (!response.ok) throw new Error(`Catalog unavailable (HTTP ${response.status}).`);
  if (Number(response.headers.get('content-length')) > 500_000) throw new Error('Catalog exceeds the size limit.');
  let text = '';
  let bytes = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Catalog has no response body.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 500_000) throw new Error('Catalog exceeds the size limit.');
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } finally { await reader.cancel(); }
  const parsed: unknown = JSON.parse(text);
  if (!validatePublicGitCatalog(parsed)) throw new Error('Catalog format is invalid.');
  return parsed;
}

/**
 * Parses GitHub repository strings like "owner/repo" or full URLs:
 * "https://github.com/owner/repo" -> { owner, repo }
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Simple "owner/repo" format
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed) && !trimmed.includes('..')) {
    const [owner, repo] = trimmed.split('/');
    return { owner, repo: repo.replace(/\.git$/, '') };
  }

  // Full URL format
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'https:' && url.hostname === 'github.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length === 2 && /^[\w-]+$/.test(parts[0]) && /^[\w.-]+$/.test(parts[1]) && !parts[1].includes('..')) {
        return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Generates raw GitHub manifest URL from owner/repo and file path
 */
export function buildRawGitHubUrl(owner: string, repo: string, path = 'vvs-manifest.json', branch = 'main'): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Validates whether an imported object has a valid VVS manifest shape
 */
export function validateGitPackManifest(data: unknown): data is GitCatalogAsset {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.title === 'string' &&
    typeof d.description === 'string'
  );
}
