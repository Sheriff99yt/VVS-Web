import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import { BaseNodeData } from '../nodes/types';
import { areSocketsCompatible, SocketType } from '../sockets/types';

/**
 * Interface for the graph store
 */
interface GraphState {
  nodes: Node<BaseNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  generatedCode: string;
  connectionError: string | null;
  
  // Methods for updating the graph
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node<BaseNodeData>) => void;
  updateGeneratedCode: (code: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateNodeProperty: (nodeId: string, propertyKey: string, value: any) => void;
  clearConnectionError: () => void;
}

/**
 * Graph store using Zustand
 * Manages the state of the graph editor
 */
const useGraphStore = create<GraphState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNodeId: null,
  generatedCode: '',
  connectionError: null,
  
  // Node changes handler
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<BaseNodeData>[],
    });
  },
  
  // Edge changes handler
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  // Connection handler with socket validation and error handling
  onConnect: (connection: Connection) => {
    // Find the source and target nodes
    const sourceNode = get().nodes.find(node => node.id === connection.source);
    const targetNode = get().nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      set({ connectionError: 'Source or target node not found' });
      return;
    }
    
    // Find the source and target sockets
    const sourceSocket = sourceNode.data.outputs.find(
      output => output.id === connection.sourceHandle
    );
    const targetSocket = targetNode.data.inputs.find(
      input => input.id === connection.targetHandle
    );
    
    // Check if sockets exist
    if (!sourceSocket || !targetSocket) {
      set({ connectionError: 'Source or target socket not found' });
      return;
    }
    
    // Check if sockets are compatible
    if (!areSocketsCompatible(sourceSocket, targetSocket)) {
      // Create a more specific error message based on the incompatibility
      let errorMessage = 'Incompatible connection: ';
      
      if (sourceSocket.direction === targetSocket.direction) {
        errorMessage += `Cannot connect ${sourceSocket.direction} to ${targetSocket.direction}`;
      } else if (sourceSocket.type !== targetSocket.type && 
                sourceSocket.type !== SocketType.ANY && 
                targetSocket.type !== SocketType.ANY) {
        errorMessage += `Type mismatch: ${sourceSocket.type} cannot connect to ${targetSocket.type}`;
      } else {
        errorMessage += 'Unknown compatibility issue';
      }
      
      set({ connectionError: errorMessage });
      return;
    }
    
    // If we get here, the connection is valid
    set({
      edges: addEdge({
        ...connection,
        // Use custom edge type
        type: 'custom',
        // Add some styling to the edge based on the socket type
        style: { 
          stroke: `var(--chakra-colors-socket-${sourceSocket.type})`,
          strokeWidth: 2 
        },
        // Add socket type data to the edge for potential use in the custom edge
        data: {
          sourceSocketType: sourceSocket.type,
          targetSocketType: targetSocket.type
        }
      }, get().edges),
      // Clear any previous error
      connectionError: null
    });
  },
  
  // Add a new node to the graph
  addNode: (node: Node<BaseNodeData>) => {
    set({
      nodes: [...get().nodes, node],
    });
  },
  
  // Update the generated code
  updateGeneratedCode: (code: string) => {
    set({
      generatedCode: code,
    });
  },
  
  // Set the selected node
  setSelectedNode: (nodeId: string | null) => {
    set({
      selectedNodeId: nodeId,
    });
  },
  
  // Update a specific property of a node
  updateNodeProperty: (nodeId: string, propertyKey: string, value: any) => {
    set({
      nodes: get().nodes.map(node => {
        if (node.id === nodeId) {
          // Create a new node with the updated property
          return {
            ...node,
            data: {
              ...node.data,
              properties: {
                ...node.data.properties,
                [propertyKey]: value
              }
            }
          };
        }
        return node;
      })
    });
  },
  
  // Clear the connection error
  clearConnectionError: () => {
    set({ connectionError: null });
  },
}));

export default useGraphStore; 