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
  Boxes,
  GitBranch,
  Radio,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { createFunctionId } from '@/lib/functionTabs';
import {
  createMacroId,
  openFunctionGraphTab,
  openMacroGraphTab,
  openMainGraph,
} from '@/lib/graphTabs';
import { defaultValueForVariableType, VariableType } from '@/lib/variableDefaults';
import { findGraphIdsUsingVariable } from '@/lib/graphRelations';
import { dispatchSwitchEditorView } from '@/lib/editorNavigate';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import {
  listGeneratedExports,
  listMacroEntries,
  listEventDispatchers,
} from '@/lib/projectTree';

type CategoryKey =
  | 'graphs'
  | 'functions'
  | 'macros'
  | 'variables'
  | 'dispatchers'
  | 'generated';

const INDENT = { root: 'pl-2', l1: 'pl-5', l2: 'pl-8' };

interface TreeRowProps {
  depth?: keyof typeof INDENT;
  active?: boolean;
  icon?: React.ReactNode;
  label: string;
  suffix?: React.ReactNode;
  onSelect?: () => void;
  onOpen?: () => void;
  hint?: string;
  className?: string;
}

const SINGLE_CLICK_DELAY_MS = 220;

function TreeRow({
  depth = 'l1',
  active,
  icon,
  label,
  suffix,
  onSelect,
  onOpen,
  hint,
  className = '',
}: TreeRowProps) {
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (!onSelect && !onOpen) return;
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
    if (!onOpen) return;
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    onOpen();
  };

  const interactive = Boolean(onSelect || onOpen);

  return (
    <div
      className={`flex items-center gap-1.5 py-1 pr-2 select-none group ${INDENT[depth]} ${
        interactive ? 'cursor-pointer' : ''
      } ${
        active ? 'bg-zinc-800/80 border-l-2 border-indigo-500' : 'hover:bg-zinc-900 border-l-2 border-transparent'
      } ${className}`}
      onClick={interactive ? handleClick : undefined}
      onDoubleClick={onOpen ? handleDoubleClick : undefined}
      title={
        hint ??
        (onOpen
          ? 'Click for references · Double-click to open'
          : onSelect
            ? 'Click for references'
            : undefined)
      }
    >
      <span className="w-4 shrink-0" />
      {icon}
      <span
        className={`text-[11px] truncate flex-1 min-w-0 ${
          active ? 'text-zinc-100 font-medium' : 'text-zinc-400 group-hover:text-zinc-200'
        }`}
      >
        {label}
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
}: {
  variable: { id: string; name: string; type: string };
  isSelected: boolean;
  color: string;
  hint?: string;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    clickTimerRef.current = setTimeout(() => {
      onSelect();
      clickTimerRef.current = null;
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
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
      title={hint ?? 'Click to select · Double-click to edit in inspector'}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/vvs-variable', JSON.stringify(variable));
        e.dataTransfer.effectAllowed = 'move';
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
      <span className="text-[9px] text-zinc-600 uppercase shrink-0">{variable.type}</span>
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
    functions,
    setFunctions,
    setSelection,
    selection,
    setOpenTabs,
    setActiveGraphTab,
    activeGraphTab,
    projectDetails,
    targetLanguage,
    openTabs,
    compileState,
    focusReference,
    referenceRootGraphId,
    referenceVariableName,
  } = useProject();

  const documents = useGraphDocuments();

  const [filterQuery, setFilterQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<CategoryKey, boolean>>({
    graphs: true,
    functions: true,
    macros: true,
    variables: true,
    dispatchers: false,
    generated: false,
  });
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('string');
  const [isAddingFunction, setIsAddingFunction] = useState(false);
  const [newFuncName, setNewFuncName] = useState('');
  const [isAddingMacro, setIsAddingMacro] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');

  const macros = useMemo(() => listMacroEntries(openTabs), [openTabs]);
  const dispatchers = useMemo(() => listEventDispatchers(documents), [documents]);
  const generatedExports = useMemo(
    () =>
      listGeneratedExports(
        openTabs,
        functions,
        documents,
        projectDetails.moduleName,
        targetLanguage
      ),
    [openTabs, functions, documents, projectDetails.moduleName, targetLanguage]
  );

  const q = filterQuery.trim().toLowerCase();

  const filteredFunctions = useMemo(
    () => functions.filter((f) => matchesFilter(f.name, q)),
    [functions, q]
  );
  const filteredMacros = useMemo(
    () => macros.filter((m) => matchesFilter(m.name, q)),
    [macros, q]
  );
  const filteredVariables = useMemo(
    () => variables.filter((v) => matchesFilter(v.name, q) || matchesFilter(v.type, q)),
    [variables, q]
  );
  const filteredDispatchers = useMemo(
    () => dispatchers.filter((d) => matchesFilter(d.label, q)),
    [dispatchers, q]
  );
  const showMainGraph = matchesFilter('event graph main', q);

  const toggleCategory = (key: CategoryKey) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  const openGraph = useCallback(
    (graphId: string, type: 'main' | 'function' | 'macro') => {
      if (type === 'main') {
        openMainGraph(setActiveGraphTab);
        setSelection({ type: 'graph', id: null });
      } else {
        const tab = openTabs.find((t) => t.id === graphId);
        if (tab?.type === 'macro') {
          openMacroGraphTab({ id: graphId, name: tab.name }, setOpenTabs, setActiveGraphTab);
        } else {
          const func = functions.find((f) => f.id === graphId);
          if (func) openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
        }
        setSelection({ type: 'graph', id: graphId });
      }
      focusReference(graphId, null);
      dispatchSwitchEditorView('canvas');
    },
    [focusReference, functions, openTabs, setActiveGraphTab, setOpenTabs, setSelection]
  );

  const openGraphById = useCallback(
    (graphId: string) => {
      if (graphId === 'main') {
        openGraph('main', 'main');
        return;
      }
      const tab = openTabs.find((t) => t.id === graphId);
      const type: 'function' | 'macro' = tab?.type === 'macro' ? 'macro' : 'function';
      openGraph(graphId, type);
    },
    [openGraph, openTabs]
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
    setVariables([
      ...variables,
      {
        id: `var-${Date.now()}`,
        name: newVarName.trim(),
        type: newVarType,
        defaultValue: defaultValueForVariableType(newVarType),
      },
    ]);
    setNewVarName('');
    setIsAddingVariable(false);
    setExpanded((s) => ({ ...s, variables: true }));
  };

  const handleSaveFunction = () => {
    if (!newFuncName.trim()) return;
    const func = { id: createFunctionId(), name: newFuncName.trim() };
    setFunctions([...functions, func]);
    openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
    setSelection({ type: 'graph', id: func.id });
    setNewFuncName('');
    setIsAddingFunction(false);
    setExpanded((s) => ({ ...s, functions: true }));
  };

  const handleSaveMacro = () => {
    if (!newMacroName.trim()) return;
    const id = createMacroId();
    openMacroGraphTab({ id, name: newMacroName.trim() }, setOpenTabs, setActiveGraphTab);
    setSelection({ type: 'graph', id });
    setNewMacroName('');
    setIsAddingMacro(false);
    setExpanded((s) => ({ ...s, macros: true }));
  };

  const handleDeleteFunction = (funcId: string) => {
    setFunctions((f) => f.filter((x) => x.id !== funcId));
    setOpenTabs((tabs) => tabs.filter((t) => t.id !== funcId));
    if (activeGraphTab === funcId) {
      setActiveGraphTab('main');
      setSelection({ type: 'graph', id: null });
    }
  };

  const handleDeleteMacro = (macroId: string) => {
    setOpenTabs((tabs) => tabs.filter((t) => t.id !== macroId));
    if (activeGraphTab === macroId) {
      setActiveGraphTab('main');
      setSelection({ type: 'graph', id: null });
    }
  };

  const getVariableColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'var(--vvs-pin-data_string)';
      case 'number':
        return 'var(--vvs-pin-data_number)';
      case 'boolean':
        return 'var(--vvs-pin-data_boolean)';
      case 'object':
        return 'var(--vvs-pin-data_object)';
      default:
        return 'var(--vvs-pin-data_any)';
    }
  };

  const renderInlineNameInput = (
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div className={`${INDENT.l1} py-1 pr-2`}>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
      />
    </div>
  );

  const emptyHint = (text: string) => (
    <div className={`${INDENT.l1} text-[10px] text-zinc-600 italic py-1 pr-2`}>{text}</div>
  );

  const rowHint = isReferenceMode
    ? 'Click to focus reference graph · Double-click to open in canvas'
    : 'Click to select · Double-click to open graph';

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col border-r border-zinc-800 min-h-0 min-w-[200px]">
      <div className="flex-none px-3 pt-2.5 pb-2 border-b border-zinc-800">
        <div className="text-[10px] uppercase tracking-wide text-zinc-600 mb-0.5">Project</div>
        <div className="text-[12px] font-medium text-zinc-100 truncate" title={projectDetails.moduleName}>
          {projectDetails.moduleName || 'Untitled'}
        </div>
      </div>

      <div className="flex-none flex items-center gap-1 px-2 py-2 border-b border-zinc-800/60">
        <PanelFilter value={filterQuery} onChange={setFilterQuery} placeholder="Filter members…" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 py-0.5">
        {/* Graphs — primary event graph */}
        <CategorySection
          title="Graphs"
          count={1}
          icon={<GitBranch size={12} className="text-emerald-500/80 shrink-0" />}
          expanded={expanded.graphs}
          onToggle={() => toggleCategory('graphs')}
        >
          {showMainGraph ? (
            <TreeRow
              active={isGraphReferenceActive('main')}
              icon={<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
              label="Event Graph"
              hint={rowHint}
              onSelect={() => selectGraph('main')}
              onOpen={() => openGraph('main', 'main')}
              suffix={
                activeGraphTab === 'main' && compileState === 'dirty' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Uncompiled changes" />
                ) : null
              }
            />
          ) : (
            emptyHint('No match.')
          )}
        </CategorySection>

        {/* Functions */}
        <CategorySection
          title="Functions"
          count={functions.length}
          icon={<PlaySquare size={12} className="text-indigo-400/80 shrink-0" />}
          expanded={expanded.functions}
          onToggle={() => toggleCategory('functions')}
          onAdd={() => setIsAddingFunction(true)}
          addLabel="New function"
        >
          {isAddingFunction &&
            renderInlineNameInput(
              'Function name',
              newFuncName,
              setNewFuncName,
              handleSaveFunction,
              () => setIsAddingFunction(false)
            )}
          {filteredFunctions.length === 0 && !isAddingFunction
            ? emptyHint(functions.length === 0 ? 'No functions yet.' : 'No match.')
            : filteredFunctions.map((f) => (
                <TreeRow
                  key={f.id}
                  active={isGraphReferenceActive(f.id)}
                  icon={<div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                  label={f.name}
                  hint={rowHint}
                  onSelect={() => selectGraph(f.id)}
                  onOpen={() => openGraph(f.id, 'function')}
                  suffix={
                    <div className="flex items-center gap-1 shrink-0">
                      {activeGraphTab === f.id && compileState === 'dirty' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      ) : null}
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
              ))}
        </CategorySection>

        {/* Macros */}
        <CategorySection
          title="Macros"
          count={macros.length}
          icon={<Boxes size={12} className="text-amber-500/80 shrink-0" />}
          expanded={expanded.macros}
          onToggle={() => toggleCategory('macros')}
          onAdd={() => setIsAddingMacro(true)}
          addLabel="New macro"
        >
          {isAddingMacro &&
            renderInlineNameInput(
              'Macro name',
              newMacroName,
              setNewMacroName,
              handleSaveMacro,
              () => setIsAddingMacro(false)
            )}
          {filteredMacros.length === 0 && !isAddingMacro
            ? emptyHint(macros.length === 0 ? 'No macros yet.' : 'No match.')
            : filteredMacros.map((m) => (
                <TreeRow
                  key={m.id}
                  active={isGraphReferenceActive(m.id)}
                  icon={<div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                  label={m.name}
                  hint={rowHint}
                  onSelect={() => selectGraph(m.id)}
                  onOpen={() => openGraph(m.id, 'macro')}
                  suffix={
                    <div className="flex items-center gap-1 shrink-0">
                      {activeGraphTab === m.id && compileState === 'dirty' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      ) : null}
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                        title="Remove macro"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMacro(m.id);
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  }
                />
              ))}
        </CategorySection>

        {/* Variables */}
        <CategorySection
          title="Variables"
          count={variables.length}
          icon={<Variable size={12} className="text-sky-400/80 shrink-0" />}
          expanded={expanded.variables}
          onToggle={() => toggleCategory('variables')}
          onAdd={() => setIsAddingVariable(true)}
          addLabel="New variable"
        >
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
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                </select>
                <button
                  type="button"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-2 rounded"
                  onClick={handleSaveVariable}
                >
                  Add
                </button>
              </div>
            </div>
          )}
          {filteredVariables.length === 0 && !isAddingVariable
            ? emptyHint(variables.length === 0 ? 'No variables yet.' : 'No match.')
            : filteredVariables.map((v) => (
                <VariableRow
                  key={v.id}
                  variable={v}
                  isSelected={isVariableActive(v.id, v.name)}
                  color={getVariableColor(v.type)}
                  hint={
                    isReferenceMode
                      ? 'Click to focus references · Double-click to edit in inspector'
                      : 'Click to select · Double-click to edit in inspector'
                  }
                  onSelect={() => selectVariable(v.id, v.name)}
                  onOpen={() => setSelection({ type: 'variable', id: v.id })}
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
        >
          {filteredDispatchers.length === 0
            ? emptyHint(
                dispatchers.length === 0
                  ? 'Add Custom event nodes to declare dispatchers.'
                  : 'No match.'
              )
            : filteredDispatchers.map((d) => (
                <TreeRow
                  key={d.id}
                  icon={<Radio size={10} className="text-violet-400/70 shrink-0" />}
                  label={d.label}
                  hint={rowHint}
                  onSelect={() => selectGraph(d.graphId)}
                  onOpen={() => openGraphById(d.graphId)}
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
            ? emptyHint('Generate code to see export filenames.')
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

      <div className="flex-none px-3 py-1.5 border-t border-zinc-800 text-[9px] text-zinc-600 leading-relaxed">
        {isReferenceMode
          ? 'Click to focus reference graph · Double-click to open in canvas'
          : 'Click to select · Double-click to open graph'}
      </div>
    </div>
  );
}
