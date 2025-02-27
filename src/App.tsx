import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import MenuBar from './components/layout/MenuBar';
import NodeCanvas from './components/canvas/NodeCanvas';
import CodePanel from './components/code/CodePanel';
import NodePalette from './components/layout/NodePalette';
import { Node, Edge } from 'reactflow';
import { CustomNodeData, nodeTypes } from './components/nodes/CustomNodes';
import { HistoryService } from './services/HistoryService';
import { ClipboardService } from './services/ClipboardService';
import { NodeContextMenu, GraphContextMenu } from './components/menu/NodeContextMenu';
import { NodeFactory } from './services/NodeFactory';

function App() {
  const [splitPosition, setSplitPosition] = useState(60); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node<CustomNodeData>[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphPaneRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>([
    {
      id: '1',
      type: nodeTypes.ifStatement,
      position: { x: 100, y: 100 },
      data: {
        title: 'If Statement',
        inputs: [
          { id: 'condition', label: 'Condition', dataType: 'boolean' }
        ],
        outputs: [
          { id: 'true', label: 'True', dataType: 'any' },
          { id: 'false', label: 'False', dataType: 'any' }
        ]
      }
    },
    {
      id: '2',
      type: nodeTypes.print,
      position: { x: 400, y: 100 },
      data: {
        title: 'Print',
        inputs: [
          { id: 'value', label: 'Value', dataType: 'any' }
        ],
        outputs: []
      }
    }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    type: 'node' | 'graph';
    x: number;
    y: number;
    flowPosition?: { x: number; y: number };
  } | null>(null);

  // Initialize history service
  const historyServiceRef = useRef(new HistoryService({ nodes, edges }));

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (graphPaneRef.current) {
        const rect = graphPaneRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate node offset for paste/duplicate
  const calculateNodeOffset = (nodes: Node<CustomNodeData>[]) => {
    if (nodes.length === 0) return { x: 0, y: 0 };

    // Find the bounding box of the nodes
    const bounds = nodes.reduce((acc, node) => {
      acc.minX = Math.min(acc.minX, node.position.x);
      acc.minY = Math.min(acc.minY, node.position.y);
      acc.maxX = Math.max(acc.maxX, node.position.x);
      acc.maxY = Math.max(acc.maxY, node.position.y);
      return acc;
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    // Calculate center of the bounding box
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Convert screen coordinates to flow coordinates using the new method
    const flowPosition = reactFlowInstance.screenToFlowPosition({
      x: mousePosition.x,
      y: mousePosition.y
    });

    return {
      x: flowPosition.x - centerX,
      y: flowPosition.y - centerY
    };
  };

  // Reference to the ReactFlow instance
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Handle state changes
  const handleStateChange = useCallback((
    newNodes: Node<CustomNodeData>[],
    newEdges: Edge[],
    debounce: boolean = false,
    selectedNodes: Node<CustomNodeData>[] = [],
    selectedEdges: Edge[] = []
  ) => {
    setNodes(newNodes);
    setEdges(newEdges);
    historyServiceRef.current.pushState({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeIds: selectedNodes.map(node => node.id),
      selectedEdgeIds: selectedEdges.map(edge => edge.id)
    }, debounce);
  }, []);

  // Delete handler
  const handleDelete = useCallback(() => {
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      // Remove selected nodes
      const remainingNodes = nodes.filter(node => 
        !selectedNodes.some(selectedNode => selectedNode.id === node.id)
      );
      
      // Remove edges connected to deleted nodes and selected edges
      const remainingEdges = edges.filter(edge => 
        !selectedNodes.some(node => node.id === edge.source || node.id === edge.target) &&
        !selectedEdges.some(selectedEdge => selectedEdge.id === edge.id)
      );

      handleStateChange(remainingNodes, remainingEdges);
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
  }, [nodes, edges, selectedNodes, selectedEdges, handleStateChange]);

  // Handle nodes changes
  const handleNodesChange = useCallback((newNodes: Node<CustomNodeData>[], recordHistory: boolean = true) => {
    setNodes(newNodes);
    if (recordHistory) {
      // Use debouncing for node movements (when recordHistory is true but it's a drag operation)
      const isNodeMovement = nodes.some((node, i) => 
        node.position.x !== newNodes[i].position.x || 
        node.position.y !== newNodes[i].position.y
      );
      handleStateChange(newNodes, edges, isNodeMovement, selectedNodes, selectedEdges);
    }
  }, [edges, nodes, selectedNodes, selectedEdges, handleStateChange]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    handleStateChange(nodes, newEdges, false, selectedNodes, selectedEdges);
  }, [nodes, handleStateChange, selectedNodes, selectedEdges]);

  // Selection handlers
  const handleSelectionChange = useCallback((nodes: Node<CustomNodeData>[], edges: Edge[]) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
    // Don't record history for selection changes
  }, []);

  const handleSelectAll = useCallback(() => {
    const allNodes = nodes.map(node => ({ ...node, selected: true }));
    const allEdges = edges.map(edge => ({ ...edge, selected: true }));
    setNodes(allNodes);
    setEdges(allEdges);
    setSelectedNodes(allNodes);
    setSelectedEdges(allEdges);
    handleStateChange(allNodes, allEdges, false, allNodes, allEdges);
  }, [nodes, edges, handleStateChange]);

  const handleDeselectAll = useCallback(() => {
    const unselectedNodes = nodes.map(node => ({ ...node, selected: false }));
    const unselectedEdges = edges.map(edge => ({ ...edge, selected: false }));
    setNodes(unselectedNodes);
    setEdges(unselectedEdges);
    setSelectedNodes([]);
    setSelectedEdges([]);
    handleStateChange(unselectedNodes, unselectedEdges, false, [], []);
  }, [nodes, edges, handleStateChange]);

  // Cut handler
  const handleCut = useCallback(() => {
    if (selectedNodes.length > 0) {
      // First copy the selected nodes and edges
      const relevantEdges = edges.filter(edge =>
        selectedNodes.some(node => node.id === edge.source) &&
        selectedNodes.some(node => node.id === edge.target)
      );
      ClipboardService.copy(selectedNodes, relevantEdges);

      // Then delete them
      handleDelete();
    }
  }, [selectedNodes, edges, handleDelete]);

  // Clipboard operations
  const handleCopy = useCallback(() => {
    if (selectedNodes.length > 0) {
      const relevantEdges = edges.filter(edge =>
        selectedNodes.some(node => node.id === edge.source) &&
        selectedNodes.some(node => node.id === edge.target)
      );
      ClipboardService.copy(selectedNodes, relevantEdges);
    }
  }, [selectedNodes, edges]);

  const handlePaste = useCallback(() => {
    if (!reactFlowInstance || !ClipboardService.hasData()) return;

    // Get the target position for pasting (mouse position in flow coordinates)
    const targetPosition = reactFlowInstance.screenToFlowPosition({
      x: mousePosition.x,
      y: mousePosition.y
    });

    // Create new nodes and edges from clipboard, centered at target position
    const pastedElements = ClipboardService.createFromClipboard(targetPosition);
    if (!pastedElements) return;

    // Unselect all existing elements
    const unselectedNodes = nodes.map(node => ({ ...node, selected: false }));
    const unselectedEdges = edges.map(edge => ({ ...edge, selected: false }));

    // Combine existing and new elements
    const newNodes = [...unselectedNodes, ...pastedElements.nodes];
    const newEdges = [...unselectedEdges, ...pastedElements.edges];

    // Update state with new elements
    handleStateChange(newNodes, newEdges, false, pastedElements.nodes, pastedElements.edges);
    setSelectedNodes(pastedElements.nodes);
    setSelectedEdges(pastedElements.edges);
  }, [nodes, edges, handleStateChange, mousePosition, reactFlowInstance]);

  const handleDuplicate = useCallback(() => {
    if (selectedNodes.length === 0 || !reactFlowInstance) return;

    // Get edges between selected nodes
    const relevantEdges = edges.filter(edge =>
      selectedNodes.some(node => node.id === edge.source) &&
      selectedNodes.some(node => node.id === edge.target)
    );

    // Get the target position for duplicating (mouse position in flow coordinates)
    const targetPosition = reactFlowInstance.screenToFlowPosition({
      x: mousePosition.x,
      y: mousePosition.y
    });

    // Create duplicates centered at target position
    const { nodes: duplicatedNodes, edges: duplicatedEdges } = 
      ClipboardService.duplicateElements(selectedNodes, relevantEdges, targetPosition);

    // Unselect existing nodes and edges
    const unselectedNodes = nodes.map(node => ({ ...node, selected: false }));
    const unselectedEdges = edges.map(edge => ({ ...edge, selected: false }));

    // Combine existing and duplicated elements
    const newNodes = [...unselectedNodes, ...duplicatedNodes];
    const newEdges = [...unselectedEdges, ...duplicatedEdges];

    // Update state with new elements
    handleStateChange(newNodes, newEdges, false, duplicatedNodes, duplicatedEdges);
    setSelectedNodes(duplicatedNodes);
    setSelectedEdges(duplicatedEdges);
  }, [selectedNodes, edges, nodes, handleStateChange, mousePosition, reactFlowInstance]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const previousState = historyServiceRef.current.undo();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      // Restore selections
      setSelectedNodes(previousState.nodes.filter(node => 
        previousState.selectedNodeIds.includes(node.id)
      ));
      setSelectedEdges(previousState.edges.filter(edge => 
        previousState.selectedEdgeIds.includes(edge.id)
      ));
    }
  }, []);

  const handleRedo = useCallback(() => {
    const nextState = historyServiceRef.current.redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      // Restore selections
      setSelectedNodes(nextState.nodes.filter(node => 
        nextState.selectedNodeIds.includes(node.id)
      ));
      setSelectedEdges(nextState.edges.filter(edge => 
        nextState.selectedEdgeIds.includes(edge.id)
      ));
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle escape key for deselect all
      if (event.key === 'Escape') {
        handleDeselectAll();
        return;
      }

      // Handle delete/backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Only handle delete if we're not in an input/textarea
        if (!(event.target instanceof HTMLInputElement) && 
            !(event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault();
          handleDelete();
          return;
        }
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'a':
            event.preventDefault();
            handleSelectAll();
            break;
          case 'c':
            event.preventDefault();
            handleCopy();
            break;
          case 'x':
            event.preventDefault();
            handleCut();
            break;
          case 'v':
            event.preventDefault();
            handlePaste();
            break;
          case 'd':
            event.preventDefault();
            handleDuplicate();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            event.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    handleUndo,
    handleRedo,
    handleDelete,
    handleSelectAll,
    handleDeselectAll
  ]);

  // Split pane handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.min(Math.max(newPosition, 30), 70));
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  const handleNodeDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/vvsnode', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Add node handler
  const handleAddNode = useCallback((nodeType: string, position: { x: number, y: number }) => {
    const newNode = NodeFactory.createNode({
      type: nodeType,
      position,
    });
    const updatedNodes = [...nodes, newNode];
    handleStateChange(updatedNodes, edges, false, [], []);
    setContextMenu(null);
  }, [nodes, edges, handleStateChange]);

  // Update context menu handler
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // Only show context menu if clicking in the graph pane
    if (graphPaneRef.current?.contains(event.target as HTMLElement)) {
      const target = event.target as HTMLElement;
      const nodeElement = target.closest('.react-flow__node');
      
      // Get the flow position for the context menu
      const flowPosition = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX - graphPaneRef.current.getBoundingClientRect().left,
        y: event.clientY - graphPaneRef.current.getBoundingClientRect().top,
      }) || { x: 0, y: 0 };

      // If we clicked on a node
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id');
        // If no nodes are selected and we clicked on a node, select it
        if (selectedNodes.length === 0 && nodeId) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNodes([node]);
            setSelectedEdges([]);
            const updatedNodes = nodes.map(n => ({
              ...n,
              selected: n.id === nodeId
            }));
            setNodes(updatedNodes);
          }
        }
        // Show node context menu
        setContextMenu({ 
          type: 'node',
          x: event.clientX, 
          y: event.clientY,
          flowPosition: { x: flowPosition.x, y: flowPosition.y }
        });
      } else {
        // Show graph context menu
        setContextMenu({ 
          type: 'graph',
          x: event.clientX, 
          y: event.clientY,
          flowPosition: { x: flowPosition.x, y: flowPosition.y }
        });
      }
    }
  }, [nodes, selectedNodes, setNodes, setSelectedNodes, setSelectedEdges, reactFlowInstance]);

  // Close context menu when clicking outside
  const handleClick = useCallback((event: MouseEvent) => {
    if (contextMenu) {
      const target = event.target as HTMLElement;
      const isContextMenuClick = target.closest('.node-context-menu');
      if (!isContextMenuClick) {
        setContextMenu(null);
      }
    }
  }, [contextMenu]);

  // Add click handler effect
  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  // Close context menu on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenu) {
        setContextMenu(null);
        return;
      }
      // ... rest of existing keyboard handlers ...
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    // ... existing dependencies ...
    contextMenu
  ]);

  return (
    <div className={`app ${isDragging ? 'resizing' : ''}`}>
      <MenuBar 
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onCut={handleCut}
        onDuplicate={handleDuplicate}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        canUndo={historyServiceRef.current.canUndo()}
        canRedo={historyServiceRef.current.canRedo()}
        canCopy={selectedNodes.length > 0}
        canPaste={ClipboardService.hasData()}
        hasSelection={selectedNodes.length > 0 || selectedEdges.length > 0}
      />
      <div className="main-content">
        <NodePalette onDragStart={handleNodeDragStart} />
        <div className="split-view" ref={containerRef}>
          <div 
            className="split-pane graph-pane"
            ref={graphPaneRef}
            style={{ width: `${splitPosition}%` }}
            onContextMenu={handleContextMenu}
          >
            <NodeCanvas 
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onSelectionChange={handleSelectionChange}
              onInit={setReactFlowInstance}
            />
            {contextMenu && contextMenu.flowPosition && (
              contextMenu.type === 'node' ? (
                <NodeContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onCopy={() => {
                    handleCopy();
                    setContextMenu(null);
                  }}
                  onCut={() => {
                    handleCut();
                    setContextMenu(null);
                  }}
                  onPaste={() => {
                    handlePaste();
                    setContextMenu(null);
                  }}
                  onDuplicate={() => {
                    handleDuplicate();
                    setContextMenu(null);
                  }}
                  onDelete={() => {
                    handleDelete();
                    setContextMenu(null);
                  }}
                  canPaste={ClipboardService.hasData()}
                  hasSelection={selectedNodes.length > 0 || selectedEdges.length > 0}
                />
              ) : (
                <GraphContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onAddNode={handleAddNode}
                  flowPosition={contextMenu.flowPosition}
                />
              )
            )}
          </div>
          <div 
            className="split-handle"
            onMouseDown={handleDragStart}
            style={{ cursor: 'col-resize' }}
          />
          <div 
            className="split-pane code-pane"
            style={{ width: `${100 - splitPosition}%` }}
          >
            <CodePanel nodes={nodes} connections={edges} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
