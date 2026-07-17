import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';
import { getApiMode } from '@/lib/api';
import { persistProjectSnapshot } from '@/lib/cloudPersistence';
import { isHostedFeaturesEnabled } from '@/lib/hostedFeatures';
import { saveProjectToFolder } from '@/lib/projectFolder';
import { saveProjectToStore, upsertRecentProject } from '@/lib/projectStore';

export type PersistEditorOptions = {
  /** When hosted HTTP mode is on, fail if the API write fails. */
  requireApiSave?: boolean;
};

/**
 * Single write router for the editor: folder `.vvs/` overlay, else browser
 * localStorage (with optional hosted cloud when enabled).
 */
export async function persistEditorSnapshot(input: {
  projectId: string;
  projectSource: ProjectSource;
  snapshot: ProjectSnapshot;
  folder?: {
    handle: FileSystemDirectoryHandle;
    label?: string | null;
  } | null;
  options?: PersistEditorOptions;
}): Promise<{ savedAt: string }> {
  const { projectId, projectSource, snapshot, folder, options } = input;

  if (folder?.handle) {
    await saveProjectToFolder(folder.handle, snapshot);
    upsertRecentProject({
      id: projectId,
      moduleName: snapshot.projectDetails.moduleName || 'Untitled',
      savedAt: snapshot.savedAt,
      source: projectSource,
      storage: 'folder',
      folderLabel: folder.label ?? folder.handle.name,
    });
    if (isHostedFeaturesEnabled() && getApiMode() === 'http') {
      await persistProjectSnapshot(projectId, snapshot, projectSource, options);
    }
    return { savedAt: snapshot.savedAt };
  }

  // Browser-only: force local storage kind so reopen loads this snapshot
  // (stale `folder` recent flags previously caused silent reloads from disk).
  const saved = await persistProjectSnapshot(projectId, snapshot, projectSource, {
    ...options,
    storage: 'local',
    folderLabel: null,
  });
  return { savedAt: saved.savedAt };
}

/**
 * Synchronous localStorage flush for browser-only projects (e.g. beforeunload).
 */
export function flushBrowserSnapshotSync(
  projectId: string,
  snapshot: ProjectSnapshot,
  source: ProjectSource
): void {
  saveProjectToStore(projectId, snapshot, source, { storage: 'local', folderLabel: null });
}
