import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { Box, Text } from '@chakra-ui/react';
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

  return (
    <Box
      borderRadius="md"
      border="2px solid"
      borderColor={selected ? 'white' : nodeColor}
      bg="gray.800"
      p={2}
      minWidth="200px"
      maxWidth="300px"
      boxShadow={selected ? '0 0 10px white' : '0 0 5px rgba(0,0,0,0.5)'}
      position="relative"
    >
      {/* Node header */}
      <Box
        bg={nodeColor}
        p={2}
        borderRadius="md"
        mb={2}
      >
        <Text fontWeight="bold" textAlign="center">{data.label}</Text>
        <Text fontSize="xs" textAlign="center" opacity={0.8}>
          {nodeCategory}
        </Text>
      </Box>

      {/* Node content with inputs and outputs */}
      <Box display="flex">
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
      </Box>
    </Box>
  );
});

export default BaseNode; 