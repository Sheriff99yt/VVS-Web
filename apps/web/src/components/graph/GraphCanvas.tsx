'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useReactFlow, Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphEdit } from '@/contexts/GraphEditContext';
import { useEditorView } from '@/contexts/EditorViewContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { VVSNode } from './VVSNode';
import { VVSEdge } from './VVSEdge';
import { VVSNode as VVSNodeType, VVSEdge as VVSEdgeType, PinType } from '@/types/graph';
import { NodeContextMenu } from './NodeContextMenu';
import { CanvasDropMenu } from './CanvasDropMenu';
import { LibraryNodeTemplate } from '@/types/ui';
import { useProject } from '@/contexts/ProjectContext';
import { VVSCommentNode } from './VVSCommentNode';
import { VVSRerouteNode } from './VVSRerouteNode';
import { GraphAction } from '@/lib/graphActions';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, isLinkedGraphNode } from '@/lib/linkedGraphNodes';
import { GraphNodeSearch } from './GraphNodeSearch';
import { GraphSelectionToolbar } from './GraphSelectionToolbar';
import { GraphFloatingDetails, SPAWN_EVENT_NODE_EVENT } from '@/components/layout/GraphFloatingDetails';
import { GraphFloatingCompilerLog } from '@/components/layout/GraphFloatingCompilerLog';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import {
  buildEventNodeData,
  applyEventDispatchBinding,
  createEventId,
  eventDisplayName,
  EVENT_DRAG_MIME,
  type EventDragPayload,
} from '@/lib/eventHelpers';
import {
  buildEnvironmentNodeData,
  SPAWN_ENV_NODE_EVENT,
  type EnvironmentSpawnAction,
} from '@/lib/environmentHelpers';
import { getLinkedEnvironmentManifest } from '@/lib/environmentContext';
import {
  applyFunctionCallBinding,
  FUNCTION_RENAMED_EVENT,
  FUNCTION_OVERLOAD_DRAG_MIME,
  syncCallNodesForFunction,
  type FunctionOverloadDragPayload,
} from '@/lib/functionHelpers';
import { applyVariableRefBinding } from '@/lib/variableHelpers';
import { clearCanvasSelectionKeepTreeSymbol, isTreeSymbolSelection } from '@/lib/projectSelection';

import {
  applyWireConnection,
  connectionFromReactFlow,
  createUniqueEdgeId,
  findCompatiblePin,
  isValidWireConnection,
  pinTypeFromDragHandle,
  splitEdgeWithReroute,
  wireRejectionMessage,
} from '@/lib/graphWiring';
import { dispatchEditorWarning } from '@/lib/editorMessages';
import {
  resolveCrossGraphTarget,
  wouldCrossGraphDependencyCycle,
} from '@/lib/graphRelations';
import { extractSelectionToFunction } from '@/lib/extractToFunction';
import { resolve as resolveKind } from '@vvs/syntax-registry';
import { defaultPropertiesFromSchema } from '@vvs/syntax-registry';
import { normalizeNodeData } from '@/lib/nodeKind';
import {
  readSystemGraphClipboard,
  writeSystemGraphClipboard,
  type GraphClipboardPayload,
} from '@/lib/graphClipboard';
import { useSyncProjectSelection } from '@/hooks/useSyncProjectSelection';
import { useEditorFocus } from '@/hooks/useEditorFocus';
import { useGraphKeyboardShortcuts } from '@/hooks/useGraphKeyboardShortcuts';
import { GraphShortcutsHelp } from './GraphShortcutsHelp';
import { activeClass, classGraphTabId, classScopedSymbols, isOnClassHomeGraph } from '@/lib/classScope';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import {
  hasDefineNodeForClass,
  hasDefineNodeForEvent,
  hasDefineNodeForFunction,
  hasDefineNodeForVariable,
  insertClassDefineNode,
  insertDefineNodeForEvent,
  insertDefineNodeForFunction,
  insertDefineNodeForVariable,
} from '@/lib/defineNodeSync';
import type { FunctionSymbol, GraphVariable, ClassSymbol, ProjectEventDefinition } from '@/types/graph';
import { CLASS_DRAG_MIME, parseClassDragPayload } from '@/lib/classHelpers';
import { TREE_DRAG_MIME, parseGraphContainerDragPayload } from '@/lib/treeDrag';
import {
  buildGraphRefNodeData,
  isGraphRefNode,
} from '@/lib/graphRefHelpers';

function wrapSelectionInComment(
  nodes: VVSNodeType[],
  setNodesWithHistory: React.Dispatch<React.SetStateAction<VVSNodeType[]>>
) {
  const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'vvs_comment_node');
  if (selectedNodes.length === 0) return;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  selectedNodes.forEach((n) => {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.x + (n.measured?.width || 200) > maxX) maxX = n.position.x + (n.measured?.width || 200);
    if (n.position.y + (n.measured?.height || 150) > maxY) maxY = n.position.y + (n.measured?.height || 150);
  });

  const padding = 50;
  const commentId = `comment-${Date.now()}`;
  const newCommentNode: VVSNodeType = {
    id: commentId,
    type: 'vvs_comment_node',
    position: { x: minX - padding, y: minY - padding - 40 },
    style: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 + 40 },
      data: { label: 'New Comment', category: 'Comment', inputs: [], outputs: [], inlineValues: {}, commentColor: '#6366f1' },
    zIndex: -1,
  };

  setNodesWithHistory((nds) => {
    const updatedNodes = nds.map((n) => {
      if (n.selected && n.type !== 'vvs_comment_node') {
        return {
          ...n,
          parentId: commentId,
          position: {
            x: n.position.x - newCommentNode.position.x,
            y: n.position.y - newCommentNode.position.y,
          },
          expandParent: true,
        };
      }
      return n;
    });
    return [newCommentNode, ...updatedNodes];
  });
}

function nodesMatchSimilarity(primary: VVSNodeType, candidate: VVSNodeType): boolean {
  if (primary.type === 'vvs_standard_node' && candidate.type === 'vvs_standard_node') {
    return primary.data.kindId === candidate.data.kindId;
  }
  return primary.type === candidate.type;
}

