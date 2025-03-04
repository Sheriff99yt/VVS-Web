import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock Chakra UI components
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  return {
    __esModule: true,
    ...originalModule,
    Box: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <div data-testid="box" {...props}>{children}</div>,
    Text: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <p data-testid="text" {...props}>{children}</p>,
    Heading: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <h3 data-testid="heading" {...props}>{children}</h3>,
    Button: ({ children, onClick, ...props }: { children?: React.ReactNode, onClick?: (event: React.MouseEvent) => void, [key: string]: any }) => (
      <button data-testid="button" onClick={onClick} {...props}>{children}</button>
    )
  };
});

import { NodeLibrary } from '../../components/NodeLibrary';
import { NODE_CATEGORIES } from '../../nodes/types';

// Mock the useGraphStore hook
const mockAddNode = jest.fn();

// This is the key fix - we need to mock the selector function that useGraphStore uses
jest.mock('../../store/useGraphStore', () => ({
  __esModule: true,
  default: jest.fn((selector) => {
    // When the component calls useGraphStore with a selector function that extracts addNode,
    // we return our mockAddNode function
    if (selector && typeof selector === 'function') {
      const mockState = { addNode: mockAddNode };
      return selector(mockState);
    }
    return { addNode: mockAddNode };
  })
}));

describe('NodeLibrary Component Tests', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    mockAddNode.mockClear();
  });

  test('renders the NodeLibrary component with title', () => {
    render(<NodeLibrary />);
    
    // Check if the title is rendered
    expect(screen.getByText('Node Library')).toBeInTheDocument();
  });

  test('renders all node categories', () => {
    render(<NodeLibrary />);
    
    // Check if all categories are rendered
    NODE_CATEGORIES.forEach(category => {
      expect(screen.getByText(category.label)).toBeInTheDocument();
    });
  });

  test('renders node buttons for each category', () => {
    render(<NodeLibrary />);
    
    // Check if node buttons are rendered for each category
    // We'll check one node from each category as an example
    expect(screen.getByText('Add')).toBeInTheDocument(); // Math category
    expect(screen.getByText('If Statement')).toBeInTheDocument(); // Control Flow category
  });

  test('clicking a node button calls addNode with correct data', () => {
    render(<NodeLibrary />);
    
    // Click on the "Add" node button
    fireEvent.click(screen.getByText('Add'));
    
    // Check if addNode was called with the correct data
    expect(mockAddNode).toHaveBeenCalledTimes(1);
    
    // Verify the node data structure
    const nodeData = mockAddNode.mock.calls[0][0];
    expect(nodeData).toHaveProperty('type', 'baseNode');
    expect(nodeData).toHaveProperty('position');
    expect(nodeData).toHaveProperty('data');
    
    // Verify the node data contains the correct node type
    expect(nodeData.data).toHaveProperty('type', 'add');
    expect(nodeData.data).toHaveProperty('label', 'Add');
    
    // Verify inputs and outputs
    expect(nodeData.data.inputs).toContainEqual(
      expect.objectContaining({ id: 'a', type: 'number', name: 'A' })
    );
    expect(nodeData.data.inputs).toContainEqual(
      expect.objectContaining({ id: 'b', type: 'number', name: 'B' })
    );
    expect(nodeData.data.outputs).toContainEqual(
      expect.objectContaining({ id: 'result', type: 'number', name: 'Result' })
    );
  });

  test('clicking a different node button calls addNode with different data', () => {
    render(<NodeLibrary />);
    
    // Click on the "If Statement" node button
    fireEvent.click(screen.getByText('If Statement'));
    
    // Check if addNode was called with the correct data
    expect(mockAddNode).toHaveBeenCalledTimes(1);
    
    // Verify the node data structure
    const nodeData = mockAddNode.mock.calls[0][0];
    expect(nodeData).toHaveProperty('type', 'baseNode');
    expect(nodeData).toHaveProperty('position');
    expect(nodeData).toHaveProperty('data');
    
    // Verify the node data contains the correct node type
    expect(nodeData.data).toHaveProperty('type', 'if_statement');
    expect(nodeData.data).toHaveProperty('label', 'If Statement');
    
    // Verify inputs and outputs for if statement
    expect(nodeData.data.inputs).toContainEqual(
      expect.objectContaining({ id: 'condition', type: 'boolean', name: 'Condition' })
    );
    expect(nodeData.data.outputs).toContainEqual(
      expect.objectContaining({ id: 'true_flow', type: 'flow', name: 'True' })
    );
    expect(nodeData.data.outputs).toContainEqual(
      expect.objectContaining({ id: 'false_flow', type: 'flow', name: 'False' })
    );
  });
}); 