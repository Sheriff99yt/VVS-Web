'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Variable,
  PlaySquare,
  GitBranch,
  Radio,
  ExternalLink,
  GripVertical,
  Layers,
  Boxes,
  PenLine,
} from 'lucide-react';
import type { FunctionBinding, FunctionSymbol, ClassSymbol, GraphContainer } from '@vvs/graph-types';
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
import { PANEL_SCROLL_ATTR } from '@/components/graph/useBlockCanvasWheel';
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
import {
  listEventDispatchers,
} from '@/lib/projectTree';
import { createEventId, EVENT_DRAG_MIME, type EventDragPayload } from '@/lib/eventHelpers';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { SPAWN_EVENT_NODE_EVENT } from '@/components/layout/GraphFloatingDetails';
import {
  findHandlerNodeForEvent,
  findMemberDeclareNodeForSymbol,
  findClassDefineNode,
  hasDefineNodeForClass,
  hasDefineNodeForEvent,
  hasDefineNodeForFunction,
  hasHandlerNodeForEvent,
  insertClassDefineNode,
  insertDefineNodeForEvent,
  insertDefineNodeForFunction,
} from '@/lib/defineNodeSync';
import {
  dispatchSpawnEnvironmentNode,
  type EnvironmentSpawnAction,
} from '@/lib/environmentHelpers';
import { getLinkedEnvironmentManifest } from '@/lib/environmentContext';
import { resolveApiSurface } from '@vvs/environment-templates';
import { SymbolDeleteDialog } from '@/components/layout/SymbolDeleteDialog';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { useClassLifecycle } from '@/hooks/useClassLifecycle';
import { useGraphContainerLifecycle } from '@/hooks/useGraphContainerLifecycle';
import { CLASS_DRAG_MIME, classDragPayload, isClassFolderDragEvent, readClassIdFromFolderDragEvent } from '@/lib/classHelpers';
import {
  configureCanvasDrag,
  configureClassFolderDrag,
  configureTreeReorderDrag,
  graphContainerDragPayload,
  parseGraphContainerDragPayload,
  TREE_DRAG_MIME,
} from '@/lib/treeDrag';
import {
  classGraphTabId,
  classContainerId,
  classScopedSymbols,
  classesForContainer,
  containerMatchesFilter,
  symbolClassId,
} from '@/lib/classScope';
import type { GraphTab } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { getSymbolDisplayName } from '@/lib/symbolLifecycle';
import type { SymbolRefKind } from '@vvs/graph-types';
import { TreeRow } from './project-tree/TreeRow';
import { CategorySection } from './project-tree/CategorySection';
import { PanelFilter } from './project-tree/PanelFilter';
import { ExplorerTabs } from './project-tree/ExplorerTabs';
import type { ExplorerTab } from './project-tree/constants';
import { ProjectScopeHeader } from './project-tree/ProjectScopeHeader';
import { CanvasStatusBadge } from './project-tree/CanvasStatusBadge';
import { CodegenSuffix } from './project-tree/CodegenSuffix';
import { SymbolCreatePopover } from './project-tree/SymbolCreatePopover';
import { ClassFolderDropStrip } from './project-tree/ClassFolderDropStrip';
import { OutputFolderToggle } from './project-tree/OutputFolderToggle';
import { MergedStructureExplorer } from './project-tree/MergedStructureExplorer';
import { INDENT, type SymbolCategoryKey } from './project-tree/constants';
import { useProjectFolderPaths } from '@/hooks/useProjectFolderPaths';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { containerEmitHint } from '@/lib/structureOutputFiles';

