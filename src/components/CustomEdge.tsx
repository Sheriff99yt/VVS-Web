import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { useToken } from '@chakra-ui/react';
import { SocketType } from '../sockets/types';

/**
 * Custom edge data interface
 */
interface CustomEdgeData {
  sourceSocketType?: SocketType;
  isValid?: boolean;
}

/**
 * CustomEdge component for enhanced visual representation of connections
 * Provides animated flow and better visual feedback for connections
 * Uses socket type based coloring for visual clarity
 */
export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  // Calculate the path for the edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get the socket type data
  const edgeData = data as CustomEdgeData | undefined;
  const socketType = edgeData?.sourceSocketType || SocketType.ANY;
  const isValid = edgeData?.isValid !== false; // Default to true if not specified
  
  // Get all socket colors from theme using the global mock
  const [
    booleanColor,
    numberColor,
    stringColor,
    flowColor,
    anyColor,
    errorColor
  ] = useToken('colors', [
    'socket.boolean',
    'socket.number',
    'socket.string',
    'socket.flow',
    'socket.any',
    'socket.error'
  ]);
  
  // Get the socket color based on type
  const getSocketColor = (type: SocketType): string => {
    if (!isValid) {
      return errorColor;
    }
    
    switch (type) {
      case SocketType.BOOLEAN:
        return booleanColor;
      case SocketType.NUMBER:
        return numberColor;
      case SocketType.STRING:
        return stringColor;
      case SocketType.FLOW:
        return flowColor;
      case SocketType.ANY:
      default:
        return anyColor;
    }
  };
  
  // Get the color for the edge
  const strokeColor = getSocketColor(socketType);
  
  // Determine animation speed based on socket type
  let animationDuration = '1s';
  let dashArray = '5,5';
  
  // Customize animation based on socket type
  switch (socketType) {
    case SocketType.FLOW:
      animationDuration = '0.5s'; // Faster for flow connections
      dashArray = '5,3';
      break;
    case SocketType.NUMBER:
      animationDuration = '1.2s';
      dashArray = '4,4';
      break;
    case SocketType.BOOLEAN:
      animationDuration = '0.8s';
      dashArray = '2,4';
      break;
    case SocketType.STRING:
      animationDuration = '1.5s';
      dashArray = '8,4';
      break;
    default:
      animationDuration = '1s';
      dashArray = '5,5';
  }

  // Determine if the edge is selected
  const strokeWidth = selected ? 3 : style.strokeWidth || 2;
  
  // Add glow effect for selected edges
  const glowEffect = selected 
    ? `0 0 6px ${strokeColor}` 
    : 'none';
  
  // Create a unique ID for the marker
  const markerId = `edge-marker-${id}`;

  return (
    <>
      {/* Define the marker for the edge */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <circle cx="5" cy="5" r="4" fill={strokeColor} />
        </marker>
      </defs>
      
      {/* Render the edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={strokeWidth}
        stroke={strokeColor}
        strokeDasharray={socketType === SocketType.FLOW ? dashArray : undefined}
        style={{
          animation: socketType === SocketType.FLOW 
            ? `flowAnimation ${animationDuration} linear infinite` 
            : undefined,
          filter: `drop-shadow(${glowEffect})`,
        }}
        markerEnd={`url(#${markerId})`}
      />
      
      {/* Add a label for flow edges */}
      {socketType === SocketType.FLOW && (
        <text
          x={labelX}
          y={labelY}
          fill={strokeColor}
          dominantBaseline="middle"
          textAnchor="middle"
          style={{
            fontSize: '8px',
            fontWeight: 'bold',
            pointerEvents: 'none',
          }}
        >
          FLOW
        </text>
      )}
    </>
  );
};

export default CustomEdge; 