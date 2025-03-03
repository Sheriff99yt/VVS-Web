/**
 * ValidationAwareEdge
 * 
 * A custom edge component for ReactFlow that shows validation status
 * for connections between nodes. It renders edges with colors and styles
 * based on their validation status.
 */

import React, { FC, memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { ConnectionValidationService } from '../../../services/validation/ConnectionValidationService';
import { EdgeType } from '../../../models/flow';
import './ValidationAwareEdge.css';

interface ValidationAwareEdgeProps extends EdgeProps {
  validationService?: ConnectionValidationService;
}

const ValidationAwareEdge: FC<ValidationAwareEdgeProps> = ({ 
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
  validationService,
}) => {
  // Get validation status if service is provided
  const validationResult = validationService?.getValidationResultForEdge(id);
  
  // Default style
  let edgeStyle: React.CSSProperties = {
    ...style,
  };
  
  // Edge type class
  const edgeTypeClass = data?.type === EdgeType.EXECUTION ? 'execution-edge' : 'data-edge';
  
  // If validation service is provided, get edge style
  if (validationService) {
    edgeStyle = {
      ...edgeStyle,
      ...validationService.getEdgeStyle({ id, source, target, data }),
    };
  }
  
  // Calculate path
  const [edgePath, labelX, labelY] = getBezierPath({
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
        className={`react-flow__edge-path ${edgeTypeClass} ${validationResult?.severity || ''}`}
        d={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      
      {/* Show validation message for invalid connections */}
      {validationResult && validationResult.severity !== 'none' && (
        <EdgeLabelRenderer>
          <div
            className={`edge-validation-label ${validationResult.severity}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            title={validationResult.message}
          >
            {validationResult.severity === 'error' ? '⚠️' : '⚠'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(ValidationAwareEdge); 