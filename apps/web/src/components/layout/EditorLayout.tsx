"use client";

import React from 'react';
import { TopNav } from './TopNav';
import { GraphExplorer } from './GraphExplorer';
import { RightSidebar } from './RightSidebar';
import { CodePreviewPanel } from './CodePreviewPanel';
import { GraphTabBar } from './GraphTabBar';
import { GraphBreadcrumb } from './GraphBreadcrumb';
import { StatusBar } from './StatusBar';
import { LibraryView } from '../views/LibraryView';
import { ReferencesView } from '../views/ReferencesView';
import { OutputConsolePanel } from './OutputConsolePanel';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ReactFlowProvider } from '@xyflow/react';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { GraphWorkspaceProvider } from '@/contexts/GraphWorkspaceContext';
import { EditorPanelProvider, useEditorPanels } from '@/contexts/EditorPanelContext';
import { EditorViewProvider } from '@/contexts/EditorViewContext';
import { EditorNavigationProvider } from '@/contexts/EditorNavigationContext';
import { GraphWorkspaceHost } from '@/components/graph/GraphWorkspaceHost';
import GraphCanvas from '@/components/graph/GraphCanvas';
import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { VVSNode, VVSEdge } from '@/types/graph';

interface EditorLayoutProps {
  projectId: string;
  projectSource: ProjectSource;
  initialSnapshot: ProjectSnapshot;
  initialView?: 'canvas' | 'references' | 'library';
  initialNodes?: VVSNode[];
  initialEdges?: VVSEdge[];
  initialDocuments?: Record<string, GraphDocument>;
}

import type { EditorViewTab } from '@/types/editorNavigation';

export type { EditorViewTab };

function CanvasWorkspace() {
  const { consolePanelRef, codePanelRef } = useEditorPanels();

  return (
    <PanelGroup orientation="horizontal" className="w-full h-full">
      <Panel id="left" defaultSize={20} minSize={15}>
        <GraphExplorer mode="canvas" />
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

      <Panel id="center" defaultSize={55} minSize={30}>
        <PanelGroup id="center-split" orientation="vertical">
          <Panel id="main-view" defaultSize={88} minSize={30}>
            <main className="w-full h-full relative bg-zinc-950 flex flex-col min-h-0 min-w-0">
              <div className="flex flex-col shrink-0 w-full z-40 relative">
                <GraphBreadcrumb />
                <GraphTabBar />
              </div>
              <div className="flex-1 relative overflow-hidden min-h-0 min-w-0">
                <GraphCanvas />
              </div>
            </main>
          </Panel>

          <PanelResizeHandle className="h-1 cursor-row-resize bg-zinc-950 border-y border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

          <Panel
            id="output-console"
            defaultSize={12}
            minSize={5}
            collapsible
            collapsedSize={0}
            panelRef={consolePanelRef}
          >
            <OutputConsolePanel />
          </Panel>
        </PanelGroup>
      </Panel>

      <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-950 border-x border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

      <Panel id="right" defaultSize={25} minSize={20}>
        <PanelGroup id="right-split" orientation="vertical">
          <Panel id="properties" defaultSize={55} minSize={20}>
            <RightSidebar />
          </Panel>

          <PanelResizeHandle className="h-1 cursor-row-resize bg-zinc-950 border-y border-zinc-800/50 hover:bg-zinc-800 transition-colors" />

          <Panel
            id="code"
            defaultSize={45}
            minSize={15}
            collapsible
            collapsedSize={0}
            panelRef={codePanelRef}
          >
            <CodePreviewPanel />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
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
    initialView === 'library' || initialView === 'references' ? initialView : 'canvas'
  );
  const isCanvas = activeTab === 'canvas';
  const isReferences = activeTab === 'references';

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
          initialDocuments={initialDocuments ?? initialSnapshot.documents}
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
                </div>

                <StatusBar />
              </div>
            </EditorPanelProvider>
            </EditorNavigationProvider>
          </EditorViewProvider>
        </GraphWorkspaceHost>
      </GraphWorkspaceProvider>
    </ProjectProvider>
  );
}