function ungroupSelectionInComment(
  nodes: VVSNodeType[],
  setNodesWithHistory: React.Dispatch<React.SetStateAction<VVSNodeType[]>>
) {
  const grouped = nodes.filter((n) => n.selected && n.parentId);
  if (grouped.length === 0) return;

  setNodesWithHistory((nds) => {
    const parentIdsToRemove = new Set(
      grouped.map((n) => n.parentId).filter((id): id is string => Boolean(id))
    );
    return nds
      .map((n) => {
        if (!n.selected || !n.parentId) return n;
        const parent = nds.find((p) => p.id === n.parentId);
        return {
          ...n,
          parentId: undefined,
          expandParent: undefined,
          position: {
            x: n.position.x + (parent?.position.x ?? 0),
            y: n.position.y + (parent?.position.y ?? 0),
          },
        };
      })
      .filter((n) => !(n.type === 'vvs_comment_node' && parentIdsToRemove.has(n.id) && n.selected));
  });
}

function GraphCanvasInner() {
  const { isCanvasActive } = useEditorView();
  const {
    setSelection,
    setSelectedNodeIds,
    selection,
    activeGraphTab,
    openTabs,
    functions,
    events,
    classes,
    activeClassId,
    setActiveClassId,
    graphContainers,
    setActiveGraphTab,
    setFunctions,
    setOpenTabs,
    setCompileState,
    markTabDirty,
    environmentId,
    targetLanguage,
    triggerUndo,
    triggerRedo,
    canUndo,
    canRedo,
  } = useProject();

  const { pendingCanvasFocus, clearPendingCanvasFocus } = useEditorNavigation();
  const { focusGraphRef } = useEditorFocus();
  const { graphChromeOpen } = useEditorPanels();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    setNodesWithHistory,
    setEdgesWithHistory,
    importGraphTab,
  } = useGraphEdit();

  const { getDocuments, patchAllDocuments } = useGraphWorkspace();
  const { addEventWithDefine } = useSymbolLifecycle();

  const classEvents = useMemo(
    () => classScopedSymbols(activeClassId, { variables: [], functions, events }).events,
    [activeClassId, functions, events]
  );

  const { screenToFlowPosition, getNode, fitView } = useReactFlow();

  useSyncProjectSelection({ isCanvasActive, setSelection, setSelectedNodeIds });

  React.useEffect(() => {
    setSelectedNodeIds([]);
    setSelection((prev) => clearCanvasSelectionKeepTreeSymbol(prev));
  }, [activeGraphTab, setSelection, setSelectedNodeIds]);

  React.useEffect(() => {
    if (!isTreeSymbolSelection(selection.type)) return;
    setNodes((nds) => {
      if (!nds.some((n) => n.selected)) return nds;
      return nds.map((n) => (n.selected ? { ...n, selected: false } : n));
    });
    setSelectedNodeIds([]);
  }, [selection.type, selection.id, setNodes, setSelectedNodeIds]);

  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    filter?: { pinType: string; lookingFor: 'input' | 'output' };
    pendingConnection?: { nodeId: string; handleId: string; handleType: 'source' | 'target' };
  } | null>(null);

  const [variableMenu, setVariableMenu] = useState<{
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    variable: GraphVariable;
  } | null>(null);

  const [functionMenu, setFunctionMenu] = useState<{
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    func: FunctionSymbol;
    overloadId: string;
  } | null>(null);

  const [eventMenu, setEventMenu] = useState<{
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    event: ProjectEventDefinition;
  } | null>(null);

  const [classMenu, setClassMenu] = useState<{
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    cls: ClassSymbol;
  } | null>(null);

  const [containerMenu, setContainerMenu] = useState<{
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    containerId: string;
    containerName: string;
  } | null>(null);

  const currentClass = useMemo(
    () => activeClass(classes, activeClassId),
    [classes, activeClassId]
  );
  const onActiveClassGraph = isOnClassHomeGraph(activeGraphTab, currentClass);

  const documentsSnapshot = getDocuments() ?? {};
  const variableDeclareExists =
    variableMenu && currentClass
      ? hasDefineNodeForVariable(documentsSnapshot, currentClass, variableMenu.variable.id)
      : false;
  const functionDeclareExists =
    functionMenu && currentClass
      ? hasDefineNodeForFunction(documentsSnapshot, currentClass, functionMenu.func.id)
      : false;
  const eventDeclareExists =
    eventMenu && currentClass
      ? hasDefineNodeForEvent(documentsSnapshot, currentClass, eventMenu.event.id)
      : false;
  const classDeclareExists =
    classMenu != null
      ? hasDefineNodeForClass(documentsSnapshot, classMenu.cls)
      : false;

  const [clipboard, setClipboard] = useState<GraphClipboardPayload | null>(null);

  const [edgeMenu, setEdgeMenu] = useState<{
    x: number;
    y: number;
    edgeId: string;
  } | null>(null);

  const focusGraphNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const alreadyFocused =
          nds.length > 0 &&
          nds.filter((n) => n.selected).length === 1 &&
          nds.some((n) => n.id === nodeId && n.selected);
        if (alreadyFocused) return nds;
        return nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }));
      });
      setSelection((prev) =>
        prev.type === 'node' && prev.id === nodeId ? prev : { type: 'node', id: nodeId }
      );
      setSelectedNodeIds([nodeId]);
      requestAnimationFrame(() => {
        fitView({ nodes: [{ id: nodeId }], padding: 0.6, duration: 200 });
      });
    },
    [setNodes, setSelection, setSelectedNodeIds, fitView]
  );

  const processedFocusKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!pendingCanvasFocus || pendingCanvasFocus.graphTab !== activeGraphTab) {
      processedFocusKeyRef.current = null;
      return;
    }
    const focusKey = `${pendingCanvasFocus.graphTab}:${pendingCanvasFocus.nodeId}`;
    if (processedFocusKeyRef.current === focusKey) return;

    const nodeExists = nodes.some((n) => n.id === pendingCanvasFocus.nodeId);
    if (!nodeExists) return;

    processedFocusKeyRef.current = focusKey;
    focusGraphNode(pendingCanvasFocus.nodeId);
    clearPendingCanvasFocus();
  }, [pendingCanvasFocus, activeGraphTab, nodes, focusGraphNode, clearPendingCanvasFocus]);

  const nodeTypes = useMemo(
    () => ({
      vvs_standard_node: VVSNode,
      vvs_comment_node: VVSCommentNode,
      vvs_reroute_node: VVSRerouteNode,
    }),
    []
  );
  const edgeTypes = useMemo(() => ({ vvs_standard_edge: VVSEdge }), []);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const attempt = connectionFromReactFlow(params as Connection);
      const result = applyWireConnection(attempt, nodes, edges);
      if ('error' in result) {
        dispatchEditorWarning(wireRejectionMessage(result.error));
        return;
      }
      if (result.chainBreak) {
        dispatchEditorWarning(
          'Flow rewired — previous upstream disconnected. Use a Call node for shared logic.',
          'Flow'
        );
      }
      setEdgesWithHistory(result.edges);
    },
    [nodes, edges, setEdgesWithHistory]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: unknown) => {
      const state = connectionState as import('@xyflow/react').ConnectionState;
      if (!state.isValid && state.fromNode) {
        const { clientX, clientY } = 'touches' in event ? event.touches[0] : event;
        const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });

        const sourceNode = state.fromNode as unknown as VVSNodeType;
        const pinType = pinTypeFromDragHandle(
          sourceNode,
          state.fromHandle?.id,
          state.fromHandle?.type === 'source' ? 'source' : 'target'
        );

        setMenu({
          x: clientX,
          y: clientY,
          flowPosition,
          filter: {
            pinType,
            lookingFor: state.fromHandle?.type === 'source' ? 'input' : 'output',
          },
          pendingConnection: {
            nodeId: state.fromNode.id,
            handleId: state.fromHandle?.id || '',
            handleType: state.fromHandle?.type === 'source' ? 'source' : 'target',
          },
        });
      }
    },
    [screenToFlowPosition]
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const attempt = connectionFromReactFlow(connection as Connection);
      return isValidWireConnection(attempt, nodes, edges);
    },
    [nodes, edges]
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({ x: event.clientX, y: event.clientY, flowPosition });
    },
    [screenToFlowPosition]
  );

  const onPaneClick = useCallback(() => {
    if (menu) setMenu(null);
    if (variableMenu) setVariableMenu(null);
    if (functionMenu) setFunctionMenu(null);
    if (eventMenu) setEventMenu(null);
    if (classMenu) setClassMenu(null);
    if (containerMenu) setContainerMenu(null);
    if (edgeMenu) setEdgeMenu(null);
  }, [menu, variableMenu, functionMenu, eventMenu, classMenu, containerMenu, edgeMenu]);

  /** Sync inspector immediately on click (onSelectionChange can lag; re-click same node does not re-fire). */
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      if (event.shiftKey || event.ctrlKey || event.metaKey) return;
      setSelection({ type: 'node', id: node.id });
      setSelectedNodeIds([node.id]);
    },
    [setSelection, setSelectedNodeIds]
  );

  const deleteEdgeById = useCallback(
    (edgeId: string) => {
      setEdgesWithHistory((eds) => eds.filter((e) => e.id !== edgeId));
      setEdgeMenu(null);
    },
    [setEdgesWithHistory]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (event.altKey) {
        deleteEdgeById(edge.id);
        return;
      }
      setEdgeMenu(null);
    },
    [deleteEdgeById]
  );

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
    setMenu(null);
    setVariableMenu(null);
    setFunctionMenu(null);
    setEventMenu(null);
    setClassMenu(null);
    setContainerMenu(null);
  }, []);

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const wireEdge = edge as VVSEdgeType;
      const { node: rerouteNode, edges: splitEdges } = splitEdgeWithReroute(wireEdge, position);

      setNodesWithHistory((nds) => nds.concat(rerouteNode));
      setEdgesWithHistory((eds) => [
        ...eds.filter((e) => e.id !== edge.id),
        ...splitEdges,
      ]);
    },
    [screenToFlowPosition, setNodesWithHistory, setEdgesWithHistory]
  );

  const handleAddNode = useCallback(
    (template: LibraryNodeTemplate) => {
      if (!menu) return;

      const defaultInlineValues: Record<string, string | number | boolean> = {};
      if (template.inputs) {
        template.inputs.forEach((input) => {
          if (input.type === 'data_string' || input.type === 'data_any') defaultInlineValues[input.id] = '';
          if (input.type === 'data_number') defaultInlineValues[input.id] = 0;
          if (input.type === 'data_boolean') defaultInlineValues[input.id] = false;
        });
      }

      const kindDef = resolveKind(template.type, template.kindVersion);
      const inputs = template.inputs || kindDef?.inputs || [];
      const outputs = template.outputs || kindDef?.outputs || [];
      const defaultProps = kindDef?.propertySchema
        ? defaultPropertiesFromSchema(kindDef.propertySchema)
        : {};

      const baseData = normalizeNodeData({
        label: template.label,
        category: template.category,
        inputs,
        outputs,
        inlineValues: defaultInlineValues,
        kindId: template.type,
        kindVersion: template.kindVersion ?? kindDef?.kindVersion,
        properties: defaultProps,
      });

      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: menu.flowPosition,
        data: {
          ...baseData,
          resolvedPorts: { inputs: baseData.inputs, outputs: baseData.outputs },
          ...(template.linkedGraphId ? { linkedGraphId: template.linkedGraphId } : {}),
          ...(template.linkKind ? { linkKind: template.linkKind } : {}),
          ...(template.graphBinding ? { graphBinding: template.graphBinding } : {}),
        },
      };

      if (template.linkKind === 'call_function' && template.linkedGraphId) {
        const func = functions.find((f) => f.id === template.linkedGraphId);
        if (func) {
          newNode.data = applyFunctionCallBinding(newNode.data, func);
        }
      }

      if (template.graphBinding?.kind === 'dispatch_event') {
        const event = classEvents.find((e) => e.id === template.graphBinding?.symbolId);
        if (event) {
          newNode.data = applyEventDispatchBinding(newNode.data, event);
        }
      }

      const crossTarget = resolveCrossGraphTarget(
        activeGraphTab,
        {
          label: template.label,
          linkedGraphId: template.linkedGraphId,
          linkKind: template.linkKind,
        },
        functions,
        []
      );
      if (
        crossTarget &&
        wouldCrossGraphDependencyCycle(
          getDocuments() ?? {},
          functions,
          [],
          activeGraphTab,
          crossTarget.targetGraphId
        )
      ) {
        dispatchEditorWarning('Circular cross-graph reference is not allowed.');
        setMenu(null);
        return;
      }

      setNodesWithHistory((nds) => [...nds, newNode]);

      if (menu.pendingConnection) {
        const { nodeId, handleId, handleType } = menu.pendingConnection;
        let sourceNodeId = '';
        let targetNodeId = '';
        let sourceHandleId = '';
        let targetHandleId = '';

        if (handleType === 'source') {
          sourceNodeId = nodeId;
          sourceHandleId = handleId;
          targetNodeId = newNode.id;
          const targetPin = findCompatiblePin(
            newNode.data.inputs,
            (menu.filter?.pinType as PinType) || 'data_any',
            'input'
          );
          if (targetPin) targetHandleId = targetPin.id;
        } else {
          targetNodeId = nodeId;
          targetHandleId = handleId;
          sourceNodeId = newNode.id;
          const sourcePin = findCompatiblePin(
            newNode.data.outputs,
            (menu.filter?.pinType as PinType) || 'data_any',
            'output'
          );
          if (sourcePin) sourceHandleId = sourcePin.id;
        }

        if (sourceNodeId && targetNodeId && sourceHandleId && targetHandleId) {
          const attempt = {
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle: sourceHandleId,
            targetHandle: targetHandleId,
          };
          const result = applyWireConnection(attempt, [...nodes, newNode], edges);
          if ('error' in result) {
            dispatchEditorWarning(wireRejectionMessage(result.error));
          } else {
            setEdgesWithHistory(result.edges);
          }
        }
      }

      setMenu(null);
    },
    [
      menu,
      setNodesWithHistory,
      setEdgesWithHistory,
      nodes,
      edges,
      activeGraphTab,
      functions,
      classEvents,
      openTabs,
      getDocuments,
    ]
  );

  const spawnDispatchNode = useCallback(
    (
      event: import('@/types/graph').ProjectEventDefinition,
      flowPosition: { x: number; y: number },
      pendingConnection?: {
        nodeId: string;
        handleId: string;
        handleType: 'source' | 'target';
      },
      filterPinType?: PinType
    ) => {
      const boundData = applyEventDispatchBinding(
        {
          label: '',
          category: 'Events',
          inputs: [],
          outputs: [],
          inlineValues: {},
        },
        event
      );

      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: boundData,
      };

      setNodesWithHistory((nds) => [...nds, newNode]);

      if (pendingConnection) {
        const { nodeId, handleId, handleType } = pendingConnection;
        let sourceNodeId = '';
        let targetNodeId = '';
        let sourceHandleId = '';
        let targetHandleId = '';

        if (handleType === 'source') {
          sourceNodeId = nodeId;
          sourceHandleId = handleId;
          targetNodeId = newNode.id;
          const targetPin = findCompatiblePin(
            newNode.data.inputs,
            filterPinType || 'execution',
            'input'
          );
          if (targetPin) targetHandleId = targetPin.id;
        } else {
          targetNodeId = nodeId;
          targetHandleId = handleId;
          sourceNodeId = newNode.id;
          const sourcePin = findCompatiblePin(
            newNode.data.outputs,
            filterPinType || 'execution',
            'output'
          );
          if (sourcePin) sourceHandleId = sourcePin.id;
        }

        if (sourceNodeId && targetNodeId && sourceHandleId && targetHandleId) {
          const attempt = {
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle: sourceHandleId,
            targetHandle: targetHandleId,
          };
          const result = applyWireConnection(attempt, [...nodes, newNode], edges);
          if ('error' in result) {
            dispatchEditorWarning(wireRejectionMessage(result.error));
          } else {
            setEdgesWithHistory(result.edges);
          }
        }
      }
    },
    [nodes, edges, setNodesWithHistory, setEdgesWithHistory]
  );

  const handleNewEventHere = useCallback(() => {
    if (!menu || !onActiveClassGraph) return;
    const raw = window.prompt('Event name:');
    const name = raw?.trim().replace(/^on\s+/i, '');
    if (!name) return;

    const event = {
      id: createEventId(),
      name,
      parameters: [],
      classId: activeClassId,
    };
    addEventWithDefine(event);
    spawnDispatchNode(
      event,
      menu.flowPosition,
      menu.pendingConnection,
      (menu.filter?.pinType as PinType) || 'execution'
    );
    setMenu(null);
  }, [menu, onActiveClassGraph, activeClassId, addEventWithDefine, spawnDispatchNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (
      event.dataTransfer.types.includes(FUNCTION_OVERLOAD_DRAG_MIME) ||
      event.dataTransfer.types.includes(EVENT_DRAG_MIME) ||
      event.dataTransfer.types.includes(CLASS_DRAG_MIME) ||
      event.dataTransfer.types.includes(TREE_DRAG_MIME.graphContainer) ||
      event.dataTransfer.types.includes(TREE_DRAG_MIME.variable)
    ) {
      event.dataTransfer.dropEffect = 'copy';
      return;
    }
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const overloadDataStr = event.dataTransfer.getData(FUNCTION_OVERLOAD_DRAG_MIME);
      if (overloadDataStr) {
        try {
          const { functionId, overloadId } = JSON.parse(
            overloadDataStr
          ) as FunctionOverloadDragPayload;
          const func = functions.find((f) => f.id === functionId);
          if (!func) return;

          const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          setFunctionMenu({
            x: event.clientX,
            y: event.clientY,
            flowPosition: position,
            func,
            overloadId,
          });
        } catch (e) {
          console.error('Failed to parse dropped function overload', e);
        }
        return;
      }

      const eventDataStr = event.dataTransfer.getData(EVENT_DRAG_MIME);
      if (eventDataStr) {
        try {
          const { eventId } = JSON.parse(eventDataStr) as EventDragPayload;
          const projectEvent = classEvents.find((e) => e.id === eventId);
          if (!projectEvent) return;

          const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          setEventMenu({
            x: event.clientX,
            y: event.clientY,
            flowPosition: position,
            event: projectEvent,
          });
        } catch (e) {
          console.error('Failed to parse dropped event', e);
        }
        return;
      }

      const variableDataStr = event.dataTransfer.getData(TREE_DRAG_MIME.variable);
      if (variableDataStr) {
        try {
          const variable = JSON.parse(variableDataStr);
          const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          setVariableMenu({ x: event.clientX, y: event.clientY, flowPosition: position, variable });
        } catch (e) {
          console.error('Failed to parse dropped variable', e);
        }
        return;
      }

      const containerDataStr = event.dataTransfer.getData(TREE_DRAG_MIME.graphContainer);
      if (containerDataStr) {
        const payload = parseGraphContainerDragPayload(containerDataStr);
        if (!payload) return;
        const container = graphContainers.find((c) => c.id === payload.containerId);
        if (!container) return;
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setContainerMenu({
          x: event.clientX,
          y: event.clientY,
          flowPosition: position,
          containerId: container.id,
          containerName: container.name,
        });
        return;
      }

      const classDataStr = event.dataTransfer.getData(CLASS_DRAG_MIME);
      if (classDataStr) {
        const payload = parseClassDragPayload(classDataStr);
        if (!payload) return;
        const cls = classes.find((c) => c.id === payload.classId);
        if (!cls) return;
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setClassMenu({ x: event.clientX, y: event.clientY, flowPosition: position, cls });
      }
    },
    [classes, classEvents, functions, graphContainers, screenToFlowPosition]
  );

  const handleSpawnGraphRef = useCallback(
    (
      options: {
        label: string;
        classId?: string;
        containerId?: string;
        graphTabId?: string;
      },
      flowPosition: { x: number; y: number }
    ) => {
      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: normalizeNodeData(buildGraphRefNodeData(options)),
      };
      setNodesWithHistory((nds) => [...nds, newNode]);
      setClassMenu(null);
      setContainerMenu(null);
    },
    [setNodesWithHistory]
  );

  const handleSpawnEventCall = useCallback(
    (event: ProjectEventDefinition, flowPosition: { x: number; y: number }) => {
      spawnDispatchNode(event, flowPosition);
      setEventMenu(null);
    },
    [spawnDispatchNode]
  );

  const handleDeclareEvent = useCallback(
    (event: ProjectEventDefinition) => {
      const cls = activeClass(classes, activeClassId);
      if (!cls) return;
      const documents = getDocuments() ?? {};
      if (hasDefineNodeForEvent(documents, cls, event.id)) {
        setEventMenu(null);
        return;
      }
      const next = insertDefineNodeForEvent(documents, cls, event);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      setEventMenu(null);
    },
    [
      classes,
      activeClassId,
      getDocuments,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
    ]
  );

  const handleSpawnFunctionCall = useCallback(
    (func: FunctionSymbol, overloadId: string, flowPosition: { x: number; y: number }) => {
      const boundData = applyFunctionCallBinding(
        {
          label: '',
          category: 'Project',
          inputs: [],
          outputs: [],
          inlineValues: {},
        },
        func,
        overloadId
      );

      const crossTarget = resolveCrossGraphTarget(
        activeGraphTab,
        {
          label: boundData.label,
          linkedGraphId: func.id,
          linkKind: 'call_function',
        },
        functions,
        []
      );
      if (
        crossTarget &&
        wouldCrossGraphDependencyCycle(
          getDocuments() ?? {},
          functions,
          [],
          activeGraphTab,
          crossTarget.targetGraphId
        )
      ) {
        dispatchEditorWarning('Circular cross-graph reference is not allowed.');
        setFunctionMenu(null);
        return;
      }

      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: boundData,
      };
      setNodesWithHistory((nds) => [...nds, newNode]);
      setFunctionMenu(null);
    },
    [activeGraphTab, functions, getDocuments, setNodesWithHistory]
  );

  const handleDeclareVariable = useCallback(
    (variable: GraphVariable) => {
      const cls = activeClass(classes, activeClassId);
      if (!cls) return;
      const documents = getDocuments() ?? {};
      if (hasDefineNodeForVariable(documents, cls, variable.id)) {
        setVariableMenu(null);
        return;
      }
      const next = insertDefineNodeForVariable(documents, cls, variable);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      setVariableMenu(null);
    },
    [
      classes,
      activeClassId,
      getDocuments,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
    ]
  );

  const handleDeclareFunction = useCallback(
    (func: FunctionSymbol) => {
      const cls = activeClass(classes, activeClassId);
      if (!cls) return;
      const documents = getDocuments() ?? {};
      if (hasDefineNodeForFunction(documents, cls, func.id)) {
        setFunctionMenu(null);
        return;
      }
      const next = insertDefineNodeForFunction(documents, cls, func);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      setFunctionMenu(null);
    },
    [
      classes,
      activeClassId,
      getDocuments,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
    ]
  );

  const handleDeclareClass = useCallback(
    (cls: ClassSymbol) => {
      const documents = getDocuments() ?? {};
      if (hasDefineNodeForClass(documents, cls)) {
        setClassMenu(null);
        return;
      }
      const next = insertClassDefineNode(documents, cls);
      patchAllDocuments(() => next);
      markTabDirty(classGraphTabId(cls));
      setCompileState('dirty');
      setActiveClassId(cls.id);
      setActiveGraphTab(classGraphTabId(cls));
      setSelection({ type: 'class', id: cls.id });
      setClassMenu(null);
    },
    [
      getDocuments,
      patchAllDocuments,
      markTabDirty,
      setCompileState,
      setActiveClassId,
      setActiveGraphTab,
      setSelection,
    ]
  );

  const handleSpawnVariableNode = useCallback(
    (
      type: 'Get' | 'Set',
      variable: GraphVariable,
      flowPosition: { x: number; y: number }
    ) => {
      if (type === 'Set' && variable.flags?.readonly) {
        dispatchEditorWarning(`Variable "${variable.name}" is read-only — use Get only.`);
        setVariableMenu(null);
        return;
      }

      const role = type === 'Get' ? 'get' : 'set';
      const empty = {
        label: '',
        category: 'Variables',
        inputs: [],
        outputs: [],
        inlineValues: {},
      };
      const data = applyVariableRefBinding(empty, variable, role);
      if (type === 'Set') {
        data.inlineValues = {
          val:
            typeof variable.defaultValue === 'string' ||
            typeof variable.defaultValue === 'number' ||
            typeof variable.defaultValue === 'boolean'
              ? variable.defaultValue
              : 0,
        };
      }

      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: flowPosition,
        data,
      };
      setNodesWithHistory((nds) => nds.concat(newNode));
      setVariableMenu(null);
    },
    [setNodesWithHistory]
  );

  const pastePayload = useCallback(
    (payload: GraphClipboardPayload) => {
      const offset = 50;
      const newNodes = payload.nodes.map((n) => ({
        ...n,
        id: `${n.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        position: { x: n.position.x + offset, y: n.position.y + offset },
        selected: true,
        parentId: undefined,
        expandParent: undefined,
      }));
      const idMap = new Map(payload.nodes.map((n, i) => [n.id, newNodes[i].id]));
      const newEdges = payload.edges.map((e, i) => ({
        ...e,
        id: createUniqueEdgeId(
          idMap.get(e.source) || e.source,
          idMap.get(e.target) || e.target,
          { index: i }
        ),
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
        selected: true,
      }));
      setNodesWithHistory((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
      setEdgesWithHistory((eds) => [...eds.map((e) => ({ ...e, selected: false })), ...newEdges]);
    },
    [setNodesWithHistory, setEdgesWithHistory]
  );

  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter(
      (e) =>
        selectedNodes.some((n) => n.id === e.source) &&
        selectedNodes.some((n) => n.id === e.target)
    );
    if (selectedNodes.length === 0) return;
    const payload: GraphClipboardPayload = { version: 1, nodes: selectedNodes, edges: selectedEdges };
    setClipboard(payload);
    void writeSystemGraphClipboard(selectedNodes, selectedEdges);
  }, [nodes, edges]);

  const handlePaste = useCallback(async () => {
    const systemPayload = await readSystemGraphClipboard();
    if (systemPayload) {
      setClipboard(systemPayload);
      pastePayload(systemPayload);
      return;
    }
    if (clipboard) pastePayload(clipboard);
  }, [clipboard, pastePayload]);

  const handleDuplicate = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedEdges = edges.filter(
      (e) =>
        selectedNodes.some((n) => n.id === e.source) &&
        selectedNodes.some((n) => n.id === e.target)
    );
    const offset = 50;
    const newNodes = selectedNodes.map((n) => ({
      ...n,
      id: `${n.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      position: { x: n.position.x + offset, y: n.position.y + offset },
      selected: true,
      parentId: undefined,
      expandParent: undefined,
    }));
    const idMap = new Map(selectedNodes.map((n, i) => [n.id, newNodes[i].id]));
    const newEdges = selectedEdges.map((e, i) => ({
      ...e,
      id: createUniqueEdgeId(idMap.get(e.source)!, idMap.get(e.target)!, { index: i }),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      selected: true,
    }));
    setNodesWithHistory((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdgesWithHistory((eds) => [...eds, ...newEdges]);
  }, [nodes, edges, setNodesWithHistory, setEdgesWithHistory]);

  const handleCut = useCallback(() => {
    handleCopy();
    setNodesWithHistory((nds) => nds.filter((n) => !n.selected));
    setEdgesWithHistory((eds) =>
      eds.filter((edge) => !nodes.find((n) => n.selected && (n.id === edge.source || n.id === edge.target)))
    );
  }, [handleCopy, nodes, setNodesWithHistory, setEdgesWithHistory]);

  React.useEffect(() => {
    const handleFunctionRenamed = (event: Event) => {
      const { func } = (event as CustomEvent<{ func: import('@/types/graph').FunctionSymbol }>).detail;
      setNodesWithHistory((nds) => syncCallNodesForFunction(nds, func) as VVSNodeType[]);
    };
    window.addEventListener(FUNCTION_RENAMED_EVENT, handleFunctionRenamed);
    return () => window.removeEventListener(FUNCTION_RENAMED_EVENT, handleFunctionRenamed);
  }, [setNodesWithHistory]);

  const handleDeleteSelection = useCallback(() => {
    const selectedEdgeIds = new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id));
    const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
    if (selectedEdgeIds.size === 0 && selectedNodeIds.size === 0) return;

    setEdgesWithHistory((eds) =>
      eds.filter(
        (edge) =>
          !selectedEdgeIds.has(edge.id) &&
          !selectedNodeIds.has(edge.source) &&
          !selectedNodeIds.has(edge.target)
      )
    );
    setNodesWithHistory((nds) => nds.filter((node) => !node.selected));
  }, [nodes, edges, setNodesWithHistory, setEdgesWithHistory]);

  const handleDisconnectSelection = useCallback(() => {
    const selectedEdgeIds = new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id));
    const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
    if (selectedEdgeIds.size === 0 && selectedNodeIds.size === 0) return;

    setEdgesWithHistory((eds) =>
      eds.filter((edge) => {
        if (selectedEdgeIds.has(edge.id)) return false;
        if (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)) return false;
        return true;
      })
    );
  }, [nodes, edges, setEdgesWithHistory]);

  const handleFocusSelection = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) return;
    fitView({
      nodes: selectedNodes.map((node) => ({ id: node.id })),
      padding: 0.4,
      duration: 300,
    });
  }, [nodes, fitView]);

  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
  }, [setNodes, setEdges]);

  const handleSelectSimilar = useCallback(() => {
    const primary = nodes.find((n) => n.selected);
    if (!primary) return;

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: nodesMatchSimilarity(primary, n),
      }))
    );
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
  }, [nodes, setNodes, setEdges]);

  const openSpawnMenu = useCallback(() => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const flowPosition = screenToFlowPosition({ x, y });
    setMenu({ x, y, flowPosition });
  }, [screenToFlowPosition]);

  const handleExtractToFunction = useCallback(() => {
    const result = extractSelectionToFunction(nodes, edges);
    if ('error' in result) {
      dispatchEditorWarning(result.error, 'Extract');
      return;
    }
    setFunctions((prev) => [...prev, result.func]);
    setOpenTabs((prev) => (prev.some((t) => t.id === result.tab.id) ? prev : [...prev, result.tab]));
    importGraphTab(result.tab, result.functionDocument);
    setNodesWithHistory(result.nextNodes);
    setEdgesWithHistory(result.nextEdges);
    markTabDirty(activeGraphTab);
    markTabDirty(result.tab.id);
    setCompileState('dirty');
    dispatchEditorWarning(`Extracted "${result.func.name}" — call node inserted.`, 'Extract');
  }, [
    nodes,
    edges,
    setFunctions,
    setOpenTabs,
    importGraphTab,
    setNodesWithHistory,
    setEdgesWithHistory,
    markTabDirty,
    activeGraphTab,
    setCompileState,
  ]);

  React.useEffect(() => {
    const handleGraphAction = (event: Event) => {
      const action = (event as CustomEvent<{ action: GraphAction }>).detail.action;
      if (action === 'copy') handleCopy();
      if (action === 'paste') void handlePaste();
      if (action === 'cut') handleCut();
      if (action === 'duplicate') handleDuplicate();
      if (action === 'delete-selection') handleDeleteSelection();
      if (action === 'disconnect-selection') handleDisconnectSelection();
      if (action === 'focus-selection') handleFocusSelection();
      if (action === 'zoom-fit') fitView({ duration: 300 });
      if (action === 'group-comment') wrapSelectionInComment(nodes, setNodesWithHistory);
      if (action === 'ungroup-comment') ungroupSelectionInComment(nodes, setNodesWithHistory);
      if (action === 'extract-function') handleExtractToFunction();
      if (action === 'select-all') handleSelectAll();
      if (action === 'select-similar') handleSelectSimilar();
    };
    window.addEventListener('vvs:graph-action', handleGraphAction);
    return () => window.removeEventListener('vvs:graph-action', handleGraphAction);
  }, [
    nodes,
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    handleDeleteSelection,
    handleDisconnectSelection,
    handleFocusSelection,
    handleSelectAll,
    handleSelectSimilar,
    fitView,
    setNodesWithHistory,
    handleExtractToFunction,
  ]);

  useGraphKeyboardShortcuts({
    onUndo: triggerUndo,
    onRedo: triggerRedo,
    canUndo,
    canRedo,
    onSpawnMenu: openSpawnMenu,
    onToggleHelp: () => setShortcutsHelpOpen((open) => !open),
    isHelpOpen: shortcutsHelpOpen,
  });

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: VVSNodeType) => {
      if (isGraphRefNode(node.data)) {
        focusGraphRef(node.data);
        return;
      }
      if (!isLinkedGraphNode(node.data) || !node.data.linkedGraphId) return;
      const entryId = findGraphEntryNodeId(getDocuments() ?? {}, node.data.linkedGraphId);
      if (!entryId) return;
      dispatchNavigateToNode(node.data.linkedGraphId, entryId);
    },
    [classes, focusGraphRef, getDocuments]
  );

  React.useEffect(() => {
    const onSpawnEventNode = (event: Event) => {
      const detail = (event as CustomEvent<{ eventId: string; role: 'define' | 'dispatch' | 'emit' | 'subscribe' }>).detail;
      const projectEvent = events.find((e) => e.id === detail.eventId);
      if (!projectEvent) return;

      const pane = document.querySelector('.react-flow');
      const bounds = pane?.getBoundingClientRect();
      const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
      const y = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
      const flowPosition = screenToFlowPosition({ x, y });
      const nodeId = `node-${Date.now()}`;
      const newNode: VVSNodeType = {
        id: nodeId,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: buildEventNodeData(projectEvent, detail.role),
      };
      setNodesWithHistory((nds) => nds.concat(newNode));
      setSelection({ type: 'node', id: nodeId });
      setSelectedNodeIds([nodeId]);
    };

    window.addEventListener(SPAWN_EVENT_NODE_EVENT, onSpawnEventNode);
    return () => window.removeEventListener(SPAWN_EVENT_NODE_EVENT, onSpawnEventNode);
  }, [events, screenToFlowPosition, setNodesWithHistory, setSelection, setSelectedNodeIds]);

  React.useEffect(() => {
    const onSpawnEnvNode = (event: Event) => {
      const detail = (event as CustomEvent<{ action: EnvironmentSpawnAction; symbolId: string }>)
        .detail;
      const manifest = getLinkedEnvironmentManifest(environmentId);
      if (!manifest) return;

      const pane = document.querySelector('.react-flow');
      const bounds = pane?.getBoundingClientRect();
      const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
      const y = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
      const flowPosition = screenToFlowPosition({ x, y });
      const nodeData = buildEnvironmentNodeData(
        manifest,
        targetLanguage,
        detail.action,
        detail.symbolId
      );
      if (!nodeData) return;
      const nodeId = `node-${Date.now()}`;
      const newNode: VVSNodeType = {
        id: nodeId,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: nodeData,
      };
      setNodesWithHistory((nds) => nds.concat(newNode));
      setSelection({ type: 'node', id: nodeId });
      setSelectedNodeIds([nodeId]);
    };

    window.addEventListener(SPAWN_ENV_NODE_EVENT, onSpawnEnvNode);
    return () => window.removeEventListener(SPAWN_ENV_NODE_EVENT, onSpawnEnvNode);
  }, [environmentId, targetLanguage, screenToFlowPosition, setNodesWithHistory, setSelection, setSelectedNodeIds]);

  const environmentManifest = useMemo(
    () => getLinkedEnvironmentManifest(environmentId),
    [environmentId]
  );

  return (
    <div
      className="relative w-full h-full"
      style={{ background: '#0a0a0c' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <GraphNodeSearch />
      <GraphShortcutsHelp open={shortcutsHelpOpen} onClose={() => setShortcutsHelpOpen(false)} />
      <GraphFloatingDetails />
      <GraphFloatingCompilerLog />
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none text-[10px] text-zinc-600 bg-zinc-950/80 border border-zinc-800/80 rounded px-2 py-1">
        Alt+click wire to delete · Alt+D disconnect · ? for shortcuts
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        elevateNodesOnSelect
        fitView
        onlyRenderVisibleElements
        selectNodesOnDrag={false}
        selectionOnDrag={false}
        autoPanOnNodeDrag={false}
        nodeClickDistance={4}
        noWheelClassName="nowheel"
        noPanClassName="nopan"
        noDragClassName="nodrag"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#333" />
        {graphChromeOpen ? (
          <>
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                if (n.data?.category === 'Events') return 'var(--vvs-cat-events)';
                if (n.data?.category === 'Action') return 'var(--vvs-cat-action)';
                if (n.data?.category === 'Math') return 'var(--vvs-cat-math)';
                if (n.data?.category === 'Variables') return 'var(--vvs-cat-variables, #4f46e5)';
                if (n.data?.category === 'Project') return 'var(--vvs-cat-project, #818cf8)';
                if (n.data?.category === 'Imports') return 'var(--vvs-cat-imports, #14b8a6)';
                return '#3f3f46';
              }}
              maskColor="rgba(10, 10, 12, 0.7)"
              style={{ backgroundColor: '#18181b' }}
            />
          </>
        ) : null}
        <GraphSelectionToolbar />
        {menu && (
          <NodeContextMenu
            x={menu.x}
            y={menu.y}
            onClose={() => setMenu(null)}
            onSelect={handleAddNode}
            filter={menu.filter}
            currentGraphId={activeGraphTab}
            functions={functions}
            events={classEvents}
            openTabs={openTabs}
            environmentId={environmentId}
            environmentManifest={environmentManifest}
            targetLanguage={targetLanguage}
            canCreateEvent={onActiveClassGraph}
            onNewEventHere={handleNewEventHere}
          />
        )}
      </ReactFlow>
      {variableMenu && (
        <CanvasDropMenu
          x={variableMenu.x}
          y={variableMenu.y}
          onClose={() => setVariableMenu(null)}
          dividersBefore={onActiveClassGraph ? ['declare-variable'] : []}
          items={[
            {
              id: 'get-variable',
              label: `Get ${variableMenu.variable.name}`,
              onClick: () =>
                handleSpawnVariableNode('Get', variableMenu.variable, variableMenu.flowPosition),
            },
            {
              id: 'set-variable',
              label: `Set ${variableMenu.variable.name}`,
              onClick: () =>
                handleSpawnVariableNode('Set', variableMenu.variable, variableMenu.flowPosition),
            },
            ...(onActiveClassGraph
              ? [
                  {
                    id: 'declare-variable',
                    label: `Declare ${variableMenu.variable.name}`,
                    disabled: variableDeclareExists,
                    title: variableDeclareExists
                      ? 'Define node already exists on class graph'
                      : undefined,
                    onClick: () => handleDeclareVariable(variableMenu.variable),
                  },
                ]
              : []),
          ]}
        />
      )}
      {functionMenu && (
        <CanvasDropMenu
          x={functionMenu.x}
          y={functionMenu.y}
          onClose={() => setFunctionMenu(null)}
          dividersBefore={onActiveClassGraph ? ['declare-function'] : []}
          items={[
            {
              id: 'call-function',
              label: `Call ${functionMenu.func.name}`,
              onClick: () =>
                handleSpawnFunctionCall(
                  functionMenu.func,
                  functionMenu.overloadId,
                  functionMenu.flowPosition
                ),
            },
            ...(onActiveClassGraph
              ? [
                  {
                    id: 'declare-function',
                    label: `Declare ${functionMenu.func.name}`,
                    disabled: functionDeclareExists,
                    title: functionDeclareExists
                      ? 'Define node already exists on class graph'
                      : undefined,
                    onClick: () => handleDeclareFunction(functionMenu.func),
                  },
                ]
              : []),
          ]}
        />
      )}
      {eventMenu && (
        <CanvasDropMenu
          x={eventMenu.x}
          y={eventMenu.y}
          onClose={() => setEventMenu(null)}
          dividersBefore={onActiveClassGraph ? ['declare-event'] : []}
          items={[
            {
              id: 'call-event',
              label: `Call ${eventDisplayName(eventMenu.event.name)}`,
              onClick: () => handleSpawnEventCall(eventMenu.event, eventMenu.flowPosition),
            },
            ...(onActiveClassGraph
              ? [
                  {
                    id: 'declare-event',
                    label: `Declare ${eventDisplayName(eventMenu.event.name)}`,
                    disabled: eventDeclareExists,
                    title: eventDeclareExists
                      ? 'Handler define already exists on class graph'
                      : undefined,
                    onClick: () => handleDeclareEvent(eventMenu.event),
                  },
                ]
              : []),
          ]}
        />
      )}
      {classMenu && (
        <CanvasDropMenu
          x={classMenu.x}
          y={classMenu.y}
          onClose={() => setClassMenu(null)}
          dividersBefore={['open-class-ref']}
          items={[
            {
              id: 'declare-class',
              label: `Declare ${classMenu.cls.name}`,
              disabled: classDeclareExists,
              title: classDeclareExists
                ? 'Class define node already exists on this class graph'
                : undefined,
              onClick: () => handleDeclareClass(classMenu.cls),
            },
            {
              id: 'open-class-ref',
              label: `Open reference to ${classMenu.cls.name}`,
              onClick: () =>
                handleSpawnGraphRef(
                  { label: classMenu.cls.name, classId: classMenu.cls.id },
                  classMenu.flowPosition
                ),
            },
          ]}
        />
      )}
      {containerMenu && (
        <CanvasDropMenu
          x={containerMenu.x}
          y={containerMenu.y}
          onClose={() => setContainerMenu(null)}
          items={[
            {
              id: 'open-container-ref',
              label: `Open reference to ${containerMenu.containerName}`,
              onClick: () =>
                handleSpawnGraphRef(
                  {
                    label: containerMenu.containerName,
                    containerId: containerMenu.containerId,
                  },
                  containerMenu.flowPosition
                ),
            },
          ]}
        />
      )}
      {edgeMenu && (
        <div
          className="fixed z-[60] bg-zinc-900 border border-zinc-700 rounded shadow-xl overflow-hidden text-xs text-white min-w-[140px]"
          style={{ top: edgeMenu.y, left: edgeMenu.x }}
        >
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-red-300 transition-colors"
            onClick={() => deleteEdgeById(edgeMenu.edgeId)}
          >
            Delete wire
          </button>
        </div>
      )}
    </div>
  );
}

export default GraphCanvasInner;
