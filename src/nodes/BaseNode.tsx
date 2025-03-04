import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { Box, Text, Flex, useToken } from '@chakra-ui/react';
import { BaseNodeData, NodeType, NODE_CATEGORIES, NodeCategory } from './types';
import Socket from '../sockets/Socket';

/**
 * Base node component for all node types
 * Displays node with its inputs and outputs
 */
export const BaseNode: React.FC<NodeProps<BaseNodeData>> = memo(({ data, selected }) => {
  // Find the category for this node type
  const getNodeCategory = (type: NodeType): NodeCategory | undefined => {
    const category = NODE_CATEGORIES.find((cat) => cat.nodeTypes.includes(type));
    return category?.id;
  };

  // Get the color for this node type
  const getNodeColor = (type: NodeType): string => {
    const category = NODE_CATEGORIES.find((cat) => cat.nodeTypes.includes(type));
    return category?.color || '#888';
  };

  const nodeColor = getNodeColor(data.type);
  const nodeCategory = getNodeCategory(data.type);
  
  // Get brand colors from theme
  const [brand500, brand600] = useToken('colors', ['brand.500', 'brand.600']);

  return (
    <Box
      borderRadius="xl"
      border="1px solid"
      borderColor={selected ? 'white' : 'gray.700'}
      bg="gray.800"
      minWidth="180px"
      maxWidth="280px"
      overflow="hidden"
      boxShadow={selected 
        ? `0 0 0 1px white, 0 8px 25px -5px rgba(0,0,0,0.5), 0 0 15px -3px ${nodeColor}40` 
        : `0 4px 15px -3px rgba(0,0,0,0.3)`
      }
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: selected 
          ? `0 0 0 1px white, 0 12px 30px -5px rgba(0,0,0,0.6), 0 0 20px -3px ${nodeColor}60` 
          : `0 8px 25px -5px rgba(0,0,0,0.4), 0 0 10px -3px ${nodeColor}30`
      }}
      className="node-container"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Node header */}
      <Box
        borderTop={`3px solid ${nodeColor}`}
        py={2.5}
        px={3.5}
        bg="gray.900"
        borderBottom="1px solid"
        borderColor="gray.700"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: `linear-gradient(90deg, ${nodeColor}10 0%, transparent 100%)`,
          opacity: selected ? 0.2 : 0.1,
          pointerEvents: 'none',
        }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Text 
            fontWeight="semibold" 
            fontSize="sm"
            letterSpacing="tight"
            textShadow={selected ? `0 0 8px ${nodeColor}80` : 'none'}
            transition="text-shadow 0.2s ease"
          >
            {data.label}
          </Text>
          <Text 
            fontSize="xs" 
            opacity={0.8}
            color={nodeColor}
            fontWeight="medium"
            px={1.5}
            py={0.5}
            borderRadius="md"
            bg={`${nodeColor}15`}
            letterSpacing="0.02em"
            textTransform="uppercase"
          >
            {nodeCategory}
          </Text>
        </Flex>
      </Box>

      {/* Node content with inputs and outputs */}
      <Box 
        p={3} 
        bg="gray.800"
        position="relative"
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)',
          pointerEvents: 'none',
        }}
      >
        <Flex>
          {/* Inputs on the left */}
          <Box flex="1">
            {data.inputs.map((socket) => (
              <Socket
                key={socket.id}
                socket={socket}
                position={Position.Left}
              />
            ))}
          </Box>

          {/* Outputs on the right */}
          <Box flex="1">
            {data.outputs.map((socket) => (
              <Socket
                key={socket.id}
                socket={socket}
                position={Position.Right}
              />
            ))}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
});

export default BaseNode; 