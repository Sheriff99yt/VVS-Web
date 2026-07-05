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
import { LibraryNodeTemplate } from '@/types/ui';
import { useProject } from '@/contexts/ProjectContext';
import { useOnSelectionChange, type OnSelectionChangeParams } from '@xyflow/react';
import { VVSCommentNode } from './VVSCommentNode';
import { VVSRerouteNode } from './VVSRerouteNode';
import { GraphAction } from '@/lib/graphActions';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, isLinkedGraphNode } from '@/lib/linkedGraphNodes';
import { GraphNodeSearch } from './GraphNodeSearch';
import { GraphFloatingDetails, SPAWN_EVENT_NODE_EVENT } from '@/components/layout/GraphFloatingDetails';
import { GraphFloatingCompilerLog } from '@/components/layout/GraphFloatingCompilerLog';
import { buildEventNodeData } from '@/lib/eventHelpers';
import {
  applyFunctionCallBinding,
  FUNCTION_RENAMED_EVENT,
  syncCallNodesForFunction,
} from '@/lib/functionHelpers';

import {
  applyWireConnection,
  connectionFromReactFlow,
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
import { listMacroEntries } from '@/lib/projectTree';
import {
  readSystemGraphClipboard,
  writeSystemGraphClipboard,
  type GraphClipboardPayload,
} from '@/lib/graphClipboard';

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
    activeGraphTab,
    openTabs,
    functions,
    events,
    setFunctions,
    setOpenTabs,
    setCompileState,
    markTabDirty,
  } = useProject();

  const { pendingCanvasFocus, clearPendingCanvasFocus } = useEditorNavigation();

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

  const { getDocuments } = useGraphWorkspace();

  const { screenToFlowPosition, getNode, fitView } = useReactFlow();

  const isCanvasActiveRef = React.useRef(isCanvasActive);
  isCanvasActiveRef.current = isCanvasActive;

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (!isCanvasActiveRef.current) return;
      if (selectedNodes.length > 0) {
        const id = selectedNodes[0]!.id;
        setSelection((prev) =>
          prev.type === 'node' && prev.id === id ? prev : { type: 'node', id }
        );
      } else {
        setSelection((prev) =>
          prev.type === 'graph' && prev.id === null ? prev : { type: 'graph', id: null }
        );
      }
    },
    [setSelection]
  );

  useOnSelectionChange({ onChange: handleSelectionChange });

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
    variable: import('@/types/graph').GraphVariable;
  } | null>(null);

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
      requestAnimationFrame(() => {
        fitView({ nodes: [{ id: nodeId }], padding: 0.6, duration: 200 });
      });
    },
    [setNodes, setSelection, fitView]
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
    if (edgeMenu) setEdgeMenu(null);
  }, [menu, variableMenu, edgeMenu]);

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
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          selected: e.id === edge.id,
        }))
      );
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      setEdgeMenu(null);
    },
    [deleteEdgeById, setEdges, setNodes]
  );

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
    setMenu(null);
    setVariableMenu(null);
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

      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: menu.flowPosition,
        data: {
          label: template.label,
          category: template.category,
          inputs,
          outputs,
          inlineValues: defaultInlineValues,
          kindId: template.type,
          kindVersion: template.kindVersion ?? kindDef?.kindVersion,
          resolvedPorts: { inputs, outputs },
          properties: {},
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

      const macros = listMacroEntries(openTabs);
      const crossTarget = resolveCrossGraphTarget(
        activeGraphTab,
        {
          label: template.label,
          linkedGraphId: template.linkedGraphId,
          linkKind: template.linkKind,
        },
        functions,
        macros
      );
      if (
        crossTarget &&
        wouldCrossGraphDependencyCycle(
          getDocuments() ?? {},
          functions,
          macros,
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
      openTabs,
      getDocuments,
    ]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const variableDataStr = event.dataTransfer.getData('application/vvs-variable');
      if (!variableDataStr) return;

      try {
        const variable = JSON.parse(variableDataStr);
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setVariableMenu({ x: event.clientX, y: event.clientY, flowPosition: position, variable });
      } catch (e) {
        console.error('Failed to parse dropped variable', e);
      }
    },
    [screenToFlowPosition]
  );

  const handleSpawnVariableNode = useCallback(
    (
      type: 'Get' | 'Set',
      variable: import('@/types/graph').GraphVariable,
      flowPosition: { x: number; y: number }
    ) => {
      const kindId = type === 'Get' ? 'variable_get' : 'variable_set';
      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: {
          label: `${type} ${variable.name}`,
          category: 'Variables',
          kindId,
          properties: { variableName: variable.name },
          inputs:
            type === 'Set'
              ? [
                  { id: 'exec_in', label: '', type: 'execution' },
                  { id: 'val', label: 'New Value', type: `data_${variable.type}` as PinType },
                ]
              : [],
          outputs:
            type === 'Get'
              ? [{ id: 'val', label: variable.name, type: `data_${variable.type}` as PinType }]
              : [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues:
            type === 'Set'
              ? {
                  val:
                    typeof variable.defaultValue === 'string' ||
                    typeof variable.defaultValue === 'number' ||
                    typeof variable.defaultValue === 'boolean'
                      ? variable.defaultValue
                      : 0,
                }
              : {},
        },
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
      const newEdges = payload.edges.map((e) => ({
        ...e,
        id: `e-${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}-${Date.now()}`,
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
    const newEdges = selectedEdges.map((e) => ({
      ...e,
      id: `e-${idMap.get(e.source)}-${idMap.get(e.target)}-${Date.now()}`,
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
    const handleVariableRenamed = (event: Event) => {
      const { oldName, newName } = (event as CustomEvent<{ oldName: string; newName: string }>).detail;
      if (!oldName || !newName || oldName === newName) return;
      setNodesWithHistory((nds) =>
        nds.map((n) => {
          if (n.type !== 'vvs_standard_node' || n.data.category !== 'Variables') return n;
          const label = n.data.label;
          if (label === `Get ${oldName}`) {
            return {
              ...n,
              data: {
                ...n.data,
                label: `Get ${newName}`,
                properties: { ...n.data.properties, variableName: newName },
              },
            };
          }
          if (label === `Set ${oldName}`) {
            return {
              ...n,
              data: {
                ...n.data,
                label: `Set ${newName}`,
                properties: { ...n.data.properties, variableName: newName },
              },
            };
          }
          return n;
        })
      );
    };
    window.addEventListener('vvs:variable-renamed', handleVariableRenamed);
    return () => window.removeEventListener('vvs:variable-renamed', handleVariableRenamed);
  }, [setNodesWithHistory]);

  React.useEffect(() => {
    const handleFunctionRenamed = (event: Event) => {
      const { func } = (event as CustomEvent<{ func: import('@/types/graph').FunctionSymbol }>).detail;
      setNodesWithHistory((nds) => syncCallNodesForFunction(nds, func) as VVSNodeType[]);
    };
    window.addEventListener(FUNCTION_RENAMED_EVENT, handleFunctionRenamed);
    return () => window.removeEventListener(FUNCTION_RENAMED_EVENT, handleFunctionRenamed);
  }, [setNodesWithHistory]);

  React.useEffect(() => {
    const handleNodeAction = (event: Event) => {
      const { action, nodeId } = (event as CustomEvent<{ action: string; nodeId: string }>).detail;
      if (action === 'duplicate-node') {
        setNodesWithHistory((nds) => {
          const nodeToCopy = nds.find((n) => n.id === nodeId);
          if (!nodeToCopy) return nds;
          const newNode = {
            ...nodeToCopy,
            id: `${nodeToCopy.type}-${Date.now()}`,
            position: { x: nodeToCopy.position.x + 50, y: nodeToCopy.position.y + 50 },
            selected: true,
            parentId: undefined,
            expandParent: undefined,
          };
          return [...nds.map((n) => ({ ...n, selected: false })), newNode];
        });
      }
      if (action === 'delete-node') {
        setNodesWithHistory((nds) => nds.filter((n) => n.id !== nodeId));
        setEdgesWithHistory((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      }
    };
    window.addEventListener('vvs:node-action', handleNodeAction);
    return () => window.removeEventListener('vvs:node-action', handleNodeAction);
  }, [setNodesWithHistory, setEdgesWithHistory]);

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
      if (action === 'zoom-fit') fitView({ duration: 300 });
      if (action === 'group-comment') wrapSelectionInComment(nodes, setNodesWithHistory);
      if (action === 'ungroup-comment') ungroupSelectionInComment(nodes, setNodesWithHistory);
      if (action === 'extract-function') handleExtractToFunction();
    };
    window.addEventListener('vvs:graph-action', handleGraphAction);
    return () => window.removeEventListener('vvs:graph-action', handleGraphAction);
  }, [nodes, handleCopy, handlePaste, handleCut, handleDuplicate, fitView, setNodesWithHistory, handleExtractToFunction]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedEdges = edges.filter((edge) => edge.selected);
        if (selectedEdges.length > 0) {
          const selectedIds = new Set(selectedEdges.map((edge) => edge.id));
          setEdgesWithHistory((eds) => eds.filter((edge) => !selectedIds.has(edge.id)));
        }
        setNodesWithHistory((nds) => nds.filter((n) => !n.selected));
        setEdgesWithHistory((eds) =>
          eds.filter(
            (edge) => !nodes.find((n) => n.selected && (n.id === edge.source || n.id === edge.target))
          )
        );
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        void handlePaste();
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        fitView({ duration: 300 });
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const flowPosition = screenToFlowPosition({ x, y });
        setMenu({ x, y, flowPosition });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        wrapSelectionInComment(nodes, setNodesWithHistory);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExtractToFunction();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        ungroupSelectionInComment(nodes, setNodesWithHistory);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, handleCopy, handlePaste, handleCut, handleDuplicate, handleExtractToFunction, setNodesWithHistory, setEdgesWithHistory, fitView, screenToFlowPosition]);

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: VVSNodeType) => {
      if (!isLinkedGraphNode(node.data) || !node.data.linkedGraphId) return;
      const entryId = findGraphEntryNodeId(getDocuments() ?? {}, node.data.linkedGraphId);
      if (!entryId) return;
      dispatchNavigateToNode(node.data.linkedGraphId, entryId);
    },
    [getDocuments]
  );

  React.useEffect(() => {
    const onSpawnEventNode = (event: Event) => {
      const detail = (event as CustomEvent<{ eventId: string; role: 'define' | 'dispatch' }>).detail;
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
    };

    window.addEventListener(SPAWN_EVENT_NODE_EVENT, onSpawnEventNode);
    return () => window.removeEventListener(SPAWN_EVENT_NODE_EVENT, onSpawnEventNode);
  }, [events, screenToFlowPosition, setNodesWithHistory, setSelection]);

  return (
    <div
      className="relative w-full h-full"
      style={{ background: '#0a0a0c' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <GraphNodeSearch />
      <GraphFloatingDetails />
      <GraphFloatingCompilerLog />
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none text-[10px] text-zinc-600 bg-zinc-950/80 border border-zinc-800/80 rounded px-2 py-1">
        Alt+click or right-click wire to delete · Delete key removes selection
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
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView
        noWheelClassName="nowheel"
        noPanClassName="nopan"
        noDragClassName="nodrag"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#333" />
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
        {menu && (
          <NodeContextMenu
            x={menu.x}
            y={menu.y}
            onClose={() => setMenu(null)}
            onSelect={handleAddNode}
            filter={menu.filter}
            currentGraphId={activeGraphTab}
            functions={functions}
            openTabs={openTabs}
          />
        )}
        {variableMenu && (
          <div
            className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded shadow-xl overflow-hidden text-xs text-white"
            style={{ top: variableMenu.y, left: variableMenu.x }}
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors"
              onClick={() =>
                handleSpawnVariableNode('Get', variableMenu.variable, variableMenu.flowPosition)
              }
            >
              Get {variableMenu.variable.name}
            </button>
            <div className="h-[1px] bg-zinc-800 w-full" />
            <button
              className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors"
              onClick={() =>
                handleSpawnVariableNode('Set', variableMenu.variable, variableMenu.flowPosition)
              }
            >
              Set {variableMenu.variable.name}
            </button>
          </div>
        )}
      </ReactFlow>
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
