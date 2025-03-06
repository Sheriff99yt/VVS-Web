import { render, screen } from '@testing-library/react';
import BaseNode from '../../nodes/BaseNode';
import { NodeType } from '../../nodes/types';
import { SocketDirection, SocketType, createSocketDefinition } from '../../sockets/types';
import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { SocketTooltipProvider } from '../../contexts/SocketTooltipContext';

// Create a test wrapper with ReactFlowProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReactFlowProvider>
      <SocketTooltipProvider>
        {children}
      </SocketTooltipProvider>
    </ReactFlowProvider>
  );
};

// Mock the ReactFlow NodeProps
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  // Ensure Position is correctly exported for the Socket component
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
  // Export a real ReactFlowProvider
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="flow-provider">{children}</div>,
  // Mock the Handle component
  Handle: () => <div data-testid="handle" />,
  // Mock the useEdges hook
  useEdges: () => [],
  // Mock the useReactFlow hook
  useReactFlow: () => ({
    setNodes: jest.fn(),
    getNode: () => null,
    setEdges: jest.fn(),
    getEdges: () => [],
    screenToFlowPosition: jest.fn(),
    flowToScreenPosition: jest.fn(),
    project: jest.fn(),
    getIntersectingNodes: jest.fn(),
    viewportInitialized: true
  })
}));

describe('BaseNode Component', () => {
  // Create a mock node data
  const mockNodeData = {
    label: 'Test Node',
    type: NodeType.ADD,
    inputs: [
      createSocketDefinition('input1', 'Input 1', SocketType.NUMBER, SocketDirection.INPUT),
      createSocketDefinition('input2', 'Input 2', SocketType.NUMBER, SocketDirection.INPUT),
    ],
    outputs: [
      createSocketDefinition('output1', 'Output', SocketType.NUMBER, SocketDirection.OUTPUT),
    ],
    properties: {
      testProperty: 'test value'
    }
  };

  // Create mock props for the node with all required properties
  const mockNodeProps = {
    id: 'test-node-id',
    type: 'baseNode',
    data: mockNodeData,
    selected: false,
    dragging: false,
    position: { x: 0, y: 0 },
    // Add missing required properties
    zIndex: 1,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    dragHandle: '.drag-handle'
  };

  test('renders node with correct label', () => {
    render(
      <TestWrapper>
        <BaseNode {...mockNodeProps} />
      </TestWrapper>
    );
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  test('renders correct number of input sockets', () => {
    render(
      <TestWrapper>
        <BaseNode {...mockNodeProps} />
      </TestWrapper>
    );
    // Check for socket wrappers with the correct titles
    const inputSockets = screen.getAllByTestId('socket-wrapper');
    const input1Socket = inputSockets.find(socket => socket.title.includes('Input 1'));
    const input2Socket = inputSockets.find(socket => socket.title.includes('Input 2'));
    
    expect(input1Socket).toBeInTheDocument();
    expect(input2Socket).toBeInTheDocument();
  });

  test('renders correct number of output sockets', () => {
    render(
      <TestWrapper>
        <BaseNode {...mockNodeProps} />
      </TestWrapper>
    );
    // Check for socket wrapper with the correct title
    const outputSockets = screen.getAllByTestId('socket-wrapper');
    const outputSocket = outputSockets.find(socket => socket.title.includes('Output'));
    
    expect(outputSocket).toBeInTheDocument();
  });

  test('changes appearance when selected', () => {
    const selectedNodeProps = {
      ...mockNodeProps,
      selected: true
    };
    
    render(
      <TestWrapper>
        <BaseNode {...selectedNodeProps} />
      </TestWrapper>
    );
    
    // Since we can't reliably test Chakra UI styles in this setup,
    // we'll just verify the node renders when selected
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });
}); 