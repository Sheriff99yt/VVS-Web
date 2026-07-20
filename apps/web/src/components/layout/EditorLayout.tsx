"use client";

import React from 'react';
import { TopNav } from './TopNav';
import { GraphExplorer } from './GraphExplorer';
import { CodeOutputPanel } from './CodeOutputPanel';
import { GraphTabBar } from './GraphTabBar';
import { StatusBar } from './StatusBar';
import { LibraryView } from '../views/LibraryView';
import { RoadmapView } from '../views/RoadmapView';
import { ReferencesView } from '../views/ReferencesView';
import { PacksView } from '../views/PacksView';
import { initializeCustomPacks } from '@/lib/packsInitializer';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ReactFlowProvider } from '@xyflow/react';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { GraphWorkspaceProvider } from '@/contexts/GraphWorkspaceContext';
import { EditorPanelProvider, useEditorPanels } from '@/contexts/EditorPanelContext';
import { EditorViewProvider } from '@/contexts/EditorViewContext';
import { EditorNavigationProvider } from '@/contexts/EditorNavigationContext';
import { GraphWorkspaceHost } from '@/components/graph/GraphWorkspaceHost';
import GraphCanvas from '@/components/graph/GraphCanvas';
import { GraphSettingsModal } from '@/components/layout/GraphSettingsModal';
import {
  EnvironmentImportModal,
  useEnvironmentImportModal,
} from '@/components/environments/EnvironmentImportModal';
import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';
import type { EditorViewTab } from '@/types/editorNavigation';

export type { EditorViewTab };

interface EditorLayoutProps {
  projectId: string;
  projectSource: ProjectSource;
  initialSnapshot: ProjectSnapshot;
  initialView?: EditorViewTab;
  initialNodes?: VVSNode[];
  initialEdges?: VVSEdge[];
  initialDocuments?: Record<string, GraphDocument>;
}

function CanvasWorkspace() {
  const { codePanelRef, graphNavPanelRef } = useEditorPanels();

  return (
    <PanelGroup orientation="horizontal" className="w-full h-full">
      <Panel
        id="left"
        defaultSize={20}
        minSize={15}
        collapsible
        collapsedSize={0}
        panelRef={graphNavPanelRef}
      >
        <GraphExplorer mode="canvas" />
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

      <Panel id="center" defaultSize={55} minSize={30}>
        <main className="w-full h-full relative bg-zinc-950 flex flex-col min-h-0 min-w-0">
          <GraphTabBar />
          <div className="flex-1 relative overflow-hidden min-h-0 min-w-0">
            <GraphCanvas />
          </div>
        </main>
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

      <Panel
        id="right"
        defaultSize={28}
        minSize={18}
        collapsible
        collapsedSize={0}
        panelRef={codePanelRef}
      >
        <CodeOutputPanel />
      </Panel>
    </PanelGroup>
  );
}

function EnvImportHost() {
  const { open, setOpen } = useEnvironmentImportModal();
  return <EnvironmentImportModal open={open} onClose={() => setOpen(false)} />;
}

export function EditorLayout({
  projectId,
  projectSource,
  initialSnapshot,
  initialView = 'canvas',
  initialNodes = [],
  initialEdges = [],
  initialDocuments,
}: EditorLayoutProps) {
  const [activeTab, setActiveTab] = React.useState<EditorViewTab>(
    initialView === 'library' || initialView === 'references' || initialView === 'roadmap' || initialView === 'packs'
      ? initialView
      : 'canvas'
  );
  const isCanvas = activeTab === 'canvas';
  const isReferences = activeTab === 'references';
  const isRoadmap = activeTab === 'roadmap';
  const isPacks = activeTab === 'packs';

  React.useEffect(() => {
    initializeCustomPacks();
  }, []);

  return (
    <ProjectProvider
      projectId={projectId}
      projectSource={projectSource}
      initialSnapshot={initialSnapshot}
    >
      <GraphWorkspaceProvider>
        <GraphWorkspaceHost
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          initialDocuments={
            (initialDocuments ?? initialSnapshot.documents) as
              | Record<string, GraphDocument>
              | undefined
          }
        >
          <EditorViewProvider activeView={activeTab}>
            <EditorNavigationProvider editorView={activeTab} setEditorView={setActiveTab}>
            <EditorPanelProvider>
              <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950">
                <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="flex-1 overflow-hidden min-h-0 relative">
                  {isCanvas ? (
                    <ReactFlowProvider>
                      <CanvasWorkspace />
                    </ReactFlowProvider>
                  ) : null}
                  {isReferences ? (
                    <div className="h-full">
                      <ReferencesView onSwitchToCanvas={() => setActiveTab('canvas')} />
                    </div>
                  ) : null}
                  {activeTab === 'library' ? (
                    <div className="h-full">
                      <LibraryView />
                    </div>
                  ) : null}
                  {isRoadmap ? (
                    <div className="h-full">
                      <RoadmapView />
                    </div>
                  ) : null}
                  {isPacks ? (
                    <div className="h-full">
                      <PacksView />
                    </div>
                  ) : null}
                </div>

                <StatusBar />
              </div>
              <GraphSettingsModal />
              <EnvImportHost />
            </EditorPanelProvider>
            </EditorNavigationProvider>
          </EditorViewProvider>
        </GraphWorkspaceHost>
      </GraphWorkspaceProvider>
    </ProjectProvider>
  );
}
