import type { NextConfig } from 'next';

/** Parse DEV_ALLOWED_ORIGIN(S) — host, host:port, or full URL; comma-separated. */
function parseAllowedDevOrigins(): string[] | undefined {
  const raw = process.env.DEV_ALLOWED_ORIGINS ?? process.env.DEV_ALLOWED_ORIGIN;
  if (!raw?.trim()) return undefined;

  const hosts = new Set<string>();

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    try {
      if (trimmed.includes('://')) {
        const url = new URL(trimmed);
        hosts.add(url.host);
        hosts.add(url.hostname);
        continue;
      }
    } catch {
      // fall through — treat as bare host
    }

    hosts.add(trimmed);
    if (!trimmed.includes(':') && !trimmed.includes('*')) {
      hosts.add(`${trimmed}:3000`);
    }
  }

  return hosts.size > 0 ? [...hosts] : undefined;
}

const allowedDevOrigins = parseAllowedDevOrigins();

const isGithubPages = process.env.GITHUB_PAGES === 'true';
/** Project Pages URL: https://sheriff99yt.github.io/VVS-Web/ */
const githubPagesBasePath = '/VVS-Web';

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: githubPagesBasePath,
        assetPrefix: `${githubPagesBasePath}/`,
      }
    : {}),
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
};

export default nextConfig;
