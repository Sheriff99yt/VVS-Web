/**
 * StyledFunctionNode
 * 
 * An enhanced version of the FunctionNode component with improved styling,
 * visual hierarchy, and usability features.
 */

import React, { useState, useCallback, memo, useMemo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { FunctionNodeData } from './FunctionNode';
import ExecutionPort from './ExecutionPort';
import NodeContextMenu from './NodeContextMenu';
import './StyledFunctionNode.css';

const StyledFunctionNode: React.FC<NodeProps<FunctionNodeData>> = ({
  id,
  data,
  selected,
  isConnectable,
}) => {
  const { setNodes } = useReactFlow();
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Show context menu on right click
  const showContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenuVisible(true);
  }, []);
  
  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setContextMenuVisible(false);
  }, []);
  
  // Delete this node
  const handleDelete = useCallback(() => {
    setNodes(nodes => nodes.filter(node => node.id !== id));
  }, [id, setNodes]);
  
  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);
  
  // Handle hover states
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // Determine node color based on category
  const nodeColor = useMemo(() => {
    const category = data.category?.toLowerCase() || '';
    
    // Color mapping for different categories
    const categoryColors: Record<string, string> = {
      math: '#e74c3c',        // Red
      string: '#9b59b6',      // Purple
      logic: '#f39c12',       // Orange
      list: '#1abc9c',        // Teal
      array: '#1abc9c',       // Teal (same as list)
      dictionary: '#34495e',  // Dark Blue
      object: '#34495e',      // Dark Blue (same as dictionary)
      'control flow': '#e67e22', // Orange-Brown
      file: '#16a085',        // Dark Green
      input: '#3498db',       // Blue
      output: '#2ecc71',      // Green
      conversion: '#8e44ad',  // Dark Purple
      default: '#95a5a6'      // Gray
    };
    
    // Build category based styles
    let colorKey = 'default';
    for (const key of Object.keys(categoryColors)) {
      if (category.includes(key)) {
        colorKey = key;
        break;
      }
    }
    
    return categoryColors[colorKey];
  }, [data.category]);
  
  // Determine the node class names
  const nodeClasses = [
    'styled-function-node',
    selected ? 'selected' : '',
    isCollapsed ? 'collapsed' : '',
    isHovered ? 'hovered' : '',
    data.hasExecutionPorts ? 'has-execution' : '',
  ].filter(Boolean).join(' ');
  
  // Get handles for execution ports if present
  const executionInputs = useMemo(() => {
    if (!data.hasExecutionPorts || !data.executionInputs) return null;
    
    return (
      <div className="execution-inputs-container">
        {data.executionInputs.map(input => (
          <ExecutionPort
            key={input.id}
            id={input.id}
            label={input.label}
            isInput={true}
            isConnectable={isConnectable}
          />
        ))}
      </div>
    );
  }, [data.hasExecutionPorts, data.executionInputs, isConnectable]);
  
  const executionOutputs = useMemo(() => {
    if (!data.hasExecutionPorts || !data.executionOutputs) return null;
    
    return (
      <div className="execution-outputs-container">
        {data.executionOutputs.map(output => (
          <ExecutionPort
            key={output.id}
            id={output.id}
            label={output.label}
            isInput={false}
            isConnectable={isConnectable}
          />
        ))}
      </div>
    );
  }, [data.hasExecutionPorts, data.executionOutputs, isConnectable]);
  
  return (
    <div
      className={nodeClasses}
      onContextMenu={showContextMenu}
      onClick={hideContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderColor: nodeColor,
      }}
    >
      {/* Execution Input Handles */}
      {executionInputs}
      
      {/* Node Header */}
      <div 
        className="node-header" 
        style={{ backgroundColor: nodeColor }}
        onClick={toggleCollapsed}
      >
        <div className="node-title">{data.label}</div>
        {data.category && <div className="node-category">{data.category}</div>}
        <div className="collapse-toggle">
          {isCollapsed ? '▼' : '▲'}
        </div>
      </div>
      
      {/* Node Content */}
      {!isCollapsed && (
        <div className="node-content">
          {data.description && (
            <div className="node-description">{data.description}</div>
          )}
          
          {/* Input Ports */}
          <div className="ports-container input-ports">
            {data.inputs?.map(input => (
              <div key={input.id} className="port">
                <div className="port-info">
                  <div className="port-name">{input.name}</div>
                  <div className="port-type">{input.type}</div>
                </div>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`input-${input.id}`}
                  isConnectable={isConnectable}
                  className={`input-handle ${input.type.toLowerCase()}-type`}
                />
              </div>
            ))}
          </div>
          
          {/* Output Ports */}
          <div className="ports-container output-ports">
            {data.outputs?.map(output => (
              <div key={output.id} className="port">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`output-${output.id}`}
                  isConnectable={isConnectable}
                  className={`output-handle ${output.type.toLowerCase()}-type`}
                />
                <div className="port-info">
                  <div className="port-name">{output.name}</div>
                  <div className="port-type">{output.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Execution Output Handles */}
      {executionOutputs}
      
      {/* Node Controls */}
      {isHovered && !contextMenuVisible && (
        <div className="node-controls">
          <button 
            className="node-control-button delete-button" 
            onClick={handleDelete}
            title="Delete Node"
          >
            ×
          </button>
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

export default memo(StyledFunctionNode); 