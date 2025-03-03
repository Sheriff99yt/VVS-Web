/**
 * TypeConversionNode
 * 
 * A specialized node component for converting data between different types.
 * This node takes an input of one type and converts it to the specified output type.
 */

import React, { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { TypeConversionService } from '../../../services/codeGen/TypeConversionService';
import NodeContextMenu from './NodeContextMenu';
import './TypeConversionNode.css';

export interface TypeConversionNodeData {
  label: string;
  sourceType: string;
  targetType: string;
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
}

const conversionService = new TypeConversionService();

const TypeConversionNode: React.FC<NodeProps<TypeConversionNodeData>> = ({ 
  id, 
  data, 
  isConnectable,
  selected,
}) => {
  const { setNodes } = useReactFlow();
  const [contextMenuVisible, setContextMenuVisible] = useState(false);

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

  // Get appropriate classes
  const nodeClasses = [
    'conversion-node',
    selected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={nodeClasses}
      onContextMenu={showContextMenu}
      onClick={hideContextMenu}
    >
      <div className="conversion-node-header">
        <div className="conversion-node-title">{data.label}</div>
      </div>

      <div className="conversion-node-content">
        <div className="conversion-arrow">
          <span className="conversion-type">{data.sourceType}</span>
          <span className="arrow">→</span>
          <span className="conversion-type">{data.targetType}</span>
        </div>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`input-${data.inputs[0]?.id || 'value'}`}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
        className={`port-type-${data.sourceType.toLowerCase()}`}
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`output-${data.outputs[0]?.id || 'result'}`}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
        className={`port-type-${data.targetType.toLowerCase()}`}
      />

      {/* Context menu */}
      {contextMenuVisible && (
        <NodeContextMenu
          onClose={hideContextMenu}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

/**
 * Create a new type conversion node with the specified types
 */
export function createTypeConversionNode(
  id: string,
  position: { x: number, y: number },
  sourceType: string,
  targetType: string
) {
  return {
    id,
    type: 'typeConversion',
    position,
    data: {
      label: `Convert ${sourceType} to ${targetType}`,
      sourceType,
      targetType,
      inputs: [
        {
          id: 'value',
          name: 'Value',
          type: sourceType,
          required: true
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          type: targetType
        }
      ]
    }
  };
}

export default memo(TypeConversionNode); 