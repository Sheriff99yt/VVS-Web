import { useEffect, useState } from 'react';
import { getRecentProjectEntry, loadProjectFromStore } from '@/lib/projectStore';
import type { EditorBootstrap } from '@/types/projectRegistry';

function resolveBootstrap(projectId: string, view: string | null): EditorBootstrap | null {
  const snapshot = loadProjectFromStore(projectId);
  if (!snapshot) return null;
  const entry = getRecentProjectEntry(projectId);
  return {
    projectId,
    snapshot,
    source: entry?.source ?? 'recent',
    initialView:
      view === 'library' ? 'library' : view === 'references' ? 'references' : 'canvas',
  };
}

/** Load project bootstrap from localStorage after navigation (client-only). */
export function useEditorBootstrap(
  projectId: string | null,
  view: string | null
): EditorBootstrap | null {
  const [bootstrap, setBootstrap] = useState<EditorBootstrap | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (!projectId) {
        setBootstrap(null);
        return;
      }
      setBootstrap(resolveBootstrap(projectId, view));
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [projectId, view]);

  return bootstrap;
}
