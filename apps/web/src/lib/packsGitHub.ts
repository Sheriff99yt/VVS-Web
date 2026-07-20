'use client';

import type { LanguageFamily } from '@vvs/graph-types';
import type { SyntaxPackManifest } from '@vvs/syntax-packs';

/**
 * GitHub-backed syntax pack discovery + install for the Pack Versions view (U78).
 * Fetches releases from a configurable GitHub repo, parses pack-manifest assets
 * by filename convention, and downloads + validates manifests on install.
 *
 * Naming convention for release assets:
 *   Base    → {family}.base@{version}.json        e.g. python.base@1.2.0.json
 *   Overlay → {family}.{overlay}@{version}.json   e.g. javascript.es2026@1.0.0.json
 *
 * Repo is configurable via localStorage `vvs_packs_github_repo` (default below).
 * Optional PAT via `vvs_packs_github_token` (dev only — raises rate limit).
 */

const DEFAULT_REPO = 'VVS-Web/syntax-packs';
const REPO_STORAGE_KEY = 'vvs_packs_github_repo';
const TOKEN_STORAGE_KEY = 'vvs_packs_github_token';

/** Cache TTL for release listings (ms). GitHub unauthenticated limit is 60/hr. */
const RELEASES_CACHE_TTL_MS = 5 * 60 * 1000;
const RELEASES_CACHE_KEY = 'vvs_packs_releases_cache';

const GITHUB_API = 'https://api.github.com';

/** Raw GitHub release shape (subset we use). */
interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string;
  draft?: boolean;
  prerelease?: boolean;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
  }>;
}

export interface PackReleaseAsset {
  family: LanguageFamily;
  type: 'base' | 'overlay';
  /** Pack id, e.g. "python.base" or "javascript.es2026". */
  name: string;
  /** Semantic version (no leading v). */
  version: string;
  /** GitHub asset browser_download_url. */
  downloadUrl: string;
  size: number;
  /** Owning release tag. */
  releaseTag: string;
  /** Display label derived from id. */
  displayName: string;
  /** True if the asset is an overlay pack. */
  isOverlay: boolean;
}

export interface PackReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: string;
  assets: PackReleaseAsset[];
}

export class PackGitHubError extends Error {
  constructor(
    message: string,
    public readonly kind: 'network' | 'rate-limit' | 'not-found' | 'schema' | 'parse'
  ) {
    super(message);
    this.name = 'PackGitHubError';
  }
}

/** Read configured repo (owner/name) from localStorage or fall back to default. */
export function getPacksRepo(): string {
  if (typeof window === 'undefined') return DEFAULT_REPO;
  return localStorage.getItem(REPO_STORAGE_KEY) || DEFAULT_REPO;
}

export function setPacksRepo(repo: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REPO_STORAGE_KEY, repo);
  invalidateReleasesCache();
}

function getOptionalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getOptionalToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

const LANGUAGE_FAMILIES: LanguageFamily[] = [
  'python',
  'javascript',
  'cpp',
  'verse',
  'gdscript',
  'rust',
  'csharp',
];

/** Matches base + overlay asset filenames like "python.base@1.2.0.json" or "javascript.es2026@1.0.0-rc1.json". */
const ASSET_RE = /^([a-z]+)\.(base|[a-z][a-z0-9-]*)@([0-9]+[^@]*)\.json$/i;

/** Test whether a release asset name is a pack manifest. */
export function isPackAssetName(name: string): boolean {
  const m = ASSET_RE.exec(name);
  if (!m) return false;
  return LANGUAGE_FAMILIES.includes(m[1] as LanguageFamily);
}

function isLanguageFamily(s: string): s is LanguageFamily {
  return (LANGUAGE_FAMILIES as string[]).includes(s);
}

/** Derive a human-readable label from a pack id (python.base → "Python Base Pack"). */
function deriveDisplayName(packId: string): string {
  const parts = packId.split('.');
  const family = parts[0] ?? '';
  const rest = parts.slice(1).join(' ');
  const familyCap = family.charAt(0).toUpperCase() + family.slice(1);
  if (rest === 'base') return `${familyCap} Base Pack`;
  return `${familyCap} ${rest.replace(/\b\w/g, (c) => c.toUpperCase())} Pack`;
}

/** Extract pack assets from a single GitHub release payload. */
export function parsePackAssets(release: GitHubRelease): PackReleaseAsset[] {
  const out: PackReleaseAsset[] = [];
  for (const asset of release.assets ?? []) {
    const m = ASSET_RE.exec(asset.name);
    if (!m) continue;
    const [, familyRaw, tailRaw, versionRaw] = m;
    if (!isLanguageFamily(familyRaw)) continue;
    const type: 'base' | 'overlay' = tailRaw === 'base' ? 'base' : 'overlay';
    const name = `${familyRaw}.${tailRaw}`;
    out.push({
      family: familyRaw,
      type,
      name,
      version: versionRaw,
      downloadUrl: asset.browser_download_url,
      size: asset.size,
      releaseTag: release.tag_name,
      displayName: deriveDisplayName(name),
      isOverlay: type === 'overlay',
    });
  }
  return out;
}

