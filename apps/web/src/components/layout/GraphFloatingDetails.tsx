'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNodesData, useReactFlow } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, isLinkedGraphNode, linkedGraphInspectorLabel } from '@/lib/linkedGraphNodes';
import { resolveImportableGraphName } from '@/lib/projectNodeCatalog';
import { CallNodeOverloadPanel } from './RightSidebar/CallNodeOverloadPanel';
import { resolveFunctionForNode } from '@/lib/functionHelpers';
import { normalizeNodeData, resolveNodeKindId } from '@/lib/nodeKind';
import { getNodeKindDefinition } from '@/lib/nodeRegistry';
import {
  applyEventDefineBinding,
  applyEventDispatchBinding,
  applyEventEmitBinding,
  applyEventSubscribeBinding,
  eventDisplayName,
  resolveEventForNode,
} from '@/lib/eventHelpers';
import type { ProjectEventDefinition, VVSNode, VVSNodeData, VariableSymbol } from '@/types/graph';
import { LOGICAL_DATA_TYPE_DESCRIPTORS, buildProjectSymbolIndex, isUnresolvedSymbolRef } from '@vvs/graph-types';
import { VariablePropertiesPanel } from './RightSidebar/VariablePropertiesPanel';
import { EventPropertiesPanel } from './RightSidebar/EventPropertiesPanel';
import { EventNodeBindingPanel } from './RightSidebar/EventNodeBindingPanel';
import { NodePinsPanel } from './RightSidebar/NodePinsPanel';
import { PropertySchemaPanel } from './RightSidebar/PropertySchemaPanel';
import { FunctionPropertiesPanel } from './RightSidebar/FunctionPropertiesPanel';
import { BrokenRefRepairPanel } from './RightSidebar/BrokenRefRepairPanel';
import { FloatingPanelShell } from './FloatingPanelShell';
import { openFunctionGraphTab } from '@/lib/graphTabs';
import type { FunctionSymbol } from '@/types/graph';
import { readUiPreference, writeUiPreferences, clampDetailsPanelHeight } from '@/lib/uiPreferences';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';

export const SPAWN_EVENT_NODE_EVENT = 'vvs:spawn-event-node';

const BROKEN_PANEL_MIN_HEIGHT = 280;

