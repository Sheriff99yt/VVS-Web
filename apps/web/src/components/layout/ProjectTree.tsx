'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Variable,
  PlaySquare,
  GitBranch,
  Radio,
  GripVertical,
  Boxes,
  FolderOutput,
  PenLine,
} from 'lucide-react';
import type { FunctionBinding, FunctionSymbol, ClassSymbol, GraphContainer, VariableSymbol } from '@vvs/graph-types';
import { createVariableSymbol, LOGICAL_DATA_TYPE_DESCRIPTORS } from '@vvs/graph-types';
import { useProject } from '@/contexts/ProjectContext';
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
import { mergeDemoVariables } from '@/lib/demoVariables';
import {
  isBindingCoaAllowed,
  isDataTypeCoaAllowed,
} from '@/lib/variableCoaUi';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { VariableBinding } from '@/types/graph';
import { findGraphIdsUsingVariable } from '@/lib/graphRelations';
import { useEditorFocus } from '@/hooks/useEditorFocus';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { createEventId, EVENT_DRAG_MIME, type EventDragPayload } from '@/lib/eventHelpers';
import { getLinkedEnvironmentManifest } from '@/lib/environmentContext';
import { resolveApiSurface } from '@vvs/environment-templates';
import { SymbolDeleteDialog } from '@/components/layout/SymbolDeleteDialog';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { useClassLifecycle } from '@/hooks/useClassLifecycle';
import { useGraphContainerLifecycle } from '@/hooks/useGraphContainerLifecycle';
import { useExplorerPanelState } from '@/hooks/useExplorerPanelState';
import { useExplorerTreeDrag, useFunctionReorderDrop } from '@/hooks/useExplorerTreeDrag';
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
import type { SymbolRefKind } from '@vvs/graph-types';
import { TreeRow } from './project-tree/TreeRow';
import { CategorySection } from './project-tree/CategorySection';
import { PanelFilter } from './project-tree/PanelFilter';
import { ExplorerTabs } from './project-tree/ExplorerTabs';
import {
  INDENT,
  type ProjectTreeMode,
} from './project-tree/constants';
export type { ProjectTreeMode } from './project-tree/constants';
import { ProjectScopeHeader } from './project-tree/ProjectScopeHeader';
import { CodegenSuffix } from './project-tree/CodegenSuffix';
import { SymbolCreatePopover } from './project-tree/SymbolCreatePopover';
import { ClassFolderDropStrip } from './project-tree/ClassFolderDropStrip';
import { ProjectFilesExplorer } from './project-tree/ProjectFilesExplorer';
import { GraphFoldersSection } from './project-tree/GraphFoldersSection';
import { SymbolsScopeBar } from './project-tree/SymbolsScopeBar';
import { ExplorerFooterHint } from './project-tree/ExplorerFooterHint';
import { EventDispatchChip } from './project-tree/EventDispatchChip';
import { EnvironmentApiSection } from './project-tree/EnvironmentApiSection';
import { VariableRow } from './project-tree/VariableRow';
import { ExplorerEmptyHint } from './project-tree/ExplorerEmptyHint';
import { SectionPopoverAnchor } from './project-tree/SectionPopoverAnchor';
import { TreeRenameRow } from './project-tree/TreeRenameRow';
import { RowActionsMenu } from './project-tree/RowActionsMenu';
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
  sectionGridSpan,
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
    functions,
    setFunctions,
    classes,
    graphContainers,
    activeClassId,
    setActiveClassId,
    setSelection,
    selection,
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
  const { deleteSymbol, getUsageSummary, addVariableWithDefine, addFunctionWithDefine, addEventWithDefine, addClassWithDefine } =
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
  const classVariables = scopedSymbols.variables;
  const classFunctions = scopedSymbols.functions;
  const classEvents = scopedSymbols.events;

  const activeClass = useMemo(
    () => classes.find((cls) => cls.id === activeClassId),
    [classes, activeClassId]
  );

  const activeClassSymbolCount =
    classFunctions.length + classEvents.length + classVariables.length;

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
    kind: SymbolRefKind;
    symbolId: string;
    symbolName: string;
  } | null>(null);

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
  const [newVarType, setNewVarType] = useState<VariableType>('data_string');
  const [newVarBinding, setNewVarBinding] = useState<VariableBinding>('instance');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true')
        ) {
          return;
        }
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
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selection, classes, functions, events, variables, graphContainers]);

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

  const treeDrag = useExplorerTreeDrag({
    moveClassToContainer,
    reorderGraphContainers,
    onClassMoved: () => setFoldersExpanded(true),
  });

  const {
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
  } = treeDrag;

  const canReorderFunctions = !q;

  const { handleFunctionDragOver, handleFunctionDrop } = useFunctionReorderDrop({
    canReorder: canReorderFunctions,
    draggingFunctionId,
    setDraggingFunctionId,
    dropFunctionId,
    setDropFunctionId,
    reorderFunctions: (fromId, toId) => setFunctions((prev) => reorderFunctionSymbols(prev, fromId, toId)),
  });

  const {
    renderClassCanvasStatus,
    renderVariableCanvasStatus,
    renderFunctionCanvasStatus,
    renderEventCanvasStatus,
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
      editorFocus.focusClass(cls);
    },
    [editorFocus]
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

  const selectClass = useCallback(
    (cls: ClassSymbol) => {
      setActiveClassId(cls.id);
      setSelection({ type: 'class', id: cls.id });
      setExpanded((s) => ({ ...s, classes: true }));
    },
    [setActiveClassId, setSelection]
  );

  const selectFunction = useCallback(
    (func: FunctionSymbol) => {
      setSelection({ type: 'function', id: func.id });
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
    (graphId: string) => {
      setSelection({ type: 'graph', id: graphId === 'main' ? null : graphId });
    },
    [setSelection]
  );

  const selectGraph = isReferenceMode ? selectGraphForReferences : selectGraphInCanvas;

  const selectVariableForReferences = useCallback(
    (varId: string, varName: string) => {
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
    (varId: string) => {
      setSelection({ type: 'variable', id: varId });
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
    (eventId: string) => {
      setSelection({ type: 'event', id: eventId });
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

  const selectVariable = isReferenceMode ? selectVariableForReferences : selectVariableInCanvas;

  const isVariableActive = useCallback(
    (varId: string, varName: string) =>
      isReferenceMode
        ? referenceVariableName === varName
        : selection.type === 'variable' && selection.id === varId,
    [isReferenceMode, referenceVariableName, selection]
  );

  const handleSaveVariable = () => {
    if (!newVarName.trim()) return;
    const variable = createVariableSymbol(newVarName.trim(), {
      type: newVarType,
      binding: newVarBinding,
      classId: activeClassId,
    });
    variable.defaultValue = defaultValueForVariableType(newVarType);
    addVariableWithDefine(variable);
    setNewVarName('');
    setNewVarBinding('instance');
    setIsAddingVariable(false);
    setExpanded((s) => ({ ...s, variables: true }));
  };

  const handleLoadDemoVariables = () => {
    setVariables((list) =>
      mergeDemoVariables(list).map((v) => ({ ...v, classId: v.classId ?? activeClassId }))
    );
    setExpanded((s) => ({ ...s, variables: true }));
  };

  const requestDeleteSymbol = useCallback(
    (kind: SymbolRefKind, symbolId: string) => {
      const symbols = { variables, functions, events, openTabs };
      setPendingDelete({
        kind,
        symbolId,
        symbolName: getSymbolDisplayName(kind, symbolId, symbols),
      });
    },
    [variables, functions, events, openTabs]
  );

  const pendingUsage = pendingDelete
    ? getUsageSummary(pendingDelete.kind, pendingDelete.symbolId)
    : { nodeCount: 0, graphCount: 0 };

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
    addEventWithDefine({
      id: createEventId(),
      name,
      parameters: [],
      classId: activeClassId,
    });
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
      <ProjectScopeHeader
        projectName={projectDetails.moduleName}
        activeGraphTab={activeGraphTab}
        openTabs={openTabs}
        classes={classes}
        activeClassId={activeClassId}
        mode={mode}
        activeClassName={panelTab === 'symbols' ? activeClass?.name : undefined}
      />

      <ExplorerToolbarRow>
        <PanelFilter value={filterQuery} onChange={setFilterQuery} placeholder="Filter…" />
      </ExplorerToolbarRow>

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

      {panelTab === 'symbols' && !isReferenceMode ? (
        <SymbolsScopeBar
          activeClass={activeClass}
          symbolCount={activeClassSymbolCount}
          missingDeclareCount={activeClassMissingDeclares}
          onFocusClass={activeClass ? () => openClassGraph(activeClass) : undefined}
        />
      ) : null}

      {!isReferenceMode && panelTab === 'symbols' ? (
        <ClassFolderDropStrip
          containers={visibleGraphContainers}
          draggingClassId={draggingClassId}
          dropContainerId={dropContainerId}
          onContainerDragOver={handleContainerDragOver}
          onContainerDrop={handleContainerDrop}
          onContainerDragLeave={clearContainerDropHint}
        />
      ) : null}

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
              <select
                value={newClassContainerId}
                onChange={(e) => setNewClassContainerId(e.target.value)}
                className={explorerSelectClass}
                title="Which graph this class generates code from"
              >
                {graphContainers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {graphContainerLabel(container)}
                  </option>
                ))}
              </select>
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
                      active={isActive && activeGraphTab === mainTabId}
                      leading={
                        !isReferenceMode ? (
                          <span
                            draggable
                            className="inline-flex items-center cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-0"
                            title="Drag grip to move output graph"
                            onClick={(e) => e.stopPropagation()}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              handleClassDragStart(e, cls);
                            }}
                            onDragEnd={handleClassDragEnd}
                          >
                            <GripVertical size={10} />
                          </span>
                        ) : (
                          <span className="w-2.5" />
                        )
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
                      meta={renamingClassId === cls.id ? undefined : `→ ${folderName} · fn ${counts.functions} · evt ${counts.events} · var ${counts.variables}`}
                      hint={[
                        `Class · outputs to ${folderName}`,
                        isActive ? 'active class' : undefined,
                        'Drag row to graph · drag grip to reassign output · double-click to open',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      onSelect={() => selectClass(cls)}
                      onOpen={() => openClassGraph(cls)}
                      showOpenAffordance
                      isDragging={draggingClassId === cls.id}
                      canvasDrag={
                        !isReferenceMode
                          ? {
                              mimeType: CLASS_DRAG_MIME,
                              payload: classDragPayload(cls),
                            }
                          : undefined
                      }
                      suffix={
                        <div className="flex items-center gap-0.5 shrink-0">
                          {isActive ? (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                              title="Active class"
                            />
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
                              {isTabDirty(mainTabId) ? (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mr-1"
                                  title="Uncompiled changes"
                                />
                              ) : null}
                            </>
                          ) : isTabDirty(mainTabId) ? (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                              title="Uncompiled changes"
                            />
                          ) : null}
                        </div>
                      }
                      hoverActions={
                        !isReferenceMode && renamingClassId !== cls.id ? (
                          <>
                            {renderClassCanvasStatus(cls, isActive && activeGraphTab === mainTabId, false, false)}
                            <CodegenSuffix
                              tabId={mainTabId}
                              documents={documents}
                              projectDefaults={projectCodegenDefaults}
                            />
                            <RowActionsMenu
                              actions={[
                                {
                                  label: 'Rename',
                                  onClick: () => {
                                    setRenamingClassId(cls.id);
                                    setRenameClassName(cls.name);
                                  },
                                },
                                ...(canDeleteClass
                                  ? [
                                      {
                                        label: 'Delete',
                                        onClick: () => deleteClass(cls.id),
                                        danger: true,
                                      },
                                    ]
                                  : []),
                              ]}
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
                    active={selection.type === 'function' && selection.id === f.id}
                    isDragging={draggingFunctionId === f.id}
                    isDropTarget={dropFunctionId === f.id}
                    leading={
                      canReorderFunctions ? (
                        <span
                          draggable
                          onDragStart={(e) => handleFunctionDragStart(e, f.id)}
                          onDragEnd={handleFunctionDragEnd}
                          className="inline-flex items-center cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-0"
                          title="Drag to reorder"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical size={11} />
                        </span>
                      ) : (
                        <span className="w-2.5" />
                      )
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
                     meta={
                       renamingFunctionId === f.id
                         ? undefined
                         : f.binding !== 'instance'
                           ? `${f.binding} · ${primaryOverload ? overloadTreeLabel(primaryOverload) : ''}`
                           : primaryOverload
                             ? extraOverloads.length > 0
                               ? `${overloadTreeLabel(primaryOverload)} +${extraOverloads.length}`
                               : overloadTreeLabel(primaryOverload)
                             : undefined
                     }
                     hint={
                       canReorderFunctions
                         ? 'Drag grip to reorder · drag row to call · double-click to open'
                         : 'Drag row to call · click to select · double-click to open'
                     }
                     onSelect={() => selectFunction(f)}
                     onOpen={() => openGraph(f.id, 'function')}
                     showOpenAffordance
                     canvasDrag={
                       !isReferenceMode && primaryDragPayload
                         ? {
                             mimeType: FUNCTION_OVERLOAD_DRAG_MIME,
                             payload: JSON.stringify(primaryDragPayload),
                           }
                         : undefined
                     }
                     onDragOver={(e) => handleFunctionDragOver(e, f.id)}
                     onDrop={(e) => handleFunctionDrop(e, f.id)}
                     onDragLeave={() => {
                       if (dropFunctionId === f.id) setDropFunctionId(null);
                     }}
                     suffix={
                       <div className="flex items-center gap-0.5 shrink-0">
                         {isTabDirty(f.id) ? (
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" title="Uncompiled changes" />
                         ) : null}
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
                            <RowActionsMenu
                            actions={[
                              {
                                label: 'Add overload',
                                onClick: () => {
                                  setAddingOverloadForId(f.id);
                                  selectFunction(f);
                                },
                              },
                              {
                                label: 'Rename',
                                onClick: () => {
                                  setRenamingFunctionId(f.id);
                                  setRenameFunctionName(f.name);
                                },
                              },
                              {
                                label: 'Delete',
                                onClick: () => handleDeleteFunction(f.id),
                                danger: true,
                              },
                            ]}
                          />
                          </>
                        ) : undefined
                      }
                  />
                  {sectionViewModes.functions === 'list'
                    ? extraOverloads.map((overload, index) => {
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
                        meta={`override ${index + 2}`}
                        hint="Drag to graph to call this override · click to open"
                        canvasDrag={{
                          mimeType: FUNCTION_OVERLOAD_DRAG_MIME,
                          payload: JSON.stringify(dragPayload),
                        }}
                        onSelect={() => openFunctionOverloadGraph(f, overload.id)}
                      />
                    );
                  })
                    : null}
                  {sectionViewModes.functions === 'list' && addingOverloadForId === f.id
                    ? renderOverloadCreateForm(f.id)
                    : null}
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
                const rowSelected = selection.type === 'event' && selection.id === entry.id;
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
                      meta={renamingEventId === entry.id ? undefined : eventRowMeta(entry)}
                      active={rowSelected}
                      hint={
                        isReferenceMode
                          ? rowHint
                          : 'Drag row to graph · double-click to open handler'
                      }
                      onSelect={() => selectEvent(entry.id)}
                      onOpen={() => openEventHomeGraph(entry.id)}
                      showOpenAffordance
                      canvasDrag={
                        !isReferenceMode
                          ? {
                              mimeType: EVENT_DRAG_MIME,
                              payload: JSON.stringify(dragPayload),
                            }
                          : undefined
                      }
                      suffix={
                        isReferenceMode ? undefined : (
                          <div className="flex items-center gap-0.5 shrink-0">
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
                            {renderEventCanvasStatus(entry.id, rowSelected, false, false)}
                            <RowActionsMenu
                              actions={[
                                {
                                  label: 'Rename',
                                  onClick: () => {
                                    setRenamingEventId(entry.id);
                                    setRenameEventName(entry.label);
                                  },
                                },
                                {
                                  label: 'Delete',
                                  onClick: () => handleDeleteEvent(entry.id),
                                  danger: true,
                                },
                              ]}
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
          {!isReferenceMode && variables.length < 3 ? (
            <div className={`${INDENT.l1} py-1 pr-2 ${sectionGridSpan(sectionViewModes.variables) ?? ''}`}>
              <button
                type="button"
                onClick={handleLoadDemoVariables}
                className="text-[10px] text-indigo-400/90 hover:text-indigo-300"
              >
                Load sample variables (datatypes demo)
              </button>
            </div>
          ) : null}
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
                  if (!isDataTypeCoaAllowed(value as VariableType, crossOverMode)) return;
                  setNewVarType(value as VariableType);
                }}
                options={LOGICAL_DATA_TYPE_DESCRIPTORS.map((descriptor) => ({
                  value: descriptor.id,
                  label: `${descriptor.label}${!isDataTypeCoaAllowed(descriptor.id, crossOverMode) ? ' (COA)' : ''}`,
                }))}
                placeholder="Type…"
              />
              <div className="flex flex-wrap gap-1">
                {(['instance', 'static', 'module'] as VariableBinding[]).map((binding) => (
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
                    declareBadge={undefined}
                    hoverBadge={
                      isReferenceMode
                        ? undefined
                        : renderVariableCanvasStatus(
                            v.id,
                            selection.type === 'variable' && selection.id === v.id,
                            false,
                            false
                          )
                    }
                    hint={
                      isReferenceMode
                        ? 'Click to focus references · Double-click to edit in inspector'
                        : 'Click to select · Double-click to open class graph'
                    }
                    onSelect={() => selectVariable(v.id, v.name)}
                    onOpen={() => openVariableHomeGraph(v.id)}
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
            title="Project files"
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

      <ExplorerFooterHint tab={panelTab} mode={mode} />

      <SymbolDeleteDialog
        open={pendingDelete !== null}
        kind={pendingDelete?.kind ?? 'variable'}
        symbolName={pendingDelete?.symbolName ?? ''}
        nodeCount={pendingUsage.nodeCount}
        graphCount={pendingUsage.graphCount}
        onCancel={() => setPendingDelete(null)}
        onDeleteSymbolOnly={() => {
          if (!pendingDelete) return;
          deleteSymbol(pendingDelete.kind, pendingDelete.symbolId, 'symbol_only');
          setPendingDelete(null);
        }}
        onDeleteSymbolAndRefs={() => {
          if (!pendingDelete) return;
          deleteSymbol(pendingDelete.kind, pendingDelete.symbolId, 'symbol_and_refs');
          setPendingDelete(null);
        }}
      />
    </ExplorerPanelShell>
  );
}
