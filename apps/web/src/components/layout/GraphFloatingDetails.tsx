'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useNodesData, useReactFlow } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { listMacroEntries } from '@/lib/projectTree';
import { wouldNodeLabelCauseCrossGraphCycle } from '@/lib/graphRelations';
import { dispatchEditorWarning } from '@/lib/editorMessages';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, isLinkedGraphNode, linkedGraphInspectorLabel } from '@/lib/linkedGraphNodes';
import { resolveImportableGraphName } from '@/lib/projectNodeCatalog';
import { resolveNodeKindId } from '@/lib/nodeKind';
import {
  applyEventDefineBinding,
  applyEventDispatchBinding,
  eventDisplayName,
  resolveEventForNode,
} from '@/lib/eventHelpers';
import type { ProjectEventDefinition, VVSNode, VVSNodeData } from '@/types/graph';
import { defaultValueForVariableType, VariableType } from '@/lib/variableDefaults';
import { VariablePropertiesPanel } from './RightSidebar/VariablePropertiesPanel';
import { EventPropertiesPanel } from './RightSidebar/EventPropertiesPanel';
import { EventNodeBindingPanel } from './RightSidebar/EventNodeBindingPanel';
import { NodePinsPanel } from './RightSidebar/NodePinsPanel';
import { FunctionPropertiesPanel } from './RightSidebar/FunctionPropertiesPanel';
import { FloatingPanelShell } from './FloatingPanelShell';
import { dispatchFunctionRenamed, syncCallNodesForFunction } from '@/lib/functionHelpers';
import { openFunctionGraphTab } from '@/lib/graphTabs';
import type { FunctionSymbol } from '@/types/graph';

export const SPAWN_EVENT_NODE_EVENT = 'vvs:spawn-event-node';

const DETAILS_EXPANDED_KEY = 'vvs:details-panel-expanded';

function readExpandedPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DETAILS_EXPANDED_KEY) === 'true';
}

