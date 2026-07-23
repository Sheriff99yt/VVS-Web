'use client';

import { useState, useCallback } from 'react';
import type { LanguageFamily } from '@vvs/graph-types';
import type { SyntaxPackManifest } from '@vvs/syntax-packs';
import {
  fetchPackReleases,
  downloadPackManifest,
  flattenReleasesToAssets,
  getPacksRepo,
  setPacksRepo as setStoredPacksRepo,
  PackGitHubError,
  type PackReleaseAsset,
} from '@/lib/packsGitHub';

export interface AvailableRelease {
  id: string;
  displayName: string;
  version: string;
  family: LanguageFamily;
  isOverlay: boolean;
  asset: PackReleaseAsset;
}

export interface UsePackReleasesResult {
  repoInput: string;
  setRepoInput: (repo: string) => void;
  applyRepo: () => void;
  isCheckingUpdates: boolean;
  availableUpdates: AvailableRelease[];
  checkedAt: string | null;
  error: string | null;
  dismissError: () => void;
  installingId: string | null;
  checkUpdates: (installedPool: SyntaxPackManifest[]) => Promise<void>;
  downloadAndInstallRelease: (
    release: AvailableRelease,
    onSuccess: (manifest: SyntaxPackManifest) => void
  ) => Promise<void>;
}

export function usePackReleases(): UsePackReleasesResult {
  const [repoInput, setRepoInput] = useState<string>(() => getPacksRepo());
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [availableUpdates, setAvailableUpdates] = useState<AvailableRelease[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const dismissError = useCallback(() => setError(null), []);

  const applyRepo = useCallback(() => {
    const trimmed = repoInput.trim();
    if (!trimmed) return;
    setStoredPacksRepo(trimmed);
    setCheckedAt(null);
    setAvailableUpdates([]);
  }, [repoInput]);

  const checkUpdates = useCallback(
    async (installedPool: SyntaxPackManifest[]) => {
      setIsCheckingUpdates(true);
      setError(null);
      try {
        const releases = await fetchPackReleases();
        const assets = flattenReleasesToAssets(releases);
        const filtered = assets.filter(
          (a) => !installedPool.some((p) => p.id === a.name && p.version === a.version)
        );
        setAvailableUpdates(
          filtered.map((asset) => ({
            id: asset.name,
            displayName: asset.displayName,
            version: asset.version,
            family: asset.family,
            isOverlay: asset.isOverlay,
            asset,
          }))
        );
        setCheckedAt(new Date().toLocaleTimeString());
      } catch (e) {
        const msg =
          e instanceof PackGitHubError
            ? e.message
            : e instanceof Error
              ? e.message
              : String(e);
        setError(msg);
        setAvailableUpdates([]);
      } finally {
        setIsCheckingUpdates(false);
      }
    },
    []
  );

  const downloadAndInstallRelease = useCallback(
    async (release: AvailableRelease, onSuccess: (manifest: SyntaxPackManifest) => void) => {
      const installKey = `${release.id}@${release.version}`;
      setInstallingId(installKey);
      setError(null);
      try {
        const manifest = await downloadPackManifest(release.asset.downloadUrl);
        onSuccess(manifest);
        setAvailableUpdates((prev) =>
          prev.filter((x) => !(x.id === release.id && x.version === release.version))
        );
      } catch (e) {
        const msg =
          e instanceof PackGitHubError
            ? `Install failed: ${e.message}`
            : e instanceof Error
              ? `Install failed: ${e.message}`
              : String(e);
        setError(msg);
      } finally {
        setInstallingId(null);
      }
    },
    []
  );

  return {
    repoInput,
    setRepoInput,
    applyRepo,
    isCheckingUpdates,
    availableUpdates,
    checkedAt,
    error,
    dismissError,
    installingId,
    checkUpdates,
    downloadAndInstallRelease,
  };
}
