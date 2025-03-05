import React, { useMemo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { useToken } from '@chakra-ui/react';
import { SocketType } from '../sockets/types';
import './EdgeStyles.css';

/**
 * Interface for edge data passed from the graph store
 */
interface CustomEdgeData {
  sourceSocketType?: SocketType;
  targetSocketType?: SocketType;
  isValid?: boolean;
}

/**
 * Configuration for edge styling by socket type
 */
interface EdgeStyleConfig {
  // No showLabel property needed anymore
}

/**
 * CustomEdge component for socket connections
 * Features:
 * - Color based on socket type
 * - No dashed styles or glow effects
 * - Flow edges are thicker
 * - No end markers
 * - No text labels
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
  // Extract edge data
  const edgeData = data as CustomEdgeData | undefined;
  const sourceSocketType = edgeData?.sourceSocketType || SocketType.ANY;
  const isValid = edgeData?.isValid !== false; // Default to true if not specified
  
  // Get all socket colors from theme
  const [
    booleanColor,
    numberColor,
    stringColor,
    flowColor,
    anyColor,
    errorColor,
    selectedColor,
  ] = useToken('colors', [
    'socket.boolean',
    'socket.number',
    'socket.string',
    'socket.flow',
    'socket.any',
    'socket.error',
    'yellow.400'
  ]);
  
  // Calculate the path for the edge
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  // No need for edgeStyleConfig anymore since we don't show labels
  
  // Generate CSS classes for the edge based on socket type and validity
  const edgeClasses = useMemo(() => {
    const classes = [`edge-${sourceSocketType.toLowerCase()}`];
    
    if (!isValid) {
      classes.push('edge-invalid');
    }
    
    return classes.join(' ');
  }, [sourceSocketType, isValid]);
  
  // Determine edge color based on socket type
  // Selected state is handled purely by CSS
  const edgeColor = useMemo(() => {
    if (!isValid) return errorColor;
    
    return getSocketColor(sourceSocketType, {
      booleanColor,
      numberColor,
      stringColor,
      flowColor,
      anyColor,
      errorColor
    });
  }, [sourceSocketType, isValid, booleanColor, numberColor, stringColor, flowColor, anyColor, errorColor]);
  
  // Determine base stroke width - flow edges are thicker in CSS
  const baseStrokeWidth = sourceSocketType === SocketType.FLOW ? 5 : (style.strokeWidth || 2.5);
  
  return (
    <>
      {/* Invisible wider path for easier selection */}
      <path
        d={edgePath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        style={{
          pointerEvents: 'stroke',
          cursor: 'pointer',
        }}
      />
      
      {/* The visible edge path with CSS classes for styling */}
      <path
        id={id}
        className={`react-flow__edge-path ${edgeClasses}`}
        d={edgePath}
        strokeWidth={baseStrokeWidth}
        stroke={selected ? selectedColor : edgeColor} // Use socket type color or yellow when selected
        style={{
          strokeLinecap: 'round',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

/**
 * Get socket color based on socket type
 */
interface ColorOptions {
  booleanColor: string;
  numberColor: string;
  stringColor: string;
  flowColor: string;
  anyColor: string;
  errorColor: string;
}

const getSocketColor = (type: SocketType, colors: ColorOptions): string => {
  switch (type) {
    case SocketType.BOOLEAN:
      return colors.booleanColor;
    case SocketType.NUMBER:
      return colors.numberColor;
    case SocketType.STRING:
      return colors.stringColor;
    case SocketType.FLOW:
      return colors.flowColor;
    case SocketType.ANY:
    default:
      return colors.anyColor;
  }
};

/**
 * Get edge styling configuration based on socket type
 * We no longer need this, but keeping a simpler version for consistency
 */
const getEdgeStyleBySocketType = (type: SocketType): EdgeStyleConfig => {
  // Empty configuration since we don't need any special styling based on type anymore
  return {};
};

export default CustomEdge; 