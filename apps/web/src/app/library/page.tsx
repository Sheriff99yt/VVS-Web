'use client';

import { Suspense } from 'react';
import { BrowseShell } from '@/components/start/BrowseShell';
import { LibraryView } from '@/components/views/LibraryView';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { GraphWorkspaceProvider } from '@/contexts/GraphWorkspaceContext';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import { BROWSE_LIBRARY_PROJECT_ID } from '@/lib/startExplore';

function LibraryBrowse() {
  return (
    <ProjectProvider
      projectId={BROWSE_LIBRARY_PROJECT_ID}
      projectSource="new"
      initialSnapshot={createEmptyProjectSnapshot()}
    >
      <GraphWorkspaceProvider>
        <LibraryView browseMode />
      </GraphWorkspaceProvider>
    </ProjectProvider>
  );
}

export default function LibraryPage() {
  return (
    <BrowseShell title="Library">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading library…
          </div>
        }
      >
        <LibraryBrowse />
      </Suspense>
    </BrowseShell>
  );
}
