/**
 * NodeLibrary
 * 
 * A component for displaying and organizing available nodes by category.
 * Allows users to search, filter, and add nodes to the flow editor.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { createTypeConversionNode } from '../flow/nodes/TypeConversionNode';
import './NodeLibrary.css';

// Import a mock node database for development
// In a real application, this would come from the actual database
const mockNodeDefinitions = [
  {
    id: 101,
    name: 'Add Numbers',
    description: 'Adds two numbers together',
    category: 'Math',
    inputs: [
      { id: 'a', name: 'A', type: 'number', required: true },
      { id: 'b', name: 'B', type: 'number', required: true }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'number' }
    ]
  },
  {
    id: 102,
    name: 'Subtract Numbers',
    description: 'Subtracts one number from another',
    category: 'Math',
    inputs: [
      { id: 'a', name: 'A', type: 'number', required: true },
      { id: 'b', name: 'B', type: 'number', required: true }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'number' }
    ]
  },
  {
    id: 201,
    name: 'Concat Strings',
    description: 'Concatenates two strings',
    category: 'String',
    inputs: [
      { id: 'a', name: 'First', type: 'string', required: true },
      { id: 'b', name: 'Second', type: 'string', required: true }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'string' }
    ]
  },
  {
    id: 301,
    name: 'If Statement',
    description: 'Conditional branching',
    category: 'Control Flow',
    inputs: [
      { id: 'condition', name: 'Condition', type: 'boolean', required: true }
    ],
    outputs: [],
    hasExecutionPorts: true,
    executionInputs: [
      { id: 'exec-in', label: 'In' }
    ],
      executionOutputs: [
      { id: 'true-branch', label: 'True' },
      { id: 'false-branch', label: 'False' }
    ]
  },
  {
    id: 401,
    name: 'Create List',
    description: 'Creates a list from individual items',
    category: 'List',
    inputs: [
      { id: 'item1', name: 'Item 1', type: 'any', required: true },
      { id: 'item2', name: 'Item 2', type: 'any', required: false },
      { id: 'item3', name: 'Item 3', type: 'any', required: false }
    ],
    outputs: [
      { id: 'list', name: 'List', type: 'array' }
    ]
  },
  {
    id: 501,
    name: 'Create Dictionary',
    description: 'Creates a dictionary from keys and values',
    category: 'Dictionary',
    inputs: [
      { id: 'keys', name: 'Keys', type: 'array', required: true },
      { id: 'values', name: 'Values', type: 'array', required: true }
    ],
    outputs: [
      { id: 'dict', name: 'Dictionary', type: 'object' }
    ]
  },
  {
    id: 601,
    name: 'Read File',
    description: 'Reads content from a file',
    category: 'File',
    inputs: [
      { id: 'path', name: 'File Path', type: 'string', required: true }
    ],
    outputs: [
      { id: 'content', name: 'Content', type: 'string' }
    ]
  }
];

// Node category definitions
interface NodeCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// Node definition from database
interface NodeDefinition {
  id: number;
  name: string;
  description: string;
  category: string;
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
  hasExecutionPorts?: boolean;
  executionInputs?: Array<{
    id: string;
    label: string;
  }>;
  executionOutputs?: Array<{
    id: string;
    label: string;
  }>;
}

// Node categories with their visual properties
const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'input',
    name: 'Input',
    description: 'Nodes for providing input values',
    color: '#3498db',
    icon: '📥'
  },
  {
    id: 'output',
    name: 'Output',
    description: 'Nodes for handling output values',
    color: '#2ecc71',
    icon: '📤'
  },
  {
    id: 'math',
    name: 'Math',
    description: 'Mathematical operations',
    color: '#e74c3c',
    icon: '🧮'
  },
  {
    id: 'string',
    name: 'String',
    description: 'String manipulation',
    color: '#9b59b6',
    icon: '📝'
  },
  {
    id: 'logic',
    name: 'Logic',
    description: 'Logical operations and comparisons',
    color: '#f39c12',
    icon: '⚖️'
  },
  {
    id: 'list',
    name: 'List',
    description: 'List operations and manipulations',
    color: '#1abc9c',
    icon: '📋'
  },
  {
    id: 'dictionary',
    name: 'Dictionary',
    description: 'Dictionary operations',
    color: '#34495e',
    icon: '🔑'
  },
  {
    id: 'control-flow',
    name: 'Control Flow',
    description: 'Control flow operations like if/else, loops',
    color: '#e67e22',
    icon: '🔄'
  },
  {
    id: 'file',
    name: 'File',
    description: 'File handling operations',
    color: '#16a085',
    icon: '📁'
  },
  {
    id: 'conversion',
    name: 'Conversion',
    description: 'Type conversion nodes',
    color: '#8e44ad',
    icon: '🔄'
  }
];

interface NodeLibraryProps {
  onClose?: () => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onClose }) => {
  const [nodes, setNodes] = useState<NodeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const reactFlowInstance = useReactFlow();
  
  // Load nodes from the database
  useEffect(() => {
    const loadNodes = async () => {
      try {
        setLoading(true);
        // Use our mock data instead of trying to access the SyntaxDatabaseService
        setNodes(mockNodeDefinitions);
      } catch (error) {
        console.error('Error loading node definitions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNodes();
  }, []);
  
  // Filter nodes based on search and selected category
  const filteredNodes = useCallback(() => {
    let result = nodes;
    
    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      result = result.filter(node => 
        node.name.toLowerCase().includes(searchTerm) || 
        node.description.toLowerCase().includes(searchTerm) ||
        node.category.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by selected category
    if (selectedCategory) {
      result = result.filter(node => node.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    return result;
  }, [nodes, search, selectedCategory]);
  
  // Group nodes by category
  const nodesByCategory = useCallback(() => {
    const grouped: Record<string, NodeDefinition[]> = {};
    
    // Initialize categories
    NODE_CATEGORIES.forEach(category => {
      grouped[category.id] = [];
    });
    
    // Group nodes
    filteredNodes().forEach(node => {
      const categoryId = node.category.toLowerCase().replace(/\s+/g, '-');
      if (grouped[categoryId]) {
        grouped[categoryId].push(node);
      } else {
        // For any node with a category not in our predefined list
        if (!grouped['other']) {
          grouped['other'] = [];
        }
        grouped['other'].push(node);
      }
    });
    
    return grouped;
  }, [filteredNodes]);
  
  // Add a node to the flow editor
  const addNodeToEditor = useCallback((node: NodeDefinition) => {
    // Create a node position - center of the current viewport
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const position = reactFlowInstance.project({
      x: window.innerWidth / 2 / zoom - x / zoom,
      y: window.innerHeight / 2 / zoom - y / zoom
    });
    
    // Create node data
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'function',
      position,
      data: {
        label: node.name,
        description: node.description,
        category: node.category,
        functionId: node.id,
        inputs: node.inputs,
        outputs: node.outputs,
        hasExecutionPorts: node.hasExecutionPorts || false,
        executionInputs: node.executionInputs || [],
        executionOutputs: node.executionOutputs || []
      }
    };
    
    // Add the node to the editor
    reactFlowInstance.addNodes(newNode);
    
    // Close the library if a close handler is provided
    if (onClose) {
      onClose();
    }
  }, [reactFlowInstance, onClose]);
  
  // Add a type conversion node to the editor
  const addConversionNode = useCallback((sourceType: string, targetType: string) => {
    // Create a node position - center of the current viewport
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const position = reactFlowInstance.project({
      x: window.innerWidth / 2 / zoom - x / zoom,
      y: window.innerHeight / 2 / zoom - y / zoom
    });
    
    // Create the conversion node
    const conversionNode = createTypeConversionNode(
      `conversion-${Date.now()}`,
      position,
      sourceType,
      targetType
    );
    
    // Add the node to the editor
    reactFlowInstance.addNodes(conversionNode);
    
    // Close the library if a close handler is provided
    if (onClose) {
      onClose();
    }
  }, [reactFlowInstance, onClose]);
  
  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);
  
  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    setExpandedCategory(prev => prev === categoryId ? prev : categoryId);
  }, []);
  
  // Render the list of available conversion nodes
  const renderConversionNodes = useCallback(() => {
    const dataTypes = ['string', 'number', 'boolean', 'array', 'object'];
    const conversions: React.ReactNode[] = [];
    
    dataTypes.forEach(sourceType => {
      dataTypes.forEach(targetType => {
        if (sourceType !== targetType) {
          conversions.push(
            <div 
              key={`${sourceType}-to-${targetType}`}
              className="node-item conversion-node"
              onClick={() => addConversionNode(sourceType, targetType)}
            >
              <div className="node-item-header">
                <span className="node-item-name">
                  {sourceType} → {targetType}
                </span>
              </div>
              <div className="node-item-description">
                Convert {sourceType} value to {targetType}
              </div>
            </div>
          );
        }
      });
    });
    
    return conversions;
  }, [addConversionNode]);
  
  // Render node categories and their nodes
  const renderCategories = useCallback(() => {
    const groupedNodes = nodesByCategory();
    
    return NODE_CATEGORIES.map(category => {
      const nodes = groupedNodes[category.id] || [];
      const isExpanded = expandedCategory === category.id;
      const isSelected = selectedCategory === category.id;
      
      // Skip categories with no nodes unless they're selected
      if (nodes.length === 0 && !isSelected && category.id !== 'conversion') {
        return null;
      }
      
      return (
        <div 
          key={category.id} 
          className={`category-container ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
        >
          <div 
            className="category-header" 
            onClick={() => toggleCategory(category.id)}
            style={{ backgroundColor: category.color + '22' }}
          >
            <div className="category-icon-container" style={{ backgroundColor: category.color }}>
              <span className="category-icon">{category.icon}</span>
            </div>
            <div className="category-info">
              <div className="category-name">{category.name}</div>
              <div className="category-description">{category.description}</div>
            </div>
            <button 
              className="category-filter-button"
              onClick={(e) => {
                e.stopPropagation();
                handleCategorySelect(category.id);
              }}
              title={isSelected ? 'Clear filter' : 'Filter by this category'}
            >
              {isSelected ? '✓' : '⊕'}
            </button>
          </div>
          
          {isExpanded && (
            <div className="category-nodes">
              {category.id === 'conversion' ? (
                renderConversionNodes()
              ) : (
                nodes.map(node => (
                  <div 
                    key={node.id} 
                    className="node-item"
                    onClick={() => addNodeToEditor(node)}
                  >
                    <div className="node-item-header">
                      <span className="node-item-name">{node.name}</span>
                      {node.hasExecutionPorts && (
                        <span className="node-execution-badge" title="Has execution ports">⚡</span>
                      )}
                    </div>
                    <div className="node-item-description">
                      {node.description}
                    </div>
                    {(node.inputs.length > 0 || node.outputs.length > 0) && (
                      <div className="node-io-summary">
                        {node.inputs.length > 0 && (
                          <div className="node-inputs">
                            In: {node.inputs.map(input => input.type).join(', ')}
                          </div>
                        )}
                        {node.outputs.length > 0 && (
                          <div className="node-outputs">
                            Out: {node.outputs.map(output => output.type).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
  }, [
    nodesByCategory, 
    expandedCategory, 
    selectedCategory, 
    toggleCategory, 
    handleCategorySelect, 
    addNodeToEditor, 
    renderConversionNodes
  ]);
  
  return (
    <div className="node-library">
      <div className="library-header">
        <h3>Node Library</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="library-search">
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {selectedCategory && (
          <button 
            className="clear-filter-button"
            onClick={() => setSelectedCategory(null)}
          >
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="library-content">
        {loading ? (
          <div className="loading-indicator">Loading nodes...</div>
        ) : (
          <>
            {filteredNodes().length === 0 ? (
              <div className="no-results">
                No nodes match your search criteria.
              </div>
            ) : (
              <div className="categories-container">
                {renderCategories()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NodeLibrary; 