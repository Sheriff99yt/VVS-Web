'use client';

import { ProjectSnapshot } from '@/types/projectSnapshot';
import { VvsApi, getApiMode } from '@/lib/api';
import {
  loadProjectDraft,
  loadProjectFromStore,
  saveProjectToStore,
} from '@/lib/projectStore';
import { getAccessToken } from '@/lib/auth/session';

/** True when HTTP API mode is on and the user has a Supabase access token. */
export function isCloudAuthenticated(): boolean {
  return getApiMode() === 'http' && Boolean(getAccessToken());
}

/**
 * Load project: cloud first when authenticated, otherwise localStorage/draft.
 * Cloud snapshots are cached locally on success.
 */
export async function loadProjectPreferred(
  projectId: string
): Promise<ProjectSnapshot | null> {
  if (isCloudAuthenticated()) {
    try {
      const cloud = await VvsApi.loadProject(projectId);
      if (cloud) {
        saveProjectToStore(projectId, cloud);
        return cloud;
      }
    } catch {
      // Fall back to local cache when cloud is unreachable or missing.
    }
  }

  return loadProjectFromStore(projectId) ?? loadProjectDraft(projectId);
}

/**
 * Persist project snapshot. When authenticated, Go API is source of truth;
 * localStorage is always updated as offline cache.
 */
export async function persistProjectSnapshot(
  projectId: string,
  snapshot: ProjectSnapshot,
  source?: Parameters<typeof saveProjectToStore>[2],
  options?: { requireApiSave?: boolean }
): Promise<ProjectSnapshot> {
  if (isCloudAuthenticated()) {
    await VvsApi.saveProject(snapshot, projectId);
    return saveProjectToStore(projectId, snapshot, source);
  }

  const saved = saveProjectToStore(projectId, snapshot, source);
  if (getApiMode() === 'http') {
    try {
      await VvsApi.saveProject(snapshot, projectId);
    } catch (err) {
      if (options?.requireApiSave) throw err;
      // Dev flow: local save succeeded; API optional when auth is off.
    }
  }
  return saved;
}
