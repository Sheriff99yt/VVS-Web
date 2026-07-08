'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  FileCode2,
  FolderOutput,
  Search,
  X,
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
import {
  openFunctionGraphTab,
  openGraphContainerTab,
  openMainGraph,
} from '@/lib/graphTabs';
import { defaultValueForVariableType, VariableType } from '@/lib/variableDefaults';
import { mergeDemoVariables } from '@/lib/demoVariables';
import {
  isBindingCoaAllowed,
  isDataTypeCoaAllowed,
} from '@/lib/variableCoaUi';
import type { VariableBinding } from '@/types/graph';
import { findGraphIdsUsingVariable } from '@/lib/graphRelations';
import { dispatchSwitchEditorView } from '@/lib/editorNavigate';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import {
  listGeneratedExports,
  listEventDispatchers,
} from '@/lib/projectTree';
import { createEventId } from '@/lib/eventHelpers';
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
import { CLASS_DRAG_MIME, classDragPayload, parseClassDragPayload } from '@/lib/classHelpers';
import {
  configureCanvasDrag,
  configureClassTreeDrag,
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
import { getSymbolDisplayName } from '@/lib/symbolLifecycle';
import type { SymbolRefKind } from '@vvs/graph-types';

type CategoryKey =
  | 'graphs'
  | 'environment'
  | 'functions'
  | 'variables'
  | 'dispatchers'
  | 'generated';

const INDENT = { root: 'pl-2', l1: 'pl-5', l2: 'pl-8' };

interface TreeRowProps {
  depth?: keyof typeof INDENT;
  active?: boolean;
  icon?: React.ReactNode;
  leading?: React.ReactNode;
  label: string;
  meta?: string;
  suffix?: React.ReactNode;
  onSelect?: () => void;
  onOpen?: () => void;
  /** When true, single click invokes onOpen (chevron/leading handles expand separately). */
  openOnSelect?: boolean;
  hint?: string;
  className?: string;
  isDropTarget?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  /** Drag from tree onto the graph canvas (e.g. function overload call). */
  canvasDrag?: { mimeType: string; payload: string };
  /** Drag within the tree (e.g. move class between graph folders). */
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const SINGLE_CLICK_DELAY_MS = 220;

function TreeRow({
  depth = 'l1',
  active,
  icon,
  leading,
  label,
  meta,
  onSelect,
  onOpen,
  openOnSelect = false,
  hint,
  suffix,
  className = '',
  isDropTarget = false,
  isDragging = false,
  onDragOver,
  onDrop,
  onDragLeave,
  canvasDrag,
  onDragStart,
  onDragEnd,
}: TreeRowProps) {
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (!onSelect && !onOpen) return;
    if (openOnSelect && onOpen) {
      onOpen();
      return;
    }
    if (!onOpen) {
      onSelect?.();
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      onSelect?.();
      clickTimerRef.current = null;
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!onOpen || openOnSelect) return;
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    onOpen();
  };

  const interactive = Boolean(onSelect || onOpen);

  const handleCanvasDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e);
      return;
    }
    if (!canvasDrag) return;
    configureCanvasDrag(e, canvasDrag);
  };

  const draggable = Boolean(canvasDrag || onDragStart);

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleCanvasDragStart : undefined}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-1.5 py-1 pr-2 select-none group ${INDENT[depth]} ${
        interactive ? 'cursor-pointer' : ''
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        active ? 'bg-zinc-800/80 border-l-2 border-indigo-500' : 'hover:bg-zinc-900 border-l-2 border-transparent'
      } ${isDropTarget ? 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30' : ''} ${
        isDragging ? 'opacity-40' : ''
      } ${className}`}
      onClick={interactive ? handleClick : undefined}
      onDoubleClick={onOpen ? handleDoubleClick : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      title={
        hint ??
        (openOnSelect && onOpen
          ? 'Click to open'
          : onOpen
            ? 'Click to select · Double-click to open'
            : onSelect
              ? 'Click to select'
              : undefined)
      }
    >
      <span className="w-4 shrink-0 flex items-center justify-center">{leading}</span>
      {icon}
      <span className="flex-1 min-w-0 flex flex-col">
        <span
          className={`text-[11px] truncate ${
            active ? 'text-zinc-100 font-medium' : 'text-zinc-400 group-hover:text-zinc-200'
          }`}
        >
          {label}
        </span>
        {meta ? <span className="text-[9px] text-zinc-600 truncate">{meta}</span> : null}
      </span>
      {suffix}
    </div>
  );
}

function CategorySection({
  title,
  count,
  icon,
  expanded,
  onToggle,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    clickTimerRef.current = setTimeout(() => {
      onToggle();
      clickTimerRef.current = null;
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    onToggle();
  };

  return (
    <div className="border-b border-zinc-800/40 last:border-b-0">
      <div
        className={`flex items-center gap-1 py-1.5 pr-2 cursor-pointer select-none group ${INDENT.root} hover:bg-zinc-900/50`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <span className="p-0.5 text-zinc-500 shrink-0">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-400 flex-1">
          {title}
        </span>
        <span className="text-[9px] text-zinc-600 tabular-nums">{count}</span>
        {onAdd ? (
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
            title={addLabel}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus size={12} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
      </div>
      {expanded ? <div className="pb-1">{children}</div> : null}
    </div>
  );
}

function PanelFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const collapse = useCallback(() => {
    if (!value.trim()) {
      setOpen(false);
      onChange('');
    }
    inputRef.current?.blur();
  }, [onChange, value]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        title="Filter"
        aria-label="Filter"
      >
        <Search size={13} />
      </button>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
      <Search size={12} className="text-zinc-600 shrink-0" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') collapse();
        }}
        onBlur={collapse}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('')}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X size={11} />
        </button>
      ) : null}
    </div>
  );
}

function VariableRow({
  variable,
  isSelected,
  color,
  hint,
  onSelect,
  onOpen,
  openOnSelect = false,
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
  openOnSelect?: boolean;
  onDelete?: () => void;
}) {
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (!onSelect && !onOpen) return;
    if (openOnSelect && onOpen) {
      onOpen();
      return;
    }
    if (!onOpen) {
      onSelect?.();
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      onSelect?.();
      clickTimerRef.current = null;
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!onOpen || openOnSelect) return;
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    onOpen();
  };

  return (
    <div
      className={`flex items-center gap-2 ${INDENT.l1} py-1 pr-2 cursor-pointer group border-l-2 ${
        isSelected ? 'bg-zinc-800/80 border-indigo-500' : 'hover:bg-zinc-900 border-transparent'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={
        hint ??
        (openOnSelect && onOpen
          ? 'Click to open'
          : onOpen
            ? 'Click to select · Double-click to edit in inspector'
            : onSelect
              ? 'Click to select'
              : undefined)
      }
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
      <span
        className={`text-[11px] truncate flex-1 ${
          isSelected ? 'text-zinc-100 font-medium' : 'text-zinc-400 group-hover:text-zinc-200'
        }`}
      >
        {variable.name}
      </span>
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
    crossOverMode,
    openTabs,
    isTabDirty,
    focusReference,
    referenceRootGraphId,
    referenceVariableName,
    environmentId,
    environmentVersion,
  } = useProject();

  const { navigate } = useEditorNavigation();
  const documents = useGraphDocuments();
  const { deleteSymbol, getUsageSummary, addVariableWithDefine, addFunctionWithDefine, addEventWithDefine } =
    useSymbolLifecycle();
  const { createClass, renameClass, deleteClass, canDeleteClass, moveClassToContainer } =
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
  const [expanded, setExpanded] = useState<Record<CategoryKey, boolean>>({
    graphs: true,
    environment: true,
    functions: true,
    variables: true,
    dispatchers: false,
    generated: false,
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
  const [addingClassToContainerId, setAddingClassToContainerId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
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

  const dispatchers = useMemo(
    () => listEventDispatchers(classEvents, documents, classes),
    [classEvents, documents, classes]
  );
  const generatedExports = useMemo(
    () =>
      listGeneratedExports(
        openTabs,
        classFunctions,
        documents,
        projectDetails.moduleName,
        targetLanguage
      ),
    [openTabs, classFunctions, documents, projectDetails.moduleName, targetLanguage]
  );

  const q = filterQuery.trim().toLowerCase();

  const filteredFunctions = useMemo(
    () => classFunctions.filter((f) => matchesFilter(f.name, q)),
    [classFunctions, q]
  );
  const filteredVariables = useMemo(
    () => classVariables.filter((v) => matchesFilter(v.name, q) || matchesFilter(v.type, q)),
    [classVariables, q]
  );
  const filteredDispatchers = useMemo(
    () => dispatchers.filter((d) => matchesFilter(d.label, q)),
    [dispatchers, q]
  );
  const graphSectionCount = graphContainers.length;

  const containerMatches = useCallback(
    (container: GraphContainer) =>
      containerMatchesFilter(container, classes, q, matchesFilter),
    [classes, q]
  );

  const visibleGraphContainers = useMemo(() => {
    return graphContainers.filter((container) => containerMatches(container));
  }, [graphContainers, containerMatches]);

  const toggleCategory = (key: CategoryKey) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  const openGraph = useCallback(
    (graphId: string, type: 'main' | 'function' | 'class') => {
      if (type === 'main') {
        openMainGraph(setActiveGraphTab);
        setSelection({ type: 'graph', id: null });
      } else if (type === 'class') {
        setActiveGraphTab(graphId);
        setSelection({ type: 'graph', id: null });
      } else {
        const func = functions.find((f) => f.id === graphId);
        if (func) openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
        setSelection({ type: 'graph', id: graphId });
      }
      focusReference(graphId, null);
      dispatchSwitchEditorView('canvas');
    },
    [focusReference, functions, setActiveGraphTab, setOpenTabs, setSelection]
  );

  const openClassGraph = useCallback(
    (cls: ClassSymbol) => {
      const tabId = classGraphTabId(cls);
      setActiveClassId(cls.id);
      const container = graphContainers.find((c) => c.id === classContainerId(cls));
      if (container) {
        openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      } else {
        setActiveGraphTab(tabId);
      }
      setSelection({ type: 'class', id: cls.id });
      focusReference(tabId, null);
      navigate({
        graphTab: tabId,
        editorView: 'canvas',
        selection: { type: 'class', id: cls.id },
      });
    },
    [focusReference, graphContainers, navigate, setActiveClassId, setActiveGraphTab, setOpenTabs, setSelection]
  );

  const openGraphContainer = useCallback(
    (container: GraphContainer) => {
      openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      setSelection({ type: 'graph', id: container.id });
      focusReference(container.id, null);
      navigate({
        graphTab: container.id,
        editorView: 'canvas',
        selection: { type: 'graph', id: container.id },
      });
      setExpanded((s) => ({ ...s, graphs: true }));
      setExpandedContainerIds((prev) => ({ ...prev, [container.id]: true }));
    },
    [focusReference, navigate, setActiveGraphTab, setOpenTabs, setSelection]
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

  const handleSaveClass = (containerId: string) => {
    if (!newClassName.trim()) return;
    createClass(newClassName.trim(), containerId);
    setNewClassName('');
    setAddingClassToContainerId(null);
    setExpandedContainerIds((prev) => ({ ...prev, [containerId]: true }));
    setExpanded((s) => ({ ...s, graphs: true }));
  };

  const handleSaveContainer = () => {
    if (!newContainerName.trim()) return;
    const container = createContainer(newContainerName.trim());
    setNewContainerName('');
    setIsAddingContainer(false);
    setExpandedContainerIds((prev) => ({ ...prev, [container.id]: true }));
    setExpanded((s) => ({ ...s, graphs: true }));
  };

  const handleSaveContainerRename = (container: GraphContainer) => {
    const name = renameContainerName.trim();
    if (!name) return;
    renameContainer(container.id, name);
    setRenamingContainerId(null);
    setRenameContainerName('');
  };

  const handleClassDragStart = useCallback((e: React.DragEvent, cls: ClassSymbol) => {
    configureClassTreeDrag(e, classDragPayload(cls));
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
      if (!draggingClassId) return;
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

      if (!draggingClassId) return;
      const raw = e.dataTransfer.getData(CLASS_DRAG_MIME);
      const payload = raw ? parseClassDragPayload(raw) : null;
      const classId = payload?.classId ?? draggingClassId;
      if (classId) moveClassToContainer(classId, containerId);
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

  const selectFunction = useCallback(
    (func: FunctionSymbol) => {
      setSelection({ type: 'function', id: func.id });
      openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
      setExpanded((s) => ({ ...s, functions: true }));
    },
    [setActiveGraphTab, setOpenTabs, setSelection]
  );

  const openFunctionOverloadGraph = useCallback(
    (func: FunctionSymbol, overloadId: string) => {
      const tabId =
        func.overloads.find((o) => o.id === overloadId)?.graphTabId ?? func.id;
      openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
      setActiveGraphTab(tabId);
      dispatchSwitchEditorView('canvas');
    },
    [setActiveGraphTab, setOpenTabs]
  );

  const canReorderFunctions = !q;

  const handleAddOverload = useCallback(
    (funcId: string) => {
      const func = functions.find((f) => f.id === funcId);
      if (!func) return;
      const { func: next, graphTabId } = appendFunctionOverload(func);
      commitFunctionSymbolUpdate(next, setFunctions, setOpenTabs);
      setSelection({ type: 'function', id: funcId });
      openFunctionGraphTab(next, setOpenTabs, setActiveGraphTab);
      setActiveGraphTab(graphTabId);
      setAddingOverloadForId(null);
      dispatchSwitchEditorView('canvas');
    },
    [functions, setActiveGraphTab, setFunctions, setOpenTabs, setSelection]
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

      setSelection({ type: 'variable', id: varId });
      const cls = classes.find((c) => c.id === symbolClassId(variable));
      if (!cls) return;

      const tabId = classGraphTabId(cls);
      setActiveClassId(cls.id);
      const container = graphContainers.find((c) => c.id === classContainerId(cls));
      if (container) {
        openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      } else {
        setActiveGraphTab(tabId);
      }
      focusReference(tabId, null);
      dispatchSwitchEditorView('canvas');
    },
    [
      variables,
      classes,
      graphContainers,
      setSelection,
      setActiveClassId,
      setOpenTabs,
      setActiveGraphTab,
      focusReference,
    ]
  );

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
    setExpanded((s) => ({ ...s, dispatchers: true }));
  };

  const handleSaveFunction = () => {
    if (!newFuncName.trim()) return;
    const func = createFunctionSymbol(newFuncName.trim(), {
      binding: newFuncBinding,
      classId: activeClassId,
    });
    addFunctionWithDefine(func);
    selectFunction(func);
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
    <div className={`${INDENT.l1} py-1.5 pr-2 space-y-1.5`}>
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
      <div className="flex-none px-3 pt-2 pb-1.5 border-b border-zinc-800">
        <div className="text-[12px] font-medium text-zinc-100 truncate" title={projectDetails.moduleName}>
          {projectDetails.moduleName || 'Untitled'}
        </div>
        {environmentManifest ? (
          <div
            className="text-[9px] text-indigo-400/90 truncate mt-0.5"
            title={`${environmentManifest.description}${environmentVersion ? ` · linked v${environmentVersion}` : ''}`}
          >
            env: {environmentManifest.displayName}
            {environmentVersion ? (
              <span className="text-zinc-600 font-mono"> · v{environmentVersion}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex-none flex items-center gap-1 px-2 py-1.5 border-b border-zinc-800/60">
        <PanelFilter value={filterQuery} onChange={setFilterQuery} placeholder="Filter…" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 py-0.5 overscroll-contain" {...{ [PANEL_SCROLL_ATTR]: '' }}>
        {/* Graphs — organizational folders containing classes */}
        <CategorySection
          title="Graphs"
          count={graphSectionCount}
          icon={<GitBranch size={12} className="text-emerald-500/80 shrink-0" />}
          expanded={expanded.graphs}
          onToggle={() => toggleCategory('graphs')}
          onAdd={() => {
            setIsAddingContainer(true);
            setExpanded((s) => ({ ...s, graphs: true }));
          }}
          addLabel="New graph"
        >
          {isAddingContainer ? (
            <div className={`${INDENT.l1} py-1.5 pr-2 space-y-1.5`}>
              <input
                type="text"
                placeholder="Graph folder name"
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
            </div>
          ) : null}
          {visibleGraphContainers
            .map((container) => {
              const containerClasses = classesForContainer(classes, container.id);
              const isExpanded = expandedContainerIds[container.id] ?? true;
              return (
                <React.Fragment key={container.id}>
                  <TreeRow
                    leading={
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          className="p-0.5 text-zinc-500 hover:text-zinc-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleContainerExpanded(container.id);
                          }}
                        >
                          {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>
                        <span
                          draggable
                          className="p-0.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                          title="Drag to reorder graph"
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(e) => handleGraphContainerDragStart(e, container)}
                          onDragEnd={handleGraphContainerDragEnd}
                        >
                          <GripVertical size={10} />
                        </span>
                      </div>
                    }
                    icon={<GitBranch size={10} className="text-emerald-500/80 shrink-0" />}
                    label={
                      renamingContainerId === container.id ? renameContainerName : container.name
                    }
                    meta={`${containerClasses.length} class${containerClasses.length === 1 ? '' : 'es'}`}
                    hint="Click to open graph · Chevron to expand or collapse"
                    active={
                      activeGraphTab === container.id ||
                      (containerClasses.length === 1 &&
                        activeGraphTab === classGraphTabId(containerClasses[0]!))
                    }
                    isDragging={draggingGraphContainerId === container.id}
                    isDropTarget={
                      dropContainerId === container.id || dropGraphContainerId === container.id
                    }
                    openOnSelect
                    onOpen={() => openGraphContainer(container)}
                    onDragOver={(e) => handleContainerDragOver(e, container.id)}
                    onDrop={(e) => handleContainerDrop(e, container.id)}
                    onDragLeave={() => {
                      setDropContainerId((id) => (id === container.id ? null : id));
                      setDropGraphContainerId((id) => (id === container.id ? null : id));
                    }}
                    suffix={
                      !isReferenceMode ? (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                            title="New class"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingClassToContainerId(container.id);
                              setNewClassName('');
                              setExpandedContainerIds((prev) => ({ ...prev, [container.id]: true }));
                            }}
                          >
                            <Plus size={10} />
                          </button>
                          {canRenameContainer(container) ? (
                            <button
                              type="button"
                              className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                              title="Rename graph folder"
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
                              title="Delete graph folder"
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
                  {isExpanded ? (
                    <>
                      {containerClasses.map((cls) => {
                        const counts = classSymbolCounts(cls.id);
                        const isActive = activeClassId === cls.id;
                        const mainTabId = classGraphTabId(cls);
                        return (
                          <React.Fragment key={cls.id}>
                            <TreeRow
                              depth="l2"
                              active={isActive && activeGraphTab === mainTabId}
                              icon={<Boxes size={10} className="text-violet-400/80 shrink-0" />}
                              label={renamingClassId === cls.id ? renameClassName : cls.name}
                              meta={
                                isActive
                                  ? `active · fn ${counts.functions} · var ${counts.variables}`
                                  : `fn ${counts.functions} · var ${counts.variables}`
                              }
                              hint="Click to select class and open its graph · Drag to declare or move"
                              openOnSelect
                              onOpen={() => openClassGraph(cls)}
                              isDragging={draggingClassId === cls.id}
                              onDragStart={(e) => handleClassDragStart(e, cls)}
                              onDragEnd={handleClassDragEnd}
                              suffix={
                                !isReferenceMode ? (
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
                                ) : null
                              }
                            />
                            {renamingClassId === cls.id ? (
                              <div className={`${INDENT.l2} py-1 pr-2 flex gap-1 pl-11`}>
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
                      {!isReferenceMode && addingClassToContainerId === container.id ? (
                        <div className={`${INDENT.l2} py-1.5 pr-2 space-y-1.5`}>
                          <input
                            type="text"
                            placeholder="Class name"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-zinc-600"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveClass(container.id);
                              if (e.key === 'Escape') {
                                setAddingClassToContainerId(null);
                                setNewClassName('');
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveClass(container.id)}
                              className="flex-1 px-2 py-1 rounded bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30"
                            >
                              Create & open
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingClassToContainerId(null);
                                setNewClassName('');
                              }}
                              className="px-2 py-1 rounded text-[10px] text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </React.Fragment>
              );
            })}
          {visibleGraphContainers.length === 0 &&
          !isAddingContainer
            ? emptyHint('No match.')
            : null}
        </CategorySection>

        {environmentSurface && environmentManifest ? (
          <CategorySection
            title="Environment API"
            count={
              environmentSurface.events.length +
              environmentSurface.natives.length +
              environmentSurface.overrideable.length
            }
            icon={<Layers size={12} className="text-indigo-400/80 shrink-0" />}
            expanded={expanded.environment}
            onToggle={() => toggleCategory('environment')}
          >
            {environmentSurface.events
              .filter((e) => matchesFilter(e.name, q))
              .map((event) => (
                <TreeRow
                  key={event.id}
                  icon={<Radio size={10} className="text-indigo-400/70 shrink-0" />}
                  label={event.name}
                  meta="event"
                  hint="Spawn handler or subscribe"
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
                        <button
                          type="button"
                          className="px-1 py-0.5 rounded text-[8px] bg-zinc-800 text-zinc-300 border border-zinc-700"
                          title="Add subscribe"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatchSpawnEnvironmentNode('event_subscribe', event.id);
                          }}
                        >
                          Sub
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

        {/* Functions */}
        <CategorySection
          title="Functions"
          count={classFunctions.length}
          icon={<PlaySquare size={12} className="text-indigo-400/80 shrink-0" />}
          expanded={expanded.functions}
          onToggle={() => toggleCategory('functions')}
          onAdd={() => {
            setIsAddingFunction(true);
            setExpanded((s) => ({ ...s, functions: true }));
          }}
          addLabel="New function"
        >
          {isAddingFunction ? renderFunctionCreateForm() : null}
          {filteredFunctions.length === 0 && !isAddingFunction
            ? emptyHint(classFunctions.length === 0 ? 'Empty — use + to add' : '—')
            : filteredFunctions.map((f) => (
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
                        ? f.binding
                        : f.overloads.length > 1
                          ? `${f.overloads.length} overloads`
                          : undefined
                    }
                    hint={canReorderFunctions ? 'Drag to reorder · click to edit' : rowHint}
                    onSelect={() => selectFunction(f)}
                    onOpen={() => openGraph(f.id, 'function')}
                    onDragOver={(e) => handleFunctionDragOver(e, f.id)}
                    onDrop={(e) => handleFunctionDrop(e, f.id)}
                    onDragLeave={() => {
                      if (dropFunctionId === f.id) setDropFunctionId(null);
                    }}
                    suffix={
                      <div className="flex items-center gap-0.5 shrink-0">
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
                  {f.overloads.map((overload, index) => {
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
                        meta={f.overloads.length > 1 ? `overload ${index + 1}` : 'drag to call'}
                        hint="Drag to graph to call · click to select"
                        canvasDrag={{
                          mimeType: FUNCTION_OVERLOAD_DRAG_MIME,
                          payload: JSON.stringify(dragPayload),
                        }}
                        onSelect={() => {
                          selectFunction(f);
                          setActiveGraphTab(overload.graphTabId ?? f.id);
                        }}
                        onOpen={() => openFunctionOverloadGraph(f, overload.id)}
                      />
                    );
                  })}
                  {addingOverloadForId === f.id ? renderOverloadCreateForm(f.id) : null}
                </React.Fragment>
              ))}
        </CategorySection>

        {/* Variables */}
        <CategorySection
          title="Variables"
          count={classVariables.length}
          icon={<Variable size={12} className="text-sky-400/80 shrink-0" />}
          expanded={expanded.variables}
          onToggle={() => toggleCategory('variables')}
          onAdd={() => setIsAddingVariable(true)}
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
          {isAddingVariable && (
            <div className={`${INDENT.l1} py-1 pr-2 space-y-1`}>
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
              <div className="flex gap-1">
                <select
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300"
                  value={newVarType}
                  onChange={(e) => setNewVarType(e.target.value as VariableType)}
                >
                  {LOGICAL_DATA_TYPE_DESCRIPTORS.map((descriptor) => {
                    const coaBlocked = !isDataTypeCoaAllowed(descriptor.id, crossOverMode);
                    return (
                      <option key={descriptor.id} value={descriptor.id} disabled={coaBlocked}>
                        {descriptor.label}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-2 rounded"
                  onClick={handleSaveVariable}
                >
                  Add
                </button>
              </div>
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
            </div>
          )}
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
                      : 'Click to select and open class graph · Double-click to edit in inspector'
                  }
                  openOnSelect={!isReferenceMode}
                  onSelect={() => selectVariable(v.id, v.name)}
                  onOpen={() => openVariableHomeGraph(v.id)}
                  onDelete={isReferenceMode ? undefined : () => handleDeleteVariable(v.id)}
                />
              ))}
        </CategorySection>

        {/* Event dispatchers — custom events declared in graphs */}
        <CategorySection
          title="Event Dispatchers"
          count={dispatchers.length}
          icon={<Radio size={12} className="text-violet-400/80 shrink-0" />}
          expanded={expanded.dispatchers}
          onToggle={() => toggleCategory('dispatchers')}
          onAdd={() => setIsAddingEvent(true)}
          addLabel="New event"
        >
          {isAddingEvent && (
            <div className={`${INDENT.l1} py-1 pr-2 space-y-1`}>
              <input
                type="text"
                placeholder="Event name (e.g. damage)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEvent();
                  if (e.key === 'Escape') setIsAddingEvent(false);
                }}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-2 rounded"
                  onClick={handleSaveEvent}
                >
                  Add
                </button>
              </div>
            </div>
          )}
          {filteredDispatchers.length === 0 && !isAddingEvent
            ? emptyHint(
                dispatchers.length === 0
                  ? 'Add project events, then place On / Subscribe / Emit nodes in graphs.'
                  : 'No match.'
              )
            : filteredDispatchers.map((d) => (
                <TreeRow
                  key={d.id}
                  icon={<Radio size={10} className="text-violet-400/70 shrink-0" />}
                  label={
                    d.subscriberCount > 0 ? `${d.label} · ${d.subscriberCount} sub` : d.label
                  }
                  active={selection.type === 'event' && selection.id === d.id}
                  hint={isReferenceMode ? rowHint : 'Click to select and open graph'}
                  openOnSelect={!isReferenceMode}
                  onSelect={() => setSelection({ type: 'event', id: d.id })}
                  onOpen={() => {
                    setSelection({ type: 'event', id: d.id });
                    openGraphById(d.graphId);
                  }}
                  suffix={
                    isReferenceMode ? undefined : (
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                        title="Remove event"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(d.id);
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )
                  }
                />
              ))}
        </CategorySection>

        {/* Generated exports */}
        <CategorySection
          title="Generated"
          count={generatedExports.length}
          icon={<FolderOutput size={12} className="text-zinc-500 shrink-0" />}
          expanded={expanded.generated}
          onToggle={() => toggleCategory('generated')}
        >
          {generatedExports.length === 0
            ? emptyHint('Filenames follow the active target language and module name.')
            : generatedExports
                .filter((e) => matchesFilter(`${e.fileName} ${e.graphLabel}`, q))
                .map((entry) => (
                  <TreeRow
                    key={entry.graphId}
                    active={isGraphReferenceActive(entry.graphId)}
                    icon={<FileCode2 size={11} className="text-emerald-500/70 shrink-0" />}
                    label={entry.fileName}
                    hint={rowHint}
                    onSelect={() => selectGraph(entry.graphId)}
                    onOpen={() => openGraphById(entry.graphId)}
                    suffix={
                      <span className="text-[9px] text-zinc-600 truncate max-w-[72px]">
                        {entry.graphLabel}
                      </span>
                    }
                  />
                ))}
        </CategorySection>
      </div>

      <div className="flex-none px-3 py-1 border-t border-zinc-800 text-[9px] text-zinc-600 text-center">
        {isReferenceMode
          ? 'Click · dbl-click open'
          : 'Drag overload to graph · drag function grip to reorder'}
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
