import React, { memo } from 'react';
import { FunctionNodeProps } from '../../components/nodes/FunctionNode.types';
import ExecutionPort from './ExecutionPort';

const FunctionNode = memo(({ data, ...props }: FunctionNodeProps) => {
  return (
    <div className={`function-node ${data.category}`}>
      {/* Execution input port if applicable */}
      {data.executionData?.executionInputs?.map((input: { id: string; name: string }) => (
        <ExecutionPort 
          key={input.id} 
          id={input.id} 
          name={input.name} 
          type="input" 
        />
      ))}
      
      <div className="function-node-header">
        <div className="function-node-title">{data.label}</div>
        <div className="function-node-category">{data.category}</div>
      </div>
      
      {/* Function inputs and outputs */}
      <div className="function-node-ports">
        {/* Input rendering code here */}
        {/* Output rendering code here */}
      </div>
      
      {/* Execution output ports */}
      <div className="execution-outputs">
        {data.executionData?.executionOutputs?.map((output: { id: string; name: string }) => (
          <ExecutionPort 
            key={output.id} 
            id={output.id} 
            name={output.name} 
            type="output" 
          />
        ))}
      </div>
    </div>
  );
});

export default FunctionNode; 