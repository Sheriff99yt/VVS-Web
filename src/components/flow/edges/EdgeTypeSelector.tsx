/**
 * EdgeTypeSelector
 * 
 * A component that allows users to switch between different edge
 * rendering types (default vs smart).
 */

import React from 'react';
import './EdgeTypeSelector.css';

export enum EdgeDisplayType {
  DEFAULT = 'default',
  SMART = 'smart'
}

interface EdgeTypeSelectorProps {
  currentType: EdgeDisplayType;
  onChange: (type: EdgeDisplayType) => void;
  className?: string;
}

const EdgeTypeSelector: React.FC<EdgeTypeSelectorProps> = ({
  currentType,
  onChange,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as EdgeDisplayType;
    onChange(value);
  };

  return (
    <div className={`edge-type-selector ${className}`}>
      <label htmlFor="edge-type-select">Edge Style:</label>
      <select
        id="edge-type-select"
        value={currentType}
        onChange={handleChange}
      >
        <option value={EdgeDisplayType.DEFAULT}>Default</option>
        <option value={EdgeDisplayType.SMART}>Smart Routing</option>
      </select>
    </div>
  );
};

export default EdgeTypeSelector; 