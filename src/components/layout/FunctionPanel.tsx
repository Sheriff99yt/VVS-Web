import React, { useState } from 'react';
import './FunctionPanel.css';

interface TreeNode {
  label: string;
  children?: TreeNode[];
  isExpanded?: boolean;
}

const FunctionPanel: React.FC = () => {
  const [functions] = useState<TreeNode[]>([
    {
      label: 'Process',
      children: [
        { label: 'IF Statement' },
        { label: 'For Loop' },
        { label: 'For Each Loop' }
      ]
    },
    {
      label: 'Logic',
      children: [
        { label: 'Greater Than' },
        { label: 'And' },
        { label: 'Less Than' },
        { label: 'Equal' }
      ]
    },
    {
      label: 'Math',
      children: [
        { label: 'Add' },
        { label: 'Subtract' },
        { label: 'Multiply' },
        { label: 'Divide' }
      ]
    },
    {
      label: 'Input',
      children: [
        { label: 'User Input' },
        { label: 'Raw Code' }
      ]
    },
    {
      label: 'Output',
      children: [
        { label: 'Print' },
        { label: 'Return' }
      ]
    }
  ]);

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    return (
      <div key={node.label} className="tree-node" style={{ paddingLeft: `${level * 20}px` }}>
        <div className="node-content">
          {node.children && (
            <span className="expand-icon">
              {node.isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="node-label">{node.label}</span>
        </div>
        {node.children && node.isExpanded && (
          <div className="node-children">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="function-panel">
      <div className="panel-header">Functions</div>
      <div className="search-box">
        <input type="text" placeholder="Search functions..." />
      </div>
      <div className="function-tree">
        {functions.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
};

export default FunctionPanel; 