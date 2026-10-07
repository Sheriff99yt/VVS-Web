/**
 * Client-side catalog search for the Library page.
 * Token / word match over name, category, language, and description.
 * Not embeddings and not a search server.
 */

export function tokenizeLibrarySearch(query: string): string[] {
  return query
    .normalize('NFKC').toLowerCase()
    .replace(/\bc\+\+/g, 'cpp').replace(/\bc#/g, 'csharp').replace(/\bjs\b/g, 'javascript')
    .split(/[^\p{L}\p{N}.+#-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function matchesLibrarySearch(haystack: string, query: string): boolean {
  const tokens = tokenizeLibrarySearch(query);
  if (tokens.length === 0) return !query.trim();
  const hay = tokenizeLibrarySearch(haystack).join(' ');
  return tokens.every((token) => hay.includes(token));
}

export interface LibrarySearchEnvironment {
  id: string;
  displayName: string;
  description: string;
  category?: string;
  defaultTarget: string;
  supportedTargets: string[];
}

export function environmentSearchHaystack(env: LibrarySearchEnvironment): string {
  return [
    env.id,
    env.displayName,
    env.description,
    env.category ?? '',
    env.defaultTarget,
    ...env.supportedTargets,
  ].join(' ');
}

export function filterEnvironmentsBySearch<T extends LibrarySearchEnvironment>(
  environments: T[],
  query: string
): T[] {
  if (!query.trim()) return environments;
  return environments.filter((env) => matchesLibrarySearch(environmentSearchHaystack(env), query));
}

export interface LibrarySearchGitRepo {
  name: string;
  description?: string;
  owner: string;
  repo: string;
}

export function gitRepoSearchHaystack(repo: LibrarySearchGitRepo): string {
  return [repo.name, repo.description ?? '', repo.owner, repo.repo, 'git'].join(' ');
}

export function filterGitReposBySearch<T extends LibrarySearchGitRepo>(
  repos: T[],
  query: string
): T[] {
  if (!query.trim()) return repos;
  return repos.filter((repo) => matchesLibrarySearch(gitRepoSearchHaystack(repo), query));
}

export interface LibrarySearchAsset {
  id?: string;
  author?: string;
  title: string;
  description: string;
  type: string;
  tags: string[];
  environmentCategory?: string;
}

export function libraryAssetSearchHaystack(asset: LibrarySearchAsset): string {
  return [asset.id ?? '', asset.author ?? '', asset.title, asset.description, asset.type, asset.environmentCategory ?? '', ...asset.tags].join(
    ' '
  );
}

export function filterLibraryAssetsBySearch<T extends LibrarySearchAsset>(
  assets: T[],
  query: string
): T[] {
  if (!query.trim()) return assets;
  return assets.filter((asset) => matchesLibrarySearch(libraryAssetSearchHaystack(asset), query));
}

export const LIBRARY_LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  verse: 'Verse',
  gdscript: 'GDScript',
  rust: 'Rust',
  csharp: 'C#',
  go: 'Go',
  json: 'JSON',
};

export function environmentLanguageIds(env: LibrarySearchEnvironment): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of [env.defaultTarget, ...env.supportedTargets]) {
    const id = String(raw ?? '').trim().toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function collectEnvironmentLanguages<T extends LibrarySearchEnvironment>(environments: T[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const env of environments) {
    for (const id of environmentLanguageIds(env)) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** Chip filter: match default or supported target. `all` returns the list unchanged. */
export function filterEnvironmentsByLanguage<T extends LibrarySearchEnvironment>(
  environments: T[],
  language: string | 'all'
): T[] {
  const lang = language.trim().toLowerCase();
  if (!lang || lang === 'all') return environments;
  return environments.filter((env) => environmentLanguageIds(env).includes(lang));
}


/** Keep a selected chip in the list after search hides every pack for that language. */
export function visibleEnvironmentLanguages<T extends LibrarySearchEnvironment>(
  environments: T[],
  activeLanguage: string | 'all'
): string[] {
  const ids = collectEnvironmentLanguages(environments);
  const lang = activeLanguage.trim().toLowerCase();
  if (lang && lang !== 'all' && !ids.includes(lang)) return [...ids, lang];
  return ids;
}
/** Honest empty copy when token search and/or a language chip hide every template. */
export function libraryTemplateEmptyLabel(
  searchQuery: string,
  language: string | 'all',
  labels: Record<string, string> = LIBRARY_LANGUAGE_LABELS
): string | undefined {
  const q = searchQuery.trim();
  const lang = language.trim().toLowerCase();
  const hasLang = Boolean(lang) && lang !== 'all';
  const langLabel = hasLang ? labels[lang] ?? lang : '';
  if (q && hasLang) return `No templates match “${q}” for ${langLabel}.`;
  if (q) return `No templates match “${q}”.`;
  return undefined;
}

