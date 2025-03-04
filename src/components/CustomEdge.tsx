import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { SocketType } from '../sockets/types';

interface CustomEdgeData {
  sourceSocketType: SocketType;
  targetSocketType: SocketType;
}

/**
 * CustomEdge component for enhanced visual representation of connections
 * Provides animated flow and better visual feedback for connections
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
  const stroke = style.stroke || 'var(--chakra-colors-socket-any)';
  
  return (
    <>
      {/* Main path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
      />
      
      {/* Animated flow effect */}
      <path
        id={`${id}-flow`}
        className="react-flow__edge-path-flow"
        d={edgePath}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={dashArray}
        style={{
          animation: `flowAnimation ${animationDuration} linear infinite`,
          opacity: 0.6,
        }}
      />
      
      {/* Add a small dot at the connection points for better visibility */}
      <circle cx={sourceX} cy={sourceY} r={4} fill={stroke} />
      <circle cx={targetX} cy={targetY} r={4} fill={stroke} />
      
      {/* Add a label for the connection type if needed */}
      {socketType === SocketType.FLOW && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '10px',
            fill: stroke,
            pointerEvents: 'none',
          }}
        >
          ▶
        </text>
      )}
    </>
  );
};

export default CustomEdge; 