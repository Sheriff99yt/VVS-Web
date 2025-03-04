import { act } from '@testing-library/react';
import useGraphStore from '../../store/useGraphStore';
import { NodeType } from '../../nodes/types';
import { SocketDirection, SocketType, createSocketDefinition } from '../../sockets/types';
import { Node, Edge, NodeChange, EdgeChange, Connection, NodeRemoveChange, EdgeRemoveChange } from 'reactflow';

// Mock reactflow
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  applyNodeChanges: jest.fn((changes: NodeChange[], nodes: Node[]) => {
    // Simple mock implementation to add/remove nodes
    if (changes[0]?.type === 'remove') {
      const removeChange = changes[0] as NodeRemoveChange;
      return nodes.filter(node => node.id !== removeChange.id);
    }
    return nodes;
  }),
  applyEdgeChanges: jest.fn((changes: EdgeChange[], edges: Edge[]) => {
    // Simple mock implementation to add/remove edges
    if (changes[0]?.type === 'remove') {
      const removeChange = changes[0] as EdgeRemoveChange;
      return edges.filter(edge => edge.id !== removeChange.id);
    }
    return edges;
  }),
  addEdge: jest.fn((params: Connection, edges: Edge[]) => {
    return [...edges, { id: 'e1-2', ...params }];
  }),
}));

describe('useGraphStore', () => {
  // Reset the store before each test
  beforeEach(() => {
    act(() => {
      useGraphStore.setState({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        generatedCode: '',
      });
    });
  });

  test('initial state is empty', () => {
    const state = useGraphStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.selectedNodeId).toBeNull();
    expect(state.generatedCode).toBe('');
  });

  test('addNode adds a node to the store', () => {
    const mockNode = {
      id: 'test-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        type: NodeType.ADD,
        inputs: [
          createSocketDefinition('input1', 'Input 1', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('output1', 'Output', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
      },
    };

    act(() => {
      useGraphStore.getState().addNode(mockNode);
    });

    const state = useGraphStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]).toEqual(mockNode);
  });

  test('setSelectedNode updates the selected node ID', () => {
    act(() => {
      useGraphStore.getState().setSelectedNode('test-node');
    });

    const state = useGraphStore.getState();
    expect(state.selectedNodeId).toBe('test-node');
  });

  test('updateGeneratedCode updates the generated code', () => {
    const testCode = 'print("Hello World")';
    
    act(() => {
      useGraphStore.getState().updateGeneratedCode(testCode);
    });

    const state = useGraphStore.getState();
    expect(state.generatedCode).toBe(testCode);
  });

  test('onNodesChange removes nodes correctly', () => {
    const mockNode = {
      id: 'test-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        type: NodeType.ADD,
        inputs: [],
        outputs: [],
      },
    };

    act(() => {
      useGraphStore.getState().addNode(mockNode);
    });

    act(() => {
      useGraphStore.getState().onNodesChange([
        { id: 'test-node', type: 'remove' } as NodeRemoveChange
      ]);
    });

    const state = useGraphStore.getState();
    expect(state.nodes).toHaveLength(0);
  });

  test('onConnect creates valid connections between compatible sockets', () => {
    // Add source node
    const sourceNode = {
      id: 'source-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Source',
        type: NodeType.ADD,
        inputs: [],
        outputs: [
          createSocketDefinition('output1', 'Output', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
      },
    };

    // Add target node
    const targetNode = {
      id: 'target-node',
      type: 'baseNode',
      position: { x: 300, y: 100 },
      data: {
        label: 'Target',
        type: NodeType.ADD,
        inputs: [
          createSocketDefinition('input1', 'Input', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [],
      },
    };

    act(() => {
      useGraphStore.getState().addNode(sourceNode);
      useGraphStore.getState().addNode(targetNode);
    });

    // Create a connection
    act(() => {
      useGraphStore.getState().onConnect({
        source: 'source-node',
        target: 'target-node',
        sourceHandle: 'output1',
        targetHandle: 'input1',
      });
    });

    const state = useGraphStore.getState();
    expect(state.edges).toHaveLength(1);
    expect(state.edges[0].source).toBe('source-node');
    expect(state.edges[0].target).toBe('target-node');
  });
  
  test('updateNodeProperty updates a specific property of a node', () => {
    // Add a node with properties
    const mockNode = {
      id: 'test-node',
      type: 'baseNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        type: NodeType.VARIABLE_DEFINITION,
        inputs: [],
        outputs: [],
        properties: {
          name: 'counter',
          value: '0'
        }
      },
    };

    act(() => {
      useGraphStore.getState().addNode(mockNode);
    });

    // Update the 'value' property
    act(() => {
      useGraphStore.getState().updateNodeProperty('test-node', 'value', '42');
    });

    const state = useGraphStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].data.properties?.value).toBe('42');
    expect(state.nodes[0].data.properties?.name).toBe('counter'); // Other properties should remain unchanged
  });
}); 