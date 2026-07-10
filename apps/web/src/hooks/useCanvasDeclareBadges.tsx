'use client';

import React, { useCallback } from 'react';
import type { ClassSymbol, FunctionSymbol, ProjectEventDefinition, VariableSymbol } from '@vvs/graph-types';
import type { GraphDocument } from '@/lib/graphDefaults';
import {
  findClassDefineNode,
  findHandlerNodeForEvent,
  findMemberDeclareNodeForSymbol,
  hasDefineNodeForClass,
  hasDefineNodeForEvent,
  hasDefineNodeForFunction,
  hasDefineNodeForVariable,
  hasHandlerNodeForEvent,
  insertClassDefineNode,
  insertDefineNodeForEvent,
  insertDefineNodeForFunction,
  insertDefineNodeForVariable,
} from '@/lib/defineNodeSync';
import { classGraphTabId, classHomeGraphId, symbolClassId } from '@/lib/classScope';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { SPAWN_EVENT_NODE_EVENT } from '@/components/layout/GraphFloatingDetails';
import { CanvasStatusBadge } from '@/components/layout/project-tree/CanvasStatusBadge';
import type { useEditorFocus } from '@/hooks/useEditorFocus';

type EditorFocus = ReturnType<typeof useEditorFocus>;

export function useCanvasDeclareBadges(input: {
  documents: Record<string, GraphDocument> | null;
  isReferenceMode: boolean;
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  classes: ClassSymbol[];
  activeClass: ClassSymbol | undefined;
  editorFocus: EditorFocus;
  patchAllDocuments: (updater: (docs: Record<string, GraphDocument>) => Record<string, GraphDocument>) => void;
  markTabDirty: (tabId: string) => void;
  setCompileState: React.Dispatch<
    React.SetStateAction<'clean' | 'dirty' | 'compiling' | 'success' | 'error'>
  >;
}) {
  const {
    documents,
    isReferenceMode,
    variables,
    functions,
    events,
    classes,
    activeClass,
    editorFocus,
    patchAllDocuments,
    markTabDirty,
    setCompileState,
  } = input;

  const focusOrInsertClassDeclare = useCallback(
    (cls: ClassSymbol, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'class', id: cls.id });

      if (hasDefineNodeForClass(documents, cls)) {
        const target = findClassDefineNode(documents, cls);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      const next = insertClassDefineNode(documents, cls);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      const target = findClassDefineNode(next, cls);
      if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
    },
    [documents, isReferenceMode, editorFocus, patchAllDocuments, markTabDirty, setCompileState]
  );

  const focusOrInsertVariableDeclare = useCallback(
    (variableId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const variable = variables.find((v) => v.id === variableId);
      const cls = variable ? classes.find((c) => c.id === symbolClassId(variable)) : undefined;
      if (!variable || !cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'variable', id: variableId });

      if (hasDefineNodeForVariable(documents, cls, variableId)) {
        const tabId = classHomeGraphId(cls);
        const node = documents[tabId]?.nodes.find(
          (n) => n.data.kindId === 'var_define' && n.data.properties?.symbolId === variableId
        );
        if (node) dispatchNavigateToNode(tabId, node.id);
        return;
      }

      const next = insertDefineNodeForVariable(documents, cls, variable);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      const nextTabId = classHomeGraphId(cls);
      const nextNode = next[nextTabId]?.nodes.find(
        (n) => n.data.kindId === 'var_define' && n.data.properties?.symbolId === variableId
      );
      if (nextNode) dispatchNavigateToNode(nextTabId, nextNode.id);
    },
    [documents, isReferenceMode, variables, classes, editorFocus, patchAllDocuments, markTabDirty, setCompileState]
  );

  const focusOrInsertFunctionDeclare = useCallback(
    (func: FunctionSymbol, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const cls = classes.find((c) => c.id === symbolClassId(func));
      if (!cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'function', id: func.id });

      if (hasDefineNodeForFunction(documents, cls, func.id)) {
        const target = findMemberDeclareNodeForSymbol(documents, cls, 'function', func.id);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      const next = insertDefineNodeForFunction(documents, cls, func);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      const target = findMemberDeclareNodeForSymbol(next, cls, 'function', func.id);
      if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
    },
    [documents, isReferenceMode, classes, editorFocus, patchAllDocuments, markTabDirty, setCompileState]
  );

  const focusOrInsertEventDeclare = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const event = events.find((item) => item.id === eventId);
      const cls = event ? classes.find((c) => c.id === symbolClassId(event)) : undefined;
      if (!event || !cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'event', id: eventId });

      if (hasDefineNodeForEvent(documents, cls, eventId)) {
        const target = findMemberDeclareNodeForSymbol(documents, cls, 'event', eventId);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      const next = insertDefineNodeForEvent(documents, cls, event);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      const target = findMemberDeclareNodeForSymbol(next, cls, 'event', eventId);
      if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
    },
    [documents, isReferenceMode, events, classes, editorFocus, patchAllDocuments, markTabDirty, setCompileState]
  );

  const focusOrInsertEventHandler = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const event = events.find((item) => item.id === eventId);
      const cls = event ? classes.find((c) => c.id === symbolClassId(event)) : undefined;
      if (!event || !cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'event', id: eventId });

      if (hasHandlerNodeForEvent(documents, eventId)) {
        const target = findHandlerNodeForEvent(documents, eventId);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      window.dispatchEvent(
        new CustomEvent(SPAWN_EVENT_NODE_EVENT, {
          detail: { eventId, role: 'define' },
        })
      );
    },
    [documents, isReferenceMode, events, classes, editorFocus]
  );

  const renderClassCanvasStatus = (cls: ClassSymbol, rowSelected = false) => {
    if (!documents || isReferenceMode) return null;
    const declared = hasDefineNodeForClass(documents, cls);
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        emphasize={rowSelected && !declared}
        onClick={(e) => focusOrInsertClassDeclare(cls, e)}
      />
    );
  };

  const renderVariableCanvasStatus = (variableId: string, rowSelected = false) => {
    if (!documents || isReferenceMode || !activeClass) return null;
    const declared = hasDefineNodeForVariable(documents, activeClass, variableId);
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        emphasize={rowSelected && !declared}
        onClick={(e) => focusOrInsertVariableDeclare(variableId, e)}
      />
    );
  };

  const renderFunctionCanvasStatus = (func: FunctionSymbol, rowSelected = false) => {
    if (!documents || isReferenceMode) return null;
    const cls = classes.find((c) => c.id === symbolClassId(func));
    if (!cls) return null;
    const declared = hasDefineNodeForFunction(documents, cls, func.id);
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        emphasize={rowSelected && !declared}
        onClick={(e) => focusOrInsertFunctionDeclare(func, e)}
      />
    );
  };

  const renderEventCanvasStatus = (eventId: string, rowSelected = false) => {
    if (!documents || isReferenceMode) return null;
    const event = events.find((item) => item.id === eventId);
    const cls = event ? classes.find((c) => c.id === symbolClassId(event)) : undefined;
    if (!event || !cls) return null;
    const declared = hasDefineNodeForEvent(documents, cls, eventId);
    const hasHandler = hasHandlerNodeForEvent(documents, eventId);
    return (
      <div className="flex items-center gap-0.5 shrink-0">
        <CanvasStatusBadge
          label="Declare"
          ok={declared}
          emphasize={rowSelected && !declared}
          onClick={(e) => focusOrInsertEventDeclare(eventId, e)}
        />
        <CanvasStatusBadge
          label="Handler"
          ok={hasHandler}
          emphasize={rowSelected && !hasHandler}
          onClick={(e) => focusOrInsertEventHandler(eventId, e)}
        />
      </div>
    );
  };

  return {
    renderClassCanvasStatus,
    renderVariableCanvasStatus,
    renderFunctionCanvasStatus,
    renderEventCanvasStatus,
  };
}
