/**
 * NodeTypeSelector
 * 
 * A dropdown component that allows users to switch between
 * different node rendering types (original vs styled).
 */

import React from 'react';
import './NodeTypeSelector.css';

export enum NodeDisplayType {
  ORIGINAL = 'original',
  STYLED = 'styled'
}

interface NodeTypeSelectorProps {
  currentType: NodeDisplayType;
  onChange: (type: NodeDisplayType) => void;
}

const NodeTypeSelector: React.FC<NodeTypeSelectorProps> = ({
  currentType,
  onChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as NodeDisplayType;
    onChange(value);
  };

  return (
    <div className="node-type-selector">
      <label htmlFor="node-type-select">Node Style:</label>
      <select
        id="node-type-select"
        value={currentType}
        onChange={handleChange}
      >
        <option value={NodeDisplayType.ORIGINAL}>Original</option>
        <option value={NodeDisplayType.STYLED}>Enhanced</option>
      </select>
    </div>
  );
};

export default NodeTypeSelector; 