function VariableRow({
  variable,
  isSelected,
  color,
  hint,
  onSelect,
  onOpen,
  onDelete,
}: {
  variable: {
    id: string;
    name: string;
    type: string;
    binding?: string;
    flags?: { readonly?: boolean };
  };
  isSelected: boolean;
  color: string;
  hint?: string;
  onSelect?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${INDENT.l1} py-1 pr-2 cursor-pointer group ${
        isSelected ? 'bg-indigo-500/10 text-indigo-100' : 'hover:bg-zinc-900/60 text-zinc-300'
      }`}
      onClick={onSelect}
      onDoubleClick={(e) => {
        if (!onOpen) return;
        e.preventDefault();
        onOpen();
      }}
      title={hint ?? (onOpen ? 'Click to select · Double-click to open' : 'Click to select')}
      draggable
      onDragStart={(e) => {
        configureCanvasDrag(e, {
          mimeType: TREE_DRAG_MIME.variable,
          payload: JSON.stringify(variable),
          effectAllowed: 'copy',
        });
      }}
    >
      <span className="w-4 shrink-0" />
      <div
        className="w-2 h-2 rounded-full border border-zinc-950 shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] truncate flex-1">{variable.name}</span>
      <span className="text-[9px] text-zinc-600 uppercase shrink-0">
        {LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === variable.type)?.shortLabel ??
          variable.type.replace(/^data_/, '')}
      </span>
      {variable.binding && variable.binding !== 'instance' ? (
        <span className="text-[8px] uppercase text-amber-500/80 shrink-0">{variable.binding}</span>
      ) : null}
      {variable.flags?.readonly ? (
        <span className="text-[8px] uppercase text-zinc-500 shrink-0">ro</span>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400 shrink-0"
          title="Remove variable"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={11} />
        </button>
      ) : null}
    </div>
  );
}

function matchesFilter(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query);
}

export type ProjectTreeMode = 'canvas' | 'references';

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
    graphContainers,
    activeClassId,
    setActiveClassId,
    setSelection,
    selection,
    setOpenTabs,
    setActiveGraphTab,
    activeGraphTab,
    projectDetails,
    targetLanguage,
    targetFileExtensions,
    crossOverMode,
    openTabs,
    isTabDirty,
    focusReference,
    referenceRootGraphId,
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
  const projectFilePaths = useMemo(
    () => projectFolderPaths.map((entry) => entry.path),
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

  const [pendingDelete, setPendingDelete] = useState<{
    kind: SymbolRefKind;
    symbolId: string;
    symbolName: string;
  } | null>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>('structure');
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [showOutputFolders, setShowOutputFolders] = useState(false);
  const [expanded, setExpanded] = useState<Record<SymbolCategoryKey, boolean>>({
    classes: false,
    functions: false,
    events: false,
    variables: false,
  });
  const [expandedContainerIds, setExpandedContainerIds] = useState<Record<string, boolean>>({});
  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [renamingContainerId, setRenamingContainerId] = useState<string | null>(null);
  const [renameContainerName, setRenameContainerName] = useState('');
  const [draggingClassId, setDraggingClassId] = useState<string | null>(null);
  const [dropContainerId, setDropContainerId] = useState<string | null>(null);
  const [draggingGraphContainerId, setDraggingGraphContainerId] = useState<string | null>(null);
  const [dropGraphContainerId, setDropGraphContainerId] = useState<string | null>(null);
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
  const [draggingFunctionId, setDraggingFunctionId] = useState<string | null>(null);
  const [dropFunctionId, setDropFunctionId] = useState<string | null>(null);

  const environmentManifest = useMemo(
    () => getLinkedEnvironmentManifest(environmentId),
    [environmentId]
  );
  const environmentSurface = useMemo(
    () =>
      environmentManifest ? resolveApiSurface(environmentManifest, targetLanguage) : null,
    [environmentManifest, targetLanguage]
  );

  const projectEvents = useMemo(
    () => listEventDispatchers(classEvents, documents, classes),
    [classEvents, documents, classes]
  );

  const q = filterQuery.trim().toLowerCase();

  const filteredClasses = useMemo(
    () =>
      classes.filter((cls) => {
        if (matchesFilter(cls.name, q)) return true;
        const container = graphContainers.find((c) => c.id === classContainerId(cls));
        return container ? matchesFilter(container.name, q) : false;
      }),
    [classes, graphContainers, q]
  );

  const filteredFunctions = useMemo(
    () => classFunctions.filter((f) => matchesFilter(f.name, q)),
    [classFunctions, q]
  );
  const filteredVariables = useMemo(
    () => classVariables.filter((v) => matchesFilter(v.name, q) || matchesFilter(v.type, q)),
    [classVariables, q]
  );
  const filteredEvents = useMemo(
    () => projectEvents.filter((d) => matchesFilter(d.label, q)),
    [projectEvents, q]
  );

  useEffect(() => {
    if (!q) return;
    setExpanded((state) => ({
      ...state,
      ...(filteredClasses.length > 0 && !state.classes ? { classes: true } : {}),
      ...(filteredFunctions.length > 0 && !state.functions ? { functions: true } : {}),
      ...(filteredEvents.length > 0 && !state.events ? { events: true } : {}),
      ...(filteredVariables.length > 0 && !state.variables ? { variables: true } : {}),
    }));
  }, [q, filteredClasses.length, filteredFunctions.length, filteredEvents.length, filteredVariables.length]);

  useEffect(() => {
    if (explorerTab !== 'symbols') return;
    setExpanded((state) => ({
      ...state,
      ...(classes.length > 0 && !state.classes ? { classes: true } : {}),
      ...(classEvents.length > 0 && !state.events ? { events: true } : {}),
    }));
  }, [explorerTab, classes.length, classEvents.length]);
  const graphSectionCount = graphContainers.length;

  const containerMatches = useCallback(
    (container: GraphContainer) =>
      containerMatchesFilter(container, classes, q, matchesFilter),
    [classes, q]
  );

  const visibleGraphContainers = useMemo(() => {
    return graphContainers.filter((container) => containerMatches(container));
  }, [graphContainers, containerMatches]);

  const projectCodegenDefaults = useMemo(
    () => ({ targetLanguage, targetFileExtensions }),
    [targetLanguage, targetFileExtensions]
  );

  useEffect(() => {
    if (selection.type === 'function') {
      setExplorerTab('symbols');
      setExpanded((state) => ({ ...state, functions: true }));
    } else if (selection.type === 'event') {
      setExplorerTab('symbols');
      setExpanded((state) => ({ ...state, events: true }));
    } else if (selection.type === 'variable') {
      setExplorerTab('symbols');
      setExpanded((state) => ({ ...state, variables: true }));
    } else if (selection.type === 'class') {
      setExplorerTab('symbols');
      setExpanded((state) => ({ ...state, classes: true }));
    } else if (selection.type === 'graph') {
      setExplorerTab('structure');
    }
  }, [selection.type]);

  const toggleCategory = (key: SymbolCategoryKey) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

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

  const revealClassGraphInTree = useCallback(
    (container: GraphContainer | undefined) => {
      setFoldersExpanded(true);
      setExplorerTab('structure');
      if (container) {
        setExpandedContainerIds((prev) => ({ ...prev, [container.id]: true }));
      }
    },
    []
  );

  const openGraphContainer = useCallback(
    (container: GraphContainer) => {
      editorFocus.focusGraphContainer(container);
      revealClassGraphInTree(container);
    },
    [editorFocus, revealClassGraphInTree]
  );

  const openGraphById = useCallback(
    (graphId: string) => {
      const container = graphContainers.find((c) => c.id === graphId);
      if (container) {
        openGraphContainer(container);
        return;
      }
      if (graphId === 'main') {
        openGraph('main', 'main');
        return;
      }
      const tab = openTabs.find((t) => t.id === graphId);
      if (tab?.type === 'class') {
        openGraph(graphId, 'class');
        return;
      }
      openGraph(graphId, 'function');
    },
    [graphContainers, openGraph, openGraphContainer, openTabs]
  );

  const toggleContainerExpanded = useCallback((containerId: string) => {
    setExpandedContainerIds((prev) => ({ ...prev, [containerId]: !prev[containerId] }));
  }, []);

  const handleSaveClass = () => {
    if (!newClassName.trim() || !newClassContainerId) return;
    addClassWithDefine(newClassName.trim(), newClassContainerId);
    setNewClassName('');
    setIsAddingClass(false);
    setExpandedContainerIds((prev) => ({ ...prev, [newClassContainerId]: true }));
    setExplorerTab('symbols');
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
    setExpandedContainerIds((prev) => ({ ...prev, [container.id]: true }));
    setFoldersExpanded(true);
    setExplorerTab('structure');
  };

  const handleSaveContainerRename = (container: GraphContainer) => {
    const name = renameContainerName.trim();
    if (!name) return;
    renameContainer(container.id, name);
    setRenamingContainerId(null);
    setRenameContainerName('');
  };

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
      setExpandedContainerIds((prev) => ({ ...prev, [containerId]: true }));
      setDraggingClassId(null);
      setDropContainerId(null);
    },
    [
      draggingClassId,
      draggingGraphContainerId,
      moveClassToContainer,
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
      setExplorerTab('symbols');
      setExpanded((s) => ({ ...s, classes: true }));
    },
    [setActiveClassId, setSelection]
  );

  const selectFunction = useCallback(
    (func: FunctionSymbol) => {
      setSelection({ type: 'function', id: func.id });
      const classId = symbolClassId(func);
      if (classId) setActiveClassId(classId);
      setExplorerTab('symbols');
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

  const canReorderFunctions = !q;

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

  const handleFunctionDragStart = useCallback((e: React.DragEvent, funcId: string) => {
    configureTreeReorderDrag(e, TREE_DRAG_MIME.functionReorder, funcId);
    setDraggingFunctionId(funcId);
  }, []);

  const handleFunctionDragEnd = useCallback(() => {
    setDraggingFunctionId(null);
    setDropFunctionId(null);
  }, []);

  const handleFunctionDragOver = useCallback(
    (e: React.DragEvent, funcId: string) => {
      if (!canReorderFunctions || !draggingFunctionId || draggingFunctionId === funcId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropFunctionId(funcId);
    },
    [canReorderFunctions, draggingFunctionId]
  );

  const handleFunctionDrop = useCallback(
    (e: React.DragEvent, funcId: string) => {
      if (!canReorderFunctions) return;
      e.preventDefault();
      e.stopPropagation();
      const fromId =
        e.dataTransfer.getData(TREE_DRAG_MIME.functionReorder) || draggingFunctionId;
      if (!fromId || fromId === funcId) return;
      setFunctions((prev) => reorderFunctionSymbols(prev, fromId, funcId));
      setDraggingFunctionId(null);
      setDropFunctionId(null);
    },
    [canReorderFunctions, draggingFunctionId, setFunctions]
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

  const eventRowMeta = (entry: { dispatchCount: number; subscriberCount: number }) => {
    const parts: string[] = [];
    if (entry.dispatchCount > 0) {
      parts.push(`${entry.dispatchCount} dispatch${entry.dispatchCount === 1 ? '' : 'es'}`);
    }
    if (entry.subscriberCount > 0) {
      parts.push(`${entry.subscriberCount} sub`);
    }
    return parts.length > 0 ? parts.join(' · ') : undefined;
  };

  const focusOrInsertClassDeclare = useCallback(
    (cls: ClassSymbol, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'class', id: cls.id });

      const declared = hasDefineNodeForClass(documents, cls);
      if (declared) {
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
    [
      documents,
      isReferenceMode,
      editorFocus,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
    ]
  );

  const renderClassCanvasStatus = (cls: ClassSymbol) => {
    if (!documents || isReferenceMode) return null;
    const declared = hasDefineNodeForClass(documents, cls);
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        onClick={(e) => focusOrInsertClassDeclare(cls, e)}
      />
    );
  };

  const focusOrInsertFunctionDeclare = useCallback(
    (func: FunctionSymbol, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const cls = classes.find((c) => c.id === symbolClassId(func));
      if (!cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'function', id: func.id });

      const declared = hasDefineNodeForFunction(documents, cls, func.id);
      if (declared) {
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
    [
      documents,
      isReferenceMode,
      classes,
      editorFocus,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
    ]
  );

  const focusOrInsertEventDeclare = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const event = events.find((item) => item.id === eventId);
      const cls = event ? classes.find((c) => c.id === symbolClassId(event)) : undefined;
      if (!event || !cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'event', id: eventId });

      const declared = hasDefineNodeForEvent(documents, cls, eventId);
      if (declared) {
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
    [
      documents,
      isReferenceMode,
      events,
      classes,
      editorFocus,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
    ]
  );

  const focusOrInsertEventHandler = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!documents || isReferenceMode) return;
      const event = events.find((item) => item.id === eventId);
      const cls = event ? classes.find((c) => c.id === symbolClassId(event)) : undefined;
      if (!event || !cls) return;

      editorFocus.focusTreeSymbolOnClass(cls, { type: 'event', id: eventId });

      const hasHandler = hasHandlerNodeForEvent(documents, eventId);
      if (hasHandler) {
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

  const renderFunctionCanvasStatus = (func: FunctionSymbol) => {
    if (!documents || isReferenceMode) return null;
    const cls = classes.find((c) => c.id === symbolClassId(func));
    if (!cls) return null;
    const declared = hasDefineNodeForFunction(documents, cls, func.id);
    return (
      <CanvasStatusBadge
        label="Declare"
        ok={declared}
        onClick={(e) => focusOrInsertFunctionDeclare(func, e)}
      />
    );
  };

  const renderEventCanvasStatus = (eventId: string) => {
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
          onClick={(e) => focusOrInsertEventDeclare(eventId, e)}
        />
        <CanvasStatusBadge
          label="Handler"
          ok={hasHandler}
          onClick={(e) => focusOrInsertEventHandler(eventId, e)}
        />
      </div>
    );
  };

  const selectVariable = isReferenceMode ? selectVariableForReferences : selectVariableInCanvas;

  const isGraphReferenceActive = useCallback(
    (graphId: string) => {
      if (isReferenceMode) {
        return referenceRootGraphId === graphId && referenceVariableName === null;
      }
      if (graphId === 'main') {
        return selection.type === 'graph' && selection.id === null;
      }
      return selection.type === 'graph' && selection.id === graphId;
    },
    [isReferenceMode, referenceRootGraphId, referenceVariableName, selection]
  );

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
    setExplorerTab('symbols');
    setExpanded((s) => ({ ...s, functions: true }));
    setNewFuncName('');
    setNewFuncBinding('instance');
    setIsAddingFunction(false);
  };

  const getVariableColor = (type: string) => {
    switch (type) {
      case 'data_string':
      case 'string':
        return '#38bdf8';
      case 'data_number':
      case 'number':
        return '#4ade80';
      case 'data_boolean':
      case 'boolean':
        return '#f87171';
      case 'data_object':
      case 'object':
        return '#a78bfa';
      case 'data_array':
      case 'array':
        return '#fbbf24';
      case 'data_any':
      case 'any':
        return '#94a3b8';
      default:
        return '#71717a';
    }
  };

  const renderFunctionCreateForm = () => (
    <div className="space-y-1.5">
      <input
        type="text"
        placeholder="Function name"
        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
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
            className={`px-1.5 py-0.5 rounded text-[9px] border ${
              newFuncBinding === binding
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {binding}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={handleSaveFunction}
          className="flex-1 px-2 py-1 rounded bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30"
        >
          Create & open
        </button>
        <button
          type="button"
          onClick={() => {
            setIsAddingFunction(false);
            setNewFuncName('');
            setNewFuncBinding('instance');
          }}
          className="px-2 py-1 rounded text-[10px] text-zinc-500 border border-zinc-800 hover:text-zinc-300"
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

  const emptyHint = (text: string) => (
    <div className={`${INDENT.l1} text-[10px] text-zinc-600 italic py-1 pr-2`}>{text}</div>
  );

  const rowHint = isReferenceMode ? 'Click focus · dbl-click open' : 'Click select · dbl-click open';

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col border-r border-zinc-800 min-h-0 min-w-[200px]">
      <ProjectScopeHeader
        projectName={projectDetails.moduleName}
        activeGraphTab={activeGraphTab}
        openTabs={openTabs}
        classes={classes}
        activeClassId={activeClassId}
        mode={mode}
      />

      <div className="flex-none flex items-center gap-1 px-2 py-1 border-b border-zinc-800/60">
        <PanelFilter value={filterQuery} onChange={setFilterQuery} placeholder="Filter…" />
        {explorerTab === 'structure' ? (
          <OutputFolderToggle enabled={showOutputFolders} onChange={setShowOutputFolders} />
        ) : null}
      </div>

      <ExplorerTabs
        value={explorerTab}
        onChange={setExplorerTab}
        showApiTab={Boolean(environmentSurface && environmentManifest)}
      />

      {!isReferenceMode ? (
        <ClassFolderDropStrip
          containers={visibleGraphContainers}
          draggingClassId={draggingClassId}
          dropContainerId={dropContainerId}
          onContainerDragOver={handleContainerDragOver}
          onContainerDrop={handleContainerDrop}
          onContainerDragLeave={(containerId) => {
            setDropContainerId((id) => (id === containerId ? null : id));
          }}
        />
      ) : null}

      <div className="flex-1 overflow-y-auto min-h-0 py-0.5 overscroll-contain" {...{ [PANEL_SCROLL_ATTR]: '' }}>
        {explorerTab === 'structure' ? (
        <>
        <CategorySection
          title={showOutputFolders ? 'Project folder' : 'Folders'}
          count={showOutputFolders ? projectFolderPaths.length : graphSectionCount}
          icon={<GitBranch size={12} className="text-emerald-500/80 shrink-0" />}
          expanded={foldersExpanded}
          onToggle={() => setFoldersExpanded((open) => !open)}
          onAdd={() => {
            setIsAddingContainer(true);
            setFoldersExpanded(true);
          }}
          addLabel="New folder"
        >
          {isAddingContainer ? (
            <SymbolCreatePopover
              open
              title="New folder"
              onClose={() => {
                setIsAddingContainer(false);
                setNewContainerName('');
              }}
              anchorClassName={INDENT.l1}
            >
              <input
                type="text"
                placeholder="Folder name"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
                value={newContainerName}
                onChange={(e) => setNewContainerName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveContainer();
                  if (e.key === 'Escape') {
                    setIsAddingContainer(false);
                    setNewContainerName('');
                  }
                }}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleSaveContainer}
                  className="flex-1 px-2 py-1 rounded bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingContainer(false);
                    setNewContainerName('');
                  }}
                  className="px-2 py-1 rounded text-[10px] text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </SymbolCreatePopover>
          ) : null}
          {showOutputFolders ? (
            <MergedStructureExplorer
              entries={projectFolderPaths}
              fileOwners={fileOwners}
              filePaths={projectFilePaths}
              pathKinds={projectFolderPathKinds}
              graphContainers={visibleGraphContainers}
              classes={classes}
              functions={functions}
              documents={documents}
              projectCodegenDefaults={projectCodegenDefaults}
              activeGraphTab={activeGraphTab}
              activeClassId={activeClassId}
              selection={selection}
              isReferenceMode={isReferenceMode}
              isTabDirty={isTabDirty}
              expandedContainerIds={expandedContainerIds}
              toggleContainerExpanded={toggleContainerExpanded}
              draggingClassId={draggingClassId}
              draggingGraphContainerId={draggingGraphContainerId}
              dropContainerId={dropContainerId}
              dropGraphContainerId={dropGraphContainerId}
              onClassDragStart={handleClassDragStart}
              onClassDragEnd={handleClassDragEnd}
              onGraphContainerDragStart={handleGraphContainerDragStart}
              onGraphContainerDragEnd={handleGraphContainerDragEnd}
              onContainerDragOver={handleContainerDragOver}
              onContainerDrop={handleContainerDrop}
              onContainerDragLeave={(containerId) => {
                setDropContainerId((id) => (id === containerId ? null : id));
                setDropGraphContainerId((id) => (id === containerId ? null : id));
              }}
              selectGraph={selectGraph}
              openGraphContainer={openGraphContainer}
              selectClass={selectClass}
              openClassGraph={openClassGraph}
              openGraph={(graphId) => openGraph(graphId, 'function')}
              classSymbolCounts={classSymbolCounts}
              canRenameContainer={canRenameContainer}
              canDeleteContainer={canDeleteContainer}
              deleteContainer={deleteContainer}
              onStartRenameContainer={(container) => {
                setRenamingContainerId(container.id);
                setRenameContainerName(container.name);
              }}
              renamingContainerId={renamingContainerId}
              renameContainerName={renameContainerName}
              setRenameContainerName={setRenameContainerName}
              onSaveContainerRename={handleSaveContainerRename}
              onCancelContainerRename={() => setRenamingContainerId(null)}
            />
          ) : null}
          {!showOutputFolders ? (
          <>
          {visibleGraphContainers
            .map((container) => {
              const containerClasses = classesForContainer(classes, container.id);
              return (
                <React.Fragment key={container.id}>
                  <TreeRow
                    leading={
                      !isReferenceMode ? (
                        <span
                          draggable
                          className="p-0.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                          title="Drag to reorder folder"
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(e) => handleGraphContainerDragStart(e, container)}
                          onDragEnd={handleGraphContainerDragEnd}
                        >
                          <GripVertical size={10} />
                        </span>
                      ) : (
                        <span className="w-2.5" />
                      )
                    }
                    icon={<GitBranch size={10} className="text-emerald-500/80 shrink-0" />}
                    label={
                      renamingContainerId === container.id ? renameContainerName : container.name
                    }
                    meta={
                      [
                        `${containerClasses.length} class${containerClasses.length === 1 ? '' : 'es'}`,
                        showOutputFolders ? containerEmitHint(container) : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                    hint="Click to select · Double-click to open · Drop class from Symbols to set output folder"
                    active={activeGraphTab === container.id}
                    isDragging={draggingGraphContainerId === container.id}
                    isDropTarget={
                      dropContainerId === container.id || dropGraphContainerId === container.id
                    }
                    onSelect={() => selectGraph(container.id)}
                    onOpen={() => openGraphContainer(container)}
                    showOpenAffordance
                    onDragOver={(e) => handleContainerDragOver(e, container.id)}
                    onDrop={(e) => handleContainerDrop(e, container.id)}
                    onDragLeave={() => {
                      setDropContainerId((id) => (id === container.id ? null : id));
                      setDropGraphContainerId((id) => (id === container.id ? null : id));
                    }}
                    suffix={
                      !isReferenceMode ? (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                          {canRenameContainer(container) ? (
                            <button
                              type="button"
                              className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                              title="Rename folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingContainerId(container.id);
                                setRenameContainerName(container.name);
                              }}
                            >
                              <PenLine size={10} />
                            </button>
                          ) : null}
                          {canDeleteContainer(container) ? (
                            <button
                              type="button"
                              className="p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                              title="Delete folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteContainer(container.id);
                              }}
                            >
                              <Trash2 size={10} />
                            </button>
                          ) : null}
                        </div>
                      ) : null
                    }
                  />
                  {renamingContainerId === container.id ? (
                    <div className={`${INDENT.l2} py-1 pr-2 flex gap-1`}>
                      <input
                        type="text"
                        value={renameContainerName}
                        onChange={(e) => setRenameContainerName(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveContainerRename(container);
                          if (e.key === 'Escape') setRenamingContainerId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveContainerRename(container)}
                        className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                      >
                        Save
                      </button>
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          {visibleGraphContainers.length === 0 &&
          !isAddingContainer
            ? emptyHint('No match.')
            : null}
          </>
          ) : null}
        </CategorySection>
        </>
        ) : null}

        {explorerTab === 'api' && environmentSurface && environmentManifest ? (
          <CategorySection
            title="Environment API"
            count={
              environmentSurface.events.length +
              environmentSurface.natives.length +
              environmentSurface.overrideable.length
            }
            icon={<Layers size={12} className="text-indigo-400/80 shrink-0" />}
            expanded
            onToggle={() => {}}
          >
            {environmentManifest ? (
              <div className={`${INDENT.l1} text-[9px] text-indigo-400/80 truncate pr-2 pb-1`}>
                {environmentManifest.displayName}
                {environmentVersion ? (
                  <span className="text-zinc-600 font-mono"> · v{environmentVersion}</span>
                ) : null}
              </div>
            ) : null}
            {environmentSurface.events
              .filter((e) => matchesFilter(e.name, q))
              .map((event) => (
                <TreeRow
                  key={event.id}
                  icon={<Radio size={10} className="text-indigo-400/70 shrink-0" />}
                  label={event.name}
                  meta="event"
                  hint="Spawn handler"
                  suffix={
                    !isReferenceMode ? (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          className="px-1 py-0.5 rounded text-[8px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                          title="Add handler"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatchSpawnEnvironmentNode('event_handler', event.id);
                          }}
                        >
                          Handler
                        </button>
                      </div>
                    ) : null
                  }
                />
              ))}
            {environmentSurface.natives
              .filter((m) => matchesFilter(m.name, q))
              .map((method) => (
                <TreeRow
                  key={method.id}
                  icon={<PlaySquare size={10} className="text-sky-400/70 shrink-0" />}
                  label={`${method.name}()`}
                  meta="native"
                  hint="Spawn native call node"
                  suffix={
                    !isReferenceMode ? (
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-[8px] bg-sky-500/20 text-sky-200 border border-sky-500/30"
                        title="Add call"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatchSpawnEnvironmentNode('call_native' as EnvironmentSpawnAction, method.id);
                        }}
                      >
                        Call
                      </button>
                    ) : null
                  }
                />
              ))}
            {environmentSurface.overrideable
              .filter((m) => matchesFilter(m.name, q))
              .map((method) => (
                <TreeRow
                  key={method.id}
                  icon={<GitBranch size={10} className="text-amber-400/70 shrink-0" />}
                  label={`${method.name}()`}
                  meta="override"
                  hint="Spawn override handler"
                  suffix={
                    !isReferenceMode ? (
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-200 border border-amber-500/30"
                        title="Add override"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatchSpawnEnvironmentNode('event_handler', method.id);
                        }}
                      >
                        Override
                      </button>
                    ) : null
                  }
                />
              ))}
          </CategorySection>
        ) : null}

        {explorerTab === 'symbols' ? (
        <>
        <CategorySection
          title="Classes"
          count={classes.length}
          icon={<Boxes size={12} className="text-violet-400/80 shrink-0" />}
          expanded={expanded.classes}
          onToggle={() => toggleCategory('classes')}
          onAdd={() => {
            setIsAddingClass(true);
            setNewClassContainerId(defaultClassContainerId());
            setExplorerTab('symbols');
            setExpanded((s) => ({ ...s, classes: true }));
          }}
          addLabel="New class"
        >
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
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
            <label className="block text-[9px] text-zinc-500 uppercase tracking-wide">Output folder</label>
            <select
              value={newClassContainerId}
              onChange={(e) => setNewClassContainerId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-zinc-600"
            >
              {graphContainers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-[11px] px-2 py-1 rounded border border-indigo-500/30"
              onClick={handleSaveClass}
            >
              Create & open
            </button>
          </SymbolCreatePopover>
          {filteredClasses.length === 0 && !isAddingClass
            ? emptyHint(classes.length === 0 ? 'No classes — use + to add' : 'No match.')
            : filteredClasses.map((cls) => {
                const counts = classSymbolCounts(cls.id);
                const isActive = activeClassId === cls.id;
                const mainTabId = classGraphTabId(cls);
                const folderName =
                  graphContainers.find((c) => c.id === classContainerId(cls))?.name ?? 'Project map';
                return (
                  <React.Fragment key={cls.id}>
                    <TreeRow
                      active={isActive && activeGraphTab === mainTabId}
                      leading={
                        !isReferenceMode ? (
                          <span
                            draggable
                            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-0"
                            title="Drag grip to move output folder"
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
                      label={renamingClassId === cls.id ? renameClassName : cls.name}
                      meta={
                        [
                          folderName,
                          isActive ? 'active' : undefined,
                          `fn ${counts.functions} · evt ${counts.events} · var ${counts.variables}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      }
                      hint="Drag row to canvas · drag grip to move folder · double-click to open class graph"
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
                          {renderClassCanvasStatus(cls)}
                          <CodegenSuffix
                            tabId={mainTabId}
                            documents={documents}
                            projectDefaults={projectCodegenDefaults}
                          />
                          {!isReferenceMode ? (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                              {isTabDirty(mainTabId) ? (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                                  title="Uncompiled changes"
                                />
                              ) : null}
                              <button
                                type="button"
                                className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                                title="Rename class"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingClassId(cls.id);
                                  setRenameClassName(cls.name);
                                }}
                              >
                                <PenLine size={10} />
                              </button>
                              {canDeleteClass ? (
                                <button
                                  type="button"
                                  className="p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                                  title="Delete class"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteClass(cls.id);
                                  }}
                                >
                                  <Trash2 size={10} />
                                </button>
                              ) : null}
                            </div>
                          ) : isTabDirty(mainTabId) ? (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                              title="Uncompiled changes"
                            />
                          ) : null}
                        </div>
                      }
                    />
                    {renamingClassId === cls.id ? (
                      <div className={`${INDENT.l2} py-1 pr-2 flex gap-1`}>
                        <input
                          type="text"
                          value={renameClassName}
                          onChange={(e) => setRenameClassName(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClassRename(cls);
                            if (e.key === 'Escape') setRenamingClassId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveClassRename(cls)}
                          className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                        >
                          Save
                        </button>
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}
        </CategorySection>

        <CategorySection
          title="Functions"
          count={classFunctions.length}
          icon={<PlaySquare size={12} className="text-indigo-400/80 shrink-0" />}
          expanded={expanded.functions}
          onToggle={() => toggleCategory('functions')}
          onAdd={() => {
            setIsAddingFunction(true);
            setExplorerTab('symbols');
            setExpanded((s) => ({ ...s, functions: true }));
          }}
          addLabel="New function"
        >
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
          {filteredFunctions.length === 0 && !isAddingFunction
            ? emptyHint(classFunctions.length === 0 ? 'Empty — use + to add' : '—')
            : filteredFunctions.map((f) => {
                const primaryOverload = f.overloads[0];
                const extraOverloads = f.overloads.slice(1);
                const primaryDragPayload: FunctionOverloadDragPayload | null = primaryOverload
                  ? { functionId: f.id, overloadId: primaryOverload.id }
                  : null;
                return (
                <React.Fragment key={f.id}>
                  <TreeRow
                    active={selection.type === 'function' && selection.id === f.id}
                    isDragging={draggingFunctionId === f.id}
                    isDropTarget={dropFunctionId === f.id}
                    leading={
                      canReorderFunctions ? (
                        <span
                          draggable
                          onDragStart={(e) => handleFunctionDragStart(e, f.id)}
                          onDragEnd={handleFunctionDragEnd}
                          className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-0"
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
                    label={f.name}
                    meta={
                      f.binding !== 'instance'
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
                        <CodegenSuffix
                          tabId={f.id}
                          documents={documents}
                          projectDefaults={projectCodegenDefaults}
                        />
                        {renderFunctionCanvasStatus(f)}
                        {isTabDirty(f.id) ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Uncompiled changes" />
                        ) : null}
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                          title="Add overload"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingOverloadForId(f.id);
                            selectFunction(f);
                          }}
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-indigo-300"
                          title="Open graph"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGraph(f.id, 'function');
                          }}
                        >
                          <ExternalLink size={11} />
                        </button>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                          title="Remove function"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFunction(f.id);
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
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
                        meta={`override ${index + 2}`}
                        hint="Drag to graph to call this override · click to open"
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
              })}
        </CategorySection>

        {/* Events — class-scoped custom events */}
        <CategorySection
          title="Events"
          count={projectEvents.length}
          icon={<Radio size={12} className="text-violet-400/80 shrink-0" />}
          expanded={expanded.events}
          onToggle={() => toggleCategory('events')}
          onAdd={() => {
            setIsAddingEvent(true);
            setExplorerTab('symbols');
            setExpanded((s) => ({ ...s, events: true }));
          }}
          addLabel="New event"
        >
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
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
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-2 py-1 rounded"
              onClick={handleSaveEvent}
            >
              Add
            </button>
          </SymbolCreatePopover>
          {filteredEvents.length === 0 && !isAddingEvent
            ? emptyHint(
                projectEvents.length === 0
                  ? 'No events yet — use + to add, then drag the dispatch row to graph.'
                  : 'No match.'
              )
            : filteredEvents.map((entry) => {
                const dragPayload: EventDragPayload = {
                  eventId: entry.id,
                  eventName: entry.label,
                };
                const isSymbolEvent = classEvents.some((event) => event.id === entry.id);
                return (
                  <React.Fragment key={entry.id}>
                    <TreeRow
                      icon={<Radio size={10} className="text-violet-400/70 shrink-0" />}
                      label={entry.label}
                      meta={eventRowMeta(entry)}
                      active={selection.type === 'event' && selection.id === entry.id}
                      hint={
                        isReferenceMode
                          ? rowHint
                          : isSymbolEvent
                            ? 'Drag row to graph · double-click to open handler'
                            : 'Click to select · double-click to open handler on class graph'
                      }
                      onSelect={() => selectEvent(entry.id)}
                      onOpen={() => openEventHomeGraph(entry.id)}
                      showOpenAffordance={isSymbolEvent}
                      canvasDrag={
                        !isReferenceMode
                          ? {
                              mimeType: EVENT_DRAG_MIME,
                              payload: JSON.stringify(dragPayload),
                            }
                          : undefined
                      }
                      suffix={
                        isReferenceMode || !isSymbolEvent ? undefined : (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {renderEventCanvasStatus(entry.id)}
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                              title="Remove event"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(entry.id);
                              }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )
                      }
                    />
                    {!isReferenceMode ? (
                      <TreeRow
                        depth="l2"
                        icon={<div className="w-1 h-1 rounded-full bg-violet-400/60 shrink-0 ml-2" />}
                        label="dispatch"
                        meta={entry.dispatchCount > 0 ? `${entry.dispatchCount} on canvas` : 'drag to graph'}
                        hint="Drag to graph to spawn a dispatch node"
                        canvasDrag={{
                          mimeType: EVENT_DRAG_MIME,
                          payload: JSON.stringify(dragPayload),
                        }}
                        onSelect={() => selectEvent(entry.id)}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
        </CategorySection>

        <CategorySection
          title="Variables"
          count={classVariables.length}
          icon={<Variable size={12} className="text-sky-400/80 shrink-0" />}
          expanded={expanded.variables}
          onToggle={() => toggleCategory('variables')}
          onAdd={() => {
            setIsAddingVariable(true);
            setExplorerTab('symbols');
            setExpanded((s) => ({ ...s, variables: true }));
          }}
          addLabel="New variable"
        >
          {!isReferenceMode && variables.length < 3 ? (
            <div className={`${INDENT.l1} py-1 pr-2`}>
              <button
                type="button"
                onClick={handleLoadDemoVariables}
                className="text-[10px] text-indigo-400/90 hover:text-indigo-300"
              >
                Load sample variables (datatypes demo)
              </button>
            </div>
          ) : null}
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
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
                  disabled={!isBindingCoaAllowed(binding, crossOverMode)}
                  onClick={() => setNewVarBinding(binding)}
                  className={`px-1.5 py-0.5 text-[9px] rounded border ${
                    newVarBinding === binding
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  } disabled:opacity-40`}
                >
                  {binding}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-2 py-1 rounded"
              onClick={handleSaveVariable}
            >
              Add
            </button>
          </SymbolCreatePopover>
          {filteredVariables.length === 0 && !isAddingVariable
            ? emptyHint(classVariables.length === 0 ? 'No variables yet.' : 'No match.')
            : filteredVariables.map((v) => (
                <VariableRow
                  key={v.id}
                  variable={v}
                  isSelected={isVariableActive(v.id, v.name)}
                  color={getVariableColor(v.type)}
                  hint={
                    isReferenceMode
                      ? 'Click to focus references · Double-click to edit in inspector'
                      : 'Click to select · Double-click to open class graph'
                  }
                  onSelect={() => selectVariable(v.id, v.name)}
                  onOpen={() => openVariableHomeGraph(v.id)}
                  onDelete={isReferenceMode ? undefined : () => handleDeleteVariable(v.id)}
                />
              ))}
        </CategorySection>
        </>
        ) : null}
      </div>

      <div className="flex-none px-3 py-1 border-t border-zinc-800 text-[9px] text-zinc-600 text-center">
        {isReferenceMode
          ? 'Click select · double-click open'
          : 'Structure (folders) · Symbols (classes, functions, events, variables) · drag class to folder for output paths'}
      </div>

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
    </div>
  );
}
