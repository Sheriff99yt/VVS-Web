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
import { editCSharpDeclarationGroup, editCSharpLocalInitializer, type CSharpIntegerType } from '@vvs/graph-types';
import { reconcileNativeScalarInferences, transactNativeScalarExpressionProperty, transactNativeScalarSignature, transactNativeScalarLocal, transactNativeScalarDeclarationMode, type NativeScalarDeclarationModeEdit, transactNativeScalarDeclarationGroup, type NativeScalarGroupEdit, type NativeScalarLocalEdit, type VVSNodeData } from '@vvs/graph-types';

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
  const { getDocuments, patchAllDocuments, pushHistory } = useGraphWorkspace();

  const getSymbolsState = useCallback(
    () => ({ variables, functions, events, openTabs, classes, activeClassId }),
    [variables, functions, events, openTabs, classes, activeClassId]
  );

  const applyDocuments = useCallback(
    (
      nextDocuments: Record<string, GraphDocument>,
      options?: { preserveHistory?: boolean; viewTabId?: string; selectedNodeId?: string }
    ) => {
      patchAllDocuments(() => nextDocuments, options);
    },
    [patchAllDocuments]
  );

  const recordSymbolHistory = useCallback(
    (label: string) => {
      pushHistory(label);
    },
    [pushHistory]
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
    (variable: VariableSymbol, historyLabel?: string) => {
      recordSymbolHistory(historyLabel ?? `Add variable ${variable.name}`);
      setVariables((list) => [...list, variable]);
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      applyDocuments(dualWriteDefineNode(documents, 'variable', variable), {
        preserveHistory: true,
      });
    },
    [setVariables, getDocuments, applyDocuments, dualWriteDefineNode, recordSymbolHistory]
  );

  const addFunctionWithDefine = useCallback(
    (func: FunctionSymbol, historyLabel?: string) => {
      recordSymbolHistory(historyLabel ?? `Add function ${func.name}`);
      setFunctions((list) => [...list, func]);
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      applyDocuments(dualWriteDefineNode(documents, 'function', func), {
        preserveHistory: true,
      });
    },
    [setFunctions, getDocuments, applyDocuments, dualWriteDefineNode, recordSymbolHistory]
  );

  const addEventWithDefine = useCallback(
    (event: ProjectEventDefinition, historyLabel?: string) => {
      recordSymbolHistory(historyLabel ?? `Add event ${event.name}`);
      setEvents((list) => [...list, event]);
      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      applyDocuments(dualWriteDefineNode(documents, 'event', event), {
        preserveHistory: true,
      });
    },
    [setEvents, getDocuments, applyDocuments, dualWriteDefineNode, recordSymbolHistory]
  );

  const addClassWithDefine = useCallback(
    (name: string, containerId: string = MAIN_GRAPH_CONTAINER_ID): ClassSymbol => {
      const trimmed = name.trim() || 'NewClass';
      const cls = createClassSymbol(trimmed, { containerId });
      const entry = createProgramEntryEvent({ id: `evt-start-${cls.id}`, classId: cls.id });

      recordSymbolHistory(`Add class ${cls.name}`);
      setClasses((list) => [...list, cls]);
      setEvents((list) => [...list, entry]);
      const documents = getDocuments() ?? {};
      applyDocuments(bootstrapClassHomeDocuments(documents, cls, entry, activeGraphTab), {
        preserveHistory: true,
      });

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
      recordSymbolHistory,
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
      // History is recorded inside addVariableWithDefine
      addVariableWithDefine(copy, `Duplicate variable ${copy.name}`);
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
      addFunctionWithDefine(copy, `Duplicate function ${copy.name}`);
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
      addEventWithDefine(copy, `Duplicate event ${copy.name}`);
      setSelection({ type: 'event', id: copy.id });
      return copy;
    },
    [events, uniqueCopyName, addEventWithDefine, setSelection]
  );

  const deleteSymbol = useCallback(
    (kind: SymbolRefKind, symbolId: string, mode: SymbolDeleteMode) => {
      if (kind !== 'variable' && kind !== 'function' && kind !== 'event') return;

      const existed =
        kind === 'variable'
          ? variables.some((v) => v.id === symbolId)
          : kind === 'function'
            ? functions.some((f) => f.id === symbolId)
            : events.some((e) => e.id === symbolId);
      if (!existed) return;

      const documents = getDocuments() ?? { main: { nodes: [], edges: [] } };
      const plan = planSymbolDelete(kind, symbolId, mode, getSymbolsState(), documents);

      const name =
        kind === 'variable'
          ? variables.find((v) => v.id === symbolId)?.name
          : kind === 'function'
            ? functions.find((f) => f.id === symbolId)?.name
            : events.find((e) => e.id === symbolId)?.name;
      recordSymbolHistory(
        `Delete ${kind}${name ? ` ${name}` : ''}${mode === 'symbol_and_refs' ? ' and refs' : ''}`
      );

      const nextViewTab = plan.closeTabIds.includes(activeGraphTab) ? 'main' : activeGraphTab;

      setVariables(plan.nextSymbols.variables);
      setFunctions(plan.nextSymbols.functions);
      setEvents(plan.nextSymbols.events);
      setOpenTabs(plan.nextSymbols.openTabs);

      if (nextViewTab !== activeGraphTab) {
        setActiveGraphTab(nextViewTab);
      }

      if (
        (selection.type === 'variable' && selection.id === symbolId && kind === 'variable') ||
        (selection.type === 'function' && selection.id === symbolId && kind === 'function') ||
        (selection.type === 'event' && selection.id === symbolId && kind === 'event')
      ) {
        setSelection({ type: 'graph', id: null });
      }

      applyDocuments(plan.nextDocuments, {
        preserveHistory: true,
        viewTabId: nextViewTab,
      });
    },
    [
      getDocuments,
      getSymbolsState,
      variables,
      functions,
      events,
      setVariables,
      setFunctions,
      setEvents,
      setOpenTabs,
      activeGraphTab,
      setActiveGraphTab,
      selection,
      setSelection,
      applyDocuments,
      recordSymbolHistory,
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
    (variable: VariableSymbol, declarationEdit?: { nodeId: string; properties: Record<string, unknown> }) => {
      const prev = variables.find((v) => v.id === variable.id);
      if (!prev) return;
      const documents = getDocuments();
      if (!documents) return;
      if (prev.name !== variable.name) {
        recordSymbolHistory(`Rename variable ${prev.name} → ${variable.name}`);
      } else {
        recordSymbolHistory(`Update variable ${variable.name}`);
      }
      setVariables((list) => list.map((v) => (v.id === variable.id ? variable : v)));
      applyDocuments(applyVariableRenameToDocuments(documents, variable, declarationEdit), {
        preserveHistory: true, selectedNodeId: declarationEdit?.nodeId,
      });
    },
    [variables, setVariables, getDocuments, applyDocuments, recordSymbolHistory]
  );

  const updateCSharpDeclarationGroup = useCallback((nodeId: string, nativeType: CSharpIntegerType, groupStyle: 'typed' | 'const', selectedNodeId = nodeId) => {
    const documents = getDocuments();
    const document = documents?.[activeGraphTab];
    if (!documents || !document) return;
    const edit = editCSharpDeclarationGroup(document, variables, nodeId, nativeType, groupStyle);
    recordSymbolHistory('Edit C# declaration group');
    setVariables(edit.variables);
    applyDocuments({ ...documents, [activeGraphTab]: edit.document }, { preserveHistory: true, selectedNodeId });
  }, [activeGraphTab, getDocuments, variables, recordSymbolHistory, setVariables, applyDocuments]);

  const updateCSharpLocalInitializer = useCallback((nodeId: string, enabled: boolean) => {
    const documents = getDocuments(), document = documents?.[activeGraphTab];
    if (!documents || !document) return;
    const next = editCSharpLocalInitializer(document, nodeId, enabled);
    recordSymbolHistory('Edit local initializer');
    applyDocuments({ ...documents, [activeGraphTab]: next }, { preserveHistory: true, selectedNodeId: nodeId });
  }, [activeGraphTab, getDocuments, recordSymbolHistory, applyDocuments]);

  const renameFunction = useCallback(
    (func: FunctionSymbol) => {
      const prev = functions.find((f) => f.id === func.id);
      if (!prev) return;
      const documents = getDocuments();
      if (!documents) return;
      if (prev.name !== func.name) {
        recordSymbolHistory(`Rename function ${prev.name} → ${func.name}`);
      } else {
        recordSymbolHistory(`Update function ${func.name}`);
      }
      setFunctions((list) => list.map((f) => (f.id === func.id ? func : f)));
      const tabName = formatFunctionTabName(func.name);
      setOpenTabs((tabs) =>
        tabs.map((tab) => (tab.id === func.id && tab.type === 'function' ? { ...tab, name: tabName } : tab))
      );
      applyDocuments(applyFunctionUpdateToDocuments(documents, func), {
        preserveHistory: true,
      });
    },
    [functions, setFunctions, setOpenTabs, getDocuments, applyDocuments, recordSymbolHistory]
  );

  const renameEvent = useCallback(
    (event: ProjectEventDefinition) => {
      const prev = events.find((e) => e.id === event.id);
      if (!prev) return;
      const documents = getDocuments();
      if (!documents) return;
      if (prev.name !== event.name) {
        recordSymbolHistory(`Rename event ${prev.name} → ${event.name}`);
      } else {
        recordSymbolHistory(`Update event ${event.name}`);
      }
      setEvents((list) => list.map((e) => (e.id === event.id ? event : e)));
      applyDocuments(applyEventUpdateToDocuments(documents, event), {
        preserveHistory: true,
      });
    },
    [events, setEvents, getDocuments, applyDocuments, recordSymbolHistory]
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

  const updateNativeScalarSignature = useCallback((definitionId: string, edited: VVSNodeData) => {
    const documents = getDocuments();
    if (!documents) throw new Error('NATIVE_SCALAR_SIGNATURE_TRANSACTION_DOCUMENTS');
    const next = transactNativeScalarSignature({ functions, documents }, definitionId, edited);
    const inferred = reconcileNativeScalarInferences({ functions: next.functions, variables, documents: next.documents }, definitionId);
    recordSymbolHistory('Edit native function signature');
    setFunctions(next.functions);
    setVariables(inferred.variables);
    applyDocuments(inferred.documents, { preserveHistory: true, selectedNodeId: definitionId, viewTabId: activeGraphTab });
  }, [functions, variables, getDocuments, recordSymbolHistory, setFunctions, setVariables, applyDocuments, activeGraphTab]);

  const updateNativeScalarExpression = useCallback((nodeId: string, key: string, value: unknown) => {
    const documents = getDocuments();
    if (!documents) throw new Error('NATIVE_EXPRESSION_EDIT_DOCUMENTS');
    const next = transactNativeScalarExpressionProperty({ variables, functions, documents }, nodeId, key, value);
    recordSymbolHistory('Edit native expression');
    setVariables(next.variables);
    applyDocuments(next.documents, { preserveHistory: true, viewTabId: activeGraphTab, selectedNodeId: nodeId });
    return next.diagnostics;
  }, [variables, functions, getDocuments, recordSymbolHistory, setVariables, applyDocuments, activeGraphTab]);

  const updateNativeScalarLocal = useCallback((declarationId: string, edit: NativeScalarLocalEdit | NativeScalarDeclarationModeEdit) => {
    const documents = getDocuments();
    if (!documents) throw new Error('NATIVE_SCALAR_LOCAL_TRANSACTION_DOCUMENTS');
    const declaration = Object.values(documents).flatMap(doc => doc.nodes).find(node => node.id === declarationId);
    const groupId = declaration?.data.properties?.groupOwnerId;
    const modeEdit = 'declarationMode' in edit;
    const localEdit: NativeScalarLocalEdit = modeEdit ? {} : edit;
    let next = modeEdit ? transactNativeScalarDeclarationMode({ variables, functions, documents }, declarationId, edit)
      : typeof groupId === 'string' && (localEdit.authoredType !== undefined || localEdit.mutable !== undefined)
      ? transactNativeScalarDeclarationGroup({ variables, functions, documents }, groupId, { ...(localEdit.authoredType !== undefined ? { authoredType: localEdit.authoredType } : {}), ...(localEdit.mutable !== undefined ? { mutable: localEdit.mutable } : {}) })
      : transactNativeScalarLocal({ variables, functions, documents }, declarationId, localEdit);
    if (!modeEdit && typeof groupId === 'string' && (localEdit.authoredType !== undefined || localEdit.mutable !== undefined) && localEdit.name !== undefined) next = transactNativeScalarLocal({ ...next, functions }, declarationId, { name: localEdit.name });
    recordSymbolHistory('Edit native local declaration');
    setVariables(next.variables);
    applyDocuments(next.documents, { preserveHistory: true, viewTabId: activeGraphTab, selectedNodeId: selection.type === 'node' ? selection.id ?? undefined : undefined });
  }, [variables, functions, getDocuments, recordSymbolHistory, setVariables, applyDocuments, activeGraphTab, selection]);

  const updateNativeScalarGroup = useCallback((groupId: string, edit: NativeScalarGroupEdit | NativeScalarDeclarationModeEdit) => {
    const documents = getDocuments();
    if (!documents) throw new Error('NATIVE_SCALAR_GROUP_TRANSACTION_DOCUMENTS');
    const next = 'declarationMode' in edit ? transactNativeScalarDeclarationMode({ variables, functions, documents }, groupId, edit) : transactNativeScalarDeclarationGroup({ variables, functions, documents }, groupId, edit);
    recordSymbolHistory('Edit native declaration group');
    setVariables(next.variables);
    applyDocuments(next.documents, { preserveHistory: true, viewTabId: activeGraphTab, selectedNodeId: selection.type === 'node' ? selection.id ?? undefined : undefined });
  }, [variables, functions, getDocuments, recordSymbolHistory, setVariables, applyDocuments, activeGraphTab, selection]);

  return {
    deleteSymbol,
    getUsageSummary,
    renameVariable,
    updateCSharpDeclarationGroup,
    updateCSharpLocalInitializer,
    renameFunction,
    updateNativeScalarSignature,
    updateNativeScalarExpression,
    updateNativeScalarLocal,
    updateNativeScalarGroup,
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
