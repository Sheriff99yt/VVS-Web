import React, { memo } from 'react';
import { Position, Handle } from 'reactflow';
import './ExecutionPort.css';

interface ExecutionPortProps {
  id: string;
  name: string;
  type: 'input' | 'output';
  position?: Position;
  isHorizontal?: boolean;
}

const ExecutionPort = memo(({ 
  id, 
  name, 
  type, 
  position = Position.Top,
  isHorizontal = false
}: ExecutionPortProps) => {
  // For horizontal layout, input pins go on the left, output pins on the right
  const horizontalPosition = type === 'input' ? Position.Left : Position.Right;
  
  // Use the horizontal position if isHorizontal is true, otherwise use the provided position
  const finalPosition = isHorizontal ? horizontalPosition : position;
  
  return (
    <div className={`execution-port execution-port-${type} ${isHorizontal ? 'horizontal' : 'vertical'}`}>
      <Handle
        type={type === 'input' ? 'target' : 'source'}
        position={finalPosition}
        id={`exec-${type}-${id}`}
        className="execution-handle"
      />
      {name && <span className="execution-port-label">{name}</span>}
    </div>
  );
});

export default ExecutionPort; 