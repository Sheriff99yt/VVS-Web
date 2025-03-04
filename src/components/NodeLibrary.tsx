import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Button, 
  Text, 
  Heading, 
  Input,
  Flex,
} from '@chakra-ui/react';
import { NODE_CATEGORIES, NodeType } from '../nodes/types';
import { SocketDirection, SocketType, createSocketDefinition } from '../sockets/types';
import useGraphStore from '../store/useGraphStore';

// Type for node creation template
interface NodeTemplate {
  type: NodeType;
  label: string;
  category: string;
  createNodeData: () => any;
}

/**
 * Component that displays the library of available nodes
 */
export const NodeLibrary: React.FC = () => {
  const addNode = useGraphStore(state => state.addNode);
  
  // State for search and category collapse
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    NODE_CATEGORIES.reduce((acc, category) => ({
      ...acc,
      [category.id]: true
    }), {})
  );
  
  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Templates for all available nodes
  const nodeTemplates: Record<NodeType, NodeTemplate> = {
    // Process Flow nodes
    [NodeType.IF_STATEMENT]: {
      type: NodeType.IF_STATEMENT,
      label: 'If Statement',
      category: 'Process Flow',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('condition', 'Condition', SocketType.BOOLEAN, SocketDirection.INPUT),
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('true_flow', 'True', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('false_flow', 'False', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          condition: 'True',
        },
      }),
    },
    [NodeType.FOR_LOOP]: {
      type: NodeType.FOR_LOOP,
      label: 'For Loop',
      category: 'Process Flow',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('loop_body', 'Body', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('loop_complete', 'Complete', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('current_value', 'Value', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          variable: 'i',
          start: '0',
          end: '10',
        },
      }),
    },
    
    // Logic Operation nodes
    [NodeType.AND]: {
      type: NodeType.AND,
      label: 'AND',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.BOOLEAN, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.BOOLEAN, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.OR]: {
      type: NodeType.OR,
      label: 'OR',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.BOOLEAN, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.BOOLEAN, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.GREATER_THAN]: {
      type: NodeType.GREATER_THAN,
      label: 'Greater Than',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.LESS_THAN]: {
      type: NodeType.LESS_THAN,
      label: 'Less Than',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.EQUAL]: {
      type: NodeType.EQUAL,
      label: 'Equal',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.ANY, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    
    // Math Operation nodes
    [NodeType.ADD]: {
      type: NodeType.ADD,
      label: 'Add',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.SUBTRACT]: {
      type: NodeType.SUBTRACT,
      label: 'Subtract',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.MULTIPLY]: {
      type: NodeType.MULTIPLY,
      label: 'Multiply',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    [NodeType.DIVIDE]: {
      type: NodeType.DIVIDE,
      label: 'Divide',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {},
      }),
    },
    
    // Variable nodes
    [NodeType.VARIABLE_DEFINITION]: {
      type: NodeType.VARIABLE_DEFINITION,
      label: 'Set Variable',
      category: 'Variables',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'myVar',
          value: '0',
        },
      }),
    },
    [NodeType.VARIABLE_GETTER]: {
      type: NodeType.VARIABLE_GETTER,
      label: 'Get Variable',
      category: 'Variables',
      createNodeData: () => ({
        inputs: [],
        outputs: [
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'myVar',
        },
      }),
    },
    
    // Input/Output nodes
    [NodeType.PRINT]: {
      type: NodeType.PRINT,
      label: 'Print',
      category: 'Input/Output',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          text: 'Hello World',
        },
      }),
    },
    [NodeType.USER_INPUT]: {
      type: NodeType.USER_INPUT,
      label: 'User Input',
      category: 'Input/Output',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('value', 'Value', SocketType.STRING, SocketDirection.OUTPUT),
        ],
        properties: {
          prompt: 'Enter a value:',
        },
      }),
    },
    
    // Function nodes
    [NodeType.FUNCTION_DEFINITION]: {
      type: NodeType.FUNCTION_DEFINITION,
      label: 'Function Definition',
      category: 'Function',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('param1', 'Parameter 1', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('body', 'Body', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('return', 'Return', SocketType.ANY, SocketDirection.INPUT),
        ],
        properties: {
          name: 'myFunction',
          parameters: ['param1'],
        },
      }),
    },
    [NodeType.FUNCTION_CALL]: {
      type: NodeType.FUNCTION_CALL,
      label: 'Function Call',
      category: 'Function',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
          createSocketDefinition('param1', 'Parameter 1', SocketType.ANY, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('return', 'Return', SocketType.ANY, SocketDirection.OUTPUT),
        ],
        properties: {
          function: 'myFunction',
        },
      }),
    },
  } as Record<NodeType, NodeTemplate>;

  // Function to handle adding a node to the graph
  const handleAddNode = (template: NodeTemplate) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'baseNode', // All nodes use the same component
      position: { x: 100, y: 100 },
      data: {
        ...template.createNodeData(),
        type: template.type,
        label: template.label,
      },
    };
    
    addNode(newNode);
  };

  // Filter nodes based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return NODE_CATEGORIES;
    }
    
    const query = searchQuery.toLowerCase();
    
    return NODE_CATEGORIES.map(category => {
      // Filter node types that match the search query
      const matchingNodeTypes = category.nodeTypes.filter(nodeType => {
        const template = nodeTemplates[nodeType];
        return template && template.label.toLowerCase().includes(query);
      });
      
      // Only include categories that have matching nodes
      return {
        ...category,
        nodeTypes: matchingNodeTypes
      };
    }).filter(category => category.nodeTypes.length > 0);
  }, [searchQuery, nodeTemplates]);

  return (
    <Box 
      height="100%" 
      overflowY="auto" 
      p={4}
      borderRight="1px solid"
      borderColor="gray.700"
    >
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Node Library
      </Text>
      
      {/* Search input */}
      <Box mb={4} position="relative">
        <Input 
          placeholder="Search nodes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          borderRadius="md"
          size="sm"
          paddingLeft="2rem"
        />
        <Text 
          position="absolute" 
          left="0.5rem" 
          top="50%" 
          transform="translateY(-50%)"
          color="gray.500"
          fontSize="sm"
        >
          🔍
        </Text>
      </Box>
      
      {filteredCategories.map((category) => (
        <Box key={category.id} mb={4}>
          <Flex 
            py={2} 
            px={1}
            alignItems="center"
            cursor="pointer"
            onClick={() => toggleCategory(category.id)}
          >
            <Text mr={2} fontSize="sm">
              {expandedCategories[category.id] ? '▼' : '▶'}
            </Text>
            <Heading 
              size="sm" 
              color={category.color}
            >
              {category.label}
            </Heading>
          </Flex>
          
          {expandedCategories[category.id] && (
            <>
              <Box 
                borderTop="1px solid" 
                borderColor="gray.700" 
                mb={2} 
                mt={1}
              />
              <Box>
                {category.nodeTypes.map((nodeType) => {
                  const template = nodeTemplates[nodeType];
                  return template ? (
                    <Button 
                      key={nodeType}
                      size="sm"
                      width="100%"
                      justifyContent="flex-start"
                      colorScheme="gray"
                      mb={1}
                      onClick={() => handleAddNode(template)}
                    >
                      {template.label}
                    </Button>
                  ) : null;
                })}
              </Box>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default NodeLibrary; 