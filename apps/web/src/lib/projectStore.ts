import { normalizeProjectSnapshot, ProjectSnapshot } from '@/types/projectSnapshot';
import { RecentProjectEntry, ProjectSource } from '@/types/projectRegistry';

const RECENT_KEY = 'vvs_recent_projects';
const LEGACY_KEY = 'vvs_mock_save';
const MAX_RECENT = 12;

function projectKey(id: string): string {
  return `vvs_project_${id}`;
}

export function createProjectId(): string {
  return `proj-${Date.now()}`;
}

export function listRecentProjects(): RecentProjectEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentProjectEntry[]) : [];
  } catch {
    return [];
  }
}

function writeRecent(entries: RecentProjectEntry[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, MAX_RECENT)));
  } catch {
    // Recent list is optional — project payload save must still succeed
  }
}

function upsertRecent(entry: RecentProjectEntry): void {
  const list = listRecentProjects().filter((e) => e.id !== entry.id);
  writeRecent([entry, ...list]);
}

export function saveProjectToStore(
  projectId: string,
  snapshot: ProjectSnapshot,
  source?: ProjectSource
): ProjectSnapshot {
  const saved: ProjectSnapshot = {
    ...snapshot,
    projectId,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(projectKey(projectId), JSON.stringify(saved));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Could not save project to local storage.'
    );
  }
  upsertRecent({
    id: projectId,
    moduleName: snapshot.projectDetails.moduleName || 'Untitled',
    savedAt: saved.savedAt,
    source: source ?? 'recent',
  });
  return saved;
}

export function loadProjectFromStore(projectId: string): ProjectSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(projectKey(projectId));
  if (!raw) return null;
  try {
    return normalizeProjectSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getRecentProjectEntry(projectId: string): RecentProjectEntry | null {
  return listRecentProjects().find((e) => e.id === projectId) ?? null;
}

export function removeFromRecentList(projectId: string): void {
  writeRecent(listRecentProjects().filter((e) => e.id !== projectId));
}

export function removeProjectFromStore(projectId: string): void {
  localStorage.removeItem(projectKey(projectId));
  removeFromRecentList(projectId);
}

export function registerProjectIfNew(
  projectId: string,
  snapshot: ProjectSnapshot,
  source: ProjectSource
): void {
  if (source === 'recent') return;
  saveProjectToStore(projectId, snapshot, source);
}

/** Migrate legacy single-slot save into the registry on first load */
export function migrateLegacySaveIfNeeded(): RecentProjectEntry | null {
  if (typeof window === 'undefined') return null;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return null;
  try {
    const snapshot = normalizeProjectSnapshot(JSON.parse(legacy));
    if (!snapshot) return null;
    const id = snapshot.projectId ?? createProjectId();
    saveProjectToStore(id, snapshot, 'recent');
    localStorage.removeItem(LEGACY_KEY);
    return listRecentProjects().find((e) => e.id === id) ?? null;
  } catch {
    return null;
  }
}
