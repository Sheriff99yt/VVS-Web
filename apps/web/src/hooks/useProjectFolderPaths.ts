'use client';

import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { listVirtualProjectFolderPaths } from '@vvs/graph-types';

/** Full virtual project folder listing for Structure → Output tree. */
export function useProjectFolderPaths() {
  const { graphContainers, openTabs, classes, integration, workspaceFiles } = useProject();
  const documents = useGraphDocuments();
  const { result } = useProjectTranspileResult();

  return useMemo(
    () =>
      listVirtualProjectFolderPaths(
        {
          graphContainers,
          openTabs,
          documents: documents ?? {},
          classes,
          workspaceFiles,
        },
        {
          emittedFilePaths: result.files.map((file) => file.path),
          integration,
        }
      ),
    [
      graphContainers,
      openTabs,
      documents,
      classes,
      workspaceFiles,
      result.files,
      integration,
    ]
  );
}
