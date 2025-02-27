import React, { useState } from 'react';
import './Node.css';

export interface NodePort {
  id: string;
  type: 'input' | 'output';
  label: string;
  dataType: 'number' | 'string' | 'boolean' | 'any';
}

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  title: string;
  inputs: NodePort[];
  outputs: NodePort[];
}

interface NodeProps {
  data: NodeData;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onPortDragStart: (nodeId: string, portId: string, startX: number, startY: number) => void;
  onPortDragEnd: (targetNodeId: string, targetPortId: string) => void;
}

const Node: React.FC<NodeProps> = ({ data, onPositionChange, onPortDragStart, onPortDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.port-point')) return;
    
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
      onPositionChange(data.id, newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePortMouseDown = (e: React.MouseEvent, port: NodePort) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    onPortDragStart(
      data.id,
      port.id,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  };

  const handlePortMouseUp = (e: React.MouseEvent, port: NodePort) => {
    e.stopPropagation();
    onPortDragEnd(data.id, port.id);
  };

  return (
    <div
      className="node"
      style={{
        left: data.position.x,
        top: data.position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="node-header">{data.title}</div>
      <div className="node-content">
        <div className="node-inputs">
          {data.inputs.map(input => (
            <div key={input.id} className="node-port node-input">
              <div 
                className="port-point"
                onMouseDown={(e) => handlePortMouseDown(e, input)}
                onMouseUp={(e) => handlePortMouseUp(e, input)}
              />
              <span className="port-label">{input.label}</span>
            </div>
          ))}
        </div>
        <div className="node-outputs">
          {data.outputs.map(output => (
            <div key={output.id} className="node-port node-output">
              <span className="port-label">{output.label}</span>
              <div 
                className="port-point"
                onMouseDown={(e) => handlePortMouseDown(e, output)}
                onMouseUp={(e) => handlePortMouseUp(e, output)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Node; 