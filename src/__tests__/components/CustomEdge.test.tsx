import { render } from '@testing-library/react';
import { EdgeProps, Position } from 'reactflow';
import CustomEdge from '../../components/CustomEdge';
import { SocketType } from '../../sockets/types';
import { useToken } from '@chakra-ui/react';

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
  useToken: jest.fn(),
}));

// Set up the mock return value for useToken
beforeEach(() => {
  (useToken as jest.Mock).mockReturnValue([
    '#ffd700', // boolean
    '#00bcd4', // number
    '#4caf50', // string
    '#ff5722', // flow
    '#9e9e9e', // any
    '#f44336', // error
    '#ffeb3b', // yellow
  ]);
});

describe('CustomEdge', () => {
  // Default props for testing
  const defaultProps: EdgeProps = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceX: 100,
    sourceY: 100,
    targetX: 200,
    targetY: 200,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      sourceSocketType: SocketType.NUMBER,
    },
  };

  test('renders with default props', () => {
    render(<CustomEdge {...defaultProps} />);
    
    // Check if the main path is rendered
    const path = document.querySelector('.react-flow__edge-path');
    expect(path).toBeInTheDocument();
    
    // Check if the path has the right color
    expect(path).toHaveAttribute('stroke', '#00bcd4');
  });

  test('renders with selected state', () => {
    render(
      <CustomEdge 
        {...defaultProps} 
        selected={true} 
      />
    );
    
    // Check if the main path has increased stroke width when selected
    const path = document.querySelector('.react-flow__edge-path');
    // The selected state changes the color, not the stroke width
    expect(path).toHaveAttribute('stroke', '#ffeb3b'); // yellow.400 color
  });

  test('renders with flow socket type', () => {
    render(
      <CustomEdge 
        {...defaultProps} 
        data={{ 
          sourceSocketType: SocketType.FLOW 
        }} 
      />
    );
    
    // Check if the path has the correct class and stroke color
    const path = document.querySelector('.react-flow__edge-path');
    expect(path).toHaveClass('edge-flow');
    expect(path).toHaveAttribute('stroke', '#ff5722');
    expect(path).toHaveAttribute('stroke-width', '5');
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
    expect(path).toHaveAttribute('stroke', '#00bcd4');
  });
}); 