'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useReactFlow, Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphEdit } from '@/contexts/GraphEditContext';
import { useEditorView } from '@/contexts/EditorViewContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useLatestRef } from '@/hooks/useLatestRef';
import { VVSNode } from './VVSNode';
import { VVSEdge } from './VVSEdge';
import { VVSNode as VVSNodeType, VVSEdge as VVSEdgeType, PinType } from '@/types/graph';
import { NodeContextMenu } from './NodeContextMenu';
import { LibraryNodeTemplate } from '@/types/ui';
import { useProject } from '@/contexts/ProjectContext';
import { useOnSelectionChange } from '@xyflow/react';
import { VVSCommentNode } from './VVSCommentNode';
import { VVSRerouteNode } from './VVSRerouteNode';
import { GraphAction } from '@/lib/graphActions';
import { buildExecutionOrder, findSimulationStartNode } from '@/lib/executionOrder';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { findGraphEntryNodeId, isLinkedGraphNode } from '@/lib/linkedGraphNodes';
import { GraphNodeSearch } from './GraphNodeSearch';

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
import { listMacroEntries } from '@/lib/projectTree';

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
    simulationState,
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
  } = useGraphEdit();

  const { getDocuments } = useGraphWorkspace();

  const { screenToFlowPosition, getNode, fitView } = useReactFlow();

  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes }) => {
      if (!isCanvasActive) return;
      if (selectedNodes.length > 0) {
        setSelection({ type: 'node', id: selectedNodes[0].id });
      } else {
        setSelection({ type: 'graph', id: null });
      }
    },
  });

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

  const [clipboard, setClipboard] = useState<{ nodes: VVSNodeType[]; edges: VVSEdgeType[] } | null>(null);

  const nodesRef = useLatestRef(nodes);
  const edgesRef = useLatestRef(edges);
  const simStepRef = React.useRef(0);

  const focusGraphNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      setSelection({ type: 'node', id: nodeId });
      requestAnimationFrame(() => {
        fitView({ nodes: [{ id: nodeId }], padding: 0.6, duration: 200 });
      });
    },
    [setNodes, setSelection, fitView]
  );

  React.useEffect(() => {
    if (!pendingCanvasFocus || pendingCanvasFocus.graphTab !== activeGraphTab) return;
    const nodeExists = nodes.some((n) => n.id === pendingCanvasFocus.nodeId);
    if (nodeExists) {
      focusGraphNode(pendingCanvasFocus.nodeId);
    }
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

  const clearSimulationHighlight = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.data.isSimulating ? { ...n, data: { ...n.data, isSimulating: false } } : n
      )
    );
  }, [setNodes]);

  const advanceSimulationStep = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const startNode = findSimulationStartNode(currentNodes);
    if (!startNode) return;

    const execOrder = buildExecutionOrder(startNode.id, currentNodes, currentEdges);
    if (execOrder.length === 0) return;

    const activeId = execOrder[simStepRef.current % execOrder.length];
    const activeLabel = currentNodes.find((n) => n.id === activeId)?.data.label ?? activeId;

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isSimulating: n.id === activeId },
      }))
    );
    window.dispatchEvent(
      new CustomEvent('vvs:simulation-log', {
        detail: { message: `Step ${simStepRef.current + 1}: ${activeLabel}` },
      })
    );
    simStepRef.current += 1;
  }, [setNodes]);

  React.useEffect(() => {
    if (simulationState === 'idle') {
      simStepRef.current = 0;
      clearSimulationHighlight();
    } else if (simulationState === 'paused') {
      clearSimulationHighlight();
    }
  }, [simulationState, clearSimulationHighlight]);

  React.useEffect(() => {
    if (simulationState !== 'playing') return;
    const interval = window.setInterval(advanceSimulationStep, 900);
    return () => window.clearInterval(interval);
  }, [simulationState, advanceSimulationStep]);

  React.useEffect(() => {
    const onStep = () => advanceSimulationStep();
    window.addEventListener('vvs:simulation-step', onStep);
    return () => window.removeEventListener('vvs:simulation-step', onStep);
  }, [advanceSimulationStep]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const attempt = connectionFromReactFlow(params as Connection);
      const result = applyWireConnection(attempt, nodes, edges);
      if ('error' in result) {
        dispatchEditorWarning(wireRejectionMessage(result.error));
        return;
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
  }, [menu, variableMenu]);

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (event.altKey) {
        setEdgesWithHistory((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [setEdgesWithHistory]
  );

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

      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: menu.flowPosition,
        data: {
          label: template.label,
          category: template.category,
          inputs: template.inputs || [],
          outputs: template.outputs || [],
          inlineValues: defaultInlineValues,
          ...(template.linkedGraphId ? { linkedGraphId: template.linkedGraphId } : {}),
          ...(template.linkKind ? { linkKind: template.linkKind } : {}),
        },
      };

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
      const newNode: VVSNodeType = {
        id: `node-${Date.now()}`,
        type: 'vvs_standard_node',
        position: flowPosition,
        data: {
          label: `${type} ${variable.name}`,
          category: 'Variables',
          inputs:
            type === 'Set'
              ? [
                  { id: 'exec_in', label: '', type: 'execution' },
                  { id: 'in_val', label: 'Value', type: `data_${variable.type}` as PinType },
                ]
              : [],
          outputs:
            type === 'Set'
              ? [
                  { id: 'exec_out', label: '', type: 'execution' },
                  { id: 'out_val', label: '', type: `data_${variable.type}` as PinType },
                ]
              : [{ id: 'out_val', label: '', type: `data_${variable.type}` as PinType }],
          inlineValues: {},
        },
      };
      setNodesWithHistory((nds) => nds.concat(newNode));
      setVariableMenu(null);
    },
    [setNodesWithHistory]
  );

  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter(
      (e) =>
        selectedNodes.some((n) => n.id === e.source) &&
        selectedNodes.some((n) => n.id === e.target)
    );
    if (selectedNodes.length > 0) setClipboard({ nodes: selectedNodes, edges: selectedEdges });
  }, [nodes, edges]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const offset = 50;
    const newNodes = clipboard.nodes.map((n) => ({
      ...n,
      id: `${n.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      position: { x: n.position.x + offset, y: n.position.y + offset },
      selected: true,
      parentId: undefined,
      expandParent: undefined,
    }));
    const idMap = new Map(clipboard.nodes.map((n, i) => [n.id, newNodes[i].id]));
    const newEdges = clipboard.edges.map((e) => ({
      ...e,
      id: `e-${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}-${Date.now()}`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
      selected: true,
    }));
    setNodesWithHistory((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdgesWithHistory((eds) => [...eds.map((e) => ({ ...e, selected: false })), ...newEdges]);
  }, [clipboard, setNodesWithHistory, setEdgesWithHistory]);

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
          if (label === `Get ${oldName}`) return { ...n, data: { ...n.data, label: `Get ${newName}` } };
          if (label === `Set ${oldName}`) return { ...n, data: { ...n.data, label: `Set ${newName}` } };
          return n;
        })
      );
    };
    window.addEventListener('vvs:variable-renamed', handleVariableRenamed);
    return () => window.removeEventListener('vvs:variable-renamed', handleVariableRenamed);
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

  React.useEffect(() => {
    const handleGraphAction = (event: Event) => {
      const action = (event as CustomEvent<{ action: GraphAction }>).detail.action;
      if (action === 'copy') handleCopy();
      if (action === 'paste') handlePaste();
      if (action === 'cut') handleCut();
      if (action === 'duplicate') handleDuplicate();
      if (action === 'zoom-fit') fitView({ duration: 300 });
      if (action === 'group-comment') wrapSelectionInComment(nodes, setNodesWithHistory);
      if (action === 'ungroup-comment') ungroupSelectionInComment(nodes, setNodesWithHistory);
    };
    window.addEventListener('vvs:graph-action', handleGraphAction);
    return () => window.removeEventListener('vvs:graph-action', handleGraphAction);
  }, [nodes, handleCopy, handlePaste, handleCut, handleDuplicate, fitView, setNodesWithHistory]);

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
        handlePaste();
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

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        ungroupSelectionInComment(nodes, setNodesWithHistory);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, handleCopy, handlePaste, handleCut, handleDuplicate, setNodesWithHistory, setEdgesWithHistory, fitView, screenToFlowPosition]);

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: VVSNodeType) => {
      if (!isLinkedGraphNode(node.data) || !node.data.linkedGraphId) return;
      const entryId = findGraphEntryNodeId(getDocuments() ?? {}, node.data.linkedGraphId);
      if (!entryId) return;
      dispatchNavigateToNode(node.data.linkedGraphId, entryId);
    },
    [getDocuments]
  );

  return (
    <div
      className="relative w-full h-full"
      style={{ background: '#0a0a0c' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <GraphNodeSearch />
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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView
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
    </div>
  );
}

export default GraphCanvasInner;
