import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  XYPosition,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { customNodes, nodeTypes, CustomNodeData } from '../nodes/CustomNodes';
import { NodeFactory } from '../../services/NodeFactory';
import './NodeCanvas.css';

interface NodeCanvasProps {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  onNodesChange: (nodes: Node<CustomNodeData>[], recordHistory?: boolean) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onSelectionChange: (nodes: Node<CustomNodeData>[], edges: Edge[]) => void;
  onInit?: (instance: any) => void;
}

const Flow: React.FC<NodeCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
  onInit,
}) => {
  const { fitView, project, getViewport } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay fitView to ensure nodes are properly rendered
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 0);
    return () => clearTimeout(timer);
  }, [fitView]);

  const screenToFlowPosition = useCallback((screenX: number, screenY: number) => {
    if (!reactFlowWrapper.current) return { x: 0, y: 0 };

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = project({
      x: screenX - reactFlowBounds.left,
      y: screenY - reactFlowBounds.top,
    });

    return position;
  }, [project]);

  const handleNodesChange = (changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes) as Node<CustomNodeData>[];
    
    // Only record history when the drag operation is complete
    const shouldRecordHistory = changes.every(change => 
      change.type !== 'position' || change.dragging === false
    );
    
    onNodesChange(updatedNodes, shouldRecordHistory);
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    onEdgesChange(updatedEdges);
  };

  const handleSelectionChange = (params: { nodes: Node[]; edges: Edge[] }) => {
    onSelectionChange(
      params.nodes as Node<CustomNodeData>[],
      params.edges
    );
  };

  const handleConnect = useCallback(
    (connection: Connection) => {
      // Validate connection before adding
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode && connection.sourceHandle && connection.targetHandle) {
        if (NodeFactory.isValidConnection(
          sourceNode,
          connection.sourceHandle,
          targetNode,
          connection.targetHandle
        )) {
          onEdgesChange(addEdge(connection, edges));
        }
      }
    },
    [edges, nodes, onEdgesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const nodeType = event.dataTransfer.getData('application/vvsnode');
      if (!nodeType) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const viewport = getViewport();
      
      // Calculate position relative to the canvas
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = NodeFactory.createNode({
        type: nodeType,
        position,
      });

      onNodesChange([...nodes, newNode]);
    },
    [nodes, onNodesChange, project, getViewport]
  );

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={handleSelectionChange}
        onInit={onInit}
        nodeTypes={customNodes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#2d2d2d" />
        <Controls />
        <MiniMap
          nodeColor="#3d3d3d"
          maskColor="rgba(0, 0, 0, 0.5)"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #3d3d3d',
          }}
        />
      </ReactFlow>
    </div>
  );
};

const NodeCanvas: React.FC<NodeCanvasProps> = (props) => {
  return (
    <div className="node-canvas">
      <ReactFlowProvider>
        <Flow {...props} />
      </ReactFlowProvider>
    </div>
  );
};

export default NodeCanvas; 