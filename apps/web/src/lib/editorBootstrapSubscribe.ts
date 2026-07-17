import { useEffect, useState } from 'react';
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

async function resolveFolderBootstrap(
  projectId: string,
  view: string | null
): Promise<EditorBootstrap | null> {
  const handle = await getFolderHandle(projectId);
  if (!handle) return null;
  const permitted = await verifyHandlePermission(handle);
  if (!permitted) return null;
  const loaded = await loadProjectFromFolder(handle);
  if (!loaded) return null;
  const entry = getRecentProjectEntry(projectId);
  return {
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
  };
}

/** Load project bootstrap from localStorage or on-disk `.vvs/` folder (client-only). */
export function useEditorBootstrap(
  projectId: string | null,
  view: string | null
): { bootstrap: EditorBootstrap | null; loading: boolean } {
  const [bootstrap, setBootstrap] = useState<EditorBootstrap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) {
        if (!cancelled) {
          setBootstrap(null);
          setLoading(false);
        }
        return;
      }

      const entry = getRecentProjectEntry(projectId);
      let resolved: EditorBootstrap | null = null;

      // Only treat as folder when the recent entry (or id prefix) says so.
      // Orphan IndexedDB handles under browser `proj-*` ids must not force a folder load.
      const preferFolder = isFolderRecentEntry(
        entry ?? { id: projectId, moduleName: '', savedAt: '', source: 'recent' }
      );

      if (preferFolder) {
        resolved = await resolveFolderBootstrap(projectId, view);
      }
      // Fall back to browser localStorage when folder access is missing/stale.
      if (!resolved) {
        resolved = await resolveLocalBootstrapAsync(projectId, view);
      }

      if (!cancelled) {
        setBootstrap(resolved);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [projectId, view]);

  return { bootstrap, loading };
}
