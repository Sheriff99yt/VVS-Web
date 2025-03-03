import React from 'react';
import { Position, Handle } from 'reactflow';
import { EdgeType } from '../../../models/flow';
import './ExecutionPort.css';

interface ExecutionPortProps {
  id: string;
  name?: string;
  label?: string;
  isConnectable: boolean;
  isInput: boolean;
}

/**
 * ExecutionPort component represents a port for execution flow connections.
 * It renders a handle that can be connected to other execution ports to define
 * the flow of execution in the program.
 */
const ExecutionPort: React.FC<ExecutionPortProps> = ({
  id,
  name,
  label,
  isConnectable,
  isInput
}) => {
  const position = isInput ? Position.Top : Position.Bottom;
  const handleId = `exec-${isInput ? 'input' : 'output'}-${id}`;
  const displayName = label || name || id;
  
  return (
    <div className="execution-port">
      <Handle
        id={handleId}
        type={isInput ? 'target' : 'source'}
        position={position}
        style={{ 
          background: '#FF9900',
          border: '2px solid #CC7700',
          width: '12px',
          height: '12px',
          top: isInput ? '-6px' : 'auto',
          bottom: isInput ? 'auto' : '-6px'
        }}
        isConnectable={isConnectable}
        data-type={EdgeType.EXECUTION}
      />
      <div className="execution-port-label">
        {displayName}
      </div>
    </div>
  );
};

export default ExecutionPort; 