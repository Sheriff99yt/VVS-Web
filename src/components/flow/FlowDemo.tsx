import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import NodeCanvas from './NodeCanvas';
import NodeLibrary from './NodeLibrary';
import CodePreview from './CodePreview';
import { FunctionNodeData } from './nodes/FunctionNode';
import './FlowDemo.css';

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
      returnType: 'array'
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
      returnType: 'array'
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
      returnType: 'boolean'
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
      returnType: 'array'
    }
  ];
};

// Convert function definitions to React Flow nodes
const convertToNodes = (
  functions: ReturnType<typeof loadPythonFunctions>
): Node<FunctionNodeData>[] => {
  return functions.map((func, index) => {
    // Calculate position - we'll arrange them in a grid
    const x = (index % 2) * 300 + 50;
    const y = Math.floor(index / 2) * 200 + 50;
    
    return {
      id: func.id,
      type: 'functionNode',
      position: { x, y },
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
        ]
      }
    };
  });
};

// Example edges to connect our nodes
const createExampleEdges = (): Edge[] => {
  return [
    {
      id: 'edge-createArray-filter',
      source: 'createArray',
      sourceHandle: 'createArray-out',
      target: 'filter',
      targetHandle: 'filter-array-in'
    }
  ];
};

interface FlowDemoProps {
  height?: string;
}

const FlowDemo: React.FC<FlowDemoProps> = ({ height = '700px' }) => {
  const [nodes, setNodes] = useState<Node<FunctionNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(true);
  
  // Reference to the flow container for drag & drop
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load functions and convert to nodes
    const functions = loadPythonFunctions();
    const flowNodes = convertToNodes(functions);
    const flowEdges = createExampleEdges();
    
    // Set state
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, []);
  
  // Handle node changes
  const handleNodesChange = (updatedNodes: Node<FunctionNodeData>[]) => {
    setNodes(updatedNodes);
  };
  
  // Handle edge changes
  const handleEdgesChange = (updatedEdges: Edge[]) => {
    setEdges(updatedEdges);
  };
  
  // Handle adding a new node from the library
  const handleAddNode = (newNode: Node<FunctionNodeData>) => {
    setNodes((nds) => [...nds, newNode]);
  };
  
  // Handle drag over for drag & drop from library
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop for drag & drop from library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const funcData = event.dataTransfer.getData('application/reactflow');
      
      if (!funcData) {
        return;
      }
      
      try {
        const func = JSON.parse(funcData);
        
        // Get position from drop coordinates
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top
        });
        
        // Create a new node with the correct type
        const newNode: Node<FunctionNodeData> = {
          id: `${func.id}-${Date.now()}`,
          type: 'functionNode', // This ensures the correct node renderer is used
          position,
          data: {
            label: func.displayName,
            description: func.description,
            category: func.category,
            inputs: func.inputs.map((input: any) => ({
              ...input,
              id: `${func.id}-${input.id}-in-${Date.now()}`
            })),
            outputs: [
              {
                id: `${func.id}-out-${Date.now()}`,
                name: 'output',
                type: func.returnType
              }
            ]
          }
        };
        
        console.log('Adding new node:', newNode);
        setNodes((nds) => [...nds, newNode]);
      } catch (error) {
        console.error('Error adding node:', error);
      }
    },
    [reactFlowInstance]
  );

  // Toggle code preview panel
  const toggleCodePreview = () => {
    setShowCodePreview(!showCodePreview);
  };
  
  return (
    <div className="flow-demo" style={{ height }}>
      <div className="flow-demo-header">
        <h2>Visual Node System Demo</h2>
        <button 
          className="toggle-preview-button"
          onClick={toggleCodePreview}
        >
          {showCodePreview ? 'Hide Code' : 'Show Code'}
        </button>
      </div>
      <div className="flow-demo-container">
        <div className="flow-library-panel">
          <NodeLibrary onNodeAdd={handleAddNode} />
        </div>
        <div 
          className="flow-canvas-panel" 
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <NodeCanvas 
            initialNodes={nodes} 
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onInit={setReactFlowInstance}
          />
        </div>
        {showCodePreview && (
          <div className="flow-code-panel">
            <CodePreview nodes={nodes} edges={edges} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowDemo; 