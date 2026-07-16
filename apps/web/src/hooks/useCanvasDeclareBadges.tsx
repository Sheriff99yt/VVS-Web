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
  hasImplementNodeForFunction,
  findImplementNodeForFunction,
  insertClassDefineNode,
  insertDefineNodeForEvent,
  insertDefineNodeForFunction,
  insertDefineNodeForVariable,
} from '@/lib/defineNodeSync';
import { classGraphTabId, classHomeGraphId, symbolClassId } from '@/lib/classScope';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { SPAWN_EVENT_NODE_EVENT, SPAWN_FUNCTION_IMPLEMENT_EVENT } from '@/components/layout/GraphFloatingDetails';
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
  activeGraphTab: string;
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
    activeGraphTab,
  } = input;

  const focusOrInsertClassDeclare = useCallback(
    (cls: ClassSymbol, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!documents || isReferenceMode) return;

      editorFocus.focusClass(cls);

      if (hasDefineNodeForClass(documents, cls)) {
        const target = findClassDefineNode(documents, cls);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      const next = insertClassDefineNode(documents, cls, activeGraphTab);
      patchAllDocuments(() => next);
      // Determine where it actually spawned
      const target = findClassDefineNode(next, cls);
      if (target) {
        markTabDirty(target.tabId);
        setCompileState('dirty');
        dispatchNavigateToNode(target.tabId, target.nodeId);
      }
    },
    [documents, isReferenceMode, editorFocus, patchAllDocuments, markTabDirty, setCompileState, activeGraphTab]
  );

  const focusOrInsertVariableDeclare = useCallback(
    (variableId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!documents || isReferenceMode) return;
      const variable = variables.find((v) => v.id === variableId);
      const cls = variable ? classes.find((c) => c.id === symbolClassId(variable)) : undefined;
      if (!variable || !cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'variable', id: variableId });

      if (hasDefineNodeForVariable(documents, cls, variableId)) {
        const target = findMemberDeclareNodeForSymbol(documents, cls, 'variable', variableId);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      const next = insertDefineNodeForVariable(documents, cls, variable, activeGraphTab);
      patchAllDocuments(() => next);
      const target = findMemberDeclareNodeForSymbol(next, cls, 'variable', variableId);
      if (target) {
        markTabDirty(target.tabId);
        setCompileState('dirty');
        dispatchNavigateToNode(target.tabId, target.nodeId);
      }
    },
    [documents, isReferenceMode, variables, classes, editorFocus, patchAllDocuments, markTabDirty, setCompileState, activeGraphTab]
  );

  const focusOrInsertFunctionDeclare = useCallback(
    (func: FunctionSymbol, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!documents || isReferenceMode) return;
      const cls = classes.find((c) => c.id === symbolClassId(func));
      if (!cls) return;

      // Stay on the class home graph — never open the function body from the tree.
      editorFocus.focusTreeSymbolOnClass(cls, { type: 'function', id: func.id });

      if (hasDefineNodeForFunction(documents, cls, func.id)) {
        const target = findMemberDeclareNodeForSymbol(documents, cls, 'function', func.id);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      const next = insertDefineNodeForFunction(documents, cls, func, activeGraphTab);
      patchAllDocuments(() => next);
      const target = findMemberDeclareNodeForSymbol(next, cls, 'function', func.id);
      if (target) {
        markTabDirty(target.tabId);
        setCompileState('dirty');
        dispatchNavigateToNode(target.tabId, target.nodeId);
      }
    },
    [documents, isReferenceMode, classes, editorFocus, patchAllDocuments, markTabDirty, setCompileState, activeGraphTab]
  );

  const focusOrInsertEventDeclare = useCallback(
    (eventId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
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

      const next = insertDefineNodeForEvent(documents, cls, event, activeGraphTab);
      patchAllDocuments(() => next);
      const target = findMemberDeclareNodeForSymbol(next, cls, 'event', eventId);
      if (target) {
        markTabDirty(target.tabId);
        setCompileState('dirty');
        dispatchNavigateToNode(target.tabId, target.nodeId);
      }
    },
    [documents, isReferenceMode, events, classes, editorFocus, patchAllDocuments, markTabDirty, setCompileState, activeGraphTab]
  );

  const focusOrInsertEventHandler = useCallback(
    (eventId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
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

  const renderClassCanvasStatus = (
    cls: ClassSymbol,
    rowSelected = false,
    onlyErrors = false,
    onlySuccess = false,
    variant: 'chip' | 'pip' = 'chip'
  ) => {
    if (!documents || isReferenceMode) return null;
    const declared = hasDefineNodeForClass(documents, cls);
    if (onlyErrors && declared) return null;
    if (onlySuccess && !declared) return null;
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        emphasize={rowSelected && !declared}
        variant={variant}
        onClick={(e) => focusOrInsertClassDeclare(cls, e)}
      />
    );
  };

  const renderVariableCanvasStatus = (
    variableId: string,
    rowSelected = false,
    onlyErrors = false,
    onlySuccess = false,
    variant: 'chip' | 'pip' = 'chip'
  ) => {
    if (!documents || isReferenceMode || !activeClass) return null;
    const declared = hasDefineNodeForVariable(documents, activeClass, variableId);
    if (onlyErrors && declared) return null;
    if (onlySuccess && !declared) return null;
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        emphasize={rowSelected && !declared}
        variant={variant}
        onClick={(e) => focusOrInsertVariableDeclare(variableId, e)}
      />
    );
  };

  const renderFunctionCanvasStatus = (
    func: FunctionSymbol,
    rowSelected = false,
    onlyErrors = false,
    onlySuccess = false,
    variant: 'chip' | 'pip' = 'chip'
  ) => {
    if (!documents || isReferenceMode) return null;
    const cls = classes.find((c) => c.id === symbolClassId(func));
    if (!cls) return null;
    const declared = hasDefineNodeForFunction(documents, cls, func.id);
    const hasDefine = hasImplementNodeForFunction(documents, func.id);

    if (onlyErrors && declared && hasDefine) return null;
    if (onlySuccess && !declared && !hasDefine) return null;

    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {(!onlyErrors || !declared) && (!onlySuccess || declared) ? (
          <CanvasStatusBadge
            label="Declare"
            ok={declared}
            emphasize={rowSelected && !declared}
            variant={variant}
            onClick={(e) => focusOrInsertFunctionDeclare(func, e)}
          />
        ) : null}
        {(!onlyErrors || !hasDefine) && (!onlySuccess || hasDefine) ? (
          <CanvasStatusBadge
            label="Define"
            ok={hasDefine}
            emphasize={rowSelected && !hasDefine}
            variant={variant}
            onClick={(e) => focusOrInsertFunctionDefine(func, e)}
          />
        ) : null}
      </div>
    );
  };

  const focusOrInsertFunctionDefine = useCallback(
    (func: FunctionSymbol, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!documents || isReferenceMode) return;
      const cls = classes.find((c) => c.id === symbolClassId(func));
      if (!cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'function', id: func.id });

      if (hasImplementNodeForFunction(documents, func.id)) {
        const target = findImplementNodeForFunction(documents, func.id);
        if (target) dispatchNavigateToNode(target.tabId, target.nodeId);
        return;
      }

      window.dispatchEvent(
        new CustomEvent(SPAWN_FUNCTION_IMPLEMENT_EVENT, {
          detail: { functionId: func.id },
        })
      );
    },
    [documents, isReferenceMode, classes, editorFocus]
  );

  const renderEventCanvasStatus = (
    eventId: string,
    rowSelected = false,
    onlyErrors = false,
    onlySuccess = false,
    variant: 'chip' | 'pip' = 'chip'
  ) => {
    if (!documents || isReferenceMode) return null;
    const event = events.find((item) => item.id === eventId);
    const cls = event ? classes.find((c) => c.id === symbolClassId(event)) : undefined;
    if (!event || !cls) return null;
    const declared = hasDefineNodeForEvent(documents, cls, eventId);
    const hasHandler = hasHandlerNodeForEvent(documents, eventId);
    
    if (onlyErrors && declared && hasHandler) return null;
    if (onlySuccess && !declared && !hasHandler) return null;

    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {(!onlyErrors || !declared) && (!onlySuccess || declared) ? (
          <CanvasStatusBadge
            label="Declare"
            ok={declared}
            emphasize={rowSelected && !declared}
            variant={variant}
            onClick={(e) => focusOrInsertEventDeclare(eventId, e)}
          />
        ) : null}
        {(!onlyErrors || !hasHandler) && (!onlySuccess || hasHandler) ? (
          <CanvasStatusBadge
            label="Handler"
            ok={hasHandler}
            emphasize={rowSelected && !hasHandler}
            variant={variant}
            onClick={(e) => focusOrInsertEventHandler(eventId, e)}
          />
        ) : null}
      </div>
    );
  };

  return {
    renderClassCanvasStatus,
    renderVariableCanvasStatus,
    renderFunctionCanvasStatus,
    renderEventCanvasStatus,
    focusOrInsertClassDeclare,
    focusOrInsertVariableDeclare,
    focusOrInsertFunctionDeclare,
    focusOrInsertFunctionDefine,
    focusOrInsertEventDeclare,
    focusOrInsertEventHandler,
  };
}
