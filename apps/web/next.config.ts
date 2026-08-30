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
/** Project site needs /VVS-Web. Custom domain (vvscodes.com) is the artifact root. */
const customDomain = process.env.VVS_CUSTOM_DOMAIN === 'true';
const githubPagesBasePath = customDomain ? '' : '/VVS-Web';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_BASE_PATH: isGithubPages && githubPagesBasePath ? githubPagesBasePath : '',
  },
  transpilePackages: ['@vvs/graph-types', '@vvs/syntax-registry', '@vvs/language-profiles', '@vvs/transpiler'],
  ...(isGithubPages
    ? {
        output: 'export',
        ...(githubPagesBasePath
          ? { basePath: githubPagesBasePath, assetPrefix: `${githubPagesBasePath}/` }
          : {}),
      }
    : {}),
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
};

export default nextConfig;
