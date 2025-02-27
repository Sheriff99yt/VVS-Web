import React from 'react';
import './NodeConnection.css';

interface NodeConnectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isCreating?: boolean;
}

const NodeConnection: React.FC<NodeConnectionProps> = ({
  startX,
  startY,
  endX,
  endY,
  isCreating = false
}) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const controlPointOffset = Math.min(Math.abs(dx), 150);

  const path = `M ${startX} ${startY} 
                C ${startX + controlPointOffset} ${startY},
                  ${endX - controlPointOffset} ${endY},
                  ${endX} ${endY}`;

  return (
    <svg
      className={`node-connection ${isCreating ? 'creating' : ''}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <path
        d={path}
        fill="none"
        stroke={isCreating ? '#6d6d6d' : '#4d4d4d'}
        strokeWidth="2"
        strokeDasharray={isCreating ? '5,5' : 'none'}
      />
    </svg>
  );
};

export default NodeConnection; 