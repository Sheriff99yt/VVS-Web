import React, { useState, useMemo, useRef } from 'react';
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
  
  // Refs for measuring content height for animations
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
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

  // Colors
  const panelBg = 'gray.900';
  const borderColor = 'gray.700';
  const headerBg = 'gray.800';
  const hoverBg = 'gray.700';
  const searchBg = 'gray.800';

  // CSS for animations
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    
    @keyframes slideDown {
      from { max-height: 0; opacity: 0; }
      to { max-height: 1000px; opacity: 1; }
    }
    
    @keyframes slideUp {
      from { max-height: 1000px; opacity: 1; }
      to { max-height: 0; opacity: 0; }
    }
    
    .category-content {
      overflow: hidden;
      transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    }
    
    .category-content-open {
      animation: slideDown 0.3s ease-in-out forwards;
      transform-origin: top;
    }
    
    .category-content-closed {
      animation: slideUp 0.3s ease-in-out forwards;
      transform-origin: top;
      max-height: 0;
      opacity: 0;
    }
    
    .category-header {
      transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;
    }
    
    .category-header:hover {
      transform: translateX(2px);
    }
    
    .chevron {
      transition: transform 0.3s ease-in-out;
    }
    
    .chevron-open {
      transform: rotate(0deg);
    }
    
    .chevron-closed {
      transform: rotate(-90deg);
    }
    
    .node-button:active {
      animation: pulse 0.3s ease-in-out;
    }
  `;

  return (
    <Box 
      height="100%" 
      overflowY="auto" 
      p={4}
      borderRight="1px solid"
      borderColor={borderColor}
      bg={panelBg}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'gray transparent',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Search input */}
      <Box mb={4} position="relative">
        <Box position="relative">
          <Input 
            placeholder="Search nodes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            borderRadius="full"
            bg={searchBg}
            paddingLeft="2.5rem"
            _focus={{
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
              borderColor: 'brand.500',
            }}
            transition="all 0.2s"
          />
          <Box 
            position="absolute" 
            left="1rem" 
            top="50%" 
            transform="translateY(-50%)"
            color="gray.500"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Box>
        </Box>
      </Box>
      
      <Box>
        {filteredCategories.map((category) => (
          <Box 
            key={category.id} 
            borderRadius="md" 
            overflow="hidden"
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{ boxShadow: 'md' }}
            mb={3}
          >
            <Flex 
              py={2} 
              px={3}
              alignItems="center"
              cursor="pointer"
              onClick={() => toggleCategory(category.id)}
              bg={headerBg}
              className="category-header"
              _hover={{ bg: hoverBg }}
            >
              <Box 
                mr={2}
                className={`chevron ${expandedCategories[category.id] ? 'chevron-open' : 'chevron-closed'}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
              <Heading 
                size="sm" 
                color={category.color}
                fontWeight="600"
              >
                {category.label}
              </Heading>
            </Flex>
            
            <Box 
              className={`category-content ${expandedCategories[category.id] ? 'category-content-open' : 'category-content-closed'}`}
              ref={(el: HTMLDivElement | null) => contentRefs.current[category.id] = el}
            >
              <Box p={2}>
                {category.nodeTypes.map((nodeType) => {
                  const template = nodeTemplates[nodeType];
                  return template ? (
                    <Button 
                      key={nodeType}
                      size="sm"
                      justifyContent="flex-start"
                      variant="ghost"
                      borderRadius="md"
                      fontWeight="normal"
                      py={1}
                      px={3}
                      mb={1}
                      width="100%"
                      onClick={() => handleAddNode(template)}
                      _hover={{ 
                        bg: 'rgba(66, 153, 225, 0.08)',
                        transform: 'translateX(2px)'
                      }}
                      _active={{
                        bg: 'rgba(66, 153, 225, 0.16)',
                      }}
                      className="node-button"
                      transition="all 0.2s"
                    >
                      {template.label}
                    </Button>
                  ) : null;
                })}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default NodeLibrary; 