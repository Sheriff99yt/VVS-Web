import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  NodeChange,
  EdgeChange,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { isEqual } from 'lodash';

// Import our custom node registry
import { nodeTypes } from './NodeCanvasRegistry';

// Import our custom node definitions
import { FunctionNodeData } from './nodes/FunctionNode';
import './nodes/FunctionNode.css';

// Import custom edges
import ExecutionEdge from './edges/ExecutionEdge';

// Import type validation utility
import { isValidConnection } from '../../utils/edgeValidation';

// Define custom edge types
const edgeTypes = {
  executionEdge: ExecutionEdge
};

// Simple debounce function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// Check if a connection is for execution flow
const isExecutionConnection = (connection: Connection): boolean => {
  return !!(
    connection.sourceHandle?.startsWith('exec-') || 
    connection.targetHandle?.startsWith('exec-')
  );
};

interface NodeCanvasProps {
  initialNodes?: Node<FunctionNodeData>[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node<FunctionNodeData>[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onInit?: (instance: ReactFlowInstance) => void;
}

const NodeCanvasComponent: React.FC<NodeCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
  onInit: externalOnInit
}) => {
  // Reference to the React Flow instance
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Track previous nodes to prevent unnecessary renders
  const prevNodesRef = useRef<Node<FunctionNodeData>[]>([]);
  
  // Sync with initialNodes prop changes - with deep comparison to prevent loop
  useEffect(() => {
    // Only update if initialNodes are different from current nodes
    const nodesChanged = initialNodes.length !== prevNodesRef.current.length || 
      initialNodes.some((node, i) => !isEqual(node, prevNodesRef.current[i]));
    
    if (nodesChanged && initialNodes.length > 0) {
      console.log('Updating nodes with new initialNodes');
      setNodes(initialNodes);
      // Update reference
      prevNodesRef.current = [...initialNodes];
    }
  }, [initialNodes]); // Intentionally remove setNodes from dependencies

  // Create a debounced version of fitView to avoid excessive calls
  const debouncedFitView = useCallback(
    debounce(() => {
      if (reactFlowInstance) {
        console.log('Fitting view after resize');
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 200),
    [reactFlowInstance]
  );

  // Add resize listener with cleanup
  useEffect(() => {
    window.addEventListener('resize', debouncedFitView);
    return () => {
      window.removeEventListener('resize', debouncedFitView);
    };
  }, [debouncedFitView]);

  // Handle when nodes are connected
  const onConnect = useCallback(
    (params: Connection) => {
      // Check if this is an execution connection
      const isExecution = isExecutionConnection(params);
      
      // Only add edge if connection is valid
      if (isValidConnection(params, nodes, edges)) {
        // Add edge with appropriate edge type
        const newEdge = {
          ...params,
          type: isExecution ? 'executionEdge' : 'default',
          data: { isExecutionFlow: isExecution }
        };
        
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [setEdges, nodes, edges]
  );
  
  // Set the React Flow instance when it's initialized
  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      console.log('ReactFlow initialized');
      setReactFlowInstance(instance);
      
      // Delay the initial fit view to allow proper rendering
      setTimeout(() => {
        instance.fitView({ padding: 0.2 });
      }, 100);
      
      if (externalOnInit) {
        externalOnInit(instance);
      }
    },
    [externalOnInit]
  );
  
  // Handler for when nodes change
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply the changes internally
      onNodesChange(changes);
      
      // Notify parent component if callback exists
      if (externalNodesChange) {
        // Use a timeout to break the potential circular update
        setTimeout(() => {
          externalNodesChange([...nodes]);
        }, 0);
      }
    },
    [nodes, externalNodesChange, onNodesChange]
  );
  
  // Handler for when edges change
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Apply the changes internally first
      onEdgesChange(changes);
      
      // Notify parent component if callback exists
      if (externalEdgesChange) {
        // Use a timeout to break the potential circular update
        setTimeout(() => {
          externalEdgesChange([...edges]);
        }, 0);
      }
    },
    [edges, externalEdgesChange, onEdgesChange]
  );
  
  // Validate connections before connecting
  const validateConnection = useCallback(
    (connection: Connection) => {
      return isValidConnection(connection, nodes, edges);
    },
    [nodes, edges]
  );
  
  // Update the onPaneClick event handler to close any open context menus
  const onPaneClick = useCallback(() => {
    // Force-close any open context menus by triggering a custom event
    const closeContextMenuEvent = new CustomEvent('closeContextMenus');
    document.dispatchEvent(closeContextMenuEvent);
  }, []);

  return (
    <div 
      className="node-canvas-wrapper" 
      ref={reactFlowWrapper} 
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden', // Prevent scrollbars which can trigger resize
        position: 'relative' // Ensure proper positioning
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Strict}
        snapToGrid={true}
        snapGrid={[15, 15]}
        isValidConnection={validateConnection}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.5}
        maxZoom={2}
        onlyRenderVisibleElements={true}
        deleteKeyCode={['Backspace', 'Delete']}
        onPaneClick={onPaneClick}
      >
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  );
};

// Wrap the component with ReactFlowProvider to ensure context is available
export const NodeCanvas: React.FC<NodeCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NodeCanvasComponent {...props} />
    </ReactFlowProvider>
  );
};

export default NodeCanvas; 