'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GitCatalogRepo,
  GitCatalogAsset,
  parseGitHubUrl,
  buildRawGitHubUrl,
} from '@/lib/gitCatalog';

const GIT_CATALOG_STORAGE_KEY = 'vvs_git_catalogs';

const DEFAULT_CATALOG_REPOS: GitCatalogRepo[] = [
  {
    id: 'vvs-official-packs',
    owner: 'Sheriff99yt',
    repo: 'VVS-Web',
    branch: 'main',
    addedAt: new Date().toISOString(),
    name: 'VVS Official Syntax Packs',
    description: 'Official core target language packs (Python, JS, C++, Gdscript, Verse, Rust, C#, Go)',
  },
];

export function useGitCatalog() {
  const [repos, setRepos] = useState<GitCatalogRepo[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CATALOG_REPOS;
    try {
      const stored = localStorage.getItem(GIT_CATALOG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_CATALOG_REPOS;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(GIT_CATALOG_STORAGE_KEY, JSON.stringify(repos));
    } catch {
      // ignore
    }
  }, [repos]);

  const addCatalogRepo = useCallback((inputUrl: string) => {
    setError(null);
    const parsed = parseGitHubUrl(inputUrl);
    if (!parsed) {
      setError('Invalid GitHub URL or repository format (expected owner/repo or github.com URL)');
      return false;
    }

    const id = `${parsed.owner}-${parsed.repo}`.toLowerCase();
    if (repos.some((r) => r.id === id)) {
      setError('Repository already added to custom catalogs');
      return false;
    }

    const newRepo: GitCatalogRepo = {
      id,
      owner: parsed.owner,
      repo: parsed.repo,
      addedAt: new Date().toISOString(),
      name: `${parsed.owner}/${parsed.repo}`,
      description: 'Custom community Git pack repository',
    };

    setRepos((prev) => [...prev, newRepo]);
    return true;
  }, [repos]);

  const removeCatalogRepo = useCallback((id: string) => {
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    repos,
    loading,
    error,
    addCatalogRepo,
    removeCatalogRepo,
  };
}
