import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import ExecutionPort from '../ExecutionPort';
import './IfNode.css';

export interface IfNodeData {
  label?: string;
}

const IfNode: React.FC<NodeProps<IfNodeData>> = ({ data, isConnectable }) => {
  return (
    <div className="control-node if-node">
      <div className="node-header">Conditional</div>
      
      {/* Execution input */}
      <ExecutionPort id="entry" name="In" type="input" />
      
      <div className="node-content">
        <div className="input-port">
          <Handle 
            type="target" 
            position={Position.Left} 
            id="condition"
            isConnectable={isConnectable}
            className="port port-type-boolean"
          />
          <span>Condition</span>
        </div>
      </div>
      
      {/* Execution outputs */}
      <div className="execution-outputs">
        <ExecutionPort id="then" name="Then" type="output" />
        <ExecutionPort id="else" name="Else" type="output" />
      </div>
    </div>
  );
};

export default memo(IfNode); 