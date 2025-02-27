import React, { useState, useRef, useEffect } from 'react';
import { NodeRegistry, NodeTemplate } from '../../services/NodeRegistry';
import './NodeContextMenu.css';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canPaste: boolean;
  hasSelection: boolean;
}

interface GraphContextMenuProps {
  x: number;
  y: number;
  onAddNode: (nodeType: string, position: { x: number, y: number }) => void;
  flowPosition: { x: number, y: number };
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  canPaste,
  hasSelection,
}) => {
  return (
    <div 
      className="node-context-menu"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="context-menu-section">
        <button 
          className="context-menu-item"
          onClick={onCopy}
          disabled={!hasSelection}
        >
          Copy
          <span className="shortcut">Ctrl+C</span>
        </button>
        <button 
          className="context-menu-item"
          onClick={onCut}
          disabled={!hasSelection}
        >
          Cut
          <span className="shortcut">Ctrl+X</span>
        </button>
        <button 
          className="context-menu-item"
          onClick={onPaste}
          disabled={!canPaste}
        >
          Paste
          <span className="shortcut">Ctrl+V</span>
        </button>
        <div className="context-menu-separator" />
        <button 
          className="context-menu-item"
          onClick={onDuplicate}
          disabled={!hasSelection}
        >
          Duplicate
          <span className="shortcut">Ctrl+D</span>
        </button>
        <button 
          className="context-menu-item delete"
          onClick={onDelete}
          disabled={!hasSelection}
        >
          Delete
          <span className="shortcut">Del</span>
        </button>
      </div>
    </div>
  );
};

export const GraphContextMenu: React.FC<GraphContextMenuProps> = ({
  x,
  y,
  onAddNode,
  flowPosition
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus the search input when the menu opens
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const categories = NodeRegistry.getAllCategories();
  const filteredNodeTemplates = searchQuery 
    ? NodeRegistry.searchNodes(searchQuery)
    : NodeRegistry.getAllNodes();

  return (
    <div 
      className="node-context-menu graph-context-menu"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="search-container">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <div className="nodes-list">
        {categories.map(category => {
          const categoryNodes = filteredNodeTemplates.filter(
            (template: NodeTemplate) => template.category === category.id
          );
          
          if (searchQuery && categoryNodes.length === 0) {
            return null;
          }

          return (
            <div key={category.id} className="node-category">
              <div 
                className={`category-header ${expandedCategories.has(category.id) ? 'expanded' : ''}`}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="category-icon">{expandedCategories.has(category.id) ? '▼' : '▶'}</span>
                {category.label}
                {searchQuery && categoryNodes.length > 0 && (
                  <span className="category-count">({categoryNodes.length})</span>
                )}
              </div>
              <div className={`category-items ${expandedCategories.has(category.id) || searchQuery ? 'expanded' : ''}`}>
                {categoryNodes.map((template: NodeTemplate) => (
                  <div
                    key={template.type}
                    className="node-template"
                    onClick={() => onAddNode(template.type, flowPosition)}
                  >
                    <div className="template-title">{template.title}</div>
                    <div className="template-description">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 