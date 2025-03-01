import React from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNode, Port } from '../../../types';
import './BaseNode.css';

interface BaseNodeProps {
  data: BaseNode['data'];
  selected: boolean;
  type: string;
}

export const BaseNodeComponent: React.FC<BaseNodeProps> = ({ data, selected, type }) => {
  const renderPort = (port: Port, index: number) => {
    const position = port.isInput ? Position.Left : Position.Right;
    const className = `port ${port.isInput ? 'input' : 'output'} ${port.type}`;
    
    return (
      <div key={port.id} className="port-container">
        <Handle
          type={port.isInput ? 'target' : 'source'}
          position={position}
          id={port.id}
          className={className}
        />
        <span className="port-label">{port.label}</span>
        {port.isOptional && <span className="optional-badge">optional</span>}
      </div>
    );
  };

  return (
    <div className={`base-node ${selected ? 'selected' : ''} ${type}`}>
      <div className="node-header">
        <span className="node-title">{data.label}</span>
      </div>
      
      {data.description && (
        <div className="node-description">
          {data.description}
        </div>
      )}
      
      <div className="node-content">
        <div className="ports inputs">
          {data.inputs.map((port, index) => renderPort(port, index))}
        </div>
        
        <div className="ports outputs">
          {data.outputs.map((port, index) => renderPort(port, index))}
        </div>
      </div>
      
      {data.error && (
        <div className="node-error">
          {data.error}
        </div>
      )}
    </div>
  );
}; 