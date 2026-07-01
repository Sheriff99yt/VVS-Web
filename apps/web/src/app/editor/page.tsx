'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { useEditorBootstrap } from '@/lib/editorBootstrapSubscribe';
import { loadProjectFromStore } from '@/lib/projectStore';
import type { EditorBootstrap } from '@/types/projectRegistry';

function EditorBootstrapLoader({
  bootstrap,
}: {
  bootstrap: EditorBootstrap;
}) {
  const documents = bootstrap.snapshot.documents ?? {};
  const mainDoc = documents.main ?? { nodes: [], edges: [] };

  return (
    <EditorLayout
      projectId={bootstrap.projectId}
      projectSource={bootstrap.source}
      initialSnapshot={bootstrap.snapshot}
      initialView={bootstrap.initialView}
      initialNodes={mainDoc.nodes}
      initialEdges={mainDoc.edges}
      initialDocuments={documents}
    />
  );
}

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const view = searchParams.get('view');

  const bootstrap = useEditorBootstrap(projectId, view);

  useEffect(() => {
    if (!projectId) {
      router.replace('/');
      return;
    }
    if (bootstrap) return;

    const timer = window.setTimeout(() => {
      if (!loadProjectFromStore(projectId)) {
        router.replace('/');
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [projectId, bootstrap, router]);

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