interface CachedReleases {
  at: number;
  repo: string;
  payload: PackReleaseInfo[];
}

function readCachedReleases(repo: string): PackReleaseInfo[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(RELEASES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedReleases;
    if (parsed.repo !== repo) return null;
    if (Date.now() - parsed.at > RELEASES_CACHE_TTL_MS) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

function writeCachedReleases(repo: string, payload: PackReleaseInfo[]): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CachedReleases = { at: Date.now(), repo, payload };
    sessionStorage.setItem(RELEASES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota — ignore */
  }
}

export function invalidateReleasesCache(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RELEASES_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** Fetch all releases from the configured GitHub repo, with 5-min cache. */
export async function fetchPackReleases(): Promise<PackReleaseInfo[]> {
  const repo = getPacksRepo();
  const cached = readCachedReleases(repo);
  if (cached) return cached;

  const url = `${GITHUB_API}/repos/${repo}/releases?per_page=100`;
  let res: Response;
  try {
    res = await fetch(url, { headers: authHeaders() });
  } catch (e) {
    throw new PackGitHubError(
      `Network error fetching releases: ${e instanceof Error ? e.message : String(e)}`,
      'network'
    );
  }

  if (res.status === 404) {
    throw new PackGitHubError(
      `Repository "${repo}" not found. Check the Pack repository setting.`,
      'not-found'
    );
  }
  if (res.status === 403) {
    throw new PackGitHubError(
      'GitHub rate limit reached (60/hr unauthenticated). Add a token in Settings or wait.',
      'rate-limit'
    );
  }
  if (!res.ok) {
    throw new PackGitHubError(`GitHub API error: ${res.status} ${res.statusText}`, 'network');
  }

  let raw: GitHubRelease[];
  try {
    raw = (await res.json()) as GitHubRelease[];
  } catch (e) {
    throw new PackGitHubError(
      `Failed to parse releases JSON: ${e instanceof Error ? e.message : String(e)}`,
      'parse'
    );
  }

  const parsed: PackReleaseInfo[] = raw
    .filter((r) => !r.draft && (r.assets?.length ?? 0) > 0)
    .map((r) => ({
      tagName: r.tag_name,
      name: r.name ?? r.tag_name,
      publishedAt: r.published_at,
      assets: parsePackAssets(r),
    }))
    .filter((r) => r.assets.length > 0);

  writeCachedReleases(repo, parsed);
  return parsed;
}

/** Validate that an unknown object matches SyntaxPackManifest shape. */
export function validatePackManifest(obj: unknown): SyntaxPackManifest {
  if (typeof obj !== 'object' || obj === null) {
    throw new PackGitHubError('Pack manifest is not an object.', 'schema');
  }
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) {
    throw new PackGitHubError('Pack manifest missing "id".', 'schema');
  }
  if (typeof o.version !== 'string' || !o.version) {
    throw new PackGitHubError('Pack manifest missing "version".', 'schema');
  }
  if (typeof o.family !== 'string' || !isLanguageFamily(o.family)) {
    throw new PackGitHubError(
      `Pack manifest has invalid "family": ${String(o.family)}`,
      'schema'
    );
  }
  if (typeof o.templates !== 'object' || o.templates === null) {
    throw new PackGitHubError('Pack manifest missing "templates" object.', 'schema');
  }
  return obj as SyntaxPackManifest;
}

/** Download a pack manifest from a GitHub asset URL and validate it. */
export async function downloadPackManifest(
  downloadUrl: string
): Promise<SyntaxPackManifest> {
  let res: Response;
  try {
    res = await fetch(downloadUrl, { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new PackGitHubError(
      `Network error downloading pack: ${e instanceof Error ? e.message : String(e)}`,
      'network'
    );
  }
  if (!res.ok) {
    throw new PackGitHubError(
      `Download failed: ${res.status} ${res.statusText}`,
      'network'
    );
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch (e) {
    throw new PackGitHubError(
      `Failed to parse pack JSON: ${e instanceof Error ? e.message : String(e)}`,
      'parse'
    );
  }
  return validatePackManifest(json);
}

/** Flatten releases → pack assets, newest first (GitHub API returns newest first). */
export function flattenReleasesToAssets(
  releases: PackReleaseInfo[]
): PackReleaseAsset[] {
  return releases.flatMap((r) => r.assets);
}
