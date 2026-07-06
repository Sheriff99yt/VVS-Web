'use client';

import { useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import {
  containerTabFor,
  createGraphContainer,
  MAIN_GRAPH_CONTAINER_ID,
  type GraphContainer,
} from '@vvs/graph-types';
import { classContainerId } from '@/lib/classScope';

export function useGraphContainerLifecycle() {
  const {
    graphContainers,
    setGraphContainers,
    classes,
    setClasses,
    setOpenTabs,
    activeGraphTab,
    setActiveGraphTab,
    setSelection,
  } = useProject();
  const { patchAllDocuments } = useGraphWorkspace();
  const { navigate } = useEditorNavigation();

  const createContainer = useCallback(
    (name?: string) => {
      const container = createGraphContainer(name ?? 'New graph');
      setGraphContainers((list) => [...list, container]);
      patchAllDocuments((docs) => ({
        ...docs,
        [container.id]: { nodes: [], edges: [] },
      }));
      setOpenTabs((prev) => {
        if (prev.some((tab) => tab.id === container.id)) return prev;
        return [...prev, containerTabFor(container)];
      });
      setActiveGraphTab(container.id);
      setSelection({ type: 'graph', id: container.id });
      navigate({
        graphTab: container.id,
        editorView: 'canvas',
        selection: { type: 'graph', id: container.id },
      });
      return container;
    },
    [
      navigate,
      patchAllDocuments,
      setActiveGraphTab,
      setGraphContainers,
      setOpenTabs,
      setSelection,
    ]
  );

  const deleteContainer = useCallback(
    (containerId: string) => {
      if (containerId === MAIN_GRAPH_CONTAINER_ID) return;

      setClasses((list) =>
        list.map((cls) =>
          classContainerId(cls) === containerId
            ? { ...cls, containerId: MAIN_GRAPH_CONTAINER_ID }
            : cls
        )
      );
      setGraphContainers((list) => list.filter((c) => c.id !== containerId));
      setOpenTabs((prev) => prev.filter((tab) => tab.id !== containerId));
      patchAllDocuments((docs) => {
        const next = { ...docs };
        delete next[containerId];
        return next;
      });
      if (activeGraphTab === containerId) {
        setActiveGraphTab(MAIN_GRAPH_CONTAINER_ID);
        navigate({
          graphTab: MAIN_GRAPH_CONTAINER_ID,
          editorView: 'canvas',
          selection: { type: 'graph', id: MAIN_GRAPH_CONTAINER_ID },
        });
      }
    },
    [
      activeGraphTab,
      navigate,
      patchAllDocuments,
      setActiveGraphTab,
      setClasses,
      setGraphContainers,
      setOpenTabs,
    ]
  );

  const renameContainer = useCallback(
    (containerId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed || containerId === MAIN_GRAPH_CONTAINER_ID) return;
      setGraphContainers((list) =>
        list.map((container) =>
          container.id === containerId ? { ...container, name: trimmed } : container
        )
      );
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.id === containerId && tab.type === 'container'
            ? { ...tab, name: trimmed }
            : tab
        )
      );
    },
    [setGraphContainers, setOpenTabs]
  );

  const canDeleteContainer = useCallback(
    (container: GraphContainer) => container.id !== MAIN_GRAPH_CONTAINER_ID,
    []
  );

  const canRenameContainer = useCallback(
    (container: GraphContainer) => container.id !== MAIN_GRAPH_CONTAINER_ID,
    []
  );

  const reorderGraphContainers = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      setGraphContainers((list) => {
        const fromIndex = list.findIndex((c) => c.id === fromId);
        const toIndex = list.findIndex((c) => c.id === toId);
        if (fromIndex < 0 || toIndex < 0) return list;
        const next = [...list];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [setGraphContainers]
  );

  return {
    createContainer,
    deleteContainer,
    renameContainer,
    reorderGraphContainers,
    canDeleteContainer,
    canRenameContainer,
  };
}
