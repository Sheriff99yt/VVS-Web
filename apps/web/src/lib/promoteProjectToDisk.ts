import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';
import {
  removeProjectDraft,
  removeProjectFromStore,
  upsertRecentProject,
} from '@/lib/projectStore';
import { linkLocalProjectToFolder } from '@/lib/projectFolder/openDirectory';

export type PromoteToDiskResult = {
  handle: FileSystemDirectoryHandle;
  folderKey: string;
};

/**
 * Write a browser-only project to a user-chosen folder, switch recents to the
 * stable folder key, and drop the browser localStorage copy.
 */
export async function promoteBrowserProjectToDisk(
  browserProjectId: string,
  snapshot: ProjectSnapshot,
  source: ProjectSource
): Promise<PromoteToDiskResult | null> {
  const linked = await linkLocalProjectToFolder(snapshot, {
    previousBrowserProjectId: browserProjectId,
  });
  if (!linked) return null;

  const { handle, folderKey } = linked;

  // Drop browser-only identity; folder key is the new project id.
  if (browserProjectId !== folderKey) {
    removeProjectFromStore(browserProjectId);
  }
  removeProjectDraft(browserProjectId);

  upsertRecentProject({
    id: folderKey,
    moduleName: snapshot.projectDetails.moduleName || 'Untitled',
    savedAt: snapshot.savedAt,
    source,
    storage: 'folder',
    folderLabel: handle.name,
  });

  return { handle, folderKey };
}

export const SAVE_ON_DISK_PROMPT_EVENT = 'vvs:save-on-disk-prompt';

export function dispatchSaveOnDiskPrompt(): void {
  window.dispatchEvent(new CustomEvent(SAVE_ON_DISK_PROMPT_EVENT));
}
