export type ProjectSource = 'new' | 'recent' | 'import' | 'template' | 'demo' | 'test';

export type ProjectStorageKind = 'local' | 'folder';

import type { EditorViewTab } from '@/types/editorNavigation';

/** Folder-backed recent entry (by metadata or id prefix). */
export function isFolderRecentEntry(entry: RecentProjectEntry): boolean {
  return entry.storage === 'folder' || entry.id.startsWith('folder-');
}

export interface RecentProjectEntry {
  id: string;
  moduleName: string;
  savedAt: string;
  source: ProjectSource;
  /** Where project data lives — localStorage snapshot or on-disk `.vvs/` folder */
  storage?: ProjectStorageKind;
  /** Directory display name when storage is folder */
  folderLabel?: string;
}

export interface EditorBootstrap {
  projectId: string;
  snapshot: import('@/types/projectSnapshot').ProjectSnapshot;
  source: ProjectSource;
  initialView?: EditorViewTab;
  folderKey?: string;
  folderHandle?: FileSystemDirectoryHandle;
  folderLabel?: string;
}