function CompactSummary({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-zinc-500 leading-relaxed">{children}</p>;
}

export function GraphFloatingDetails() {
  const {
    selection,
    setSelection,
    variables,
    setVariables,
    events,
    setEvents,
    activeGraphTab,
    functions,
    setFunctions,
    openTabs,
    setOpenTabs,
    setActiveGraphTab,
  } = useProject();
  const documents = useGraphDocuments();
  const macros = listMacroEntries(openTabs);
  const [expanded, setExpanded] = useState(readExpandedPreference);

  const selectedNodeId = selection.type === 'node' ? selection.id : null;
  const nodeData = useNodesData<VVSNode>(selectedNodeId || '');
  const { updateNodeData, setNodes } = useReactFlow();

  const selectedVariable =
    selection.type === 'variable' ? variables.find((v) => v.id === selection.id) : null;
  const selectedFunction =
    selection.type === 'function' ? functions.find((f) => f.id === selection.id) : null;
  const selectedEvent =
    selection.type === 'event' ? events.find((e) => e.id === selection.id) : null;

  const syncCallNodesForFunctionOnCanvas = useCallback(
    (func: FunctionSymbol) => {
      setNodes((nds) => syncCallNodesForFunction(nds as VVSNode[], func) as VVSNode[]);
    },
    [setNodes]
  );

  const handleFunctionChange = (next: FunctionSymbol) => {
    const prev = functions.find((f) => f.id === next.id);
    setFunctions((list) => list.map((f) => (f.id === next.id ? next : f)));
    if (prev && prev.name !== next.name) {
      dispatchFunctionRenamed(next);
    }
    syncCallNodesForFunctionOnCanvas(next);
  };

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      window.localStorage.setItem(DETAILS_EXPANDED_KEY, String(next));
      return next;
    });
  }, []);

  const syncEventNodesOnCanvas = useCallback(
    (event: ProjectEventDefinition) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type !== 'vvs_standard_node') return n;
          const data = n.data as VVSNodeData;
          const boundId = data.properties?.eventId;
          if (typeof boundId !== 'string' || boundId !== event.id) return n;
          const kindId = resolveNodeKindId(data);
          if (kindId === 'event_define' || kindId === 'event_custom') {
            return { ...n, data: applyEventDefineBinding(data, event) };
          }
          if (kindId === 'event_dispatch') {
            return { ...n, data: applyEventDispatchBinding(data, event) };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  const handleDismiss = () => {
    setSelection({ type: 'graph', id: null });
  };

  const handleNodeInputChange = (key: string, value: string | number | boolean) => {
    if (!selectedNodeId || !nodeData) return;
    updateNodeData(selectedNodeId, {
      inlineValues: {
        ...(nodeData.data.inlineValues || {}),
        [key]: value,
      },
    });
  };

  const handleVariableChange = (
    key: 'name' | 'type' | 'defaultValue' | 'binding' | 'readonly',
    value: string | number | boolean | Record<string, unknown>
  ) => {
    if (!selectedVariable) return;

    if (key === 'name' && typeof value === 'string' && value !== selectedVariable.name) {
      window.dispatchEvent(
        new CustomEvent('vvs:variable-renamed', {
          detail: { oldName: selectedVariable.name, newName: value },
        })
      );
    }

    setVariables((vars) =>
      vars.map((v) => {
        if (v.id !== selectedVariable.id) return v;
        if (key === 'type') {
          const nextType = value as VariableType;
          return { ...v, type: nextType, defaultValue: defaultValueForVariableType(nextType) };
        }
        return { ...v, [key]: value };
      })
    );
  };

  const handleEventChange = (next: ProjectEventDefinition) => {
    setEvents((list) => list.map((e) => (e.id === next.id ? next : e)));
    syncEventNodesOnCanvas(next);
  };

  const bindNodeToEvent = (event: ProjectEventDefinition, role: 'define' | 'dispatch') => {
    if (!selectedNodeId) return;
    const empty: VVSNodeData = {
      label: '',
      category: 'Events',
      inputs: [],
      outputs: [],
      inlineValues: {},
    };
    const patch =
      role === 'define'
        ? applyEventDefineBinding(nodeData?.data ?? empty, event)
        : applyEventDispatchBinding(nodeData?.data ?? empty, event);
    updateNodeData(selectedNodeId, patch);
  };

  const handleOpenLinkedGraph = () => {
    if (!nodeData || !isLinkedGraphNode(nodeData.data) || !nodeData.data.linkedGraphId) return;
    const entryId = findGraphEntryNodeId(documents ?? {}, nodeData.data.linkedGraphId);
    if (!entryId) return;
    dispatchNavigateToNode(nodeData.data.linkedGraphId, entryId);
  };

  const linkedGraphName =
    nodeData?.data.linkedGraphId && nodeData.data.linkKind
      ? resolveImportableGraphName(nodeData.data.linkedGraphId, functions, openTabs)
      : undefined;

  const nodeKindId = nodeData ? resolveNodeKindId(nodeData.data) : null;
  const isEventDefineNode = nodeKindId === 'event_define' || nodeKindId === 'event_custom';
  const isEventDispatchNode = nodeKindId === 'event_dispatch';
  const boundEvent = nodeData ? resolveEventForNode(nodeData.data, events) : undefined;
  const isCommentNode = nodeData?.type === 'vvs_comment_node';
  const isRerouteNode = nodeData?.type === 'vvs_reroute_node';

  const visible =
    (selection.type === 'node' && !isCommentNode && !isRerouteNode) ||
    selection.type === 'variable' ||
    selection.type === 'event' ||
    selection.type === 'function';

  if (!visible) return null;

  const inputCount = nodeData?.data.inputs?.length ?? 0;
  const outputCount = nodeData?.data.outputs?.length ?? 0;

  const title =
    selection.type === 'node'
      ? nodeData?.data.label ?? 'Node'
      : selection.type === 'variable'
        ? selectedVariable?.name ?? 'Variable'
        : selection.type === 'event'
          ? eventDisplayName(selectedEvent?.name ?? 'Event')
          : selection.type === 'function'
            ? selectedFunction?.name ?? 'Function'
          : 'Details';

  const spawnEventNode = (role: 'define' | 'dispatch') => {
    if (!selectedEvent) return;
    window.dispatchEvent(
      new CustomEvent(SPAWN_EVENT_NODE_EVENT, {
        detail: { eventId: selectedEvent.id, role },
      })
    );
  };

  const renderCompact = () => {
    if (selection.type === 'variable' && selectedVariable) {
      return (
        <CompactSummary>
          <span className="text-zinc-400">{selectedVariable.type}</span>
        </CompactSummary>
      );
    }
    if (selection.type === 'function' && selectedFunction) {
      return (
        <CompactSummary>
          <span className="text-zinc-400">{selectedFunction.binding}</span>
          {selectedFunction.overloads.length > 1 ? ` · ${selectedFunction.overloads.length} overloads` : ''}
        </CompactSummary>
      );
    }
    if (selection.type === 'event' && selectedEvent) {
      return (
        <CompactSummary>
          {selectedEvent.parameters.length} param{selectedEvent.parameters.length === 1 ? '' : 's'}
        </CompactSummary>
      );
    }
    if (selection.type === 'node' && nodeData) {
      if (isEventDefineNode || isEventDispatchNode) {
        return (
          <CompactSummary>
            {boundEvent ? eventDisplayName(boundEvent.name) : '—'} · {inputCount + outputCount} pins
          </CompactSummary>
        );
      }
      if (isLinkedGraphNode(nodeData.data)) {
        return (
          <CompactSummary>
            → {linkedGraphName ?? 'graph'}
          </CompactSummary>
        );
      }
      return (
        <CompactSummary>
          {inputCount}↓ {outputCount}↑
        </CompactSummary>
      );
    }
    return null;
  };

  const renderExpanded = () => (
    <>
      {selection.type === 'variable' && selectedVariable && (
        <VariablePropertiesPanel variable={selectedVariable} onChange={handleVariableChange} />
      )}

      {selection.type === 'function' && selectedFunction && (
        <FunctionPropertiesPanel
          func={selectedFunction}
          onChange={handleFunctionChange}
          onOpenGraph={(overloadId) => {
            const tabId =
              selectedFunction.overloads.find((o) => o.id === overloadId)?.graphTabId ??
              selectedFunction.id;
            openFunctionGraphTab(selectedFunction, setOpenTabs, setActiveGraphTab);
            setActiveGraphTab(tabId);
          }}
        />
      )}

      {selection.type === 'event' && selectedEvent && (
        <EventPropertiesPanel
          event={selectedEvent}
          onChange={handleEventChange}
          onSpawnDefine={() => spawnEventNode('define')}
          onSpawnDispatch={() => spawnEventNode('dispatch')}
        />
      )}

      {selection.type === 'node' && nodeData && selectedNodeId && (
        <>
          {(isEventDefineNode || isEventDispatchNode) && (
            <div className="mb-2 pb-2 border-b border-zinc-800/80">
              <EventNodeBindingPanel
                events={events}
                eventId={
                  typeof nodeData.data.properties?.eventId === 'string'
                    ? nodeData.data.properties.eventId
                    : undefined
                }
                role={isEventDispatchNode ? 'dispatch' : 'define'}
                onSelectEvent={(event) =>
                  bindNodeToEvent(event, isEventDispatchNode ? 'dispatch' : 'define')
                }
              />
            </div>
          )}

          <NodePinsPanel
            nodeData={nodeData}
            onInputChange={handleNodeInputChange}
            linkedGraphName={linkedGraphName}
            linkedGraphInspectorLabel={
              nodeData.data.linkKind ? linkedGraphInspectorLabel(nodeData.data.linkKind) : undefined
            }
            onOpenLinkedGraph={isLinkedGraphNode(nodeData.data) ? handleOpenLinkedGraph : undefined}
          />
        </>
      )}
    </>
  );

  return (
    <FloatingPanelShell
      title={title}
      corner="top-right"
      expanded={expanded}
      onToggleExpanded={toggleExpanded}
      onClose={handleDismiss}
    >
      {expanded ? renderExpanded() : renderCompact()}
    </FloatingPanelShell>
  );
}
