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

/**
 * Parses GitHub repository strings like "owner/repo" or full URLs:
 * "https://github.com/owner/repo" -> { owner, repo }
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Simple "owner/repo" format
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    const [owner, repo] = trimmed.split('/');
    return { owner, repo: repo.replace(/\.git$/, '') };
  }

  // Full URL format
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('github.com')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
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
