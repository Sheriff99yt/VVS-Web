import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';
import { saveProjectToStore, upsertRecentProject } from '@/lib/projectStore';
import { linkLocalProjectToFolder } from '@/lib/projectFolder/openDirectory';

/** Write a browser-only project to a user-chosen folder and update recents. */
export async function promoteBrowserProjectToDisk(
  projectId: string,
  snapshot: ProjectSnapshot,
  source: ProjectSource
): Promise<FileSystemDirectoryHandle | null> {
  const handle = await linkLocalProjectToFolder(projectId, snapshot);
  if (!handle) return null;

  upsertRecentProject({
    id: projectId,
    moduleName: snapshot.projectDetails.moduleName || 'Untitled',
    savedAt: snapshot.savedAt,
    source,
    storage: 'folder',
    folderLabel: handle.name,
  });
  saveProjectToStore(projectId, snapshot, source);
  return handle;
}

export const SAVE_ON_DISK_PROMPT_EVENT = 'vvs:save-on-disk-prompt';

export function dispatchSaveOnDiskPrompt(): void {
  window.dispatchEvent(new CustomEvent(SAVE_ON_DISK_PROMPT_EVENT));
}
