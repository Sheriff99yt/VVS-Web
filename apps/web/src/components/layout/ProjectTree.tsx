'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Variable,
  PlaySquare,
  GitBranch,
  Radio,
  Boxes,
  FolderOutput,
  PenLine,
} from 'lucide-react';
import type { FunctionBinding, FunctionSymbol, ClassSymbol, GraphContainer, VariableSymbol } from '@vvs/graph-types';
import { createVariableSymbol, resolveNodeKindId } from '@vvs/graph-types';
import { useProject, type TreeSymbolSelectionKey } from '@/contexts/ProjectContext';
import {
  createFunctionSymbol,
  appendFunctionOverload,
  reorderFunctionSymbols,
  overloadTreeLabel,
} from '@/lib/functionTabs';
import {
  FUNCTION_OVERLOAD_DRAG_MIME,
  type FunctionOverloadDragPayload,
  commitFunctionSymbolUpdate,
} from '@/lib/functionHelpers';
import { defaultValueForVariableType, VariableType } from '@/lib/variableDefaults';
import {
  isBindingCoaAllowed,
  isDataTypeCoaAllowed,
} from '@/lib/variableCoaUi';
import {
  applyPickerValueToVariableFields,
  buildTypePickerOptions,
} from '@/lib/typePickerOptions';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Tooltip } from '@/components/ui/Tooltip';
import type { VariableBinding } from '@/types/graph';
import { findGraphIdsUsingVariable } from '@/lib/graphRelations';
import { useEditorFocus } from '@/hooks/useEditorFocus';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { createEventId, EVENT_DRAG_MIME, type EventDragPayload } from '@/lib/eventHelpers';
import { getLinkedEnvironmentManifest } from '@/lib/environmentContext';
import { resolveApiSurface } from '@vvs/environment-templates';
import { SymbolDeleteDialog } from '@/components/layout/SymbolDeleteDialog';
import {
  SPAWN_EVENT_NODE_EVENT,
  SPAWN_FUNCTION_CALL_EVENT,
} from '@/components/layout/GraphFloatingDetails';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { useClassLifecycle } from '@/hooks/useClassLifecycle';
import { useGraphContainerLifecycle } from '@/hooks/useGraphContainerLifecycle';
import { useExplorerPanelState } from '@/hooks/useExplorerPanelState';
import { useExplorerTreeDrag, useListReorderDrop } from '@/hooks/useExplorerTreeDrag';
import { useCanvasDeclareBadges } from '@/hooks/useCanvasDeclareBadges';
import { CLASS_DRAG_MIME, classDragPayload } from '@/lib/classHelpers';
import {
  classGraphTabId,
  classContainerId,
  classScopedSymbols,
  symbolClassId,
} from '@/lib/classScope';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { getSymbolDisplayName } from '@/lib/symbolLifecycle';
import { dispatchFocusGraphNodeSearch } from '@/lib/uiPreferences';
import { shortcutKeys } from '@/lib/graphShortcuts';
import { hasDefineNodeForClass, insertClassDefineNode } from '@/lib/defineNodeSync';
import type { SymbolRefKind } from '@vvs/graph-types';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { reorderById } from '@/lib/symbolOrder';
import { TREE_DRAG_MIME } from '@/lib/treeDrag';
import { TreeRow } from './project-tree/TreeRow';
import { CategorySection } from './project-tree/CategorySection';
import { PanelFilter } from './project-tree/PanelFilter';
import { ExplorerTabs } from './project-tree/ExplorerTabs';
import {
  INDENT,
  type ProjectTreeMode,
} from './project-tree/constants';
export type { ProjectTreeMode } from './project-tree/constants';
import { CodegenSuffix } from './project-tree/CodegenSuffix';
import { SymbolCreatePopover } from './project-tree/SymbolCreatePopover';
import { ProjectFilesExplorer } from './project-tree/ProjectFilesExplorer';
import { GraphFoldersSection } from './project-tree/GraphFoldersSection';
import { EventDispatchChip } from './project-tree/EventDispatchChip';
import { EnvironmentApiSection } from './project-tree/EnvironmentApiSection';
import { VariableRow } from './project-tree/VariableRow';
import { ExplorerEmptyHint } from './project-tree/ExplorerEmptyHint';
import { SectionPopoverAnchor } from './project-tree/SectionPopoverAnchor';
import { TreeRenameRow } from './project-tree/TreeRenameRow';
import { SymbolMenuItem } from './project-tree/SymbolMenuItem';
import {
  ExplorerPanelShell,
  ExplorerScrollRegion,
  ExplorerToolbarRow,
} from './project-tree/ExplorerPanelShell';
import {
  bindingChipClass,
  explorerBtnCompactCancelClass,
  explorerBtnPrimaryClass,
  explorerBtnSecondaryClass,
  explorerInputClass,
  explorerLabelClass,
  explorerRowActionClass,
  explorerRowDeleteClass,
  explorerSelectClass,
} from './project-tree/explorerStyles';
import { countMissingDeclaresForClass } from './project-tree/canvasDeclareStatus';
import { countSymbolCategoryIssues } from './project-tree/symbolCategoryIssues';
import { graphContainerLabel } from './project-tree/graphContainerLabels';
import {
  eventRowMeta,
  getVariableColor,
} from './project-tree/explorerUtils';
import { useProjectFolderPaths } from '@/hooks/useProjectFolderPaths';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';

export interface ProjectTreeProps {
  /** Canvas: edit selection only. References: drives the reference graph focus. */
  mode?: ProjectTreeMode;
}

