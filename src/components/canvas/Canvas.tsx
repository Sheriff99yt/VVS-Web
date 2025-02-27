import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { NodeData, Connection, Port } from '../../types/node';
import { NodeFactory } from '../../core/NodeFactory';
import { ConnectionManager } from '../../core/ConnectionManager';
import { StateManager } from '../../core/StateManager';
import { InputNode } from '../nodes/InputNode';
import { MathNode } from '../nodes/MathNode';
import { OutputNode } from '../nodes/OutputNode';
import { ConnectionLine } from './ConnectionLine';
import { ErrorDisplay } from '../ErrorDisplay';
import { useError } from '../../contexts/ErrorContext';
import { PropertyPanel } from '../panels/PropertyPanel';

interface DragState {
  isDragging: boolean;
  sourcePortId: string | null;
  sourceNodeId: string | null;
  mousePosition: { x: number; y: number };
  isValidConnection: boolean;
  hoveredPortId: string | null;
  hoveredNodeId: string | null;
}

interface NodeDragState {
  isDragging: boolean;
  nodeId: string | null;
  offset: { x: number; y: number };
}

export const Canvas: React.FC = () => {
  const { addError, removeError, errors } = useError();
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    sourcePortId: null,
    sourceNodeId: null,
    mousePosition: { x: 0, y: 0 },
    isValidConnection: true,
    hoveredPortId: null,
    hoveredNodeId: null
  });
  const [nodeDragState, setNodeDragState] = useState<NodeDragState>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 }
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeFactory = NodeFactory.getInstance();
  const connectionManager = ConnectionManager.getInstance();
  const stateManager = StateManager.getInstance();

  const handleAddNode = (type: 'input' | 'math' | 'output', position: { x: number; y: number }) => {
    let newNode: NodeData;
    switch (type) {
      case 'input':
        newNode = nodeFactory.createInputNode(position);
        break;
      case 'math':
        newNode = nodeFactory.createMathNode(position);
        break;
      case 'output':
        newNode = nodeFactory.createOutputNode(position);
        break;
      default:
        return;
    }
    setNodes([...nodes, newNode]);
  };

  const handleStartConnection = (nodeId: string, portId: string) => {
    setDragState({
      isDragging: true,
      sourcePortId: portId,
      sourceNodeId: nodeId,
      mousePosition: { x: 0, y: 0 },
      isValidConnection: true,
      hoveredPortId: null,
      hoveredNodeId: null
    });
  };

  const handleEndConnection = (nodeId: string, portId: string) => {
    if (dragState.isDragging && dragState.sourcePortId && dragState.sourceNodeId) {
      const sourceNode = nodes.find(n => n.id === dragState.sourceNodeId);
      const targetNode = nodes.find(n => n.id === nodeId);

      if (sourceNode && targetNode) {
        const sourcePort = [...sourceNode.inputs, ...sourceNode.outputs]
          .find(p => p.id === dragState.sourcePortId);
        const targetPort = [...targetNode.inputs, ...targetNode.outputs]
          .find(p => p.id === portId);

        if (sourcePort && targetPort) {
          if (connectionManager.canConnect(sourcePort, targetPort)) {
            const newConnection = connectionManager.createConnection(
              dragState.sourceNodeId,
              dragState.sourcePortId,
              nodeId,
              portId
            );
            setConnections([...connections, newConnection]);
          } else {
            addError('Invalid connection: Port types are incompatible', 'warning');
          }
        }
      }
    }
    setDragState({
      isDragging: false,
      sourcePortId: null,
      sourceNodeId: null,
      mousePosition: { x: 0, y: 0 },
      isValidConnection: true,
      hoveredPortId: null,
      hoveredNodeId: null
    });
  };

  const handleStartNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setNodeDragState({
        isDragging: true,
        nodeId,
        offset: {
          x: e.clientX - rect.left - node.position.x,
          y: e.clientY - rect.top - node.position.y
        }
      });
      setSelectedNode(nodeId);
    }
  };

  const handleNodeDrag = useCallback((e: React.MouseEvent) => {
    if (nodeDragState.isDragging && nodeDragState.nodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - nodeDragState.offset.x;
      const newY = e.clientY - rect.top - nodeDragState.offset.y;

      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === nodeDragState.nodeId
            ? { ...node, position: { x: newX, y: newY } }
            : node
        )
      );
    }
  }, [nodeDragState]);

  const handleEndNodeDrag = () => {
    setNodeDragState({
      isDragging: false,
      nodeId: null,
      offset: { x: 0, y: 0 }
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragState(prev => ({
        ...prev,
        mousePosition: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }));
    }
    if (nodeDragState.isDragging) {
      handleNodeDrag(e);
    }
  }, [dragState.isDragging, nodeDragState.isDragging, handleNodeDrag]);

  const handlePortValueChange = (nodeId: string, portId: string, value: any) => {
    stateManager.updatePortValue(nodeId, portId, value);
  };

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setSelectedNode(null); // Deselect any selected node
  };

  const handleConnectionDelete = (connectionId: string) => {
    setConnections(prevConnections => 
      prevConnections.filter(conn => conn.id !== connectionId)
    );
    setSelectedConnection(null);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setSelectedConnection(null);
  };

  const handleNodeDelete = useCallback((nodeId: string) => {
    // Remove all connections associated with this node
    const nodeConnections = connections.filter(conn => 
      conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId
    );
    
    if (nodeConnections.length > 0) {
      addError(`Removed ${nodeConnections.length} connection(s)`, 'info');
    }
    
    setConnections(prevConnections => 
      prevConnections.filter(conn => 
        conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      )
    );
    
    // Remove the node
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    
    // Clear selection if the deleted node was selected
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode, connections, addError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || (e.key === 'Backspace' && !e.target)) {
        if (selectedNode) {
          handleNodeDelete(selectedNode);
        } else if (selectedConnection) {
          handleConnectionDelete(selectedConnection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedConnection, handleNodeDelete, handleConnectionDelete]);

  const handleNodeDoubleClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleNodeDelete(nodeId);
  };

  const handlePortHover = (nodeId: string, portId: string) => {
    if (dragState.isDragging && dragState.sourcePortId && dragState.sourceNodeId) {
      const sourceNode = nodes.find(n => n.id === dragState.sourceNodeId);
      const targetNode = nodes.find(n => n.id === nodeId);

      if (sourceNode && targetNode) {
        const sourcePort = [...sourceNode.inputs, ...sourceNode.outputs]
          .find(p => p.id === dragState.sourcePortId);
        const targetPort = [...targetNode.inputs, ...targetNode.outputs]
          .find(p => p.id === portId);

        const isValid = !!(sourcePort && targetPort && connectionManager.canConnect(sourcePort, targetPort));

        setDragState(prev => ({
          ...prev,
          isValidConnection: isValid,
          hoveredPortId: portId,
          hoveredNodeId: nodeId
        }));
      }
    }
  };

  const handlePortHoverEnd = () => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        isValidConnection: true,
        hoveredPortId: null,
        hoveredNodeId: null
      }));
    }
  };

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<NodeData>) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, ...updates }
          : node
      )
    );
  }, []);

  const renderNode = (node: NodeData) => {
    const props = {
      key: node.id,
      id: node.id,
      inputs: node.inputs,
      outputs: node.outputs,
      onInputChange: handlePortValueChange,
      onOutputChange: handlePortValueChange,
      onStartConnection: (portId: string) => handleStartConnection(node.id, portId),
      onEndConnection: (portId: string) => handleEndConnection(node.id, portId),
      onPortHover: (portId: string) => handlePortHover(node.id, portId),
      onPortHoverEnd: handlePortHoverEnd,
      position: node.position,
      selected: node.id === selectedNode,
      hoveredPortId: dragState.hoveredNodeId === node.id ? dragState.hoveredPortId : null,
      isValidConnection: dragState.isValidConnection,
      style: {
        position: 'absolute' as const,
        left: node.position.x,
        top: node.position.y,
        transform: 'translate(0, 0)',
        cursor: nodeDragState.isDragging && node.id === nodeDragState.nodeId ? 'grabbing' : 'grab',
        border: node.id === selectedNode ? '2px solid #2196f3' : 'none',
        borderRadius: '4px'
      },
      onMouseDown: (e: React.MouseEvent) => handleStartNodeDrag(node.id, e),
      onDoubleClick: (e: React.MouseEvent) => handleNodeDoubleClick(node.id, e)
    };

    switch (node.type) {
      case 'input':
        return <InputNode {...props} />;
      case 'math':
        return <MathNode {...props} />;
      case 'output':
        return <OutputNode {...props} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Paper
        sx={{
          flexGrow: 1,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'grey.100'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEndNodeDrag}
        onMouseLeave={handleEndNodeDrag}
        onClick={handleCanvasClick}
        ref={canvasRef}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {connections.map(connection => {
            const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
            const targetNode = nodes.find(n => n.id === connection.targetNodeId);
            if (sourceNode && targetNode) {
              return (
                <ConnectionLine
                  key={connection.id}
                  connection={connection}
                  sourcePosition={sourceNode.position}
                  targetPosition={targetNode.position}
                  isSelected={connection.id === selectedConnection}
                  onSelect={handleConnectionSelect}
                  onDelete={handleConnectionDelete}
                />
              );
            }
            return null;
          })}
          {dragState.isDragging && dragState.sourceNodeId && (
            <path
              d={`M ${dragState.mousePosition.x} ${dragState.mousePosition.y} L ${dragState.mousePosition.x + 100} ${dragState.mousePosition.y}`}
              stroke="#999"
              strokeWidth={1}
              strokeDasharray="4"
              fill="none"
            />
          )}
        </svg>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {nodes.map(renderNode)}
        </Box>
        <ErrorDisplay errors={errors} onClose={removeError} />
      </Paper>
      <PropertyPanel
        selectedNode={nodes.find(node => node.id === selectedNode) || null}
        onNodeUpdate={handleNodeUpdate}
        onPortValueChange={handlePortValueChange}
      />
    </Box>
  );
};

export default Canvas; 