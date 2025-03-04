import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Alert } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';
import BaseNode from '../nodes/BaseNode';
import CustomEdge from './CustomEdge';
import SocketTypeLegend from './SocketTypeLegend';

/**
 * Custom node types for the graph editor
 */
const nodeTypes: NodeTypes = {
  baseNode: BaseNode,
};

/**
 * Custom edge types for the graph editor
 */
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

/**
 * GraphEditor component - the main node graph editor
 */
export const GraphEditor: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setSelectedNode,
    connectionError,
    clearConnectionError
  } = useGraphStore();
  
  // Selection handler with explicit typing
  const onSelectionChange = useCallback((params: { nodes: any[] }) => {
    if (params.nodes.length > 0) {
      setSelectedNode(params.nodes[0].id);
    } else {
      setSelectedNode(null);
    }
  }, [setSelectedNode]);
  
  return (
    <Box height="100%" flex="1" position="relative">
      {connectionError && (
        <Box
          position="absolute"
          top="20px"
          right="20px"
          zIndex={10}
          width="400px"
        >
          <Alert.Root status="error" variant="solid" borderRadius="md">
            <Alert.Indicator />
            <Box flex="1" p={3}>
              <Alert.Title>Connection Error</Alert.Title>
              <Alert.Description>{connectionError}</Alert.Description>
            </Box>
            <Box position="absolute" right="8px" top="8px">
              <button onClick={clearConnectionError}>×</button>
            </Box>
          </Alert.Root>
        </Box>
      )}
      
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'custom' }}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.2}
          maxZoom={4}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.selected) return '#ffffff';
              return '#555555';
            }}
            nodeColor={() => {
              return '#333333';
            }}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </ReactFlow>
        <SocketTypeLegend />
      </ReactFlowProvider>
    </Box>
  );
};

export default GraphEditor; 