export function ProjectTree({ mode = 'canvas' }: ProjectTreeProps) {
  const isReferenceMode = mode === 'references';
  const {
    variables,
    setVariables,
    events,
    setEvents,
    functions,
    setFunctions,
    classes,
    setClasses,
    graphContainers,
    activeClassId,
    setActiveClassId,
    setSelection,
    selection,
    selectedTreeSymbols,
    setSelectedTreeSymbols,
    selectedNodeIds,
    setOpenTabs,
    activeGraphTab,
    projectDetails,
    targetLanguage,
    targetFileExtensions,
    crossOverMode,
    openTabs,
    isTabDirty,
    focusReference,
    referenceVariableName,
    environmentId,
    environmentVersion,
    markTabDirty,
    setCompileState,
  } = useProject();

  const editorFocus = useEditorFocus();
  const documents = useGraphDocuments();
  const projectFolderPaths = useProjectFolderPaths();
  const { fileOwners } = useProjectTranspileResult();
  const projectFolderPathKinds = useMemo(
    () => new Map(projectFolderPaths.map((entry) => [entry.path, entry.kind])),
    [projectFolderPaths]
  );
  const { patchAllDocuments } = useGraphWorkspace();
  const { deleteSymbol, getUsageSummary, addVariableWithDefine, addFunctionWithDefine, addEventWithDefine, addClassWithDefine, duplicateVariable, duplicateFunction, duplicateEvent } =
    useSymbolLifecycle();
  const { renameClass, deleteClass, canDeleteClass, moveClassToContainer } =
    useClassLifecycle();
  const {
    createContainer,
    deleteContainer,
    renameContainer,
    reorderGraphContainers,
    canDeleteContainer,
    canRenameContainer,
  } = useGraphContainerLifecycle();

  const scopedSymbols = useMemo(
    () => classScopedSymbols(activeClassId, { variables, functions, events }),
    [activeClassId, variables, functions, events]
  );
  const classVariables = useMemo(
    () => scopedSymbols.variables.filter((v) => !v.graphTabId && !v.scopedNodeId),
    [scopedSymbols.variables]
  );
  const classFunctions = scopedSymbols.functions;
  const classEvents = scopedSymbols.events;

  const activeClass = useMemo(
    () => classes.find((cls) => cls.id === activeClassId),
    [classes, activeClassId]
  );

  const activeClassMissingDeclares = useMemo(() => {
    if (!activeClass || isReferenceMode) return 0;
    return countMissingDeclaresForClass(
      documents,
      activeClass,
      variables,
      functions,
      events
    );
  }, [activeClass, documents, variables, functions, events, isReferenceMode]);

  const symbolCategoryIssues = useMemo(
    () =>
      isReferenceMode
        ? { classes: 0, functions: 0, events: 0, variables: 0 }
        : countSymbolCategoryIssues(
            documents,
            activeClass,
            classes,
            classFunctions,
            classEvents,
            classVariables
          ),
    [
      documents,
      isReferenceMode,
      activeClass,
      classes,
      classFunctions,
      classEvents,
      classVariables,
    ]
  );

  const [pendingDelete, setPendingDelete] = useState<{
    items: Array<{ kind: SymbolRefKind; symbolId: string; symbolName: string }>;
  } | null>(null);

  type SymbolMultiKey = TreeSymbolSelectionKey;
  const selectedSymbols = selectedTreeSymbols;
  const setSelectedSymbols = setSelectedTreeSymbols;
  const [symbolMenu, setSymbolMenu] = useState<{
    x: number;
    y: number;
    targets: SymbolMultiKey[];
  } | null>(null);
  const symbolMenuRef = useRef<HTMLDivElement>(null);

  const [newContainerName, setNewContainerName] = useState('');
  const [renamingContainerId, setRenamingContainerId] = useState<string | null>(null);
  const [renameContainerName, setRenameContainerName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassContainerId, setNewClassContainerId] = useState(MAIN_GRAPH_CONTAINER_ID);
  const [renamingClassId, setRenamingClassId] = useState<string | null>(null);
  const [renameClassName, setRenameClassName] = useState('');
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<string>('data_string');
  const [newVarBinding, setNewVarBinding] = useState<VariableBinding>('instance');

  const typePickerOptions = useMemo(
    () =>
      buildTypePickerOptions({
        documents: documents ?? {},
        classes,
        includeClasses: true,
        includeContainers: true,
        formatBuiltinLabel: (id, label) =>
          `${label}${!isDataTypeCoaAllowed(id as VariableType, crossOverMode) ? ' (COA)' : ''}`,
      }),
    [documents, classes, crossOverMode]
  );

  const activeScope = useMemo(() => {
    if (isReferenceMode) return null;
    const activeFunc = functions.find(
      (f) => f.id === activeGraphTab || f.overloads.some((o) => o.graphTabId === activeGraphTab)
    );
    if (activeFunc) {
      return { id: activeGraphTab, name: activeFunc.name, type: 'function' as const };
    }
    if (selection.type === 'node' && selection.id) {
      // Intentionally removed block-scope detection. 
      // Local variables are now strictly limited to Functions to enforce 
      // pure visual scripting flow (output pins) for block constructs.
    }
    return null;
  }, [isReferenceMode, activeGraphTab, functions, selection, documents]);

  const activeScopeVariables = useMemo(() => {
    if (!activeScope) return [];
    return variables.filter((v) =>
      activeScope.type === 'function'
        ? v.graphTabId === activeScope.id
        : v.scopedNodeId === activeScope.id
    );
  }, [activeScope, variables]);

  const [isAddingLocalVariable, setIsAddingLocalVariable] = useState(false);
  const [newLocalVarName, setNewLocalVarName] = useState('');
  const [newLocalVarType, setNewLocalVarType] = useState<string>('data_string');

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [isAddingFunction, setIsAddingFunction] = useState(false);
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncBinding, setNewFuncBinding] = useState<FunctionBinding>('instance');
  const [addingOverloadForId, setAddingOverloadForId] = useState<string | null>(null);

  const [renamingFunctionId, setRenamingFunctionId] = useState<string | null>(null);
  const [renameFunctionName, setRenameFunctionName] = useState('');
  const [renamingEventId, setRenamingEventId] = useState<string | null>(null);
  const [renameEventName, setRenameEventName] = useState('');
  const [renamingVariableId, setRenamingVariableId] = useState<string | null>(null);
  const [renameVariableName, setRenameVariableName] = useState('');

  const { renameFunction, renameEvent, renameVariable } = useSymbolLifecycle();

  const handleSaveFunctionRename = (func: FunctionSymbol) => {
    const name = renameFunctionName.trim();
    if (name && name !== func.name) {
      renameFunction({ ...func, name });
    }
    setRenamingFunctionId(null);
  };

  const handleSaveEventRename = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const name = renameEventName.trim();
    if (name && name !== event.name) {
      renameEvent({ ...event, name });
    }
    setRenamingEventId(null);
  };

  const handleSaveVariableRename = (variable: VariableSymbol) => {
    const name = renameVariableName.trim();
    if (name && name !== variable.name) {
      renameVariable({ ...variable, name });
    }
    setRenamingVariableId(null);
  };

  const environmentManifest = useMemo(
    () => getLinkedEnvironmentManifest(environmentId),
    [environmentId]
  );
  const environmentSurface = useMemo(
    () =>
      environmentManifest ? resolveApiSurface(environmentManifest, targetLanguage) : null,
    [environmentManifest, targetLanguage]
  );

  const showApiTab = Boolean(environmentSurface && environmentManifest);

  const {
    filterQuery,
    setFilterQuery,
    q,
    explorerTab,
    setExplorerTab,
    panelTab,
    foldersExpanded,
    setFoldersExpanded,
    sectionViewModes,
    setSectionView,
    expanded,
    setExpanded,
    toggleCategory,
    isAddingContainer,
    setIsAddingContainer,
    filteredClasses,
    filteredFunctions,
    filteredVariables,
    filteredEvents,
    visibleGraphContainers,
    filteredProjectFileCount,
    showGraphFoldersSection,
    showClassesSection,
    showFunctionsSection,
    showEventsSection,
    showVariablesSection,
  } = useExplorerPanelState({
    classes,
    classFunctions,
    classVariables,
    classEvents,
    graphContainers,
    documents,
    projectFolderPaths,
    showApiTab,
    selection,
    isAdding: {
      class: isAddingClass,
      function: isAddingFunction,
      event: isAddingEvent,
      variable: isAddingVariable,
    },
  });

  const filteredLocalVariables = useMemo(() => {
    if (!q) return activeScopeVariables;
    const lower = q.toLowerCase();
    return activeScopeVariables.filter((v) => v.name.toLowerCase().includes(lower));
  }, [activeScopeVariables, q]);

  const treeDrag = useExplorerTreeDrag({
    moveClassToContainer,
    reorderGraphContainers,
    onClassMoved: () => setFoldersExpanded(true),
  });

  const {
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
  } = treeDrag;

  const canReorderSymbols = !q && !isReferenceMode;

  const {
    handleDragOver: handleFunctionDragOver,
    handleDrop: handleFunctionDrop,
    handleDragLeave: handleFunctionDragLeave,
  } = useListReorderDrop({
    canReorder: canReorderSymbols,
    mimeType: TREE_DRAG_MIME.functionReorder,
    draggingId: draggingFunctionId,
    setDraggingId: setDraggingFunctionId,
    dropId: dropFunctionId,
    setDropId: setDropFunctionId,
    onReorder: (fromId, toId) => setFunctions((prev) => reorderFunctionSymbols(prev, fromId, toId)),
  });

  const {
    handleDragOver: handleVariableDragOver,
    handleDrop: handleVariableDrop,
    handleDragLeave: handleVariableDragLeave,
  } = useListReorderDrop({
    canReorder: canReorderSymbols,
    mimeType: TREE_DRAG_MIME.variableReorder,
    draggingId: draggingVariableId,
    setDraggingId: setDraggingVariableId,
    dropId: dropVariableId,
    setDropId: setDropVariableId,
    onReorder: (fromId, toId) => setVariables((prev) => reorderById(prev, fromId, toId)),
  });

  const {
    handleDragOver: handleEventDragOver,
    handleDrop: handleEventDrop,
    handleDragLeave: handleEventDragLeave,
  } = useListReorderDrop({
    canReorder: canReorderSymbols,
    mimeType: TREE_DRAG_MIME.eventReorder,
    draggingId: draggingEventId,
    setDraggingId: setDraggingEventId,
    dropId: dropEventId,
    setDropId: setDropEventId,
    onReorder: (fromId, toId) => setEvents((prev) => reorderById(prev, fromId, toId)),
  });

  const {
    handleDragOver: handleClassReorderDragOver,
    handleDrop: handleClassReorderDrop,
    handleDragLeave: handleClassReorderDragLeave,
  } = useListReorderDrop({
    canReorder: canReorderSymbols,
    mimeType: TREE_DRAG_MIME.classReorder,
    draggingId: draggingClassId,
    setDraggingId: (id) => {
      if (id === null) handleClassDragEnd();
    },
    dropId: dropClassId,
    setDropId: setDropClassId,
    onReorder: (fromId, toId) => setClasses((prev) => reorderById(prev, fromId, toId)),
  });

  const {
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
  } = useCanvasDeclareBadges({
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
  });

  const projectCodegenDefaults = useMemo(
    () => ({ targetLanguage, targetFileExtensions }),
    [targetLanguage, targetFileExtensions]
  );

  const openGraph = useCallback(
    (graphId: string, type: 'main' | 'function' | 'class') => {
      if (type === 'main') {
        editorFocus.focusMainGraph();
      } else if (type === 'class') {
        editorFocus.focusClassGraphTab(graphId);
      } else {
        const func = functions.find((f) => f.id === graphId);
        if (func) {
          editorFocus.focusFunction(func, graphId);
        } else {
          editorFocus.focusFunctionGraphTab(graphId);
        }
      }
    },
    [editorFocus, functions]
  );

  const openClassGraph = useCallback(
    (cls: ClassSymbol) => {
      if (!documents) {
        editorFocus.focusClass(cls);
        return;
      }
      if (!hasDefineNodeForClass(documents, cls)) {
        patchAllDocuments((d) => insertClassDefineNode(d, cls, activeGraphTab));
      }
      editorFocus.focusClass(cls);
    },
    [editorFocus, documents, patchAllDocuments, activeGraphTab]
  );

  const revealClassGraphInTree = useCallback((_container?: GraphContainer) => {
    setFoldersExpanded(true);
  }, [setFoldersExpanded]);

  const openGraphContainer = useCallback(
    (container: GraphContainer) => {
      editorFocus.focusGraphContainer(container);
      revealClassGraphInTree(container);
    },
    [editorFocus, revealClassGraphInTree]
  );

  const handleSaveClass = () => {
    if (!newClassName.trim() || !newClassContainerId) return;
    addClassWithDefine(newClassName.trim(), newClassContainerId);
    setNewClassName('');
    setIsAddingClass(false);
    setFoldersExpanded(true);
    setExpanded((s) => ({ ...s, classes: true }));
  };

  const defaultClassContainerId = useCallback(() => {
    const active = classes.find((cls) => cls.id === activeClassId);
    if (active) return classContainerId(active);
    const emitContainer = graphContainers.find((c) => c.id !== MAIN_GRAPH_CONTAINER_ID);
    return emitContainer?.id ?? MAIN_GRAPH_CONTAINER_ID;
  }, [classes, activeClassId, graphContainers]);

  const handleSaveContainer = () => {
    if (!newContainerName.trim()) return;
    const container = createContainer(newContainerName.trim());
    setNewContainerName('');
    setIsAddingContainer(false);
    setFoldersExpanded(true);
  };

  const handleSaveContainerRename = (container: GraphContainer) => {
    const name = renameContainerName.trim();
    if (!name) return;
    renameContainer(container.id, name);
    setRenamingContainerId(null);
    setRenameContainerName('');
  };

  const handleSaveClassRename = (cls: ClassSymbol) => {
    const name = renameClassName.trim();
    if (!name) return;
    renameClass({ ...cls, name });
    setRenamingClassId(null);
    setRenameClassName('');
  };

  const classSymbolCounts = useCallback(
    (classId: string) => {
      const scoped = classScopedSymbols(classId, { variables, functions, events });
      return {
        functions: scoped.functions.length,
        variables: scoped.variables.length,
        events: scoped.events.length,
      };
    },
    [variables, functions, events]
  );

  const symbolKeyEquals = (a: SymbolMultiKey, b: SymbolMultiKey) =>
    a.kind === b.kind && a.id === b.id;

  const selectClass = useCallback(
    (cls: ClassSymbol, e?: React.MouseEvent) => {
      const key: SymbolMultiKey = { kind: 'class', id: cls.id };
      if (e && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedSymbols((prev) => {
          const exists = prev.some((s) => symbolKeyEquals(s, key));
          return exists ? prev.filter((s) => !symbolKeyEquals(s, key)) : [...prev, key];
        });
        setSelection({ type: 'class', id: cls.id });
      } else {
        setSelectedSymbols([key]);
        setSelection({ type: 'class', id: cls.id });
      }
      setActiveClassId(cls.id);
      setExpanded((s) => ({ ...s, classes: true }));
    },
    [setActiveClassId, setSelection, setSelectedSymbols]
  );

  const isSymbolMultiSelected = useCallback(
    (kind: SymbolMultiKey['kind'], id: string) =>
      selectedSymbols.some((s) => s.kind === kind && s.id === id),
    [selectedSymbols]
  );

  const selectFunction = useCallback(
    (func: FunctionSymbol, e?: React.MouseEvent) => {
      const key: SymbolMultiKey = { kind: 'function', id: func.id };
      if (e && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedSymbols((prev) => {
          const exists = prev.some((s) => symbolKeyEquals(s, key));
          return exists ? prev.filter((s) => !symbolKeyEquals(s, key)) : [...prev, key];
        });
        setSelection({ type: 'function', id: func.id });
      } else {
        setSelectedSymbols([key]);
        setSelection({ type: 'function', id: func.id });
      }
      const classId = symbolClassId(func);
      if (classId) setActiveClassId(classId);
      setExpanded((s) => ({ ...s, functions: true }));
    },
    [setActiveClassId, setSelection]
  );

  const openFunctionOverloadGraph = useCallback(
    (func: FunctionSymbol, overloadId: string) => {
      const tabId =
        func.overloads.find((o) => o.id === overloadId)?.graphTabId ?? func.id;
      editorFocus.focusFunction(func, tabId);
    },
    [editorFocus]
  );

  const handleAddOverload = useCallback(
    (funcId: string) => {
      const func = functions.find((f) => f.id === funcId);
      if (!func) return;
      const { func: next, graphTabId } = appendFunctionOverload(func);
      commitFunctionSymbolUpdate(next, setFunctions, setOpenTabs);
      setAddingOverloadForId(null);
      editorFocus.focusFunction(next, graphTabId);
    },
    [editorFocus, functions, setFunctions, setOpenTabs]
  );

  const selectGraphForReferences = useCallback(
    (graphId: string) => {
      focusReference(graphId, null);
      setSelection({ type: 'graph', id: graphId === 'main' ? null : graphId });
    },
    [focusReference, setSelection]
  );

  const selectGraphInCanvas = useCallback(
    (graphId: string, e?: React.MouseEvent) => {
      const key: SymbolMultiKey = { kind: 'graph', id: graphId };
      if (e && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedSymbols((prev) => {
          const exists = prev.some((s) => symbolKeyEquals(s, key));
          return exists ? prev.filter((s) => !symbolKeyEquals(s, key)) : [...prev, key];
        });
      } else {
        setSelectedSymbols([key]);
      }
      setSelection({ type: 'graph', id: graphId === 'main' ? null : graphId });
    },
    [setSelection, setSelectedSymbols]
  );

  const selectGraph = isReferenceMode ? selectGraphForReferences : selectGraphInCanvas;

  const selectVariableForReferences = useCallback(
    (varId: string, varName: string) => {
      setSelectedSymbols([{ kind: 'variable', id: varId }]);
      setSelection({ type: 'variable', id: varId });
      if (!documents) {
        focusReference('main', varName);
        return;
      }
      const graphIds = findGraphIdsUsingVariable(documents, varName);
      focusReference(graphIds[0] ?? 'main', varName);
    },
    [documents, focusReference, setSelection]
  );

  const selectVariableInCanvas = useCallback(
    (varId: string, e?: React.MouseEvent) => {
      const key: SymbolMultiKey = { kind: 'variable', id: varId };
      if (e && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedSymbols((prev) => {
          const exists = prev.some((s) => symbolKeyEquals(s, key));
          return exists ? prev.filter((s) => !symbolKeyEquals(s, key)) : [...prev, key];
        });
        setSelection({ type: 'variable', id: varId });
      } else {
        setSelectedSymbols([key]);
        setSelection({ type: 'variable', id: varId });
      }
    },
    [setSelection]
  );

  const openVariableHomeGraph = useCallback(
    (varId: string) => {
      const variable = variables.find((v) => v.id === varId);
      if (!variable) return;

      const cls = classes.find((c) => c.id === symbolClassId(variable));
      if (!cls) return;

      const target = editorFocus.focusTreeSymbolOnClass(cls, { type: 'variable', id: varId });
      revealClassGraphInTree(target.container);
    },
    [variables, classes, editorFocus, revealClassGraphInTree]
  );

  const selectEvent = useCallback(
    (eventId: string, e?: React.MouseEvent) => {
      const key: SymbolMultiKey = { kind: 'event', id: eventId };
      if (e && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedSymbols((prev) => {
          const exists = prev.some((s) => symbolKeyEquals(s, key));
          return exists ? prev.filter((s) => !symbolKeyEquals(s, key)) : [...prev, key];
        });
        setSelection({ type: 'event', id: eventId });
      } else {
        setSelectedSymbols([key]);
        setSelection({ type: 'event', id: eventId });
      }
      setExpanded((s) => ({ ...s, events: true }));
    },
    [setSelection]
  );

  const openEventHomeGraph = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      const cls = classes.find((c) => c.id === symbolClassId(event));
      if (!cls) return;

      const target = editorFocus.focusTreeSymbolOnClass(cls, { type: 'event', id: eventId });
      revealClassGraphInTree(target.container);
      setExpanded((s) => ({ ...s, events: true }));
    },
    [events, classes, editorFocus, revealClassGraphInTree]
  );

  const selectVariable = isReferenceMode
    ? (varId: string, varName: string, _e?: React.MouseEvent) =>
        selectVariableForReferences(varId, varName)
    : (varId: string, _varName?: string, e?: React.MouseEvent) =>
        selectVariableInCanvas(varId, e);

  const isVariableActive = useCallback(
    (varId: string, varName: string) =>
      isReferenceMode
        ? referenceVariableName === varName
        : isSymbolMultiSelected('variable', varId) ||
          (selection.type === 'variable' && selection.id === varId),
    [isReferenceMode, referenceVariableName, selection, isSymbolMultiSelected]
  );

  const requestDeleteSymbols = useCallback(
    (items: Array<{ kind: SymbolRefKind; symbolId: string }>) => {
      if (items.length === 0) return;
      const symbols = { variables, functions, events, openTabs };
      setPendingDelete({
        items: items.map((item) => ({
          ...item,
          symbolName: getSymbolDisplayName(item.kind, item.symbolId, symbols),
        })),
      });
    },
    [variables, functions, events, openTabs]
  );

  const requestDeleteSymbol = useCallback(
    (kind: SymbolRefKind, symbolId: string) => {
      requestDeleteSymbols([{ kind, symbolId }]);
    },
    [requestDeleteSymbols]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        if (selection.type === 'class' && selection.id) {
          const cls = classes.find((c) => c.id === selection.id);
          if (cls) {
            setRenamingClassId(cls.id);
            setRenameClassName(cls.name);
          }
        } else if (selection.type === 'function' && selection.id) {
          const func = functions.find((f) => f.id === selection.id);
          if (func) {
            setRenamingFunctionId(func.id);
            setRenameFunctionName(func.name);
          }
        } else if (selection.type === 'event' && selection.id) {
          const event = events.find((e) => e.id === selection.id);
          if (event) {
            setRenamingEventId(event.id);
            setRenameEventName(event.name);
          }
        } else if (selection.type === 'variable' && selection.id) {
          const variable = variables.find((v) => v.id === selection.id);
          if (variable) {
            setRenamingVariableId(variable.id);
            setRenameVariableName(variable.name);
          }
        } else if (selection.type === 'graph' && selection.id) {
          const container = graphContainers.find((c) => c.id === selection.id);
          if (container) {
            setRenamingContainerId(container.id);
            setRenameContainerName(container.name);
          }
        }
        return;
      }

      // When canvas nodes are selected, let graph shortcuts own Delete / Ctrl+D.
      if (selectedNodeIds.length > 0) return;

      const mod = e.ctrlKey || e.metaKey;
      const treeTargets =
        selectedSymbols.length > 0
          ? selectedSymbols.filter(
              (t) => t.kind === 'variable' || t.kind === 'function' || t.kind === 'event'
            )
          : selection.type === 'variable' ||
              selection.type === 'function' ||
              selection.type === 'event'
            ? [{ kind: selection.type, id: selection.id! }]
            : [];

      if (mod && e.key.toLowerCase() === 'd' && !e.shiftKey && !e.altKey && treeTargets.length > 0) {
        e.preventDefault();
        for (const target of treeTargets) {
          if (target.kind === 'variable') duplicateVariable(target.id);
          else if (target.kind === 'function') duplicateFunction(target.id);
          else if (target.kind === 'event') duplicateEvent(target.id);
        }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !mod && treeTargets.length > 0) {
        e.preventDefault();
        requestDeleteSymbols(
          treeTargets.map((t) => ({
            kind: t.kind as 'variable' | 'function' | 'event',
            symbolId: t.id,
          }))
        );
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selection,
    classes,
    functions,
    events,
    variables,
    graphContainers,
    selectedSymbols,
    selectedNodeIds,
    duplicateVariable,
    duplicateFunction,
    duplicateEvent,
    requestDeleteSymbols,
  ]);

  const openSymbolContextMenu = useCallback(
    (e: React.MouseEvent, target: SymbolMultiKey) => {
      if (isReferenceMode) return;
      e.preventDefault();
      e.stopPropagation();
      const inSelection = selectedSymbols.some((s) => symbolKeyEquals(s, target));
      const targets = inSelection && selectedSymbols.length > 0 ? selectedSymbols : [target];
      if (!inSelection) {
        setSelectedSymbols([target]);
        if (target.kind === 'graph') {
          setSelection({ type: 'graph', id: target.id === 'main' ? null : target.id });
        } else {
          setSelection({ type: target.kind, id: target.id });
        }
      }
      setSymbolMenu({
        ...paneMenuPosition(e.clientX, e.clientY, 180, 240),
        targets,
      });
    },
    [isReferenceMode, selectedSymbols, setSelection, setSelectedSymbols]
  );

  const symbolMenuSingle =
    symbolMenu && symbolMenu.targets.length === 1 ? symbolMenu.targets[0]! : null;

  const handleSymbolMenuCall = useCallback(() => {
    if (!symbolMenuSingle) return;
    if (symbolMenuSingle.kind === 'function') {
      window.dispatchEvent(
        new CustomEvent(SPAWN_FUNCTION_CALL_EVENT, {
          detail: { functionId: symbolMenuSingle.id },
        })
      );
    } else if (symbolMenuSingle.kind === 'event') {
      window.dispatchEvent(
        new CustomEvent(SPAWN_EVENT_NODE_EVENT, {
          detail: { eventId: symbolMenuSingle.id, role: 'dispatch' },
        })
      );
    }
    setSymbolMenu(null);
  }, [symbolMenuSingle]);

  const handleSymbolMenuDeclare = useCallback(() => {
    if (!symbolMenuSingle) return;
    if (symbolMenuSingle.kind === 'function') {
      const func = functions.find((f) => f.id === symbolMenuSingle.id);
      if (func) focusOrInsertFunctionDeclare(func);
    } else if (symbolMenuSingle.kind === 'event') {
      focusOrInsertEventDeclare(symbolMenuSingle.id);
    } else if (symbolMenuSingle.kind === 'variable') {
      focusOrInsertVariableDeclare(symbolMenuSingle.id);
    } else {
      const cls = classes.find((c) => c.id === symbolMenuSingle.id);
      if (cls) focusOrInsertClassDeclare(cls);
    }
    setSymbolMenu(null);
  }, [
    symbolMenuSingle,
    functions,
    classes,
    focusOrInsertFunctionDeclare,
    focusOrInsertEventDeclare,
    focusOrInsertVariableDeclare,
    focusOrInsertClassDeclare,
  ]);

  const handleSymbolMenuDefine = useCallback(() => {
    if (!symbolMenuSingle) return;
    if (symbolMenuSingle.kind === 'function') {
      const func = functions.find((f) => f.id === symbolMenuSingle.id);
      if (func) focusOrInsertFunctionDefine(func);
    } else if (symbolMenuSingle.kind === 'event') {
      focusOrInsertEventHandler(symbolMenuSingle.id);
    }
    setSymbolMenu(null);
  }, [symbolMenuSingle, functions, focusOrInsertFunctionDefine, focusOrInsertEventHandler]);

  const symbolMenuFindNames = useMemo(() => {
    if (!symbolMenu || symbolMenu.targets.length === 0) return [] as string[];
    const names: string[] = [];
    for (const target of symbolMenu.targets) {
      if (target.kind === 'function') {
        const n = functions.find((f) => f.id === target.id)?.name;
        if (n) names.push(n);
      } else if (target.kind === 'event') {
        const n = events.find((e) => e.id === target.id)?.name;
        if (n) names.push(n);
      } else if (target.kind === 'variable') {
        const n = variables.find((v) => v.id === target.id)?.name;
        if (n) names.push(n);
      } else if (target.kind === 'class') {
        const n = classes.find((c) => c.id === target.id)?.name;
        if (n) names.push(n);
      } else if (target.kind === 'graph') {
        const n = graphContainers.find((c) => c.id === target.id)?.name;
        if (n) names.push(n);
      }
    }
    return [...new Set(names)];
  }, [symbolMenu, functions, events, variables, classes, graphContainers]);

  const handleSymbolMenuFindInGraph = useCallback(() => {
    if (symbolMenuFindNames.length === 0) return;
    dispatchFocusGraphNodeSearch(symbolMenuFindNames, { searchAllGraphs: false });
    setSymbolMenu(null);
  }, [symbolMenuFindNames]);

  const handleSymbolMenuFindInAllGraphs = useCallback(() => {
    if (symbolMenuFindNames.length === 0) return;
    dispatchFocusGraphNodeSearch(symbolMenuFindNames, { searchAllGraphs: true });
    setSymbolMenu(null);
  }, [symbolMenuFindNames]);

  const handleSymbolMenuOpen = useCallback(() => {
    if (!symbolMenuSingle) return;
    if (symbolMenuSingle.kind === 'class') {
      const cls = classes.find((c) => c.id === symbolMenuSingle.id);
      if (cls) openClassGraph(cls);
    } else if (symbolMenuSingle.kind === 'graph') {
      const container = graphContainers.find((c) => c.id === symbolMenuSingle.id);
      if (container) openGraphContainer(container);
    }
    setSymbolMenu(null);
  }, [symbolMenuSingle, classes, graphContainers, openClassGraph, openGraphContainer]);

  const handleSymbolMenuRename = useCallback(() => {
    if (!symbolMenuSingle) return;
    if (symbolMenuSingle.kind === 'function') {
      const func = functions.find((f) => f.id === symbolMenuSingle.id);
      if (func) {
        setRenamingFunctionId(func.id);
        setRenameFunctionName(func.name);
      }
    } else if (symbolMenuSingle.kind === 'event') {
      const event = events.find((e) => e.id === symbolMenuSingle.id);
      if (event) {
        setRenamingEventId(event.id);
        setRenameEventName(event.name);
      }
    } else if (symbolMenuSingle.kind === 'variable') {
      const variable = variables.find((v) => v.id === symbolMenuSingle.id);
      if (variable) {
        setRenamingVariableId(variable.id);
        setRenameVariableName(variable.name);
      }
    } else if (symbolMenuSingle.kind === 'graph') {
      const container = graphContainers.find((c) => c.id === symbolMenuSingle.id);
      if (container && canRenameContainer(container)) {
        setRenamingContainerId(container.id);
        setRenameContainerName(container.name);
      }
    } else {
      const cls = classes.find((c) => c.id === symbolMenuSingle.id);
      if (cls) {
        setRenamingClassId(cls.id);
        setRenameClassName(cls.name);
      }
    }
    setSymbolMenu(null);
  }, [
    symbolMenuSingle,
    functions,
    events,
    variables,
    classes,
    graphContainers,
    canRenameContainer,
  ]);

  const handleSymbolMenuAddOverload = useCallback(() => {
    if (!symbolMenuSingle || symbolMenuSingle.kind !== 'function') return;
    setAddingOverloadForId(symbolMenuSingle.id);
    const func = functions.find((f) => f.id === symbolMenuSingle.id);
    if (func) selectFunction(func);
    setSymbolMenu(null);
  }, [symbolMenuSingle, functions, selectFunction]);

  const symbolMenuDuplicatable = symbolMenu
    ? symbolMenu.targets.filter((t) => t.kind !== 'class' && t.kind !== 'graph')
    : [];
  const symbolMenuCanDelete =
    !!symbolMenu &&
    symbolMenu.targets.some((t) => {
      if (t.kind === 'class') return canDeleteClass;
      if (t.kind === 'graph') {
        const container = graphContainers.find((c) => c.id === t.id);
        return container ? canDeleteContainer(container) : false;
      }
      return true;
    });

  const handleSymbolMenuDuplicate = useCallback(() => {
    if (!symbolMenu) return;
    for (const target of symbolMenu.targets) {
      if (target.kind === 'variable') duplicateVariable(target.id);
      else if (target.kind === 'function') duplicateFunction(target.id);
      else if (target.kind === 'event') duplicateEvent(target.id);
    }
    setSymbolMenu(null);
  }, [symbolMenu, duplicateVariable, duplicateFunction, duplicateEvent]);

  const handleSymbolMenuDelete = useCallback(() => {
    if (!symbolMenu) return;
    const classTargets = symbolMenu.targets.filter((t) => t.kind === 'class');
    const graphTargets = symbolMenu.targets.filter((t) => t.kind === 'graph');
    const symbolTargets = symbolMenu.targets.filter(
      (t): t is { kind: 'variable' | 'function' | 'event'; id: string } =>
        t.kind === 'variable' || t.kind === 'function' || t.kind === 'event'
    );
    for (const target of classTargets) {
      if (canDeleteClass) deleteClass(target.id);
    }
    for (const target of graphTargets) {
      const container = graphContainers.find((c) => c.id === target.id);
      if (container && canDeleteContainer(container)) deleteContainer(target.id);
    }
    if (symbolTargets.length > 0) {
      requestDeleteSymbols(symbolTargets.map((t) => ({ kind: t.kind, symbolId: t.id })));
    }
    setSymbolMenu(null);
  }, [
    symbolMenu,
    requestDeleteSymbols,
    deleteClass,
    canDeleteClass,
    deleteContainer,
    canDeleteContainer,
    graphContainers,
  ]);

  useEffect(() => {
    if (!symbolMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSymbolMenu(null);
    };
    const onDown = (e: MouseEvent) => {
      if (symbolMenuRef.current?.contains(e.target as Node)) return;
      setSymbolMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [symbolMenu]);

  const pendingUsage = pendingDelete
    ? pendingDelete.items.reduce(
        (acc, item) => {
          const usage = getUsageSummary(item.kind, item.symbolId);
          return {
            nodeCount: acc.nodeCount + usage.nodeCount,
            graphCount: acc.graphCount + usage.graphCount,
          };
        },
        { nodeCount: 0, graphCount: 0 }
      )
    : { nodeCount: 0, graphCount: 0 };

  const handleSaveVariable = () => {
    if (!newVarName.trim()) return;
    const applied = applyPickerValueToVariableFields(newVarType);
    const variable = createVariableSymbol(newVarName.trim(), {
      type: applied?.type ?? 'data_string',
      typeRef: applied?.typeRef,
      binding: newVarBinding,
      classId: activeClassId,
    });
    variable.defaultValue = applied?.defaultValue ?? defaultValueForVariableType(variable.type);
    if (applied?.enumType) variable.enumType = applied.enumType;
    addVariableWithDefine(variable);
    setNewVarName('');
    setNewVarBinding('instance');
    setIsAddingVariable(false);
    setExpanded((s) => ({ ...s, variables: true }));
  };

  const handleSaveLocalVariable = () => {
    if (!newLocalVarName.trim() || !activeScope) return;
    // Function/node locals are not class members — no var_define dual-write.
    const applied = applyPickerValueToVariableFields(newLocalVarType);
    const variable = createVariableSymbol(newLocalVarName.trim(), {
      type: applied?.type ?? 'data_string',
      typeRef: applied?.typeRef,
      binding: 'instance',
      classId: activeClassId,
      ...(activeScope.type === 'function'
        ? { graphTabId: activeScope.id }
        : { scopedNodeId: activeScope.id }),
    });
    variable.defaultValue = applied?.defaultValue ?? defaultValueForVariableType(variable.type);
    if (applied?.enumType) variable.enumType = applied.enumType;
    setVariables((list) => [...list, variable]);
    setNewLocalVarName('');
    setIsAddingLocalVariable(false);
  };

  const handleDeleteVariable = (varId: string) => {
    requestDeleteSymbol('variable', varId);
  };

  const handleDeleteFunction = (funcId: string) => {
    requestDeleteSymbol('function', funcId);
  };

  const handleDeleteEvent = (eventId: string) => {
    requestDeleteSymbol('event', eventId);
  };

  const handleSaveEvent = () => {
    const name = newEventName.trim().replace(/^on\s+/i, '');
    if (!name) return;
    const event = {
      id: createEventId(),
      name,
      parameters: [],
      classId: activeClassId,
    };
    addEventWithDefine(event);
    setSelection({ type: 'event', id: event.id });
    setNewEventName('');
    setIsAddingEvent(false);
    setExpanded((s) => ({ ...s, events: true }));
  };

  const handleSaveFunction = () => {
    if (!newFuncName.trim()) return;
    const func = createFunctionSymbol(newFuncName.trim(), {
      binding: newFuncBinding,
      classId: activeClassId,
    });
    addFunctionWithDefine(func);
    setSelection({ type: 'function', id: func.id });
    editorFocus.focusFunction(func);
    setExpanded((s) => ({ ...s, functions: true }));
    setNewFuncName('');
    setNewFuncBinding('instance');
    setIsAddingFunction(false);
  };

  const renderFunctionCreateForm = () => (
    <div className="space-y-1.5">
      <input
        type="text"
        placeholder="Function name"
        className={explorerInputClass}
        value={newFuncName}
        onChange={(e) => setNewFuncName(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSaveFunction();
          if (e.key === 'Escape') {
            setIsAddingFunction(false);
            setNewFuncName('');
            setNewFuncBinding('instance');
          }
        }}
      />
      <div className="flex flex-wrap gap-1">
        {(['instance', 'static', 'module'] as FunctionBinding[]).map((binding) => (
          <button
            key={binding}
            type="button"
            onClick={() => setNewFuncBinding(binding)}
            className={bindingChipClass(newFuncBinding === binding)}
          >
            {binding}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={handleSaveFunction} className={`flex-1 ${explorerBtnPrimaryClass}`}>
          Create & open
        </button>
        <button
          type="button"
          onClick={() => {
            setIsAddingFunction(false);
            setNewFuncName('');
            setNewFuncBinding('instance');
          }}
          className={explorerBtnCompactCancelClass}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderOverloadCreateForm = (funcId: string) => (
    <div className={`${INDENT.l2} py-1 pr-2`}>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleAddOverload(funcId)}
          className="flex-1 px-2 py-1 rounded bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30"
        >
          Add & open
        </button>
        <button
          type="button"
          onClick={() => setAddingOverloadForId(null)}
          className="px-2 py-1 rounded text-[10px] text-zinc-500 border border-zinc-800 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const rowHint = isReferenceMode ? 'Click focus · dbl-click open' : 'Click select · dbl-click open';

  return (
    <ExplorerPanelShell>
      <ExplorerToolbarRow>
        <ExplorerTabs
          value={panelTab}
          onChange={setExplorerTab}
          showApiTab={showApiTab}
          tabIssueCounts={
            isReferenceMode || activeClassMissingDeclares === 0
              ? undefined
              : { symbols: activeClassMissingDeclares }
          }
        />
        <PanelFilter value={filterQuery} onChange={setFilterQuery} placeholder="Filter…" />
      </ExplorerToolbarRow>

      <ExplorerScrollRegion>
        {panelTab === 'api' && environmentSurface && environmentManifest ? (
          <EnvironmentApiSection
            environmentManifest={environmentManifest}
            environmentVersion={environmentVersion}
            environmentSurface={environmentSurface}
            filterQuery={filterQuery}
            viewMode={sectionViewModes.api}
            onViewModeChange={(mode) => setSectionView('api', mode)}
            isReferenceMode={isReferenceMode}
          />
        ) : null}

        {panelTab === 'symbols' ? (
        <>
        {showGraphFoldersSection ? (
          <GraphFoldersSection
            containers={visibleGraphContainers}
            classes={classes}
            expanded={foldersExpanded}
            onToggleExpanded={() => setFoldersExpanded((open) => !open)}
            isAdding={isAddingContainer}
            onStartAdd={() => {
              setIsAddingContainer(true);
              setFoldersExpanded(true);
            }}
            onCancelAdd={() => {
              setIsAddingContainer(false);
              setNewContainerName('');
            }}
            newName={newContainerName}
            onNewNameChange={setNewContainerName}
            onSaveNew={handleSaveContainer}
            renamingId={renamingContainerId}
            renameName={renameContainerName}
            onRenameNameChange={setRenameContainerName}
            onStartRename={(container) => {
              setRenamingContainerId(container.id);
              setRenameContainerName(container.name);
            }}
            onSaveRename={handleSaveContainerRename}
            onCancelRename={() => setRenamingContainerId(null)}
            activeGraphTab={activeGraphTab}
            isReferenceMode={isReferenceMode}
            draggingId={draggingGraphContainerId}
            dropContainerId={dropContainerId}
            dropGraphContainerId={dropGraphContainerId}
            onGraphContainerDragStart={handleGraphContainerDragStart}
            onGraphContainerDragEnd={handleGraphContainerDragEnd}
            onContainerDragOver={handleContainerDragOver}
            onContainerDrop={handleContainerDrop}
            onContainerDragLeave={clearContainerDropHint}
            onSelectGraph={selectGraph}
            onOpenGraph={openGraphContainer}
            onContextMenu={
              isReferenceMode
                ? undefined
                : (e, containerId) => openSymbolContextMenu(e, { kind: 'graph', id: containerId })
            }
            isRowSelected={(id) => isSymbolMultiSelected('graph', id)}
            canRename={canRenameContainer}
            canDelete={canDeleteContainer}
            onDelete={deleteContainer}
            emptyHint={
              <ExplorerEmptyHint viewMode={sectionViewModes.graphs}>No graphs yet.</ExplorerEmptyHint>
            }
            viewMode={sectionViewModes.graphs}
            onViewModeChange={(mode) => setSectionView('graphs', mode)}
          />
        ) : null}

        {showClassesSection ? (
        <CategorySection
          title="Classes"
          count={classes.length}
          issueCount={symbolCategoryIssues.classes}
          icon={<Boxes size={12} className="text-violet-400/80 shrink-0" />}
          expanded={expanded.classes}
          onToggle={() => toggleCategory('classes')}
          viewMode={sectionViewModes.classes}
          onViewModeChange={(mode) => setSectionView('classes', mode)}
          onAdd={() => {
            setIsAddingClass(true);
            setNewClassContainerId(defaultClassContainerId());
            setExpanded((s) => ({ ...s, classes: true }));
          }}
          addLabel="New class"
        >
          {isAddingClass && (
            <SectionPopoverAnchor viewMode={sectionViewModes.classes}>
            <SymbolCreatePopover
              open={isAddingClass}
              title="New class"
              onClose={() => {
                setIsAddingClass(false);
                setNewClassName('');
              }}
              anchorClassName={INDENT.l1}
            >
              <input
                type="text"
                placeholder="Class name"
                className={explorerInputClass}
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveClass();
                  if (e.key === 'Escape') {
                    setIsAddingClass(false);
                    setNewClassName('');
                  }
                }}
              />
              <label className={explorerLabelClass}>Output graph</label>
              <Tooltip content="Which graph this class generates code from" placement="right" className="block w-full">
                <select
                  value={newClassContainerId}
                  onChange={(e) => setNewClassContainerId(e.target.value)}
                  className={explorerSelectClass}
                >
                  {graphContainers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {graphContainerLabel(container)}
                    </option>
                  ))}
                </select>
              </Tooltip>
              <button
                type="button"
                className={explorerBtnPrimaryClass}
                onClick={handleSaveClass}
              >
                Create & open
              </button>
            </SymbolCreatePopover>
            </SectionPopoverAnchor>
          )}
          {filteredClasses.length === 0 && !isAddingClass ? (
            <ExplorerEmptyHint viewMode={sectionViewModes.classes}>
              {classes.length === 0 ? 'No classes — use + to add' : 'No match.'}
            </ExplorerEmptyHint>
          ) : (
            filteredClasses.map((cls) => {
                const counts = classSymbolCounts(cls.id);
                const isActive = activeClassId === cls.id;
                const mainTabId = classGraphTabId(cls);
                const folderName =
                  graphContainerLabel(
                    graphContainers.find((c) => c.id === classContainerId(cls)) ?? {
                      id: MAIN_GRAPH_CONTAINER_ID,
                      name: 'Overview',
                    }
                  );
                return (
                  <React.Fragment key={cls.id}>
                    <TreeRow
                      layout={sectionViewModes.classes}
                      active={
                        (isActive && activeGraphTab === mainTabId) ||
                        isSymbolMultiSelected('class', cls.id) ||
                        (selection.type === 'class' && selection.id === cls.id)
                      }
                      icon={<Boxes size={10} className="text-violet-400/80 shrink-0" />}
                      label={
                        renamingClassId === cls.id ? (
                          <input
                            type="text"
                            value={renameClassName}
                            onChange={(e) => setRenameClassName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-zinc-600"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveClassRename(cls);
                              if (e.key === 'Escape') setRenamingClassId(null);
                            }}
                          />
                        ) : (
                          cls.name
                        )
                      }
                      isRenaming={renamingClassId === cls.id}
                      hint={[
                        renamingClassId === cls.id
                          ? undefined
                          : `→ ${folderName} · fn ${counts.functions} · evt ${counts.events} · var ${counts.variables}`,
                        `Class · outputs to ${folderName}`,
                        isActive ? 'active class' : undefined,
                        canReorderSymbols
                          ? 'Hover for reorder grip · drag row to graph · drop grip on a Graphs folder to reassign · right-click for actions · double-click to focus Declare'
                          : 'Drag row to graph · right-click for actions · double-click to focus Declare',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      onSelect={(e) => selectClass(cls, e)}
                      onOpen={() =>
                        isReferenceMode ? openClassGraph(cls) : focusOrInsertClassDeclare(cls)
                      }
                      onContextMenu={
                        !isReferenceMode
                          ? (e) => openSymbolContextMenu(e, { kind: 'class', id: cls.id })
                          : undefined
                      }
                      canvasDrag={
                        !isReferenceMode
                          ? {
                              mimeType: CLASS_DRAG_MIME,
                              payload: classDragPayload(cls),
                            }
                          : undefined
                      }
                      reorder={
                        canReorderSymbols
                          ? {
                              enabled: true,
                              title: 'Drag to reorder · drop on a Graphs folder to reassign output',
                              // Do not dim the drag source — opacity changes mid-drag cancel HTML5 DnD in Chromium.
                              isDragging: false,
                              isDropTarget: dropClassId === cls.id,
                              onDragStart: (e) => handleClassDragStart(e, cls),
                              onDragEnd: handleClassDragEnd,
                              onDragOver: (e) => handleClassReorderDragOver(e, cls.id),
                              onDrop: (e) => handleClassReorderDrop(e, cls.id),
                              onDragLeave: () => handleClassReorderDragLeave(cls.id),
                            }
                          : undefined
                      }
                      suffix={
                        <div className="flex items-center gap-0.5 shrink-0">
                          {isActive ? (
                            <Tooltip content="Active class" placement="top">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            </Tooltip>
                          ) : null}
                          {renamingClassId === cls.id ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveClassRename(cls);
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 shrink-0"
                            >
                              Save
                            </button>
                          ) : !isReferenceMode ? (
                            <>
                              {renderClassCanvasStatus(
                                cls,
                                isActive && activeGraphTab === mainTabId,
                                true,
                                false,
                                'chip'
                              )}
                              {isTabDirty(mainTabId) ? (
                                <Tooltip content="Uncompiled changes" placement="top">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mr-1" />
                                </Tooltip>
                              ) : null}
                            </>
                          ) : isTabDirty(mainTabId) ? (
                            <Tooltip content="Uncompiled changes" placement="top">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            </Tooltip>
                          ) : null}
                        </div>
                      }
                      hoverActions={
                        !isReferenceMode && renamingClassId !== cls.id ? (
                          <>
                            {renderClassCanvasStatus(cls, isActive && activeGraphTab === mainTabId, false, true)}
                            <CodegenSuffix
                              tabId={mainTabId}
                              documents={documents}
                              projectDefaults={projectCodegenDefaults}
                            />
                          </>
                        ) : undefined
                      }
                    />
                  </React.Fragment>
                );
              })
          )}
        </CategorySection>
        ) : null}

        {showFunctionsSection ? (
        <CategorySection
          title="Functions"
          count={classFunctions.length}
          issueCount={symbolCategoryIssues.functions}
          icon={<PlaySquare size={12} className="text-indigo-400/80 shrink-0" />}
          expanded={expanded.functions}
          onToggle={() => toggleCategory('functions')}
          viewMode={sectionViewModes.functions}
          onViewModeChange={(mode) => setSectionView('functions', mode)}
          onAdd={() => {
            setIsAddingFunction(true);
            setExpanded((s) => ({ ...s, functions: true }));
          }}
          addLabel="New function"
        >
          {isAddingFunction && (
            <SectionPopoverAnchor viewMode={sectionViewModes.functions}>
            <SymbolCreatePopover
              open={isAddingFunction}
              title="New function"
              onClose={() => {
                setIsAddingFunction(false);
                setNewFuncName('');
                setNewFuncBinding('instance');
              }}
              anchorClassName={INDENT.l1}
            >
              {renderFunctionCreateForm()}
            </SymbolCreatePopover>
            </SectionPopoverAnchor>
          )}
          {filteredFunctions.length === 0 && !isAddingFunction ? (
            <ExplorerEmptyHint viewMode={sectionViewModes.functions}>
              {classFunctions.length === 0 ? 'Empty — use + to add' : '—'}
            </ExplorerEmptyHint>
          ) : (
            filteredFunctions.map((f) => {
                const primaryOverload = f.overloads[0];
                const extraOverloads = f.overloads.slice(1);
                const primaryDragPayload: FunctionOverloadDragPayload | null = primaryOverload
                  ? { functionId: f.id, overloadId: primaryOverload.id }
                  : null;
                return (
                <React.Fragment key={f.id}>
                  <TreeRow
                    layout={sectionViewModes.functions}
                    active={
                      isSymbolMultiSelected('function', f.id) ||
                      (selection.type === 'function' && selection.id === f.id)
                    }
                    icon={<div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                    label={
                       renamingFunctionId === f.id ? (
                         <input
                           type="text"
                           value={renameFunctionName}
                           onChange={(e) => setRenameFunctionName(e.target.value)}
                           onClick={(e) => e.stopPropagation()}
                           onDoubleClick={(e) => e.stopPropagation()}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-zinc-600"
                           autoFocus
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') handleSaveFunctionRename(f);
                             if (e.key === 'Escape') setRenamingFunctionId(null);
                           }}
                         />
                       ) : (
                         f.name
                       )
                     }
                     isRenaming={renamingFunctionId === f.id}
                     hint={[
                       renamingFunctionId === f.id
                         ? undefined
                         : f.binding !== 'instance'
                           ? `${f.binding} · ${primaryOverload ? overloadTreeLabel(primaryOverload) : ''}`
                           : primaryOverload
                             ? extraOverloads.length > 0
                               ? `${overloadTreeLabel(primaryOverload)} +${extraOverloads.length}`
                               : overloadTreeLabel(primaryOverload)
                             : undefined,
                       canReorderSymbols
                         ? 'Hover for reorder grip · drag row to call · right-click for actions · double-click to Edit function body · Define badge places definition on host graph'
                         : 'Drag row to call · click to select · right-click for actions · double-click to Edit function body · Define badge places definition on host graph',
                     ]
                       .filter(Boolean)
                       .join(' · ')}
                     onSelect={(e) => selectFunction(f, e)}
                     onOpen={() => openGraph(f.id, 'function')}
                     onContextMenu={(e) => openSymbolContextMenu(e, { kind: 'function', id: f.id })}
                     canvasDrag={
                       !isReferenceMode && primaryDragPayload
                         ? {
                             mimeType: FUNCTION_OVERLOAD_DRAG_MIME,
                             payload: JSON.stringify(primaryDragPayload),
                           }
                         : undefined
                     }
                     reorder={
                       canReorderSymbols
                         ? {
                             enabled: true,
                             isDragging: draggingFunctionId === f.id,
                             isDropTarget: dropFunctionId === f.id,
                             onDragStart: (e) => handleFunctionDragStart(e, f.id),
                             onDragEnd: handleFunctionDragEnd,
                             onDragOver: (e) => handleFunctionDragOver(e, f.id),
                             onDrop: (e) => handleFunctionDrop(e, f.id),
                             onDragLeave: () => handleFunctionDragLeave(f.id),
                           }
                         : undefined
                     }
                     suffix={
                       <div className="flex items-center gap-0.5 shrink-0">
                         {isTabDirty(f.id) ? (
                           <Tooltip content="Uncompiled changes" placement="top">
                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                           </Tooltip>
                         ) : null}
                         {!isReferenceMode && renamingFunctionId !== f.id
                           ? renderFunctionCanvasStatus(
                               f,
                               selection.type === 'function' && selection.id === f.id,
                               true,
                               false,
                               'chip'
                             )
                           : null}
                         {renamingFunctionId === f.id ? (
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleSaveFunctionRename(f);
                             }}
                             className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 shrink-0"
                           >
                             Save
                           </button>
                         ) : null}
                       </div>
                     }
                      hoverActions={
                        !isReferenceMode && renamingFunctionId !== f.id ? (
                          <>
                            <CodegenSuffix
                              tabId={f.id}
                              documents={documents}
                              projectDefaults={projectCodegenDefaults}
                            />
                            {renderFunctionCanvasStatus(
                              f,
                              selection.type === 'function' && selection.id === f.id,
                              false,
                              true
                            )}
                          </>
                        ) : undefined
                      }
                  />
                  {extraOverloads.map((overload, index) => {
                    const dragPayload: FunctionOverloadDragPayload = {
                      functionId: f.id,
                      overloadId: overload.id,
                    };
                    return (
                      <TreeRow
                        key={overload.id}
                        depth="l2"
                        active={
                          selection.type === 'function' &&
                          selection.id === f.id &&
                          activeGraphTab === (overload.graphTabId ?? f.id)
                        }
                        icon={<div className="w-1 h-1 rounded-full bg-indigo-400/60 shrink-0 ml-2" />}
                        label={overloadTreeLabel(overload)}
                        hint={`override ${index + 2} · Drag row to call this override · click to open`}
                        canvasDrag={{
                          mimeType: FUNCTION_OVERLOAD_DRAG_MIME,
                          payload: JSON.stringify(dragPayload),
                        }}
                        onSelect={() => openFunctionOverloadGraph(f, overload.id)}
                      />
                    );
                  })}
                  {addingOverloadForId === f.id ? renderOverloadCreateForm(f.id) : null}
                </React.Fragment>
                );
              })
          )}
        </CategorySection>
        ) : null}

        {showEventsSection ? (
        <CategorySection
          title="Events"
          count={classEvents.length}
          issueCount={symbolCategoryIssues.events}
          icon={<Radio size={12} className="text-violet-400/80 shrink-0" />}
          expanded={expanded.events}
          onToggle={() => toggleCategory('events')}
          viewMode={sectionViewModes.events}
          onViewModeChange={(mode) => setSectionView('events', mode)}
          onAdd={() => {
            setIsAddingEvent(true);
            setExpanded((s) => ({ ...s, events: true }));
          }}
          addLabel="New event"
        >
          {isAddingEvent && (
            <SectionPopoverAnchor viewMode={sectionViewModes.events}>
            <SymbolCreatePopover
              open={isAddingEvent}
              title="New event"
              onClose={() => {
                setIsAddingEvent(false);
                setNewEventName('');
              }}
              anchorClassName={INDENT.l1}
            >
              <input
                type="text"
                placeholder="Event name (e.g. calculate)"
                className={explorerInputClass}
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEvent();
                  if (e.key === 'Escape') setIsAddingEvent(false);
                }}
              />
              <button
                type="button"
                className={explorerBtnSecondaryClass}
                onClick={handleSaveEvent}
              >
                Add
              </button>
            </SymbolCreatePopover>
            </SectionPopoverAnchor>
          )}
          {filteredEvents.length === 0 && !isAddingEvent ? (
            <ExplorerEmptyHint viewMode={sectionViewModes.events}>
              {classEvents.length === 0
                ? 'No events yet — use + to add, then drag rows to graph.'
                : 'No match.'}
            </ExplorerEmptyHint>
          ) : (
            filteredEvents.map((entry) => {
                const dragPayload: EventDragPayload = {
                  eventId: entry.id,
                  eventName: entry.label,
                };
                const rowSelected =
                  isSymbolMultiSelected('event', entry.id) ||
                  (selection.type === 'event' && selection.id === entry.id);
                return (
                  <React.Fragment key={entry.id}>
                    <TreeRow
                      layout={sectionViewModes.events}
                      icon={<Radio size={10} className="text-violet-400/70 shrink-0" />}
                      label={
                        renamingEventId === entry.id ? (
                          <input
                            type="text"
                            value={renameEventName}
                            onChange={(e) => setRenameEventName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-zinc-600"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEventRename(entry.id);
                              if (e.key === 'Escape') setRenamingEventId(null);
                            }}
                          />
                        ) : (
                          entry.label
                        )
                      }
                      isRenaming={renamingEventId === entry.id}
                      active={rowSelected}
                      hint={[
                        renamingEventId === entry.id ? undefined : eventRowMeta(entry),
                        isReferenceMode
                          ? rowHint
                          : canReorderSymbols
                            ? 'Hover for reorder grip · drag row to graph · right-click for actions · double-click to focus Declare'
                            : 'Drag row to graph · right-click for actions · double-click to focus Declare',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      onSelect={(e) => selectEvent(entry.id, e)}
                      onOpen={() =>
                        isReferenceMode
                          ? openEventHomeGraph(entry.id)
                          : focusOrInsertEventDeclare(entry.id)
                      }
                      onContextMenu={(e) => openSymbolContextMenu(e, { kind: 'event', id: entry.id })}
                      canvasDrag={
                        !isReferenceMode
                          ? {
                              mimeType: EVENT_DRAG_MIME,
                              payload: JSON.stringify(dragPayload),
                            }
                          : undefined
                      }
                      reorder={
                        canReorderSymbols
                          ? {
                              enabled: true,
                              isDragging: draggingEventId === entry.id,
                              isDropTarget: dropEventId === entry.id,
                              onDragStart: (e) => handleEventDragStart(e, entry.id),
                              onDragEnd: handleEventDragEnd,
                              onDragOver: (e) => handleEventDragOver(e, entry.id),
                              onDrop: (e) => handleEventDrop(e, entry.id),
                              onDragLeave: () => handleEventDragLeave(entry.id),
                            }
                          : undefined
                      }
                      suffix={
                        isReferenceMode ? undefined : (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {renamingEventId !== entry.id
                              ? renderEventCanvasStatus(
                                  entry.id,
                                  rowSelected,
                                  true,
                                  false,
                                  'chip'
                                )
                              : null}
                            {renamingEventId === entry.id ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEventRename(entry.id);
                                }}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 shrink-0"
                              >
                                Save
                              </button>
                            ) : null}
                          </div>
                        )
                      }
                      hoverActions={
                        !isReferenceMode && renamingEventId !== entry.id ? (
                          <>
                            <EventDispatchChip dispatchCount={entry.dispatchCount} />
                            {renderEventCanvasStatus(entry.id, rowSelected, false, true)}
                          </>
                        ) : undefined
                      }
                    />
                  </React.Fragment>
                );
              })
          )}
        </CategorySection>
        ) : null}

        {showVariablesSection ? (
        <CategorySection
          title="Variables"
          count={classVariables.length}
          issueCount={symbolCategoryIssues.variables}
          icon={<Variable size={12} className="text-sky-400/80 shrink-0" />}
          expanded={expanded.variables}
          onToggle={() => toggleCategory('variables')}
          viewMode={sectionViewModes.variables}
          onViewModeChange={(mode) => setSectionView('variables', mode)}
          onAdd={() => {
            setIsAddingVariable(true);
            setExpanded((s) => ({ ...s, variables: true }));
          }}
          addLabel="New variable"
        >
          {isAddingVariable && (
            <SectionPopoverAnchor viewMode={sectionViewModes.variables}>
            <SymbolCreatePopover
              open={isAddingVariable}
              title="New variable"
              onClose={() => {
                setIsAddingVariable(false);
                setNewVarName('');
                setNewVarBinding('instance');
              }}
              anchorClassName={INDENT.l1}
            >
              <input
                type="text"
                placeholder="Variable name"
                className={explorerInputClass}
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveVariable();
                  if (e.key === 'Escape') setIsAddingVariable(false);
                }}
              />
              <SearchableSelect
                className="w-full"
                value={newVarType}
                onChange={(value) => {
                  if (value.startsWith('data_') && !isDataTypeCoaAllowed(value as VariableType, crossOverMode)) {
                    return;
                  }
                  setNewVarType(value);
                }}
                options={typePickerOptions}
                placeholder="Type…"
              />
              <div className="flex flex-wrap gap-1">
                {(['instance', 'static'] as VariableBinding[]).map((binding) => (
                  <button
                    key={binding}
                    type="button"
                    className={bindingChipClass(newVarBinding === binding)}
                    disabled={!isBindingCoaAllowed(binding, crossOverMode)}
                    onClick={() => setNewVarBinding(binding)}
                  >
                    {binding}
                  </button>
                ))}
              </div>
              <button type="button" className={explorerBtnSecondaryClass} onClick={handleSaveVariable}>
                Add
              </button>
            </SymbolCreatePopover>
            </SectionPopoverAnchor>
          )}
          {filteredVariables.length === 0 && !isAddingVariable ? (
            <ExplorerEmptyHint viewMode={sectionViewModes.variables}>
              {classVariables.length === 0 ? 'No variables yet.' : 'No match.'}
            </ExplorerEmptyHint>
          ) : (
            filteredVariables.map((v) => (
                <React.Fragment key={v.id}>
                  <VariableRow
                    layout={sectionViewModes.variables}
                    variable={v}
                    isSelected={isVariableActive(v.id, v.name)}
                    color={getVariableColor(v.type)}
                    canReorder={canReorderSymbols}
                    isDragging={draggingVariableId === v.id}
                    isDropTarget={dropVariableId === v.id}
                    onReorderDragStart={(e) => handleVariableDragStart(e, v.id)}
                    onReorderDragEnd={handleVariableDragEnd}
                    onReorderDragOver={(e) => handleVariableDragOver(e, v.id)}
                    onReorderDrop={(e) => handleVariableDrop(e, v.id)}
                    onReorderDragLeave={() => handleVariableDragLeave(v.id)}
                    declareBadge={
                      isReferenceMode
                        ? undefined
                        : renderVariableCanvasStatus(
                            v.id,
                            selection.type === 'variable' && selection.id === v.id,
                            true,
                            false,
                            'chip'
                          )
                    }
                    hoverBadge={
                      isReferenceMode
                        ? undefined
                        : renderVariableCanvasStatus(
                            v.id,
                            selection.type === 'variable' && selection.id === v.id,
                            false,
                            true
                          )
                    }
                    hint={
                      isReferenceMode
                        ? 'Click to focus references · Double-click to edit in inspector'
                        : canReorderSymbols
                          ? 'Hover for reorder grip · drag row to graph · double-click to focus Declare'
                          : 'Drag row to graph · click to select · double-click to focus Declare'
                    }
                    onSelect={(e) => selectVariable(v.id, v.name, e)}
                    onOpen={() =>
                      isReferenceMode
                        ? openVariableHomeGraph(v.id)
                        : focusOrInsertVariableDeclare(v.id)
                    }
                    onContextMenu={
                      isReferenceMode
                        ? undefined
                        : (e) => openSymbolContextMenu(e, { kind: 'variable', id: v.id })
                    }
                    onRename={() => {
                      setRenamingVariableId(v.id);
                      setRenameVariableName(v.name);
                    }}
                    onDelete={isReferenceMode ? undefined : () => handleDeleteVariable(v.id)}
                    isRenaming={renamingVariableId === v.id}
                    renameValue={renameVariableName}
                    onRenameValueChange={setRenameVariableName}
                    onSaveRename={() => handleSaveVariableRename(v)}
                    onCancelRename={() => setRenamingVariableId(null)}
                  />
                </React.Fragment>
              ))
          )}
        </CategorySection>
        ) : null}

        {activeScope && showVariablesSection ? (
        <CategorySection
          title={`Local Variables (${activeScope.name})`}
          count={activeScopeVariables.length}
          issueCount={0}
          icon={<Variable size={12} className="text-teal-400/80 shrink-0" />}
          expanded={true}
          onToggle={() => {}}
          viewMode={sectionViewModes.variables}
          onViewModeChange={(mode) => setSectionView('variables', mode)}
          onAdd={() => setIsAddingLocalVariable(true)}
          addLabel="New local variable"
        >
          {isAddingLocalVariable && (
            <SectionPopoverAnchor viewMode={sectionViewModes.variables}>
            <SymbolCreatePopover
              open={isAddingLocalVariable}
              title="New local variable"
              onClose={() => {
                setIsAddingLocalVariable(false);
                setNewLocalVarName('');
              }}
              anchorClassName={INDENT.l1}
            >
              <input
                type="text"
                placeholder="Variable name"
                className={explorerInputClass}
                value={newLocalVarName}
                onChange={(e) => setNewLocalVarName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLocalVariable();
                  if (e.key === 'Escape') setIsAddingLocalVariable(false);
                }}
              />
              <SearchableSelect
                className="w-full"
                value={newLocalVarType}
                onChange={(value) => {
                  if (value.startsWith('data_') && !isDataTypeCoaAllowed(value as VariableType, crossOverMode)) {
                    return;
                  }
                  setNewLocalVarType(value);
                }}
                options={typePickerOptions}
                placeholder="Type…"
              />
              <button type="button" className={explorerBtnSecondaryClass} onClick={handleSaveLocalVariable}>
                Add
              </button>
            </SymbolCreatePopover>
            </SectionPopoverAnchor>
          )}
          {filteredLocalVariables.length === 0 && !isAddingLocalVariable ? (
            <ExplorerEmptyHint viewMode={sectionViewModes.variables}>
              {activeScopeVariables.length === 0 ? 'No local variables.' : 'No match.'}
            </ExplorerEmptyHint>
          ) : (
            filteredLocalVariables.map((v) => (
                <React.Fragment key={v.id}>
                  <VariableRow
                    layout={sectionViewModes.variables}
                    variable={v}
                    isSelected={isVariableActive(v.id, v.name)}
                    color={getVariableColor(v.type)}
                    canReorder={canReorderSymbols}
                    isDragging={draggingVariableId === v.id}
                    isDropTarget={dropVariableId === v.id}
                    onReorderDragStart={(e) => handleVariableDragStart(e, v.id)}
                    onReorderDragEnd={handleVariableDragEnd}
                    onReorderDragOver={(e) => handleVariableDragOver(e, v.id)}
                    onReorderDrop={(e) => handleVariableDrop(e, v.id)}
                    onReorderDragLeave={() => handleVariableDragLeave(v.id)}
                    declareBadge={
                      isReferenceMode
                        ? undefined
                        : renderVariableCanvasStatus(
                            v.id,
                            selection.type === 'variable' && selection.id === v.id,
                            true,
                            false,
                            'chip'
                          )
                    }
                    hoverBadge={
                      isReferenceMode
                        ? undefined
                        : renderVariableCanvasStatus(
                            v.id,
                            selection.type === 'variable' && selection.id === v.id,
                            false,
                            true
                          )
                    }
                    hint={
                      isReferenceMode
                        ? 'Click to focus references · Double-click to edit in inspector'
                        : canReorderSymbols
                          ? 'Hover for reorder grip · drag row to graph · double-click to focus Declare'
                          : 'Drag row to graph · click to select · double-click to focus Declare'
                    }
                    onSelect={(e) => selectVariable(v.id, v.name, e)}
                    onOpen={() =>
                      isReferenceMode
                        ? openVariableHomeGraph(v.id)
                        : focusOrInsertVariableDeclare(v.id)
                    }
                    onContextMenu={
                      isReferenceMode
                        ? undefined
                        : (e) => openSymbolContextMenu(e, { kind: 'variable', id: v.id })
                    }
                    onRename={() => {
                      setRenamingVariableId(v.id);
                      setRenameVariableName(v.name);
                    }}
                    onDelete={isReferenceMode ? undefined : () => handleDeleteVariable(v.id)}
                    isRenaming={renamingVariableId === v.id}
                    renameValue={renameVariableName}
                    onRenameValueChange={setRenameVariableName}
                    onSaveRename={() => handleSaveVariableRename(v)}
                    onCancelRename={() => setRenamingVariableId(null)}
                  />
                </React.Fragment>
              ))
          )}
        </CategorySection>
        ) : null}
        </>
        ) : null}

        {panelTab === 'output' ? (
          <CategorySection
            title="Generated files"
            count={filteredProjectFileCount}
            icon={<FolderOutput size={12} className="text-zinc-500 shrink-0" />}
            expanded
            onToggle={() => {}}
            viewMode={sectionViewModes.projectFiles}
            onViewModeChange={(mode) => setSectionView('projectFiles', mode)}
          >
            <ProjectFilesExplorer
              entries={projectFolderPaths}
              fileOwners={fileOwners}
              pathKinds={projectFolderPathKinds}
              graphContainers={graphContainers}
              classes={classes}
              functions={functions}
              filterQuery={q}
              viewMode={sectionViewModes.projectFiles}
            />
          </CategorySection>
        ) : null}
      </ExplorerScrollRegion>

      <SymbolDeleteDialog
        open={pendingDelete !== null}
        kind={pendingDelete?.items[0]?.kind ?? 'variable'}
        symbolName={
          pendingDelete && pendingDelete.items.length > 1
            ? pendingDelete.items.map((i) => i.symbolName).join(', ')
            : (pendingDelete?.items[0]?.symbolName ?? '')
        }
        itemCount={pendingDelete?.items.length ?? 1}
        nodeCount={pendingUsage.nodeCount}
        graphCount={pendingUsage.graphCount}
        onCancel={() => setPendingDelete(null)}
        onDeleteSymbolOnly={() => {
          if (!pendingDelete) return;
          for (const item of pendingDelete.items) {
            deleteSymbol(item.kind, item.symbolId, 'symbol_only');
          }
          setSelectedSymbols([]);
          setPendingDelete(null);
        }}
        onDeleteSymbolAndRefs={() => {
          if (!pendingDelete) return;
          for (const item of pendingDelete.items) {
            deleteSymbol(item.kind, item.symbolId, 'symbol_and_refs');
          }
          setSelectedSymbols([]);
          setPendingDelete(null);
        }}
      />
      {symbolMenu ? (
        <div
          ref={symbolMenuRef}
          className="fixed z-[80] min-w-[168px] py-0.5 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
          style={{ left: symbolMenu.x, top: symbolMenu.y }}
          role="menu"
        >
          {symbolMenuSingle ? (
            <>
              {symbolMenuSingle.kind === 'function' || symbolMenuSingle.kind === 'event' ? (
                <SymbolMenuItem label="Call" onClick={handleSymbolMenuCall} />
              ) : null}
              {symbolMenuSingle.kind !== 'graph' ? (
                <SymbolMenuItem label="Declare" onClick={handleSymbolMenuDeclare} />
              ) : null}
              {symbolMenuSingle.kind === 'function' || symbolMenuSingle.kind === 'event' ? (
                <SymbolMenuItem label="Define" onClick={handleSymbolMenuDefine} />
              ) : null}
              {symbolMenuSingle.kind === 'class' || symbolMenuSingle.kind === 'graph' ? (
                <SymbolMenuItem label="Open" onClick={handleSymbolMenuOpen} />
              ) : null}
              <div className="my-0.5 border-t border-zinc-800" role="separator" />
              {symbolMenuSingle.kind === 'graph'
                ? (() => {
                    const container = graphContainers.find((c) => c.id === symbolMenuSingle.id);
                    return container && canRenameContainer(container) ? (
                      <SymbolMenuItem
                        label="Rename"
                        shortcut={shortcutKeys('rename-symbol')}
                        onClick={handleSymbolMenuRename}
                      />
                    ) : null;
                  })()
                : (
                  <SymbolMenuItem
                    label="Rename"
                    shortcut={shortcutKeys('rename-symbol')}
                    onClick={handleSymbolMenuRename}
                  />
                )}
              {symbolMenuSingle.kind === 'function' ? (
                <SymbolMenuItem label="Add overload" onClick={handleSymbolMenuAddOverload} />
              ) : null}
            </>
          ) : null}
          {symbolMenuFindNames.length > 0 ? (
            <>
              <div className="my-0.5 border-t border-zinc-800" role="separator" />
              <SymbolMenuItem
                label={
                  symbolMenuFindNames.length > 1
                    ? `Find in this graph (${symbolMenuFindNames.length})`
                    : 'Find in this graph'
                }
                shortcut={shortcutKeys('node-search')}
                onClick={handleSymbolMenuFindInGraph}
              />
              <SymbolMenuItem
                label={
                  symbolMenuFindNames.length > 1
                    ? `Find in all graphs (${symbolMenuFindNames.length})`
                    : 'Find in all graphs'
                }
                shortcut={shortcutKeys('node-search-all')}
                onClick={handleSymbolMenuFindInAllGraphs}
              />
            </>
          ) : null}
          {symbolMenuDuplicatable.length > 0 ? (
            <SymbolMenuItem
              label={
                symbolMenuDuplicatable.length > 1
                  ? `Duplicate (${symbolMenuDuplicatable.length})`
                  : 'Duplicate'
              }
              shortcut={shortcutKeys('duplicate')}
              onClick={handleSymbolMenuDuplicate}
            />
          ) : null}
          {symbolMenuCanDelete ? (
            <SymbolMenuItem
              label={
                symbolMenu.targets.length > 1
                  ? `Delete (${symbolMenu.targets.length})`
                  : 'Delete'
              }
              shortcut={shortcutKeys('delete')}
              danger
              onClick={handleSymbolMenuDelete}
            />
          ) : null}
        </div>
      ) : null}
    </ExplorerPanelShell>
  );
}
