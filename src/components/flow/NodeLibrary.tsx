import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { FunctionNodeData } from './nodes/FunctionNode';
import './NodeLibrary.css';
import { nodeCategories, controlFlowNodes, NodeTemplate } from './NodeCanvasRegistry';

// Mock function for loading function definitions
// In production, this would come from the SyntaxDatabaseService
const loadPythonFunctions = (): Array<{
  id: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  inputs: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  returnType: string;
  isPure?: boolean; // Added isPure flag to mark pure functions
}> => {
  return [
    {
      id: 'filter',
      name: 'filter',
      displayName: 'Filter Array',
      category: 'Array',
      description: 'Filter elements in an array based on a condition',
      inputs: [
        {
          id: 'array',
          name: 'array',
          type: 'array',
          description: 'The array to filter',
          required: true
        },
        {
          id: 'condition',
          name: 'condition',
          type: 'function',
          description: 'The condition to apply to each element',
          required: true
        }
      ],
      returnType: 'array',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'map',
      name: 'map',
      displayName: 'Map Array',
      category: 'Array',
      description: 'Apply a function to each element in an array',
      inputs: [
        {
          id: 'array',
          name: 'array',
          type: 'array',
          description: 'The array to map',
          required: true
        },
        {
          id: 'mapper',
          name: 'mapper',
          type: 'function',
          description: 'The function to apply to each element',
          required: true
        }
      ],
      returnType: 'array',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'greaterThan',
      name: 'greaterThan',
      displayName: 'Greater Than',
      category: 'Logic',
      description: 'Check if a value is greater than another',
      inputs: [
        {
          id: 'value',
          name: 'value',
          type: 'number',
          description: 'The value to check',
          required: true
        },
        {
          id: 'comparedTo',
          name: 'comparedTo',
          type: 'number',
          description: 'The value to compare against',
          required: true
        }
      ],
      returnType: 'boolean',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'createArray',
      name: 'createArray',
      displayName: 'Create Array',
      category: 'Array',
      description: 'Create a new array from provided values',
      inputs: [
        {
          id: 'items',
          name: 'items',
          type: 'any',
          description: 'Items to include in the array',
          required: false
        }
      ],
      returnType: 'array',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'add',
      name: 'add',
      displayName: 'Add Numbers',
      category: 'Math',
      description: 'Add two numbers together',
      inputs: [
        {
          id: 'a',
          name: 'a',
          type: 'number',
          description: 'First number',
          required: true
        },
        {
          id: 'b',
          name: 'b',
          type: 'number',
          description: 'Second number',
          required: true
        }
      ],
      returnType: 'number',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'subtract',
      name: 'subtract',
      displayName: 'Subtract Numbers',
      category: 'Math',
      description: 'Subtract second number from first',
      inputs: [
        {
          id: 'a',
          name: 'a',
          type: 'number',
          description: 'First number',
          required: true
        },
        {
          id: 'b',
          name: 'b',
          type: 'number',
          description: 'Second number',
          required: true
        }
      ],
      returnType: 'number',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'multiply',
      name: 'multiply',
      displayName: 'Multiply Numbers',
      category: 'Math',
      description: 'Multiply two numbers',
      inputs: [
        {
          id: 'a',
          name: 'a',
          type: 'number',
          description: 'First number',
          required: true
        },
        {
          id: 'b',
          name: 'b',
          type: 'number',
          description: 'Second number',
          required: true
        }
      ],
      returnType: 'number',
      isPure: true // Pure function - no side effects
    },
    {
      id: 'concat',
      name: 'concat',
      displayName: 'Concatenate Strings',
      category: 'String',
      description: 'Join two strings together',
      inputs: [
        {
          id: 'a',
          name: 'a',
          type: 'string',
          description: 'First string',
          required: true
        },
        {
          id: 'b',
          name: 'b',
          type: 'string',
          description: 'Second string',
          required: true
        }
      ],
      returnType: 'string',
      isPure: true // Pure function - no side effects
    },
    // Adding non-pure functions with execution pins
    {
      id: 'print',
      name: 'print',
      displayName: 'Print to Console',
      category: 'IO',
      description: 'Output text to the console',
      inputs: [
        {
          id: 'message',
          name: 'message',
          type: 'string',
          description: 'Message to print',
          required: true
        }
      ],
      returnType: 'void',
      isPure: false // Non-pure function - has side effects
    },
    {
      id: 'append',
      name: 'append',
      displayName: 'Append to Array',
      category: 'Array',
      description: 'Append an item to an array (modifies the array)',
      inputs: [
        {
          id: 'array',
          name: 'array',
          type: 'array',
          description: 'The array to modify',
          required: true
        },
        {
          id: 'item',
          name: 'item',
          type: 'any',
          description: 'Item to append',
          required: true
        }
      ],
      returnType: 'void',
      isPure: false // Non-pure function - modifies input
    },
    {
      id: 'fileWrite',
      name: 'writeFile',
      displayName: 'Write to File',
      category: 'IO',
      description: 'Write content to a file',
      inputs: [
        {
          id: 'filepath',
          name: 'filepath',
          type: 'string',
          description: 'Path to the file',
          required: true
        },
        {
          id: 'content',
          name: 'content',
          type: 'string',
          description: 'Content to write',
          required: true
        }
      ],
      returnType: 'boolean',
      isPure: false // Non-pure function - file system side effect
    },
    {
      id: 'fileRead',
      name: 'readFile',
      displayName: 'Read from File',
      category: 'IO',
      description: 'Read content from a file',
      inputs: [
        {
          id: 'filepath',
          name: 'filepath',
          type: 'string',
          description: 'Path to the file',
          required: true
        }
      ],
      returnType: 'string',
      isPure: false // Non-pure function - depends on external state
    },
    {
      id: 'random',
      name: 'random',
      displayName: 'Random Number',
      category: 'Math',
      description: 'Generate a random number',
      inputs: [
        {
          id: 'min',
          name: 'min',
          type: 'number',
          description: 'Minimum value (inclusive)',
          required: true
        },
        {
          id: 'max',
          name: 'max',
          type: 'number',
          description: 'Maximum value (exclusive)',
          required: true
        }
      ],
      returnType: 'number',
      isPure: false // Non-pure function - non-deterministic
    }
  ];
};

