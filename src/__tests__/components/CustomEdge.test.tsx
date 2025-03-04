import { render } from '@testing-library/react';
import CustomEdge from '../../components/CustomEdge';
import { SocketType } from '../../sockets/types';
import { Position } from 'reactflow';

// Mock the getBezierPath function
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  getBezierPath: jest.fn(() => ['M0,0 C50,0 50,100 100,100', 50, 50]),
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
}));

// Mock the useToken hook
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToken: jest.fn(() => {
    return [
      '#2B6CB0', // boolean
      '#DD6B20', // number
      '#805AD5', // string
      '#38A169', // flow
      '#718096', // any
      '#E53E3E', // error
    ];
  }),
}));

describe('CustomEdge', () => {
  const defaultProps = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceX: 100,
    sourceY: 100,
    targetX: 200,
    targetY: 200,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { stroke: '#ff0000', strokeWidth: 2 },
    selected: false,
  };

  test('renders with default props', () => {
    render(<CustomEdge {...defaultProps} />);
    
    // Check if the main path is rendered
    const path = document.querySelector('.react-flow__edge-path');
    expect(path).toBeInTheDocument();
    
    // Check if the marker is defined
    const marker = document.querySelector('marker');
    expect(marker).toBeInTheDocument();
    
    // Check if the connection points are rendered
    const circles = document.querySelectorAll('circle');
    expect(circles.length).toBe(1);
  });

  test('renders with selected state', () => {
    render(<CustomEdge {...defaultProps} selected={true} />);
    
    // Check if the main path has increased stroke width when selected
    const path = document.querySelector('.react-flow__edge-path');
    expect(path).toHaveAttribute('stroke-width', '3');
  });

  test('renders with flow socket type', () => {
    render(
      <CustomEdge 
        {...defaultProps} 
        data={{ 
          sourceSocketType: SocketType.FLOW,
          targetSocketType: SocketType.FLOW
        }} 
      />
    );
    
    // Check if the flow indicator is rendered
    const text = document.querySelector('text');
    expect(text).toBeInTheDocument();
    expect(text?.textContent).toBe('FLOW');
    
    // Check if the path has the correct stroke color
    const path = document.querySelector('.react-flow__edge-path');
    expect(path).toHaveAttribute('stroke', '#38A169');
  });

  test('renders with number socket type', () => {
    render(
      <CustomEdge 
        {...defaultProps} 
        data={{ 
          sourceSocketType: SocketType.NUMBER,
          targetSocketType: SocketType.NUMBER
        }} 
      />
    );
    
    // Check if the path has the correct stroke color
    const path = document.querySelector('.react-flow__edge-path');
    expect(path).toHaveAttribute('stroke', '#DD6B20');
  });
}); 