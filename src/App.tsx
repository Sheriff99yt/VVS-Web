import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import MenuBar from './components/layout/MenuBar';
import NodeCanvas from './components/canvas/NodeCanvas';
import CodePanel from './components/code/CodePanel';
import NodePalette from './components/layout/NodePalette';
import { Node, Edge } from 'reactflow';
import { NodeData } from './services/NodeFactory';
import { HistoryService } from './services/HistoryService';
import { ClipboardService } from './services/ClipboardService';
import { NodeContextMenu, GraphContextMenu } from './components/menu/NodeContextMenu';
import { NodeFactory } from './services/NodeFactory';

function App() {
  const [splitPosition, setSplitPosition] = useState(60); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node<NodeData>[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphPaneRef = useRef<HTMLDivElement>(null);
  
  // Start with an empty graph
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    type: 'node' | 'graph';
    x: number;
    y: number;
    flowPosition?: { x: number; y: number };
  } | null>(null);

  // Initialize history service
  const historyServiceRef = useRef(new HistoryService());

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
  const calculateNodeOffset = (nodes: Node<NodeData>[]) => {
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
    newNodes: Node<NodeData>[],
    newEdges: Edge[],
    debounce: boolean = false
  ) => {
    historyServiceRef.current.pushState({
      nodes: newNodes,
      edges: newEdges,
      selectedNodes,
      selectedEdges
    });
  }, [selectedNodes, selectedEdges]);

  // Handle nodes changes
  const handleNodesChange = useCallback((newNodes: Node<NodeData>[], recordHistory: boolean = true) => {
    setNodes(newNodes);
    if (recordHistory) {
      handleStateChange(newNodes, edges);
    }
  }, [edges, handleStateChange]);

  // Handle edges changes
  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
    handleStateChange(nodes, newEdges);
  }, [nodes, handleStateChange]);

  // Selection handlers
  const handleSelectionChange = useCallback((nodes: Node<NodeData>[], edges: Edge[]) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, []);

  // History handlers
  const handleUndo = useCallback(() => {
    const previousState = historyServiceRef.current.undo();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setSelectedNodes(previousState.selectedNodes);
      setSelectedEdges(previousState.selectedEdges);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const nextState = historyServiceRef.current.redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setSelectedNodes(nextState.selectedNodes);
      setSelectedEdges(nextState.selectedEdges);
    }
  }, []);

  // Clipboard handlers
  const handleCopy = useCallback(() => {
    if (selectedNodes.length > 0) {
      const selectedEdgesSet = new Set(selectedEdges.map(e => e.id));
      const connectedEdges = edges.filter(e => 
        selectedEdgesSet.has(e.id) || 
        (selectedNodes.some(n => n.id === e.source) && selectedNodes.some(n => n.id === e.target))
      );
      ClipboardService.copyToClipboard(selectedNodes, connectedEdges);
    }
  }, [selectedNodes, selectedEdges, edges]);

  const handlePaste = useCallback(() => {
    if (ClipboardService.hasData()) {
      const data = ClipboardService.createFromClipboard({ x: 50, y: 50 });
      if (data) {
        handleNodesChange([...nodes, ...data.nodes]);
        handleEdgesChange([...edges, ...data.edges]);
      }
    }
  }, [nodes, edges, handleNodesChange, handleEdgesChange]);

  const handleCut = useCallback(() => {
    if (selectedNodes.length > 0) {
      handleCopy();
      const remainingNodes = nodes.filter(node => !selectedNodes.some(n => n.id === node.id));
      const remainingEdges = edges.filter(edge => 
        !selectedEdges.some(e => e.id === edge.id) &&
        !selectedNodes.some(n => n.id === edge.source || n.id === edge.target)
      );
      handleNodesChange(remainingNodes);
      handleEdgesChange(remainingEdges);
    }
  }, [selectedNodes, selectedEdges, nodes, edges, handleCopy, handleNodesChange, handleEdgesChange]);

  const handleDuplicate = useCallback(() => {
    if (selectedNodes.length > 0) {
      handleCopy();
      handlePaste();
    }
  }, [selectedNodes, handleCopy, handlePaste]);

  // Context menu handlers
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    if (!graphPaneRef.current) return;

    const rect = graphPaneRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setContextMenu({
      type: selectedNodes.length > 0 ? 'node' : 'graph',
      x,
      y,
      flowPosition: { x, y }
    });
  }, [selectedNodes]);

  const handleDelete = useCallback(() => {
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      const remainingNodes = nodes.filter(node => !selectedNodes.some(n => n.id === node.id));
      const remainingEdges = edges.filter(edge => 
        !selectedEdges.some(e => e.id === edge.id) &&
        !selectedNodes.some(n => n.id === edge.source || n.id === edge.target)
      );
      handleNodesChange(remainingNodes);
      handleEdgesChange(remainingEdges);
    }
  }, [selectedNodes, selectedEdges, nodes, edges, handleNodesChange, handleEdgesChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'c':
            handleCopy();
            break;
          case 'v':
            handlePaste();
            break;
          case 'x':
            handleCut();
            break;
          case 'd':
            event.preventDefault();
            handleDuplicate();
            break;
          case 'a':
            event.preventDefault();
            setSelectedNodes(nodes);
            setSelectedEdges(edges);
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDelete();
      } else if (event.key === 'Escape') {
        setSelectedNodes([]);
        setSelectedEdges([]);
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleCut,
    handleDuplicate,
    handleDelete,
    nodes,
    edges
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

  return (
    <div className={`app ${isDragging ? 'resizing' : ''}`}>
      <MenuBar 
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onCut={handleCut}
        onDuplicate={handleDuplicate}
        onSelectAll={() => {
          setSelectedNodes(nodes);
          setSelectedEdges(edges);
        }}
        onDeselectAll={() => {
          setSelectedNodes([]);
          setSelectedEdges([]);
        }}
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
                  onCopy={handleCopy}
                  onCut={handleCut}
                  onPaste={handlePaste}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
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
