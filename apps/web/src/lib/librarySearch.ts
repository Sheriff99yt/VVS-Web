/**
 * Client-side catalog search for the Library page.
 * Token / word match over name, category, language, and description.
 * Not embeddings and not a search server.
 */

export function tokenizeLibrarySearch(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9.+#-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function matchesLibrarySearch(haystack: string, query: string): boolean {
  const tokens = tokenizeLibrarySearch(query);
  if (tokens.length === 0) return true;
  const hay = haystack.toLowerCase();
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
  const tokens = tokenizeLibrarySearch(query);
  if (tokens.length === 0) return environments;
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
  if (tokenizeLibrarySearch(query).length === 0) return repos;
  return repos.filter((repo) => matchesLibrarySearch(gitRepoSearchHaystack(repo), query));
}

export interface LibrarySearchAsset {
  title: string;
  description: string;
  type: string;
  tags: string[];
  environmentCategory?: string;
}

export function libraryAssetSearchHaystack(asset: LibrarySearchAsset): string {
  return [asset.title, asset.description, asset.type, asset.environmentCategory ?? '', ...asset.tags].join(
    ' '
  );
}

export function filterLibraryAssetsBySearch<T extends LibrarySearchAsset>(
  assets: T[],
  query: string
): T[] {
  if (tokenizeLibrarySearch(query).length === 0) return assets;
  return assets.filter((asset) => matchesLibrarySearch(libraryAssetSearchHaystack(asset), query));
}
