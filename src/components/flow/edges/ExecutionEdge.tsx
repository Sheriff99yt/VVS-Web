import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath, getStraightPath } from 'reactflow';
import './ExecutionEdge.css';

interface ExecutionEdgeData {
  isExecutionFlow: boolean;
}

const ExecutionEdge: React.FC<EdgeProps<ExecutionEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  // Determine if this is a horizontal flow (left to right)
  const isHorizontalFlow = 
    (sourcePosition === 'right' && targetPosition === 'left') ||
    (Math.abs(sourceY - targetY) < Math.abs(sourceX - targetX));
  
  // Use straight path for horizontal execution flow, bezier for others
  const [edgePath, labelX, labelY] = isHorizontalFlow 
    ? getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  return (
    <>
      <path
        id={id}
        className={`execution-edge-path ${isHorizontalFlow ? 'horizontal' : 'vertical'}`}
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: isHorizontalFlow ? '8,2' : '5,2',
          stroke: '#ff7700',
          strokeWidth: isHorizontalFlow ? 2.5 : 2,
        }}
      />
      {isHorizontalFlow && (
        <path
          d={edgePath}
          className="execution-edge-glow"
          style={{
            stroke: 'rgba(255, 119, 0, 0.2)',
            strokeWidth: 6,
            filter: 'blur(3px)',
          }}
        />
      )}
    </>
  );
};

export default ExecutionEdge; 