function CompactSummary({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-zinc-500 leading-relaxed">{children}</p>;
}

export function GraphFloatingDetails() {
  const {
    selection,
    setSelection,
    variables,
    events,
    activeGraphTab,
    functions,
    openTabs,
    setOpenTabs,
    setActiveGraphTab,
  } = useProject();
  const documents = useGraphDocuments();
  const {
    renameVariable,
    renameFunction,
    renameEvent,
    deleteBrokenNode,
    deleteAllBrokenForRef,
    fixBrokenNode,
    fixAllBrokenRefs,
  } = useSymbolLifecycle();

  const [expanded, setExpanded] = useState(() => readUiPreference('detailsPanelExpanded'));
  const [expandedHeight, setExpandedHeight] = useState(() =>
    clampDetailsPanelHeight(readUiPreference('detailsPanelExpandedHeight'))
  );
  const [compactHeight, setCompactHeight] = useState(() =>
    clampDetailsPanelHeight(readUiPreference('detailsPanelCompactHeight'))
  );

  const selectedNodeId = selection.type === 'node' ? selection.id : null;
  const nodeData = useNodesData<VVSNode>(selectedNodeId || '');
  const { updateNodeData } = useReactFlow();

  const selectedVariable =
    selection.type === 'variable' ? variables.find((v) => v.id === selection.id) : null;
  const selectedFunction =
    selection.type === 'function' ? functions.find((f) => f.id === selection.id) : null;
  const selectedEvent =
    selection.type === 'event' ? events.find((e) => e.id === selection.id) : null;

  const brokenRef = useMemo(() => {
    if (selection.type !== 'node' || !selectedNodeId || !nodeData) return null;
    const index = buildProjectSymbolIndex({
      variables,
      functions,
      events,
    });
    const node = {
      id: selectedNodeId,
      type: nodeData.type ?? 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: nodeData.data,
    };
    return isUnresolvedSymbolRef(node, index);
  }, [selection.type, selectedNodeId, nodeData, variables, functions, events]);

  const isBrokenRefSelection = brokenRef !== null;
  const effectiveExpanded = expanded || isBrokenRefSelection;
  const panelHeight = effectiveExpanded ? expandedHeight : compactHeight;

  useEffect(() => {
    if (!isBrokenRefSelection) return;
    if (expandedHeight < BROKEN_PANEL_MIN_HEIGHT) {
      const next = clampDetailsPanelHeight(BROKEN_PANEL_MIN_HEIGHT);
      setExpandedHeight(next);
      writeUiPreferences({ detailsPanelExpandedHeight: next });
    }
  }, [isBrokenRefSelection, expandedHeight]);

  const handlePanelHeightChange = useCallback(
    (height: number) => {
      const next = clampDetailsPanelHeight(height);
      if (effectiveExpanded) {
        setExpandedHeight(next);
        writeUiPreferences({ detailsPanelExpandedHeight: next });
      } else {
        setCompactHeight(next);
        writeUiPreferences({ detailsPanelCompactHeight: next });
      }
    },
    [effectiveExpanded]
  );

  const handleFunctionChange = (next: FunctionSymbol) => {
    renameFunction(next);
  };

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      writeUiPreferences({ detailsPanelExpanded: next });
      return next;
    });
  }, []);

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

  const handleNodePropertyChange = (key: string, value: string | number | boolean) => {
    if (!selectedNodeId || !nodeData) return;
    const patch = normalizeNodeData({
      ...nodeData.data,
      properties: {
        ...(nodeData.data.properties ?? {}),
        [key]: value,
      },
    });
    updateNodeData(selectedNodeId, {
      properties: patch.properties,
      outputs: patch.outputs,
      label: patch.label,
    });
  };

  const handleVariableChange = (next: VariableSymbol) => {
    renameVariable(next);
  };

  const handleEventChange = (next: ProjectEventDefinition) => {
    renameEvent(next);
  };

  const bindNodeToEvent = (
    event: ProjectEventDefinition,
    role: 'define' | 'dispatch' | 'emit' | 'subscribe'
  ) => {
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
        : role === 'subscribe'
          ? applyEventSubscribeBinding(nodeData?.data ?? empty, event)
          : role === 'emit'
            ? applyEventEmitBinding(nodeData?.data ?? empty, event)
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
  const nodeKindDef = nodeKindId ? getNodeKindDefinition(nodeKindId) : undefined;
  const isEventDefineNode = nodeKindId === 'event_define' || nodeKindId === 'event_custom';
  const isEventDispatchNode = nodeKindId === 'event_dispatch';
  const isEventEmitNode = nodeKindId === 'event_emit';
  const isEventSubscribeNode = nodeKindId === 'event_subscribe';
  const eventNodeRole: 'define' | 'dispatch' | 'emit' | 'subscribe' | null =
    isEventDefineNode
      ? 'define'
      : isEventSubscribeNode
        ? 'subscribe'
        : isEventEmitNode
          ? 'emit'
          : isEventDispatchNode
            ? 'dispatch'
            : null;
  const boundEvent = nodeData ? resolveEventForNode(nodeData.data, events) : undefined;
  const boundFunction = nodeData ? resolveFunctionForNode(nodeData.data, functions) : undefined;
  const isCallFunctionNode = nodeKindId === 'vvs.project.call_function';
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

  const baseTitle =
    selection.type === 'node'
      ? nodeData?.data.label ?? 'Node'
      : selection.type === 'variable'
        ? selectedVariable?.name ?? 'Variable'
        : selection.type === 'event'
          ? eventDisplayName(selectedEvent?.name ?? 'Event')
          : selection.type === 'function'
            ? selectedFunction?.name ?? 'Function'
            : 'Details';

  const title = isBrokenRefSelection ? `Broken reference — ${baseTitle}` : baseTitle;

  const spawnEventNode = (role: 'define' | 'dispatch' | 'emit' | 'subscribe') => {
    if (!selectedEvent) return;
    window.dispatchEvent(
      new CustomEvent(SPAWN_EVENT_NODE_EVENT, {
        detail: { eventId: selectedEvent.id, role },
      })
    );
  };

  const renderCompact = () => {
    if (isBrokenRefSelection && brokenRef && selectedNodeId) {
      return (
        <BrokenRefRepairPanel
          ref={brokenRef}
          onDeleteNode={() => deleteBrokenNode(activeGraphTab, selectedNodeId)}
          onDeleteAllForSymbol={() => deleteAllBrokenForRef(brokenRef)}
          onRecreateSymbol={() => fixBrokenNode(activeGraphTab, selectedNodeId)}
          onRecreateAllSymbols={() => fixAllBrokenRefs(brokenRef)}
        />
      );
    }

    if (selection.type === 'variable' && selectedVariable) {
      const typeLabel =
        LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === selectedVariable.type)?.shortLabel ??
        selectedVariable.type.replace(/^data_/, '');
      return (
        <CompactSummary>
          <span className="text-zinc-400">{typeLabel}</span>
          {selectedVariable.binding !== 'instance' ? ` · ${selectedVariable.binding}` : ''}
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
      if (eventNodeRole) {
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
      {isBrokenRefSelection && brokenRef && selectedNodeId ? (
        <BrokenRefRepairPanel
          ref={brokenRef}
          onDeleteNode={() => deleteBrokenNode(activeGraphTab, selectedNodeId)}
          onDeleteAllForSymbol={() => deleteAllBrokenForRef(brokenRef)}
          onRecreateSymbol={() => fixBrokenNode(activeGraphTab, selectedNodeId)}
          onRecreateAllSymbols={() => fixAllBrokenRefs(brokenRef)}
        />
      ) : null}

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
          onSpawnSubscribe={() => spawnEventNode('subscribe')}
          onSpawnEmit={() => spawnEventNode('emit')}
          onSpawnDispatch={() => spawnEventNode('dispatch')}
        />
      )}

      {selection.type === 'node' && nodeData && selectedNodeId && (
        <>
          {eventNodeRole && (
            <div className="mb-2 pb-2 border-b border-zinc-800/80">
              <EventNodeBindingPanel
                events={events}
                eventId={
                  typeof nodeData.data.properties?.eventId === 'string'
                    ? nodeData.data.properties.eventId
                    : undefined
                }
                role={eventNodeRole}
                onSelectEvent={(event) => bindNodeToEvent(event, eventNodeRole)}
              />
            </div>
          )}

          {isCallFunctionNode && boundFunction ? (
            <CallNodeOverloadPanel
              func={boundFunction}
              nodeData={nodeData.data}
              onApply={(patch) => updateNodeData(selectedNodeId, patch)}
            />
          ) : null}

          {nodeKindDef?.propertySchema && nodeKindDef.propertySchema.length > 0 ? (
            <PropertySchemaPanel
              fields={nodeKindDef.propertySchema}
              values={(nodeData.data.properties ?? {}) as Record<string, unknown>}
              onChange={handleNodePropertyChange}
            />
          ) : null}

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
      titleIcon={isBrokenRefSelection ? <AlertTriangle size={13} className="text-amber-400" /> : undefined}
      corner="top-right"
      expanded={effectiveExpanded}
      onToggleExpanded={toggleExpanded}
      onClose={handleDismiss}
      heightPx={panelHeight}
      onHeightChange={handlePanelHeightChange}
    >
      {effectiveExpanded ? renderExpanded() : renderCompact()}
    </FloatingPanelShell>
  );
}
