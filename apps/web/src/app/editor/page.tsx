'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Folder } from 'lucide-react';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { useEditorBootstrap } from '@/lib/editorBootstrapSubscribe';
import { loadProjectFromStore, getRecentProjectEntry, loadProjectDraft } from '@/lib/projectStore';
import { getFolderHandle } from '@/lib/projectFolder';
import { isFolderRecentEntry } from '@/types/projectRegistry';
import type { EditorBootstrap } from '@/types/projectRegistry';
import type { VVSNode, VVSEdge } from '@/types/graph';
import type { GraphDocument } from '@/lib/graphDefaults';
import { ProjectFolderProvider } from '@/contexts/ProjectFolderContext';

import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

function EditorBootstrapLoader({
  bootstrap,
}: {
  bootstrap: EditorBootstrap;
}) {
  const documents = bootstrap.snapshot.documents ?? {};
  const activeTab = bootstrap.snapshot.activeGraphTab;
  const initialDoc =
    documents[activeTab] ??
    documents[MAIN_GRAPH_CONTAINER_ID] ??
    { nodes: [], edges: [] };

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
        initialNodes={initialDoc.nodes as VVSNode[]}
        initialEdges={initialDoc.edges as VVSEdge[]}
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

  const {
    bootstrap,
    loading,
    pendingFolderHandle,
    requestPendingFolderPermission,
  } = useEditorBootstrap(projectId, view);

  useEffect(() => {
    if (!projectId) {
      router.replace('/');
      return;
    }
    if (loading || bootstrap || pendingFolderHandle) return;

    const timer = window.setTimeout(async () => {
      const entry = getRecentProjectEntry(projectId);
      const preferFolder = isFolderRecentEntry(
        entry ?? { id: projectId!, moduleName: '', savedAt: '', source: 'recent' }
      );
      if (preferFolder) {
        const storedHandle = await getFolderHandle(projectId!);
        if (!storedHandle && !loadProjectFromStore(projectId) && !loadProjectDraft(projectId)) {
          router.replace('/');
        }
        return;
      }
      if (!loadProjectFromStore(projectId) && !loadProjectDraft(projectId)) {
        router.replace('/');
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [projectId, bootstrap, loading, pendingFolderHandle, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
        Loading project…
      </div>
    );
  }

  if (pendingFolderHandle) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
          <Folder className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-zinc-100 mb-1">
          Folder Access Permission Required
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
          Browser security requires interactive permission to read local files in{' '}
          <span className="font-mono text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            {pendingFolderHandle.name}
          </span>
          .
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void requestPendingFolderPermission()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded font-medium transition-colors shadow-sm cursor-pointer"
          >
            Grant Access & Continue
          </button>
          <button
            type="button"
            onClick={() => router.replace('/')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 rounded font-medium transition-colors cursor-pointer"
          >
            Back to Start
          </button>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
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
