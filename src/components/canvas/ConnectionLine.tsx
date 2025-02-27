import React from 'react';
import { Connection } from '../../types/node';

interface ConnectionLineProps {
  connection: Connection;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  isSelected?: boolean;
  onSelect?: (connectionId: string) => void;
  onDelete?: (connectionId: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourcePosition,
  targetPosition,
  isSelected = false,
  onSelect,
  onDelete
}) => {
  // Calculate control points for the bezier curve
  const dx = targetPosition.x - sourcePosition.x;
  const offsetX = Math.abs(dx) * 0.5;

  const path = `M ${sourcePosition.x} ${sourcePosition.y}
                C ${sourcePosition.x + offsetX} ${sourcePosition.y},
                  ${targetPosition.x - offsetX} ${targetPosition.y},
                  ${targetPosition.x} ${targetPosition.y}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(connection.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(connection.id);
  };

  return (
    <g>
      <path
        d={path}
        stroke={isSelected ? '#2196f3' : '#999'}
        strokeWidth={isSelected ? 2 : 1}
        fill="none"
        className="connection-line"
        style={{ pointerEvents: 'stroke' }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      {isSelected && (
        <path
          d={path}
          stroke="transparent"
          strokeWidth={10}
          fill="none"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />
      )}
    </g>
  );
};

export default ConnectionLine; 