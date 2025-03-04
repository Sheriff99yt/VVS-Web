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
    
    // Check if the animated flow path is rendered
    const flowPath = document.querySelector('.react-flow__edge-path-flow');
    expect(flowPath).toBeInTheDocument();
    
    // Check if the connection points are rendered
    const circles = document.querySelectorAll('circle');
    expect(circles.length).toBe(2);
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
    expect(text?.textContent).toBe('▶');
    
    // Check if the animation duration is set correctly
    const flowPath = document.querySelector('.react-flow__edge-path-flow');
    expect(flowPath).toHaveStyle('animation: flowAnimation 0.5s linear infinite');
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
    
    // Check if the animation duration is set correctly
    const flowPath = document.querySelector('.react-flow__edge-path-flow');
    expect(flowPath).toHaveStyle('animation: flowAnimation 1.2s linear infinite');
    
    // Check if the dash array is set correctly
    expect(flowPath).toHaveAttribute('stroke-dasharray', '4,4');
  });
}); 