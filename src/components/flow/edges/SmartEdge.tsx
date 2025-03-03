/**
 * SmartEdge
 * 
 * A custom edge component for ReactFlow that provides improved routing,
 * visual feedback, and better interactivity.
 */

import React, { useMemo, useState, FC } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, getStraightPath, getSimpleBezierPath } from 'reactflow';
import { EdgeType } from '../../../models/flow';
import './SmartEdge.css';

export interface SmartEdgeProps extends EdgeProps {
  data?: {
    type?: EdgeType;
    label?: string;
    isValid?: boolean;
    animated?: boolean;
  };
}

const SmartEdge: FC<SmartEdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if edge is execution or data type
  const isExecution = data?.type === EdgeType.EXECUTION;
  
  // Determine edge validity state
  const isValid = data?.isValid !== undefined ? data.isValid : true;
  
  // Calculate path based on edge type
  const [edgePath, labelX, labelY] = useMemo(() => {
    // Determine minimum distance for smart routing
    const xDistance = Math.abs(targetX - sourceX);
    const horizontalDistance = 50;
    
    // For execution flows, use simpler routing
    if (isExecution) {
      return getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
    }
    
    // For short distances, use a straight path
    if (xDistance < horizontalDistance) {
      return getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
    }
    
    // For medium distances, use simple bezier
    if (xDistance < horizontalDistance * 2) {
      return getSimpleBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
    }
    
    // For long distances, use a more complex bezier path
    return getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, isExecution]);
  
  // Calculate edge styles
  const edgeClasses = [
    'smart-edge',
    isExecution ? 'execution-edge' : 'data-edge',
    selected ? 'selected' : '',
    isHovered ? 'hovered' : '',
    isValid ? 'valid' : 'invalid',
    data?.animated ? 'animated' : '',
  ].filter(Boolean).join(' ');
  
  // Handle edge hover
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  return (
    <>
      <path
        id={id}
        className={edgeClasses}
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Display label if provided */}
      {data?.label && (isHovered || selected) && (
        <EdgeLabelRenderer>
          <div
            className="smart-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Show invalid connection warning */}
      {!isValid && (isHovered || selected) && (
        <EdgeLabelRenderer>
          <div
            className="smart-edge-warning"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            title="This connection may have type compatibility issues"
          >
            ⚠️
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default SmartEdge; 