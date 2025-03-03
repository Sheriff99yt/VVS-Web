import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import ExecutionPort from '../ExecutionPort';
import './ForLoopNode.css';

export interface ForLoopNodeData {
  label?: string;
}

const ForLoopNode: React.FC<NodeProps<ForLoopNodeData>> = ({ data, isConnectable }) => {
  return (
    <div className="control-node loop-node">
      <div className="node-header">For Loop</div>
      
      {/* Execution input */}
      <ExecutionPort id="entry" name="In" type="input" />
      
      <div className="node-content">
        <div className="input-port">
          <Handle 
            type="target" 
            position={Position.Left} 
            id="start" 
            isConnectable={isConnectable}
            className="port port-type-number"
          />
          <span>Start</span>
        </div>
        <div className="input-port">
          <Handle 
            type="target" 
            position={Position.Left} 
            id="end" 
            isConnectable={isConnectable}
            className="port port-type-number"
          />
          <span>End</span>
        </div>
        <div className="input-port">
          <Handle 
            type="target" 
            position={Position.Left} 
            id="step" 
            isConnectable={isConnectable}
            className="port port-type-number"
          />
          <span>Step</span>
        </div>
        <div className="output-port">
          <span>Index</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="index" 
            isConnectable={isConnectable}
            className="port port-type-index"
          />
        </div>
      </div>
      
      {/* Execution outputs */}
      <div className="execution-outputs">
        <ExecutionPort id="body" name="Body" type="output" />
        <ExecutionPort id="completed" name="Completed" type="output" />
      </div>
    </div>
  );
};

export default memo(ForLoopNode); 