import { useEffect, useMemo, useState } from 'react';
import type { GraphDocument } from '@/lib/graphDefaults';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { buildReferenceIndex } from '@/lib/graphRelations';

/**
 * Snapshot of workspace documents that only updates when the workspace notifies
 * listeners — avoids unstable object identity from getDocuments() on every render.
 */
export function useGraphDocuments(): Record<string, GraphDocument> | null {
  const { getDocuments, subscribeMetadata } = useGraphWorkspace();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    bump();
    return subscribeMetadata(bump);
  }, [subscribeMetadata]);

  return useMemo(() => {
    void revision;
    return getDocuments();
  }, [revision, getDocuments]);
}

export function useGraphReferenceIndex(
  functions: { id: string; name: string }[],
  macros: { id: string; name: string }[]
) {
  const documents = useGraphDocuments();

  return useMemo(() => {
    if (!documents) return null;
    return buildReferenceIndex(documents, functions, macros);
  }, [documents, functions, macros]);
}