// Convert function definition to a node
const createNodeFromFunction = (
  func: ReturnType<typeof loadPythonFunctions>[0],
  position = { x: 0, y: 0 }
): Node<FunctionNodeData> => {
  // Add execution ports for non-pure functions
  const hasExecutionPorts = func.isPure === false;
  
  return {
    id: `${func.id}-${Date.now()}`, // Ensure unique ID
    type: 'functionNode',
    position,
    data: {
      label: func.displayName,
      description: func.description,
      category: func.category,
      inputs: func.inputs.map((input) => ({
        ...input,
        id: `${func.id}-${input.id}-in`
      })),
      outputs: [
        {
          id: `${func.id}-out`,
          name: 'output',
          type: func.returnType
        }
      ],
      // Add execution ports for non-pure functions
      hasExecutionPorts: hasExecutionPorts,
      executionInputs: hasExecutionPorts ? [{ id: 'entry', name: 'In' }] : undefined,
      executionOutputs: hasExecutionPorts ? [{ id: 'exit', name: 'Out' }] : undefined
    }
  };
};

interface NodeLibraryProps {
  onNodeAdd?: (node: Node<FunctionNodeData>) => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onNodeAdd }) => {
  const [functions, setFunctions] = useState<ReturnType<typeof loadPythonFunctions>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Load functions on mount
  useEffect(() => {
    const loadedFunctions = loadPythonFunctions();
    setFunctions(loadedFunctions);
    
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(loadedFunctions.map(func => func.category))
    );
    setCategories(uniqueCategories);
  }, []);
  
  // Filter functions based on search term and selected category
  const filteredFunctions = functions.filter(func => {
    const matchesSearch = 
      searchTerm === '' || 
      func.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === null || 
      func.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Create a function to convert NodeTemplate to the format expected by drag and click handlers
  const convertTemplateToFunctionData = (template: NodeTemplate): any => {
    return {
      id: template.id,
      name: template.id,
      displayName: template.label,
      category: template.category,
      description: template.description || '',
      inputs: template.inputs || [],
      returnType: template.outputs?.[0]?.type || 'void',
      // Add execution flow properties
      hasExecutionPorts: template.hasExecutionPorts,
      executionInputs: template.executionInputs,
      executionOutputs: template.executionOutputs,
      // Mark as non-pure since it has execution ports
      isPure: !template.hasExecutionPorts
    };
  };
  
  // Update the onDragStart and onNodeClick functions
  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle node click (add to canvas)
  const onNodeClick = (func: ReturnType<typeof loadPythonFunctions>[0]) => {
    if (onNodeAdd) {
      // Create a node at a random position
      const position = {
        x: Math.random() * 300,
        y: Math.random() * 300
      };
      const node = createNodeFromFunction(func, position);
      onNodeAdd(node);
    }
  };
  
  // Add the controlFlowNodes to your node templates
  const [templates, setTemplates] = useState<NodeTemplate[]>([
    ...controlFlowNodes,
    // ... existing templates ...
  ]);
  
  // Update the renderNode function to handle execution ports
  const renderNode = (template: NodeTemplate) => {
    // Convert template to the expected format
    const nodeData = convertTemplateToFunctionData(template);
    
    const previewNode = (
      <div 
        className={`node-template ${template.category}`} 
        key={template.id}
        draggable
        onDragStart={(e) => onDragStart(e, nodeData)}
        onClick={() => onNodeClick(nodeData)}
      >
        <div className="node-template-header">
          <span className="node-template-title">{template.label}</span>
          {template.category && (
            <span className={`node-template-category category-${template.category}`}>
              {template.category}
            </span>
          )}
        </div>
        {template.description && (
          <div className="node-template-description">{template.description}</div>
        )}
        
        {/* Show execution ports in preview if applicable */}
        {template.hasExecutionPorts && (
          <div className="execution-preview horizontal">
            <div className="execution-preview-inputs">
              {template.executionInputs?.map(input => (
                <div key={input.id} className="execution-preview-port input">→</div>
              ))}
            </div>
            <div className="execution-preview-content">
              {/* Node content placeholder */}
            </div>
            <div className="execution-preview-outputs">
              {template.executionOutputs?.map(output => (
                <div key={output.id} className="execution-preview-port output">→</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    
    return previewNode;
  };
  
  return (
    <div className="node-library">
      <div className="node-library-header">
        <h3>Function Library</h3>
        <input
          type="text"
          placeholder="Search functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="node-library-search"
        />
      </div>
      
      <div className="node-library-categories">
        <button
          className={`category-button ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="node-library-list">
        {filteredFunctions.map(func => {
          // Determine if this function should have execution ports
          const hasExecutionPorts = func.isPure === false;
          
          return (
            <div
              key={func.id}
              className={`node-library-item category-${func.category.toLowerCase()} ${hasExecutionPorts ? 'has-execution-ports' : ''}`}
              draggable
              onDragStart={(event) => onDragStart(event, func)}
              onClick={() => onNodeClick(func)}
            >
              <div className="node-library-item-header">
                <span className="node-library-item-title">{func.displayName}</span>
                <span className="node-library-item-category">{func.category}</span>
              </div>
              <div className="node-library-item-description">{func.description}</div>
              <div className="node-library-item-type">Returns: {func.returnType}</div>
              
              {/* Show execution pins preview for non-pure functions */}
              {hasExecutionPorts && (
                <div className="execution-preview horizontal">
                  <div className="execution-preview-inputs">
                    <div className="execution-preview-port input">→</div>
                  </div>
                  <div className="execution-preview-content">
                    {/* Node content placeholder */}
                  </div>
                  <div className="execution-preview-outputs">
                    <div className="execution-preview-port output">→</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredFunctions.length === 0 && (
          <div className="node-library-empty">
            No functions found. Try adjusting your search or category filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeLibrary; 