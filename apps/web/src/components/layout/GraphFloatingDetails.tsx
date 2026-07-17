'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNodesData, useReactFlow } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, nestedGraphIdForNode, linkedGraphInspectorLabel } from '@/lib/linkedGraphNodes';
import { resolveImportableGraphName } from '@/lib/projectNodeCatalog';
import { CallNodeOverloadPanel } from './RightSidebar/CallNodeOverloadPanel';
import { SwitchNodePanel } from './RightSidebar/SwitchNodePanel';
import { resolveVariableForNode } from '@/lib/variableHelpers';
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
import { ImportGraphTargetPanel } from './RightSidebar/ImportGraphTargetPanel';
import { FunctionPropertiesPanel } from './RightSidebar/FunctionPropertiesPanel';
import { BrokenRefRepairPanel } from './RightSidebar/BrokenRefRepairPanel';
import { CodePreviewPropertiesPanel } from './RightSidebar/CodePreviewPropertiesPanel';
import { FloatingPanelShell } from './FloatingPanelShell';
import { openFunctionGraphTab } from '@/lib/graphTabs';
import type { FunctionSymbol } from '@/types/graph';
import { readUiPreference, writeUiPreferences, clampDetailsPanelHeight, clampFloatingPanelWidth, defaultDetailsPanelLayout, dispatchResetDetailsPanelLayout, RESET_DETAILS_PANEL_LAYOUT_EVENT } from '@/lib/uiPreferences';
import { useUiPreference } from '@/hooks/useUiPreference';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { activeClass } from '@/lib/classScope';
import {
  hasDefineNodeForEvent,
  hasHandlerNodeForEvent,
} from '@/lib/defineNodeSync';
import { paneMenuPosition } from '@/lib/paneMenuPosition';

export const SPAWN_EVENT_NODE_EVENT = 'vvs:spawn-event-node';
export const SPAWN_EVENT_DECLARE_MEMBER_EVENT = 'vvs:spawn-event-declare-member';
export const SPAWN_FUNCTION_IMPLEMENT_EVENT = 'vvs:spawn-function-implement';
/** Spawn a Call Function node at viewport center (tree context menu). */
export const SPAWN_FUNCTION_CALL_EVENT = 'vvs:spawn-function-call';

