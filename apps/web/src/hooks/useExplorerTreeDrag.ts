'use client';

import { useCallback, useState } from 'react';
import type { ClassSymbol, GraphContainer } from '@vvs/graph-types';
import { classDragPayload, isClassFolderDragEvent, readClassIdFromFolderDragEvent } from '@/lib/classHelpers';
import {
  clearTreeReorderDrag,
  configureCanvasDrag,
  configureTreeReorderDrag,
  graphContainerDragPayload,
  isTreeReorderDrag,
  parseGraphContainerDragPayload,
  readTreeReorderId,
  TREE_DRAG_MIME,
} from '@/lib/treeDrag';
import { peekSymbolReorder } from '@/lib/symbolReorderSession';

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
  const [draggingVariableId, setDraggingVariableId] = useState<string | null>(null);
  const [dropVariableId, setDropVariableId] = useState<string | null>(null);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [dropEventId, setDropEventId] = useState<string | null>(null);
  const [dropClassId, setDropClassId] = useState<string | null>(null);

  const handleClassDragStart = useCallback((e: React.DragEvent, cls: ClassSymbol) => {
    // Reorder primary; folder mime so drop on a graph folder still reassigns output.
    configureTreeReorderDrag(e, TREE_DRAG_MIME.classReorder, cls.id, {
      effectAllowed: 'copyMove',
      extraData: { [TREE_DRAG_MIME.classFolder]: classDragPayload(cls) },
    });
    // Defer React UI state: sync setState (opacity / strip) mid-dragstart cancels HTML5 DnD in Chromium.
    const id = cls.id;
    requestAnimationFrame(() => setDraggingClassId(id));
  }, []);

  const handleClassDragEnd = useCallback(() => {
    clearTreeReorderDrag();
    setDraggingClassId(null);
    setDropContainerId(null);
    setDropClassId(null);
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
      clearTreeReorderDrag();
      setDraggingClassId(null);
      setDropContainerId(null);
      setDropClassId(null);
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
    clearTreeReorderDrag();
    setDraggingFunctionId(null);
    setDropFunctionId(null);
  }, []);

  const handleVariableDragStart = useCallback((e: React.DragEvent, variableId: string) => {
    configureTreeReorderDrag(e, TREE_DRAG_MIME.variableReorder, variableId);
    setDraggingVariableId(variableId);
  }, []);

  const handleVariableDragEnd = useCallback(() => {
    clearTreeReorderDrag();
    setDraggingVariableId(null);
    setDropVariableId(null);
  }, []);

  const handleEventDragStart = useCallback((e: React.DragEvent, eventId: string) => {
    configureTreeReorderDrag(e, TREE_DRAG_MIME.eventReorder, eventId);
    setDraggingEventId(eventId);
  }, []);

  const handleEventDragEnd = useCallback(() => {
    clearTreeReorderDrag();
    setDraggingEventId(null);
    setDropEventId(null);
  }, []);

  const clearContainerDropHint = useCallback((containerId: string) => {
    setDropContainerId((id) => (id === containerId ? null : id));
    setDropGraphContainerId((id) => (id === containerId ? null : id));
  }, []);

  return {
    draggingClassId,
    dropContainerId,
    dropClassId,
    setDropClassId,
    draggingGraphContainerId,
    dropGraphContainerId,
    draggingFunctionId,
    setDraggingFunctionId,
    dropFunctionId,
    setDropFunctionId,
    draggingVariableId,
    setDraggingVariableId,
    dropVariableId,
    setDropVariableId,
    draggingEventId,
    setDraggingEventId,
    dropEventId,
    setDropEventId,
    handleClassDragStart,
    handleClassDragEnd,
    handleContainerDragOver,
    handleContainerDrop,
    handleGraphContainerDragStart,
    handleGraphContainerDragEnd,
    handleFunctionDragStart,
    handleFunctionDragEnd,
    handleVariableDragStart,
    handleVariableDragEnd,
    handleEventDragStart,
    handleEventDragEnd,
    clearContainerDropHint,
  };
}

/** Shared drop-target handlers for in-list / grid symbol reorder. */
export function useListReorderDrop(input: {
  canReorder: boolean;
  mimeType: string;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  dropId: string | null;
  setDropId: (id: string | null) => void;
  onReorder: (fromId: string, toId: string) => void;
}) {
  const { canReorder, mimeType, draggingId, setDraggingId, setDropId, onReorder } = input;

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      if (!canReorder) return;
      if (!isTreeReorderDrag(e, mimeType, draggingId)) return;
      const fromId = peekSymbolReorder(mimeType) ?? draggingId;
      if (fromId === targetId) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDropId(targetId);
    },
    [canReorder, draggingId, mimeType, setDropId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      if (!canReorder) return;
      e.preventDefault();
      e.stopPropagation();
      const fromId = readTreeReorderId(e, mimeType, draggingId);
      clearTreeReorderDrag();
      if (!fromId || fromId === targetId) {
        setDraggingId(null);
        setDropId(null);
        return;
      }
      onReorder(fromId, targetId);
      setDraggingId(null);
      setDropId(null);
    },
    [canReorder, mimeType, draggingId, onReorder, setDraggingId, setDropId]
  );

  const handleDragLeave = useCallback(
    (targetId: string) => {
      if (input.dropId === targetId) setDropId(null);
    },
    [input.dropId, setDropId]
  );

  return {
    handleDragOver,
    handleDrop,
    handleDragLeave,
  };
}

/** @deprecated Use useListReorderDrop */
export function useFunctionReorderDrop(input: {
  canReorder: boolean;
  draggingFunctionId: string | null;
  setDraggingFunctionId: (id: string | null) => void;
  dropFunctionId: string | null;
  setDropFunctionId: (id: string | null) => void;
  reorderFunctions: (fromId: string, toId: string) => void;
}) {
  const handlers = useListReorderDrop({
    canReorder: input.canReorder,
    mimeType: TREE_DRAG_MIME.functionReorder,
    draggingId: input.draggingFunctionId,
    setDraggingId: input.setDraggingFunctionId,
    dropId: input.dropFunctionId,
    setDropId: input.setDropFunctionId,
    onReorder: input.reorderFunctions,
  });
  return {
    dropFunctionId: input.dropFunctionId,
    handleFunctionDragOver: handlers.handleDragOver,
    handleFunctionDrop: handlers.handleDrop,
    handleFunctionDragLeave: handlers.handleDragLeave,
  };
}
