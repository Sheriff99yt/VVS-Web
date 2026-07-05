'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { useEditorBootstrap } from '@/lib/editorBootstrapSubscribe';
import { loadProjectFromStore, getRecentProjectEntry, loadProjectDraft } from '@/lib/projectStore';
import { getFolderHandle } from '@/lib/projectFolder';
import { isFolderRecentEntry } from '@/types/projectRegistry';
import type { EditorBootstrap } from '@/types/projectRegistry';
import type { VVSNode, VVSEdge } from '@/types/graph';
import type { GraphDocument } from '@/lib/graphDefaults';
import { ProjectFolderProvider } from '@/contexts/ProjectFolderContext';

function EditorBootstrapLoader({
  bootstrap,
}: {
  bootstrap: EditorBootstrap;
}) {
  const documents = bootstrap.snapshot.documents ?? {};
  const mainDoc = documents.main ?? { nodes: [], edges: [] };

  return (
    <ProjectFolderProvider
      folderKey={bootstrap.folderKey}
      folderHandle={bootstrap.folderHandle}
      folderLabel={bootstrap.folderLabel}
    >
      <EditorLayout
        projectId={bootstrap.projectId}
        projectSource={bootstrap.source}
        initialSnapshot={bootstrap.snapshot}
        initialView={bootstrap.initialView}
        initialNodes={mainDoc.nodes as VVSNode[]}
        initialEdges={mainDoc.edges as VVSEdge[]}
        initialDocuments={documents as Record<string, GraphDocument>}
      />
    </ProjectFolderProvider>
  );
}

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const view = searchParams.get('view');

  const { bootstrap, loading } = useEditorBootstrap(projectId, view);

  useEffect(() => {
    if (!projectId) {
      router.replace('/');
      return;
    }
    if (loading || bootstrap) return;

    const timer = window.setTimeout(async () => {
      const entry = getRecentProjectEntry(projectId);
      const storedHandle = await getFolderHandle(projectId!);
      if (isFolderRecentEntry(entry ?? { id: projectId!, moduleName: '', savedAt: '', source: 'recent' }) || storedHandle) {
        router.replace('/');
        return;
      }
      if (!loadProjectFromStore(projectId) && !loadProjectDraft(projectId)) {
        router.replace('/');
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [projectId, bootstrap, loading, router]);

  if (loading || !bootstrap) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
        Loading project…
      </div>
    );
  }

  return <EditorBootstrapLoader bootstrap={bootstrap} />;
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
          Loading project…
        </div>
      }
    >
      <EditorPageContent />
    </Suspense>
  );
}