/** Delay before hover expands details — avoids flash while dragging. */
const HOVER_EXPAND_MS = 180;
const ROLE_CHIP_CLASS: Record<string, string> = {
  Declare: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Define: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  Call: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

function resolveNodeRoleChip(kindId: string | null): string | null {
  if (!kindId) return null;
  if (kindId === 'function_define') return 'Declare';
  if (kindId === 'function_implement') return 'Define';
  if (
    kindId === 'var_define' ||
    kindId === 'class_define' ||
    kindId === 'event_member_define'
  ) {
    return 'Declare';
  }
  if (kindId === 'event_define' || kindId === 'event_custom') return 'Define';
  if (kindId === 'event_dispatch') return 'Call';
  if (kindId === 'vvs.project.call_function' || kindId === 'call_function') return 'Call';
  return null;
}

function NodeRoleChip({ role }: { role: string }) {
  return (
    <span
      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium border ${ROLE_CHIP_CLASS[role] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
    >
      {role}
    </span>
  );
}

const BROKEN_PANEL_MIN_HEIGHT = 280;

function CompactSummary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function GraphFloatingDetailsPanel() {
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
    classes,
    activeClassId,
    graphContainers,
  } = useProject();
  const graphDocuments = useGraphDocuments();
  const {
    renameVariable,
    renameFunction,
    renameEvent,
    deleteBrokenNode,
    deleteAllBrokenForRef,
    fixBrokenNode,
    fixAllBrokenRefs,
  } = useSymbolLifecycle();

  const [pinned, setPinned] = useUiPreference('detailsPanelPinned');
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureActiveRef = useRef(false);
  const hoverInsideRef = useRef(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [expandedHeight, setExpandedHeight] = useState(() =>
    clampDetailsPanelHeight(readUiPreference('detailsPanelExpandedHeight'))
  );
  const [expandedWidth, setExpandedWidth] = useState(() =>
    clampFloatingPanelWidth(readUiPreference('detailsPanelExpandedWidth'))
  );
  const [offsetRight, setOffsetRight] = useState(() => readUiPreference('detailsPanelOffsetRight'));
  const [offsetTop, setOffsetTop] = useState(() => readUiPreference('detailsPanelOffsetTop'));

  const selectedNodeId = selection.type === 'node' ? selection.id : null;
  const nodeData = useNodesData<VVSNode>(selectedNodeId || '');
  const { updateNodeData } = useReactFlow();

  // New selection → drop transient hover expand (pin still wins).
  useEffect(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverExpanded(false);
  }, [selection.type, selection.id]);

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
  const effectiveExpanded = pinned || hoverExpanded || isBrokenRefSelection;

  if (isBrokenRefSelection && expandedHeight < BROKEN_PANEL_MIN_HEIGHT) {
    setExpandedHeight(clampDetailsPanelHeight(BROKEN_PANEL_MIN_HEIGHT));
  }

  useEffect(() => {
    if (isBrokenRefSelection && expandedHeight < BROKEN_PANEL_MIN_HEIGHT) {
      writeUiPreferences({ detailsPanelExpandedHeight: clampDetailsPanelHeight(BROKEN_PANEL_MIN_HEIGHT) });
    }
  }, [isBrokenRefSelection, expandedHeight]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const applyDefaultLayout = useCallback(() => {
    const d = defaultDetailsPanelLayout();
    setExpandedWidth(d.width);
    setExpandedHeight(d.height);
    setOffsetRight(d.offsetRight);
    setOffsetTop(d.offsetTop);
  }, []);

  useEffect(() => {
    const onReset = () => applyDefaultLayout();
    window.addEventListener(RESET_DETAILS_PANEL_LAYOUT_EVENT, onReset);
    return () => window.removeEventListener(RESET_DETAILS_PANEL_LAYOUT_EVENT, onReset);
  }, [applyDefaultLayout]);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    const onDown = (e: MouseEvent) => {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [contextMenu]);

  const handlePanelHeightChange = useCallback((height: number) => {
    const next = clampDetailsPanelHeight(height);
    setExpandedHeight(next);
    writeUiPreferences({ detailsPanelExpandedHeight: next });
  }, []);

  const handlePanelWidthChange = useCallback((width: number) => {
    const next = clampFloatingPanelWidth(width);
    setExpandedWidth(next);
    writeUiPreferences({ detailsPanelExpandedWidth: next });
  }, []);

  const handleOffsetChange = useCallback((right: number, top: number) => {
    setOffsetRight(right);
    setOffsetTop(top);
    writeUiPreferences({ detailsPanelOffsetRight: right, detailsPanelOffsetTop: top });
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(paneMenuPosition(event.clientX, event.clientY, 180, 40));
  }, []);

  const handleResetLayout = useCallback(() => {
    dispatchResetDetailsPanelLayout();
    setContextMenu(null);
  }, []);

  const handleFunctionChange = (next: FunctionSymbol) => {
    renameFunction(next);
  };

  const togglePinned = useCallback(() => {
    setPinned(!pinned);
  }, [pinned, setPinned]);

  const handleHoverChange = useCallback(
    (hovered: boolean) => {
      hoverInsideRef.current = hovered;
      if (gestureActiveRef.current) {
        if (hovered) {
          if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
          setHoverExpanded(true);
        }
        return;
      }
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (hovered) {
        hoverTimerRef.current = setTimeout(() => {
          setHoverExpanded(true);
          hoverTimerRef.current = null;
        }, HOVER_EXPAND_MS);
        return;
      }
      if (!pinned) {
        setHoverExpanded(false);
      }
    },
    [pinned]
  );

  const handleGestureChange = useCallback(
    (active: boolean) => {
      gestureActiveRef.current = active;
      if (active) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        setHoverExpanded(true);
        return;
      }
      if (!hoverInsideRef.current && !pinned) {
        setHoverExpanded(false);
      }
    },
    [pinned]
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
    
    // Dual write to symbol table
    const symbolId = nodeData.data.properties?.symbolId;
    if (symbolId && typeof symbolId === 'string') {
      const isFlag = ['isConst', 'isAbstract', 'isVirtual', 'isOverride', 'isAsync'].includes(key);
      const flagKey = key === 'isConst' ? 'readonly' : (isFlag ? key.slice(2).toLowerCase() : null);
      
      if (nodeData.data.kindId === 'var_define') {
        const v = variables.find(x => x.id === symbolId);
        if (v) {
          if (isFlag) renameVariable({ ...v, flags: { ...v.flags, [flagKey!]: value } });
          else renameVariable({ ...v, [key]: value });
        }
      } else if (nodeData.data.kindId === 'function_define') {
        const f = functions.find(x => x.id === symbolId);
        if (f) {
          if (isFlag) renameFunction({ ...f, flags: { ...f.flags, [flagKey!]: value } });
          else renameFunction({ ...f, [key]: value });
        }
      } else if (nodeData.data.kindId === 'event_member_define') {
        const e = events.find(x => x.id === symbolId);
        if (e) {
          // Event doesn't have flags currently, but if it does later, handle it here
          renameEvent({ ...e, [key]: value });
        }
      }
    }
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
    if (!nodeData) return;
    const nestedId = nestedGraphIdForNode(nodeData.data);
    if (!nestedId) return;
    const entryId = findGraphEntryNodeId(graphDocuments ?? {}, nestedId);
    if (!entryId) return;
    dispatchNavigateToNode(nestedId, entryId);
  };

  const linkedGraphName = (() => {
    if (!nodeData) return undefined;
    const nestedId = nestedGraphIdForNode(nodeData.data);
    if (!nestedId) return undefined;
    return resolveImportableGraphName(nestedId, functions, openTabs);
  })();

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
  const isVarDefineNode = nodeKindId === 'var_define';
  const isFunctionDefineNode = nodeKindId === 'function_define';
  const isEventMemberDefineNode = nodeKindId === 'event_member_define';
  const isImportTargetNode =
    nodeKindId === 'graph_ref' ||
    nodeKindId === 'import_class' ||
    nodeKindId === 'vvs.project.import_module' ||
    nodeData?.data.linkKind === 'import_module';

  const filteredPropertySchema = useMemo(() => {
    if (!nodeKindDef?.propertySchema?.length) return [];
    const hidden = new Set<string>();
    if (nodeKindId === 'graph_ref') {
      hidden.add('classId');
      hidden.add('containerId');
      hidden.add('graphTabId');
      hidden.add('refLabel');
    }
    if (nodeKindId === 'import_class') {
      hidden.add('targetClassId');
    }
    // Linking IDs — not user codegen options
    hidden.add('symbolId');
    hidden.add('eventId');
    if (nodeKindId === 'function_define') {
      hidden.add('graphTabId');
    }
    return nodeKindDef.propertySchema.filter((field) => !hidden.has(field.key));
  }, [nodeKindDef?.propertySchema, nodeKindId]);
  const boundVariable = nodeData ? resolveVariableForNode(nodeData.data, variables) : undefined;
  const isCommentNode = nodeData?.type === 'vvs_comment_node';
  const isRerouteNode = nodeData?.type === 'vvs_reroute_node';
  const nodeRoleChip = selection.type === 'node' ? resolveNodeRoleChip(nodeKindId) : null;

  const selectedEventDeclareStatus = useMemo(() => {
    if (!selectedEvent || !graphDocuments) return null;
    const cls = activeClass(classes, activeClassId);
    if (!cls) return null;
    return {
      hasDeclare: hasDefineNodeForEvent(graphDocuments, cls, selectedEvent.id),
      hasHandler: hasHandlerNodeForEvent(graphDocuments, selectedEvent.id),
    };
  }, [selectedEvent, graphDocuments, classes, activeClassId]);

  const boundEventDeclareStatus = useMemo(() => {
    if (!boundEvent || !graphDocuments) return null;
    const cls = activeClass(classes, activeClassId);
    if (!cls) return null;
    return {
      hasDeclare: hasDefineNodeForEvent(graphDocuments, cls, boundEvent.id),
      hasHandler: hasHandlerNodeForEvent(graphDocuments, boundEvent.id),
    };
  }, [boundEvent, graphDocuments, classes, activeClassId]);

  const visible =
    (selection.type === 'node' && !isCommentNode && !isRerouteNode) ||
    selection.type === 'variable' ||
    selection.type === 'event' ||
    selection.type === 'function' ||
    selection.type === 'code';

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
            : selection.type === 'code'
              ? 'Code preview'
              : 'Details';

  const title = isBrokenRefSelection ? `Broken reference — ${baseTitle}` : baseTitle;

  const inspectorEvent = selectedEvent ?? boundEvent ?? null;

  const spawnEventNodeFor = (event: ProjectEventDefinition, role: 'define' | 'dispatch') => {
    window.dispatchEvent(
      new CustomEvent(SPAWN_EVENT_NODE_EVENT, {
        detail: { eventId: event.id, role },
      })
    );
  };

  const spawnEventDeclareMemberFor = (event: ProjectEventDefinition) => {
    window.dispatchEvent(
      new CustomEvent(SPAWN_EVENT_DECLARE_MEMBER_EVENT, {
        detail: { eventId: event.id },
      })
    );
  };

  const eventCanvasActions = inspectorEvent
    ? {
        onSpawnDeclareMember:
          isEventMemberDefineNode ||
          (inspectorEvent.id === selectedEvent?.id
            ? selectedEventDeclareStatus?.hasDeclare
            : boundEventDeclareStatus?.hasDeclare)
            ? undefined
            : () => spawnEventDeclareMemberFor(inspectorEvent),
        onSpawnHandler: () => spawnEventNodeFor(inspectorEvent, 'define'),
        onSpawnDispatch: () => spawnEventNodeFor(inspectorEvent, 'dispatch'),
      }
    : {};

  const renderCompactSubtitle = (): React.ReactNode => {
    if (isBrokenRefSelection) {
      return <span className="text-amber-400/90">Unresolved — hover or pin to repair</span>;
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
          {selectedFunction.overloads.length > 1
            ? ` · ${selectedFunction.overloads.length} overloads`
            : ''}
        </CompactSummary>
      );
    }
    if (selection.type === 'event' && selectedEvent) {
      return (
        <CompactSummary>
          {selectedEvent.parameters.length} param
          {selectedEvent.parameters.length === 1 ? '' : 's'}
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
      if (nestedGraphIdForNode(nodeData.data)) {
        return <CompactSummary>→ {linkedGraphName ?? 'graph'}</CompactSummary>;
      }
      return (
        <CompactSummary>
          {inputCount}↓ {outputCount}↑ · hover for details
        </CompactSummary>
      );
    }
    if (selection.type === 'code') {
      return <CompactSummary>Language · emit options · hover for details</CompactSummary>;
    }
    return null;
  };

  const renderExpanded = () => (
    <>
      {isBrokenRefSelection && brokenRef && selectedNodeId ? (
        <BrokenRefRepairPanel
          symbolRef={brokenRef}
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
          {...eventCanvasActions}
        />
      )}

      {selection.type === 'code' ? (
        <CodePreviewPropertiesPanel filePath={selection.id} />
      ) : null}

      {selection.type === 'node' && nodeData && selectedNodeId && (
        <>
          {isVarDefineNode && boundVariable ? (
            <div className="mb-2 pb-2 border-b border-zinc-800/80">
              <VariablePropertiesPanel variable={boundVariable} onChange={handleVariableChange} />
            </div>
          ) : null}

          {isFunctionDefineNode && boundFunction ? (
            <div className="mb-2 pb-2 border-b border-zinc-800/80">
              <FunctionPropertiesPanel
                func={boundFunction}
                onChange={handleFunctionChange}
                onOpenGraph={(overloadId) => {
                  const tabId =
                    boundFunction.overloads.find((o) => o.id === overloadId)?.graphTabId ??
                    boundFunction.id;
                  openFunctionGraphTab(boundFunction, setOpenTabs, setActiveGraphTab);
                  setActiveGraphTab(tabId);
                }}
              />
            </div>
          ) : null}

          {isEventMemberDefineNode && boundEvent ? (
            <div className="mb-2 pb-2 border-b border-zinc-800/80">
              <EventPropertiesPanel
                event={boundEvent}
                onChange={handleEventChange}
                {...eventCanvasActions}
              />
            </div>
          ) : null}

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

          {isImportTargetNode && nodeData && selectedNodeId ? (
            <ImportGraphTargetPanel
              kindId={nodeKindId}
              nodeData={nodeData.data}
              activeGraphTab={activeGraphTab}
              graphContainers={graphContainers}
              openTabs={openTabs}
              functions={functions}
              classes={classes}
              onApply={(patch) => updateNodeData(selectedNodeId, patch)}
            />
          ) : null}

          {nodeKindId === 'flow_switch' && (
            <SwitchNodePanel
              nodeData={nodeData}
              onApply={(patch) => updateNodeData(selectedNodeId, patch)}
            />
          )}

          {filteredPropertySchema.length > 0 ? (
            <PropertySchemaPanel
              fields={filteredPropertySchema}
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
            onOpenLinkedGraph={
              nestedGraphIdForNode(nodeData.data) ? handleOpenLinkedGraph : undefined
            }
          />
        </>
      )}
    </>
  );

  return (
    <>
      <FloatingPanelShell
        title={title}
        subtitle={effectiveExpanded ? undefined : renderCompactSubtitle()}
        titleIcon={isBrokenRefSelection ? <AlertTriangle size={13} className="text-amber-400" /> : undefined}
        headerExtra={nodeRoleChip ? <NodeRoleChip role={nodeRoleChip} /> : undefined}
        corner="top-right"
        expanded={effectiveExpanded}
        pinned={pinned}
        onTogglePinned={togglePinned}
        onHoverChange={handleHoverChange}
        onGestureChange={handleGestureChange}
        onContextMenu={handleContextMenu}
        onClose={handleDismiss}
        heightPx={effectiveExpanded ? expandedHeight : undefined}
        onHeightChange={effectiveExpanded ? handlePanelHeightChange : undefined}
        widthPx={expandedWidth}
        onWidthChange={effectiveExpanded ? handlePanelWidthChange : undefined}
        offsetRight={offsetRight}
        offsetTop={offsetTop}
        onOffsetChange={handleOffsetChange}
      >
        {effectiveExpanded ? renderExpanded() : null}
      </FloatingPanelShell>
      {contextMenu ? (
        <div
          ref={contextMenuRef}
          className="fixed z-[80] min-w-[168px] py-0.5 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-800"
            onClick={handleResetLayout}
          >
            Reset size & position
          </button>
        </div>
      ) : null}
    </>
  );
}

export const GraphFloatingDetails = React.memo(GraphFloatingDetailsPanel);
