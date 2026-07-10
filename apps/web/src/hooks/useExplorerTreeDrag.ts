'use client';

import { useCallback, useState } from 'react';
import type { ClassSymbol, GraphContainer } from '@vvs/graph-types';
import { CLASS_DRAG_MIME, classDragPayload, isClassFolderDragEvent, readClassIdFromFolderDragEvent } from '@/lib/classHelpers';
import {
  configureCanvasDrag,
  configureClassFolderDrag,
  configureTreeReorderDrag,
  graphContainerDragPayload,
  parseGraphContainerDragPayload,
  TREE_DRAG_MIME,
} from '@/lib/treeDrag';

export function useExplorerTreeDrag(input: {
  moveClassToContainer: (classId: string, containerId: string) => void;
  reorderGraphContainers: (fromId: string, toId: string) => void;
  onClassMoved?: () => void;
}) {
  const { moveClassToContainer, reorderGraphContainers, onClassMoved } = input;

  const [draggingClassId, setDraggingClassId] = useState<string | null>(null);
  const [dropContainerId, setDropContainerId] = useState<string | null>(null);
  const [draggingGraphContainerId, setDraggingGraphContainerId] = useState<string | null>(null);
  const [dropGraphContainerId, setDropGraphContainerId] = useState<string | null>(null);
  const [draggingFunctionId, setDraggingFunctionId] = useState<string | null>(null);
  const [dropFunctionId, setDropFunctionId] = useState<string | null>(null);

  const handleClassDragStart = useCallback((e: React.DragEvent, cls: ClassSymbol) => {
    configureClassFolderDrag(e, classDragPayload(cls));
    setDraggingClassId(cls.id);
  }, []);

  const handleClassDragEnd = useCallback(() => {
    setDraggingClassId(null);
    setDropContainerId(null);
  }, []);

  const handleContainerDragOver = useCallback(
    (e: React.DragEvent, containerId: string) => {
      if (draggingGraphContainerId && draggingGraphContainerId !== containerId) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropGraphContainerId(containerId);
        return;
      }
      if (!draggingClassId && !isClassFolderDragEvent(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDropContainerId(containerId);
    },
    [draggingClassId, draggingGraphContainerId]
  );

  const handleContainerDrop = useCallback(
    (e: React.DragEvent, containerId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const containerPayload = parseGraphContainerDragPayload(
        e.dataTransfer.getData(TREE_DRAG_MIME.graphContainer)
      );
      if (containerPayload && draggingGraphContainerId) {
        reorderGraphContainers(draggingGraphContainerId, containerId);
        setDraggingGraphContainerId(null);
        setDropGraphContainerId(null);
        return;
      }

      const classId = readClassIdFromFolderDragEvent(e, draggingClassId);
      if (!classId) return;
      moveClassToContainer(classId, containerId);
      onClassMoved?.();
      setDraggingClassId(null);
      setDropContainerId(null);
    },
    [
      draggingClassId,
      draggingGraphContainerId,
      moveClassToContainer,
      onClassMoved,
      reorderGraphContainers,
    ]
  );

  const handleGraphContainerDragStart = useCallback(
    (e: React.DragEvent, container: GraphContainer) => {
      configureCanvasDrag(e, {
        mimeType: TREE_DRAG_MIME.graphContainer,
        payload: graphContainerDragPayload(container.id),
        effectAllowed: 'copyMove',
      });
      setDraggingGraphContainerId(container.id);
    },
    []
  );

  const handleGraphContainerDragEnd = useCallback(() => {
    setDraggingGraphContainerId(null);
    setDropGraphContainerId(null);
    setDropContainerId(null);
  }, []);

  const handleFunctionDragStart = useCallback((e: React.DragEvent, funcId: string) => {
    configureTreeReorderDrag(e, TREE_DRAG_MIME.functionReorder, funcId);
    setDraggingFunctionId(funcId);
  }, []);

  const handleFunctionDragEnd = useCallback(() => {
    setDraggingFunctionId(null);
    setDropFunctionId(null);
  }, []);

  const clearContainerDropHint = useCallback((containerId: string) => {
    setDropContainerId((id) => (id === containerId ? null : id));
    setDropGraphContainerId((id) => (id === containerId ? null : id));
  }, []);

  return {
    draggingClassId,
    dropContainerId,
    draggingGraphContainerId,
    dropGraphContainerId,
    draggingFunctionId,
    setDraggingFunctionId,
    dropFunctionId,
    setDropFunctionId,
    handleClassDragStart,
    handleClassDragEnd,
    handleContainerDragOver,
    handleContainerDrop,
    handleGraphContainerDragStart,
    handleGraphContainerDragEnd,
    handleFunctionDragStart,
    handleFunctionDragEnd,
    clearContainerDropHint,
  };
}

export function useFunctionReorderDrop(input: {
  canReorder: boolean;
  draggingFunctionId: string | null;
  setDraggingFunctionId: (id: string | null) => void;
  dropFunctionId: string | null;
  setDropFunctionId: (id: string | null) => void;
  reorderFunctions: (fromId: string, toId: string) => void;
}) {
  const {
    canReorder,
    draggingFunctionId,
    setDraggingFunctionId,
    dropFunctionId,
    setDropFunctionId,
    reorderFunctions,
  } = input;

  const handleFunctionDragOver = useCallback(
    (e: React.DragEvent, funcId: string) => {
      if (!canReorder || !draggingFunctionId || draggingFunctionId === funcId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropFunctionId(funcId);
    },
    [canReorder, draggingFunctionId, setDropFunctionId]
  );

  const handleFunctionDrop = useCallback(
    (e: React.DragEvent, funcId: string) => {
      if (!canReorder) return;
      e.preventDefault();
      e.stopPropagation();
      const fromId =
        e.dataTransfer.getData(TREE_DRAG_MIME.functionReorder) || draggingFunctionId;
      if (!fromId || fromId === funcId) return;
      reorderFunctions(fromId, funcId);
      setDraggingFunctionId(null);
      setDropFunctionId(null);
    },
    [canReorder, draggingFunctionId, reorderFunctions, setDraggingFunctionId, setDropFunctionId]
  );

  return {
    dropFunctionId,
    handleFunctionDragOver,
    handleFunctionDrop,
  };
}
