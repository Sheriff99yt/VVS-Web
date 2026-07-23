import { useCallback, useEffect, useState } from 'react';
import { getRecentProjectEntry, loadProjectFromStore } from '@/lib/projectStore';
import { loadProjectPreferred } from '@/lib/cloudPersistence';
import {
  getFolderHandle,
  loadProjectFromFolder,
  verifyHandlePermission,
} from '@/lib/projectFolder';
import type { EditorBootstrap } from '@/types/projectRegistry';
import { isFolderRecentEntry } from '@/types/projectRegistry';

async function resolveLocalBootstrapAsync(
  projectId: string,
  view: string | null
): Promise<EditorBootstrap | null> {
  const snapshot = await loadProjectPreferred(projectId);
  if (!snapshot) return null;
  const entry = getRecentProjectEntry(projectId);
  const isDraft = loadProjectFromStore(projectId) === null;
  return {
    projectId,
    snapshot,
    source: isDraft ? 'new' : (entry?.source ?? 'recent'),
    initialView:
      view === 'library'
        ? 'library'
        : view === 'references'
          ? 'references'
          : view === 'roadmap'
            ? 'roadmap'
            : 'canvas',
  };
}

interface ResolveFolderResult {
  bootstrap: EditorBootstrap | null;
  pendingHandle: FileSystemDirectoryHandle | null;
}

async function resolveFolderBootstrap(
  projectId: string,
  view: string | null
): Promise<ResolveFolderResult> {
  const handle = await getFolderHandle(projectId);
  if (!handle) return { bootstrap: null, pendingHandle: null };

  try {
    const status = await handle.queryPermission({ mode: 'readwrite' });
    if (status !== 'granted') {
      return { bootstrap: null, pendingHandle: handle };
    }
  } catch {
    return { bootstrap: null, pendingHandle: handle };
  }

  const loaded = await loadProjectFromFolder(handle);
  if (!loaded) return { bootstrap: null, pendingHandle: null };
  const entry = getRecentProjectEntry(projectId);
  return {
    bootstrap: {
      projectId,
      snapshot: loaded.snapshot,
      source: entry?.source ?? 'recent',
      initialView:
        view === 'library'
          ? 'library'
          : view === 'references'
            ? 'references'
            : view === 'roadmap'
              ? 'roadmap'
              : 'canvas',
      folderKey: projectId,
      folderHandle: handle,
      folderLabel: entry?.folderLabel ?? handle.name,
    },
    pendingHandle: null,
  };
}

/** Load project bootstrap from localStorage or on-disk `.vvs/` folder (client-only). */
export function useEditorBootstrap(
  projectId: string | null,
  view: string | null
): {
  bootstrap: EditorBootstrap | null;
  loading: boolean;
  pendingFolderHandle: FileSystemDirectoryHandle | null;
  requestPendingFolderPermission: () => Promise<boolean>;
} {
  const [bootstrap, setBootstrap] = useState<EditorBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingFolderHandle, setPendingFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (!projectId) {
      setBootstrap(null);
      setPendingFolderHandle(null);
      setLoading(false);
      return;
    }

    const entry = getRecentProjectEntry(projectId);
    let resolved: EditorBootstrap | null = null;
    let pending: FileSystemDirectoryHandle | null = null;

    const preferFolder = isFolderRecentEntry(
      entry ?? { id: projectId, moduleName: '', savedAt: '', source: 'recent' }
    );

    if (preferFolder) {
      const folderRes = await resolveFolderBootstrap(projectId, view);
      resolved = folderRes.bootstrap;
      pending = folderRes.pendingHandle;
    }

    if (!resolved && !pending) {
      resolved = await resolveLocalBootstrapAsync(projectId, view);
    }

    setPendingFolderHandle(pending);
    setBootstrap(resolved);
    setLoading(false);
  }, [projectId, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestPendingFolderPermission = useCallback(async (): Promise<boolean> => {
    if (!pendingFolderHandle || !projectId) return false;
    const permitted = await verifyHandlePermission(pendingFolderHandle);
    if (permitted) {
      await load();
      return true;
    }
    return false;
  }, [pendingFolderHandle, projectId, load]);

  return { bootstrap, loading, pendingFolderHandle, requestPendingFolderPermission };
}
