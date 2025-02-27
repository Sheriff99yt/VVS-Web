import React, { useState } from 'react';
import { NodeRegistry, NodeTemplate } from '../../services/NodeRegistry';
import './NodePalette.css';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="node-palette">
      <div className="search-container">
        <input
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
                    draggable
                    onDragStart={(e) => onDragStart(e, template.type)}
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

export default NodePalette; 