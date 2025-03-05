import React, { useState, useRef, useMemo, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Text, 
  Heading, 
  Input,
  Flex,
} from '@chakra-ui/react';
import { NODE_CATEGORIES, NodeType, NodeCategory } from '../nodes/types';
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
  
  // Store the previous expanded state before search
  const [previousExpandedState, setPreviousExpandedState] = useState<Record<string, boolean>>({});
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    
    // If we're starting a search from empty, store the current expanded state
    if (searchQuery === '' && newQuery !== '') {
      setPreviousExpandedState({...expandedCategories});
      
      // Expand all categories when searching
      const allExpanded = NODE_CATEGORIES.reduce((acc, category) => ({
        ...acc,
        [category.id]: true
      }), {});
      
      setExpandedCategories(allExpanded);
    } 
    // If we're clearing the search, restore previous expanded state
    else if (newQuery === '' && searchQuery !== '') {
      setExpandedCategories(previousExpandedState);
    }
    
    setSearchQuery(newQuery);
  };
  
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
          createSocketDefinition('condition', 'Condition', SocketType.BOOLEAN, SocketDirection.INPUT, true, {
            enabled: true,
            label: 'Condition',
          }),
          createSocketDefinition('flow_in', 'Flow In', SocketType.FLOW, SocketDirection.INPUT),
        ],
        outputs: [
          createSocketDefinition('true_flow', 'True', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('false_flow', 'False', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          condition: 'True',
          description: 'Conditionally executes one of two branches based on whether the condition is true or false.',
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
          createSocketDefinition('start', 'Start', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            isInteger: true,
            min: 0,
          }),
          createSocketDefinition('end', 'End', SocketType.NUMBER, SocketDirection.INPUT, 10, {
            enabled: true,
            isInteger: true,
            min: 0,
          }),
          createSocketDefinition('step', 'Step', SocketType.NUMBER, SocketDirection.INPUT, 1, {
            enabled: true,
            isInteger: true,
            min: 1,
          }),
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
          description: 'Executes a loop from Start to End with the given Step size, providing the current value as output.',
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
          createSocketDefinition('a', 'A', SocketType.BOOLEAN, SocketDirection.INPUT, false, {
            enabled: true,
            label: 'A',
          }),
          createSocketDefinition('b', 'B', SocketType.BOOLEAN, SocketDirection.INPUT, false, {
            enabled: true,
            label: 'B',
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Performs a logical AND operation on two boolean inputs. Returns true only if both inputs are true.',
        }
      }),
    },
    [NodeType.OR]: {
      type: NodeType.OR,
      label: 'OR',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.BOOLEAN, SocketDirection.INPUT, false, {
            enabled: true,
            label: 'A',
          }),
          createSocketDefinition('b', 'B', SocketType.BOOLEAN, SocketDirection.INPUT, false, {
            enabled: true,
            label: 'B',
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Performs a logical OR operation on two boolean inputs. Returns true if either input is true.',
        },
      }),
    },
    [NodeType.GREATER_THAN]: {
      type: NodeType.GREATER_THAN,
      label: 'Greater Than',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            min: -Infinity,
            max: Infinity,
          }),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            min: -Infinity,
            max: Infinity,
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Compares two number inputs and returns true if the first value is greater than the second value.',
        },
      }),
    },
    [NodeType.LESS_THAN]: {
      type: NodeType.LESS_THAN,
      label: 'Less Than',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            min: -Infinity,
            max: Infinity,
          }),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            min: -Infinity,
            max: Infinity,
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Compares two number inputs and returns true if the first value is less than the second value.',
        },
      }),
    },
    [NodeType.EQUAL]: {
      type: NodeType.EQUAL,
      label: 'Equal',
      category: 'Logic Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.ANY, SocketDirection.INPUT, '', {
            enabled: true,
            placeholder: 'Value A',
          }),
          createSocketDefinition('b', 'B', SocketType.ANY, SocketDirection.INPUT, '', {
            enabled: true,
            placeholder: 'Value B',
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.BOOLEAN, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Compares two inputs of any type and returns true if they are equal.',
        },
      }),
    },
    
    // Math Operation nodes
    [NodeType.ADD]: {
      type: NodeType.ADD,
      label: 'Add',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            step: 0.1,
          }),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            step: 0.1,
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Adds two numbers together and outputs the sum.',
        },
      }),
    },
    [NodeType.SUBTRACT]: {
      type: NodeType.SUBTRACT,
      label: 'Subtract',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            step: 0.1,
          }),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            step: 0.1,
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Subtracts the second number from the first and outputs the difference.',
        },
      }),
    },
    [NodeType.MULTIPLY]: {
      type: NodeType.MULTIPLY,
      label: 'Multiply',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            step: 0.1,
          }),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT, 0, {
            enabled: true,
            step: 0.1,
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Multiplies two numbers together and outputs the product.',
        },
      }),
    },
    [NodeType.DIVIDE]: {
      type: NodeType.DIVIDE,
      label: 'Divide',
      category: 'Math Operations',
      createNodeData: () => ({
        inputs: [
          createSocketDefinition('a', 'A', SocketType.NUMBER, SocketDirection.INPUT, 1, {
            enabled: true,
            step: 0.1,
            min: 0,
          }),
          createSocketDefinition('b', 'B', SocketType.NUMBER, SocketDirection.INPUT, 1, {
            enabled: true,
            step: 0.1,
            min: 0.000001, // Prevent division by zero
          }),
        ],
        outputs: [
          createSocketDefinition('result', 'Result', SocketType.NUMBER, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Divides the first number by the second and outputs the quotient. Has safeguards to prevent division by zero.',
        },
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
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT, 0, {
            enabled: true,
          }),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          name: 'myVar',
          value: '0',
          description: 'Defines or updates a variable with the given name and value.',
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
          description: 'Retrieves the value of a previously defined variable by name.',
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
          createSocketDefinition('value', 'Value', SocketType.ANY, SocketDirection.INPUT, 'Hello World', {
            enabled: true,
            placeholder: 'Text to print',
          }),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
        ],
        properties: {
          description: 'Outputs the connected value to the console or standard output.',
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
          createSocketDefinition('prompt', 'Prompt', SocketType.STRING, SocketDirection.INPUT, 'Enter a value:', {
            enabled: true,
            placeholder: 'Prompt text',
            maxLength: 100,
          }),
        ],
        outputs: [
          createSocketDefinition('flow_out', 'Flow Out', SocketType.FLOW, SocketDirection.OUTPUT),
          createSocketDefinition('value', 'Value', SocketType.STRING, SocketDirection.OUTPUT),
        ],
        properties: {
          prompt: 'Enter a value:',
          description: 'Collects input from the user by displaying a prompt and returns the entered value.',
        },
      }),
    },
  } as Record<NodeType, NodeTemplate>;

  // Function to handle adding a node to the graph
  const handleAddNode = (template: NodeTemplate) => {
    // Convert template category string to NodeCategory enum
    let categoryEnum: NodeCategory | undefined;
    
    // Find the matching category definition
    const categoryDef = NODE_CATEGORIES.find(cat => cat.label === template.category);
    if (categoryDef) {
      categoryEnum = categoryDef.id;
    }
    
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'baseNode', // All nodes use the same component
      position: { x: 100, y: 100 },
      data: {
        ...template.createNodeData(),
        type: template.type,
        label: template.label,
        category: categoryEnum,
      },
    };
    
    addNode(newNode);
  };

  // Filter nodes based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return NODE_CATEGORIES;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
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
    .category-content {
      overflow: hidden;
      transition: max-height 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
                 opacity 0.15s ease, 
                 padding 0.15s ease,
                 transform 0.15s ease;
      transform-origin: top;
    }
    
    .category-header {
      transition: background-color 0.12s ease-in-out, transform 0.12s ease-in-out;
    }
    
    .category-header:hover {
      transform: translateX(1px);
    }
    
    .category-chevron {
      transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .node-button:active {
      transform: scale(0.98);
      transition: transform 0.08s ease;
    }
  `;

  // Get CSS variable for node category color
  const getCategoryColorVar = (categoryId: NodeCategory): string => {
    switch(categoryId) {
      case NodeCategory.PROCESS_FLOW:
        return 'var(--node-category-process-flow)';
      case NodeCategory.LOGIC:
        return 'var(--node-category-logic)';
      case NodeCategory.MATH:
        return 'var(--node-category-math)';
      case NodeCategory.VARIABLES:
        return 'var(--node-category-variables)';
      case NodeCategory.IO:
        return 'var(--node-category-io)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Render a single node item button
  const renderNodeItem = (type: NodeType, template: NodeTemplate) => {
    // Get CSS variable name for the category
    const categoryColorVar = getCategoryColorVar(template.category as NodeCategory);
    
    // Check if this node matches the search query
    const isMatch = searchQuery.trim() && 
                   template.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
    
    return (
      <Button 
        key={type}
        size="xs"
        variant="ghost"
        width="calc(50% - 2px)"
        minWidth="60px"
        maxWidth="100%"
        justifyContent="center"
        mb={0.5}
        py={0}
        px={1.5}
        height="19px"
        onClick={() => handleAddNode(template)}
        className={`node-button ${isMatch ? 'search-match' : ''}`}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        borderRadius="sm"
        position="relative"
        flexShrink={0}
        transition="transform 0.1s ease, background-color 0.1s ease, box-shadow 0.1s ease"
        _hover={{
          bg: 'var(--node-button-hover)',
          transform: 'translateY(-1px)',
        }}
        _active={{
          bg: 'var(--node-button-active)',
          transform: 'translateY(0) scale(0.98)',
        }}
        boxShadow={isMatch ? 'var(--node-button-match-shadow)' : 'var(--node-button-shadow)'}
        bg={isMatch ? 'var(--node-button-match-bg)' : 'transparent'}
      >
        <Box 
          position="absolute" 
          left="0" 
          top="0" 
          bottom="0" 
          width="2px" 
          borderRadius="0"
          className="node-button-indicator"
          style={{ 
            background: categoryColorVar,
            opacity: isMatch ? 1 : 0.7,
          }}
        />
        <Text 
          fontSize="xs" 
          fontWeight="medium"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {template.label}
        </Text>
      </Button>
    );
  };

  // Render a category section with its nodes
  const renderCategory = (category: NodeCategory) => {
    const isExpanded = expandedCategories[category] || false;
    
    // Find the corresponding category definition
    const categoryDef = NODE_CATEGORIES.find(cat => cat.id === category);
    
    // Get CSS variable name for the category
    const categoryColorVar = getCategoryColorVar(category);
    
    return (
      <Box key={category} mb={1} className="node-category" width="100%">
        <Flex 
          className="category-header"
          justifyContent="space-between" 
          alignItems="center" 
          p={1}
          pl={1.5}
          borderRadius="sm"
          cursor="pointer"
          onClick={() => toggleCategory(category)}
          _hover={{
            bg: 'var(--category-header-hover)',
          }}
        >
          <Flex alignItems="center" minWidth={0} flex="1">
            <Box 
              w="2px" 
              h="10px" 
              mr={1} 
              borderRadius="full"
              bg={categoryColorVar}
              className="category-indicator"
              flexShrink={0}
            />
            <Text 
              fontWeight="medium" 
              fontSize="xs"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {categoryDef ? categoryDef.label : category}
            </Text>
          </Flex>
          <Box
            className="category-chevron"
            transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"}
            opacity={0.6}
            h="14px"
            w="14px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.5 0.5L4 4L7.5 0.5" stroke="currentColor" strokeWidth="1" strokeLinecap="square"/>
            </svg>
          </Box>
        </Flex>

        <Box
          className="category-content nodes-grid"
          ref={(el: HTMLDivElement | null) => (contentRefs.current[category] = el)}
          overflow="hidden"
          maxH={isExpanded ? '500px' : '0px'}
          transition="max-height 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease, padding 0.15s ease, transform 0.15s ease"
          opacity={isExpanded ? 1 : 0}
          transform={isExpanded ? 'scaleY(1)' : 'scaleY(0.95)'}
          pl={2}
          pr={1}
          pt={isExpanded ? 1 : 0}
          pb={isExpanded ? 0.5 : 0}
          display="flex"
          flexWrap="wrap"
          justifyContent="space-between"
          width="100%"
        >
          {Object.entries(nodeTemplates)
            .filter(([_, template]) => template.category === category)
            .filter(([_, template]) => {
              if (!searchQuery.trim()) return true;
              return template.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
            })
            .map(([type, template]) => renderNodeItem(type as NodeType, template))}
        </Box>
      </Box>
    );
  };

  return (
    <Box 
      height="100%" 
      position="relative"
      borderRight="1px solid var(--node-library-border)"
      bg="var(--node-library-bg)"
      className="node-library"
      backdropFilter="blur(8px)"
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Search input - fixed at top */}
      <Box 
        position="sticky" 
        top="0" 
        zIndex="10"
        pt={2}
        pb={1.5}
        px={2}
        bg="var(--node-library-bg)"
        borderBottom="1px solid var(--node-library-border)"
        className="node-search-container"
        backdropFilter="blur(8px)"
      >
        <Box position="relative">
          <Box
            position="absolute"
            left="8px"
            top="50%"
            transform="translateY(-50%)"
            color="var(--search-icon-color)"
            zIndex="2"
            className="search-icon"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15.5 15.5M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Box>
          <Input 
            placeholder="Search nodes..." 
            value={searchQuery}
            onChange={handleSearchChange}
            borderRadius="sm"
            bg="var(--search-input-bg)"
            paddingLeft="28px"
            paddingRight="10px"
            className="search-input"
            size="xs"
            border="none"
            height="28px"
            boxShadow="var(--search-input-shadow)"
            _focus={{
              bg: 'var(--search-input-bg-focus)',
              boxShadow: 'var(--search-input-shadow-focus)',
            }}
            _hover={{
              bg: 'var(--search-input-bg-hover)',
            }}
            transition="all 0.2s ease"
          />
        </Box>
      </Box>
      
      {/* Scrollable nodes section */}
      <Box 
        flex="1"
        overflowY="auto" 
        className="nodes-container"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--scrollbar-thumb) transparent',
        }}
        p={2}
        pt={1}
      >
        {filteredCategories.map((category) => (
          renderCategory(category.id as NodeCategory)
        ))}
      </Box>
    </Box>
  );
};

export default NodeLibrary; 