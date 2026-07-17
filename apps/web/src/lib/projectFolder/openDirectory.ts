import { getFolderHandle, storeFolderHandle, removeFolderHandle, folderKeyFromHandleName } from './handleStore';
import { pickProjectFolder, verifyHandlePermission } from './fsAccess';
import { createProjectInFolder } from './io';
import type { ProjectSnapshot } from '@vvs/graph-types';

export async function resolveProjectFolderHandle(
  folderKey: string,
  folderLabel?: string
): Promise<FileSystemDirectoryHandle | null> {
  let handle = await getFolderHandle(folderKey);

  if (!handle) {
    const label = folderLabel ? ` "${folderLabel}"` : '';
    const retry = window.confirm(
      `Folder access for${label} was lost.\n\nChoose the project folder again to reconnect.`
    );
    if (!retry) return null;
    handle = await pickProjectFolder();
    if (!handle) return null;
    await storeFolderHandle(folderKey, handle);
  }

  if (!(await verifyHandlePermission(handle))) {
    window.alert('Permission to access the project folder was denied.');
    return null;
  }

  return handle;
}

export type LinkedFolderProject = {
  handle: FileSystemDirectoryHandle;
  folderKey: string;
};

/**
 * Export a browser-stored project into a user-chosen folder and link the handle
 * under `folderKeyFromHandleName` (same scheme as New/Open folder).
 */
export async function linkLocalProjectToFolder(
  snapshot: ProjectSnapshot,
  options?: { previousBrowserProjectId?: string }
): Promise<LinkedFolderProject | null> {
  const handle = await pickProjectFolder();
  if (!handle) return null;
  if (!(await verifyHandlePermission(handle))) {
    window.alert('Permission to write to the project folder was denied.');
    return null;
  }
  try {
    const folderKey = folderKeyFromHandleName(handle.name);
    const folderSnapshot: ProjectSnapshot = { ...snapshot, projectId: folderKey };
    await createProjectInFolder(handle, folderSnapshot, { adoptExisting: true });
    await storeFolderHandle(folderKey, handle);

    const previousId = options?.previousBrowserProjectId;
    if (previousId && previousId !== folderKey) {
      try {
        await removeFolderHandle(previousId);
      } catch {
        // Best-effort cleanup of legacy handle keyed by browser project id.
      }
    }

    return { handle, folderKey };
  } catch (error) {
    window.alert(
      error instanceof Error ? error.message : 'Could not write project files to that folder.'
    );
    return null;
  }
}

export async function hasStoredFolderHandle(folderKey: string): Promise<boolean> {
  return (await getFolderHandle(folderKey)) !== null;
}
