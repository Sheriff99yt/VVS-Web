'use client';

import { useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { FunctionSymbol, ProjectEventDefinition, VariableSymbol } from '@/types/graph';
import type { SymbolRefKind } from '@vvs/graph-types';
import type { ResolvedSymbolRef } from '@vvs/graph-types';
import {
  applyEventUpdateToDocuments,
  applyFunctionUpdateToDocuments,
  applyVariableRenameToDocuments,
  countSymbolUsage,
  deleteAllBrokenNodesForRef,
  deleteBrokenNodeFromDocuments,
  planSymbolDelete,
  recreateAllUnresolvedSymbols,
  recreateSymbolForNode,
  type SymbolDeleteMode,
} from '@/lib/symbolLifecycle';
import { formatFunctionTabName } from '@/lib/functionTabs';
import {
  insertDefineNodeForEvent,
  insertDefineNodeForFunction,
  insertDefineNodeForVariable,
  bootstrapClassHomeDocuments,
} from '@/lib/defineNodeSync';
import { activeClass } from '@/lib/classScope';
import {
  createClassSymbol,
  createProgramEntryEvent,
  classHomeGraphId,
  MAIN_GRAPH_CONTAINER_ID,
  type ClassSymbol,
} from '@vvs/graph-types';
import { openGraphContainerTab } from '@/lib/graphTabs';

export function useSymbolLifecycle() {
  const {
    variables,
    setVariables,
    functions,
    setFunctions,
    events,
    setEvents,
    openTabs,
    setOpenTabs,
    classes,
    activeClassId,
    activeGraphTab,
    setActiveGraphTab,
    setActiveClassId,
    selection,
    setSelection,
    graphContainers,
    setClasses,
  } = useProject();
  const { getDocuments, patchAllDocuments } = useGraphWorkspace();

  const getSymbolsState = useCallback(
    () => ({ variables, functions, events, openTabs, classes, activeClassId }),
    [variables, functions, events, openTabs, classes, activeClassId]
  );

  const applyDocuments = useCallback(
    (nextDocuments: Record<string, GraphDocument>) => {
      patchAllDocuments(() => nextDocuments);
    },
    [patchAllDocuments]
  );

  const dualWriteDefineNode = useCallback(
    (
      documents: Record<string, GraphDocument>,
      kind: 'variable' | 'function' | 'event',
      symbol: VariableSymbol | FunctionSymbol | ProjectEventDefinition
    ) => {
      const cls = activeClass(classes, activeClassId);
      if (!cls) return documents;
      if (kind === 'variable') {
        return insertDefineNodeForVariable(
          documents,
          cls,
          symbol as VariableSymbol,
          activeGraphTab
        );
      }
      if (kind === 'function') {
        return insertDefineNodeForFunction(
          documents,
          cls,
          symbol as FunctionSymbol,
          activeGraphTab
        );
      }
      return insertDefineNodeForEvent(
        documents,
        cls,
        symbol as ProjectEventDefinition,
        activeGraphTab
      );
    },
    [classes, activeClassId, activeGraphTab]
  );

  const addVariableWithDefine = useCallback(
    (variable: VariableSymbol) => {
      setVariables((list) => [...list, variable]);
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      applyDocuments(dualWriteDefineNode(documents, 'variable', variable));
    },
    [setVariables, getDocuments, applyDocuments, dualWriteDefineNode]
  );

  const addFunctionWithDefine = useCallback(
    (func: FunctionSymbol) => {
      setFunctions((list) => [...list, func]);
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      applyDocuments(dualWriteDefineNode(documents, 'function', func));
    },
    [setFunctions, getDocuments, applyDocuments, dualWriteDefineNode]
  );

  const addEventWithDefine = useCallback(
    (event: ProjectEventDefinition) => {
      setEvents((list) => [...list, event]);
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      applyDocuments(dualWriteDefineNode(documents, 'event', event));
    },
    [setEvents, getDocuments, applyDocuments, dualWriteDefineNode]
  );

  const addClassWithDefine = useCallback(
    (name: string, containerId: string = MAIN_GRAPH_CONTAINER_ID): ClassSymbol => {
      const trimmed = name.trim() || 'NewClass';
      const cls = createClassSymbol(trimmed, { containerId });
      const entry = createProgramEntryEvent({ id: `evt-start-${cls.id}`, classId: cls.id });

      setClasses((list) => [...list, cls]);
      setEvents((list) => [...list, entry]);
      const documents = getDocuments() ?? {};
      applyDocuments(bootstrapClassHomeDocuments(documents, cls, entry, activeGraphTab));

      const container = graphContainers.find((c) => c.id === containerId);
      if (container) {
        openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      } else {
        setActiveGraphTab(classHomeGraphId(cls));
      }
      setActiveClassId(cls.id);
      setSelection({ type: 'class', id: cls.id });
      return cls;
    },
    [
      setClasses,
      setEvents,
      getDocuments,
      applyDocuments,
      graphContainers,
      setOpenTabs,
      setActiveGraphTab,
      setActiveClassId,
      setSelection,
      activeGraphTab,
    ]
  );

  const uniqueCopyName = useCallback((base: string, existingNames: string[]) => {
    const taken = new Set(existingNames.map((n) => n.toLowerCase()));
    let name = `${base}_copy`;
    let n = 2;
    while (taken.has(name.toLowerCase())) {
      name = `${base}_copy${n++}`;
    }
    return name;
  }, []);

  const duplicateVariable = useCallback(
    (variableId: string): VariableSymbol | null => {
      const source = variables.find((v) => v.id === variableId);
      if (!source) return null;
      const name = uniqueCopyName(
        source.name,
        variables.filter((v) => v.classId === source.classId).map((v) => v.name)
      );
      const copy: VariableSymbol = {
        ...source,
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
      };
      addVariableWithDefine(copy);
      setSelection({ type: 'variable', id: copy.id });
      return copy;
    },
    [variables, uniqueCopyName, addVariableWithDefine, setSelection]
  );

  const duplicateFunction = useCallback(
    (functionId: string): FunctionSymbol | null => {
      const source = functions.find((f) => f.id === functionId);
      if (!source) return null;
      const name = uniqueCopyName(
        source.name,
        functions.filter((f) => f.classId === source.classId).map((f) => f.name)
      );
      const newId = `func-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const overloads = source.overloads.map((overload, index) => {
        const overloadId = `ovl-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
        const graphTabId =
          source.overloads.length === 1 ? newId : `${newId}::${overloadId}`;
        return {
          ...overload,
          id: overloadId,
          parameters: overload.parameters.map((p) => ({ ...p })),
          graphTabId,
        };
      });
      const copy: FunctionSymbol = {
        ...source,
        id: newId,
        name,
        overloads,
      };
      addFunctionWithDefine(copy);
      setSelection({ type: 'function', id: copy.id });
      return copy;
    },
    [functions, uniqueCopyName, addFunctionWithDefine, setSelection]
  );

  const duplicateEvent = useCallback(
    (eventId: string): ProjectEventDefinition | null => {
      const source = events.find((e) => e.id === eventId);
      if (!source) return null;
      const name = uniqueCopyName(
        source.name,
        events.filter((e) => e.classId === source.classId).map((e) => e.name)
      );
      const copy: ProjectEventDefinition = {
        ...source,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        role: source.role === 'entry' ? undefined : source.role,
        parameters: source.parameters.map((p) => ({ ...p })),
      };
      addEventWithDefine(copy);
      setSelection({ type: 'event', id: copy.id });
      return copy;
    },
    [events, uniqueCopyName, addEventWithDefine, setSelection]
  );

  const deleteSymbol = useCallback(
    (kind: SymbolRefKind, symbolId: string, mode: SymbolDeleteMode) => {
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      const plan = planSymbolDelete(kind, symbolId, mode, getSymbolsState(), documents);

      setVariables(plan.nextSymbols.variables);
      setFunctions(plan.nextSymbols.functions);
      setEvents(plan.nextSymbols.events);
      setOpenTabs(plan.nextSymbols.openTabs);

      if (plan.closeTabIds.includes(activeGraphTab)) {
        setActiveGraphTab('main');
      }

      if (
        (selection.type === 'variable' && selection.id === symbolId && kind === 'variable') ||
        (selection.type === 'function' && selection.id === symbolId && kind === 'function') ||
        (selection.type === 'event' && selection.id === symbolId && kind === 'event')
      ) {
        setSelection({ type: 'graph', id: null });
      }

      applyDocuments(plan.nextDocuments);
    },
    [
      getDocuments,
      getSymbolsState,
      setVariables,
      setFunctions,
      setEvents,
      setOpenTabs,
      activeGraphTab,
      setActiveGraphTab,
      selection,
      setSelection,
      applyDocuments,
    ]
  );

  const getUsageSummary = useCallback(
    (kind: SymbolRefKind, symbolId: string) => {
      const documents = getDocuments() ?? {};
      return countSymbolUsage(documents, kind, symbolId);
    },
    [getDocuments]
  );

  const renameVariable = useCallback(
    (variable: VariableSymbol) => {
      setVariables((list) => list.map((v) => (v.id === variable.id ? variable : v)));
      const documents = getDocuments();
      if (!documents) return;
      applyDocuments(applyVariableRenameToDocuments(documents, variable));
    },
    [setVariables, getDocuments, applyDocuments]
  );

  const renameFunction = useCallback(
    (func: FunctionSymbol) => {
      setFunctions((list) => list.map((f) => (f.id === func.id ? func : f)));
      const tabName = formatFunctionTabName(func.name);
      setOpenTabs((tabs) =>
        tabs.map((tab) => (tab.id === func.id && tab.type === 'function' ? { ...tab, name: tabName } : tab))
      );
      const documents = getDocuments();
      if (!documents) return;
      applyDocuments(applyFunctionUpdateToDocuments(documents, func));
    },
    [setFunctions, setOpenTabs, getDocuments, applyDocuments]
  );

  const renameEvent = useCallback(
    (event: ProjectEventDefinition) => {
      setEvents((list) => list.map((e) => (e.id === event.id ? event : e)));
      const documents = getDocuments();
      if (!documents) return;
      applyDocuments(applyEventUpdateToDocuments(documents, event));
    },
    [setEvents, getDocuments, applyDocuments]
  );

  const deleteBrokenNode = useCallback(
    (tabId: string, nodeId: string) => {
      const documents = getDocuments();
      if (!documents) return;
      applyDocuments(deleteBrokenNodeFromDocuments(documents, tabId, nodeId));
      if (selection.type === 'node' && selection.id === nodeId) {
        setSelection({ type: 'graph', id: null });
      }
    },
    [getDocuments, applyDocuments, selection, setSelection]
  );

  const deleteAllBrokenForRef = useCallback(
    (ref: ResolvedSymbolRef) => {
      const documents = getDocuments();
      if (!documents) return;
      applyDocuments(deleteAllBrokenNodesForRef(documents, ref));
      if (selection.type === 'node') {
        setSelection({ type: 'graph', id: null });
      }
    },
    [getDocuments, applyDocuments, selection, setSelection]
  );

  const fixBrokenNode = useCallback(
    (tabId: string, nodeId: string) => {
      const documents = getDocuments();
      if (!documents) return;
      const result = recreateSymbolForNode(getSymbolsState(), documents, tabId, nodeId, {
        classes,
        preferredClassId: activeClassId,
        activeGraphTab,
      });
      if (!result) return;
      setVariables(result.nextSymbols.variables);
      setFunctions(result.nextSymbols.functions);
      setEvents(result.nextSymbols.events);
      setOpenTabs(result.nextSymbols.openTabs);
      applyDocuments(result.nextDocuments);
    },
    [
      getDocuments,
      getSymbolsState,
      classes,
      activeClassId,
      activeGraphTab,
      setVariables,
      setFunctions,
      setEvents,
      setOpenTabs,
      applyDocuments,
    ]
  );

  const fixAllBrokenRefs = useCallback(
    (filterRef?: ResolvedSymbolRef) => {
      const documents = getDocuments();
      if (!documents) return;
      const result = recreateAllUnresolvedSymbols(getSymbolsState(), documents, filterRef, {
        classes,
        preferredClassId: activeClassId,
        activeGraphTab,
      });
      setVariables(result.nextSymbols.variables);
      setFunctions(result.nextSymbols.functions);
      setEvents(result.nextSymbols.events);
      setOpenTabs(result.nextSymbols.openTabs);
      applyDocuments(result.nextDocuments);
    },
    [
      getDocuments,
      getSymbolsState,
      classes,
      activeClassId,
      activeGraphTab,
      setVariables,
      setFunctions,
      setEvents,
      setOpenTabs,
      applyDocuments,
    ]
  );

  return {
    deleteSymbol,
    getUsageSummary,
    renameVariable,
    renameFunction,
    renameEvent,
    deleteBrokenNode,
    deleteAllBrokenForRef,
    fixBrokenNode,
    fixAllBrokenRefs,
    addVariableWithDefine,
    addFunctionWithDefine,
    addEventWithDefine,
    addClassWithDefine,
    duplicateVariable,
    duplicateFunction,
    duplicateEvent,
  };
}
