import { normalizeProjectSnapshot, ProjectSnapshot } from '@/types/projectSnapshot';
import { RecentProjectEntry, ProjectSource } from '@/types/projectRegistry';
import { notifyRecentProjectsChanged } from '@/lib/recentProjectsSubscribe';

const RECENT_KEY = 'vvs_recent_projects';
const LEGACY_KEY = 'vvs_mock_save';
const MAX_RECENT = 12;

function projectKey(id: string): string {
  return `vvs_project_${id}`;
}

function draftKey(id: string): string {
  return `vvs_draft_${id}`;
}

/** Session-only project payload — not listed in recents until promoted via saveProjectToStore. */
export function saveProjectDraft(projectId: string, snapshot: ProjectSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      draftKey(projectId),
      JSON.stringify({ ...snapshot, projectId, savedAt: new Date().toISOString() })
    );
  } catch {
    // Draft is optional — library browse still works until session storage fills
  }
}

export function loadProjectDraft(projectId: string): ProjectSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(draftKey(projectId));
  if (!raw) return null;
  try {
    return normalizeProjectSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function removeProjectDraft(projectId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(draftKey(projectId));
}

export function createProjectId(): string {
  return `proj-${Date.now()}`;
}

export function listRecentProjects(): RecentProjectEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentProjectEntry[]) : [];
    const pruned = pruneRecentProjects(parsed);
    if (pruned.length !== parsed.length) {
      localStorage.setItem(RECENT_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return [];
  }
}

/** Drop mock-api ghost entries and duplicate ids from the recent list. */
function pruneRecentProjects(entries: RecentProjectEntry[]): RecentProjectEntry[] {
  const seen = new Set<string>();
  const pruned: RecentProjectEntry[] = [];
  for (const entry of entries) {
    if (entry.id === 'default') continue;
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    pruned.push(entry);
  }
  return pruned;
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

export function upsertRecentProject(entry: RecentProjectEntry): void {
  upsertRecent(entry);
  notifyRecentProjectsChanged();
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
  removeProjectDraft(projectId);
  const existing = getRecentProjectEntry(projectId);
  upsertRecent({
    id: projectId,
    moduleName: snapshot.projectDetails.moduleName || 'Untitled',
    savedAt: saved.savedAt,
    source: source ?? 'recent',
    storage: existing?.storage,
    folderLabel: existing?.folderLabel,
  });
  notifyRecentProjectsChanged();
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

export function isProjectDraftOnly(projectId: string): boolean {
  return loadProjectFromStore(projectId) === null && loadProjectDraft(projectId) !== null;
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
