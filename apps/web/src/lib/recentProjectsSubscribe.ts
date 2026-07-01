import { useSyncExternalStore } from 'react';
import { listRecentProjects, migrateLegacySaveIfNeeded } from '@/lib/projectStore';
import type { RecentProjectEntry } from '@/types/projectRegistry';

const listeners = new Set<() => void>();

/** Stable reference for SSR and initial client hydration — must not allocate per call. */
const SERVER_RECENT_SNAPSHOT: RecentProjectEntry[] = [];

let cachedSnapshot: RecentProjectEntry[] = SERVER_RECENT_SNAPSHOT;
let clientSnapshotReady = false;

function refreshSnapshot(): void {
  if (typeof window === 'undefined') return;
  migrateLegacySaveIfNeeded();
  cachedSnapshot = listRecentProjects();
  clientSnapshotReady = true;
}

function getRecentSnapshot(): RecentProjectEntry[] {
  if (typeof window !== 'undefined' && !clientSnapshotReady) {
    refreshSnapshot();
  }
  return cachedSnapshot;
}

function getServerRecentSnapshot(): RecentProjectEntry[] {
  return SERVER_RECENT_SNAPSHOT;
}

export function subscribeRecentProjects(onStoreChange: () => void): () => void {
  if (typeof window !== 'undefined') {
    refreshSnapshot();
  }
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function notifyRecentProjectsChanged(): void {
  refreshSnapshot();
  listeners.forEach((listener) => listener());
}

export function useRecentProjects(): RecentProjectEntry[] {
  return useSyncExternalStore(subscribeRecentProjects, getRecentSnapshot, getServerRecentSnapshot);
}

export function initRecentProjects(): void {
  notifyRecentProjectsChanged();
}
