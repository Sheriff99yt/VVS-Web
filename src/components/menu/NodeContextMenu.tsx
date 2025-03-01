import React, { useState, useRef, useEffect } from 'react';
import './NodeContextMenu.css';
import { NodeFactory } from '../../services/NodeFactory';
import { NodeFunctionStructure } from '../../isolated/db/FunctionDB';

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
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  flowPosition: { x: number; y: number };
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
  hasSelection
}) => {
  return (
    <div className="context-menu" style={{ left: x, top: y }}>
      <div className="menu-item" onClick={onCopy} data-enabled={hasSelection}>
        Copy
      </div>
      <div className="menu-item" onClick={onCut} data-enabled={hasSelection}>
        Cut
      </div>
      <div className="menu-item" onClick={onPaste} data-enabled={canPaste}>
        Paste
      </div>
      <div className="menu-item" onClick={onDuplicate} data-enabled={hasSelection}>
        Duplicate
      </div>
      <div className="menu-item delete" onClick={onDelete} data-enabled={hasSelection}>
        Delete
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
  const [nodes, setNodes] = useState<NodeFunctionStructure[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const allNodes = await NodeFactory.getAllNodes();
        setNodes(allNodes);
      } catch (error) {
        console.error('Failed to load nodes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNodes();
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

  // Group nodes by category
  const nodesByCategory = nodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeFunctionStructure[]>);

  // Filter nodes based on search
  const filteredNodes = searchQuery
    ? nodes.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nodes;

  if (loading) {
    return (
      <div className="context-menu loading" style={{ left: x, top: y }}>
        Loading nodes...
      </div>
    );
  }

  return (
    <div className="context-menu node-list" style={{ left: x, top: y }}>
      <div className="search-container">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="node-categories">
        {searchQuery ? (
          <div className="search-results">
            {filteredNodes.map(node => (
              <div
                key={`${node.id}-${node.language}`}
                className="menu-item"
                onClick={() => onAddNode(node.id.toString(), flowPosition)}
              >
                <span className="node-name">{node.name}</span>
                <span className="node-language">{node.language}</span>
              </div>
            ))}
          </div>
        ) : (
          Object.entries(nodesByCategory).map(([category, categoryNodes]) => (
            <div key={category} className="category">
              <div
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="expand-icon">
                  {expandedCategories.has(category) ? '▼' : '▶'}
                </span>
                {category}
                <span className="category-count">({categoryNodes.length})</span>
              </div>
              {expandedCategories.has(category) && (
                <div className="category-nodes">
                  {categoryNodes.map(node => (
                    <div
                      key={`${node.id}-${node.language}`}
                      className="menu-item"
                      onClick={() => onAddNode(node.id.toString(), flowPosition)}
                    >
                      <span className="node-name">{node.name}</span>
                      <span className="node-language">{node.language}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 