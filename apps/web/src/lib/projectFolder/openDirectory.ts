import { getFolderHandle, storeFolderHandle } from './handleStore';
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

/** Export a browser-stored project into a user-chosen folder and link the handle. */
export async function linkLocalProjectToFolder(
  projectId: string,
  snapshot: ProjectSnapshot
): Promise<FileSystemDirectoryHandle | null> {
  const handle = await pickProjectFolder();
  if (!handle) return null;
  if (!(await verifyHandlePermission(handle))) {
    window.alert('Permission to write to the project folder was denied.');
    return null;
  }
  try {
    await createProjectInFolder(handle, snapshot, { adoptExisting: true });
  } catch (error) {
    window.alert(
      error instanceof Error ? error.message : 'Could not write project files to that folder.'
    );
    return null;
  }
  await storeFolderHandle(projectId, handle);
  return handle;
}

export async function hasStoredFolderHandle(folderKey: string): Promise<boolean> {
  return (await getFolderHandle(folderKey)) !== null;
}
