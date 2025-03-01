import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeFactory, NodeData } from '../../services/NodeFactory';
import './NodeCanvas.css';

interface NodeCanvasProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: (nodes: Node<NodeData>[], recordHistory?: boolean) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onSelectionChange: (nodes: Node<NodeData>[], edges: Edge[]) => void;
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
  const { fitView, project } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 0);
    return () => clearTimeout(timer);
  }, [fitView]);

  const handleNodesChange = (changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes) as Node<NodeData>[];
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
      params.nodes as Node<NodeData>[],
      params.edges
    );
  };

  const handleConnect = useCallback(
    (connection: Connection) => {
      onEdgesChange(addEdge(connection, edges));
    },
    [edges, onEdgesChange]
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

      const position = project({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      const newNode = NodeFactory.createNode({
        type: nodeType,
        position,
      });

      if (newNode) {
        onNodesChange([...nodes, newNode]);
      }
    },
    [nodes, onNodesChange, project]
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
        draggable={true}
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