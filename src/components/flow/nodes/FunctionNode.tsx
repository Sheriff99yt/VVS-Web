import React, { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import ExecutionPort from './ExecutionPort';
import NodeContextMenu from './NodeContextMenu';
import { EdgeType } from '../../../models/flow';
import './FunctionNode.css';

export interface FunctionNodeData {
  label: string;
  description?: string;
  category?: string;
  inputs: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    required: boolean;
  }>;
  outputs: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
  }>;
  isSelected?: boolean;
  // Properties for execution flow
  hasExecutionPorts?: boolean;
  executionInputs?: Array<{
    id: string;
    name: string;
    label?: string;
  }>;
  executionOutputs?: Array<{
    id: string;
    name: string;
    label?: string;
  }>;
}

// Custom equality check for props to prevent unnecessary re-renders
const propsAreEqual = (
  prevProps: NodeProps<FunctionNodeData>,
  nextProps: NodeProps<FunctionNodeData>
) => {
  // Check simple prop equality
  const simplePropsEqual = 
    prevProps.selected === nextProps.selected &&
    prevProps.dragging === nextProps.dragging &&
    prevProps.isConnectable === nextProps.isConnectable;
  
  // If simple props are different, re-render
  if (!simplePropsEqual) return false;
  
  // Check deep equality for data
  return isEqual(prevProps.data, nextProps.data);
};

const FunctionNode: React.FC<NodeProps<FunctionNodeData>> = ({ 
  data, 
  isConnectable,
  selected,
  id
}) => {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { deleteElements } = useReactFlow();
  
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenuVisible(true);
  }, []);
  
  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);
  
  const hideContextMenu = useCallback(() => {
    setContextMenuVisible(false);
  }, []);
  
  const nodeClass = classNames('function-node', {
    'selected': selected,
    'with-execution-ports': data.hasExecutionPorts
  });
  
  return (
    <div 
      className={nodeClass} 
      ref={nodeRef}
      onContextMenu={handleContextMenu}
    >
      {/* Node Header */}
      <div className="function-node-header">
        <div className="function-node-title">{data.label}</div>
        {data.category && <div className="function-node-category">{data.category}</div>}
      </div>
      
      {/* Execution Input Ports - displayed at the top */}
      {data.hasExecutionPorts && data.executionInputs && data.executionInputs.length > 0 && (
        <div className="execution-ports execution-inputs">
          {data.executionInputs.map((input) => (
            <ExecutionPort
              key={`exec-input-${input.id}`}
              id={input.id}
              name={input.name}
              label={input.label}
              isConnectable={isConnectable}
              isInput={true}
            />
          ))}
        </div>
      )}
      
      {/* Node Content with Input and Output Ports */}
      <div className="function-node-content">
        {/* Input Ports - displayed on the left */}
        <div className="function-node-inputs">
          {data.inputs && data.inputs.map((input) => (
            <div key={`input-${input.id}`} className="function-node-port">
              <Handle
                id={`input-${input.id}`}
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                isConnectable={isConnectable}
                data-type={EdgeType.DATA}
              />
              <div className="function-node-port-label">
                {input.name}
                {input.required && <span className="required">*</span>}
              </div>
              <div className="function-node-port-type">{input.type}</div>
            </div>
          ))}
        </div>
        
        {/* Node Description - displayed in the center */}
        {data.description && (
          <div className="function-node-description">
            {data.description}
          </div>
        )}
        
        {/* Output Ports - displayed on the right */}
        <div className="function-node-outputs">
          {data.outputs && data.outputs.map((output) => (
            <div key={`output-${output.id}`} className="function-node-port">
              <div className="function-node-port-label">{output.name}</div>
              <div className="function-node-port-type">{output.type}</div>
              <Handle
                id={`output-${output.id}`}
                type="source"
                position={Position.Right}
                style={{ background: '#555' }}
                isConnectable={isConnectable}
                data-type={EdgeType.DATA}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Execution Output Ports - displayed at the bottom */}
      {data.hasExecutionPorts && data.executionOutputs && data.executionOutputs.length > 0 && (
        <div className="execution-ports execution-outputs">
          {data.executionOutputs.map((output) => (
            <ExecutionPort
              key={`exec-output-${output.id}`}
              id={output.id}
              name={output.name}
              label={output.label}
              isConnectable={isConnectable}
              isInput={false}
            />
          ))}
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenuVisible && (
        <NodeContextMenu
          onClose={hideContextMenu}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

// Use memo with custom equality function to prevent unnecessary re-renders
export default memo(FunctionNode, propsAreEqual); 