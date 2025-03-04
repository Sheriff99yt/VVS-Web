import React, { memo, useEffect, useState, useCallback } from 'react';
import { NodeProps, Position, useEdges, getConnectedEdges, useReactFlow } from 'reactflow';
import { Box, Text, Flex, useToken } from '@chakra-ui/react';
import { BaseNodeData, NodeType, NODE_CATEGORIES, NodeCategory } from './types';
import Socket from '../sockets/Socket';
import { SocketDefinition, SocketDirection } from '../sockets/types';

/**
 * Base node component for all node types
 * Displays node with its inputs and outputs
 */
export const BaseNode: React.FC<NodeProps<BaseNodeData>> = memo(({ id, data, selected }) => {
  // State to track current theme
  const [isDark, setIsDark] = useState(true);
  
  // Get all edges to check for connections
  const edges = useEdges();
  
  // Access to ReactFlow instance for updating node data
  const { setNodes } = useReactFlow();
  
  // Effect to update when theme changes
  useEffect(() => {
    // Initial check
    const theme = document.documentElement.getAttribute('data-theme');
    setIsDark(theme !== 'light');
    
    // Create an observer to watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          setIsDark(newTheme !== 'light');
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, { attributes: true });
    
    // Cleanup
    return () => observer.disconnect();
  }, []);

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
  
  // Theme-aware colors
  const bgColor = isDark ? 'gray.800' : 'white';
  const headerBgColor = isDark ? 'gray.900' : 'gray.50';
  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const selectedBorderColor = isDark ? 'white' : 'brand.500';
  const textColor = isDark ? 'white' : 'gray.800';
  const shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)';
  
  // Check if a socket is connected
  const isSocketConnected = useCallback((socketId: string, direction: SocketDirection) => {
    return edges.some(edge => 
      (direction === SocketDirection.INPUT && edge.target === id && edge.targetHandle === socketId) ||
      (direction === SocketDirection.OUTPUT && edge.source === id && edge.sourceHandle === socketId)
    );
  }, [edges, id]);
  
  // Handle socket value change
  const handleSocketValueChange = useCallback((socketId: string, value: any) => {
    // Update the node data in the ReactFlow state
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          // Create a deep copy of the node data
          const newData = { ...node.data };
          
          // Find the socket in inputs and update its default value
          newData.inputs = newData.inputs.map((socket: SocketDefinition) => {
            if (socket.id === socketId) {
              return { ...socket, defaultValue: value };
            }
            return socket;
          });
          
          // Return updated node
          return {
            ...node,
            data: newData
          };
        }
        return node;
      })
    );
    
    console.log(`Socket ${socketId} value changed to:`, value);
  }, [id, setNodes]);

  return (
    <Box
      borderRadius="xl"
      border="1px solid"
      borderColor={selected ? selectedBorderColor : borderColor}
      bg={bgColor}
      minWidth="180px"
      maxWidth="280px"
      overflow="hidden"
      boxShadow={selected 
        ? `0 0 0 1px ${selectedBorderColor}, 0 8px 25px -5px ${shadowColor}` 
        : `0 4px 15px -3px ${shadowColor}`
      }
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: selected 
          ? `0 0 0 1px ${selectedBorderColor}, 0 12px 30px -5px ${shadowColor}` 
          : `0 8px 25px -5px ${shadowColor}`
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
        bg={headerBgColor}
        borderBottom="1px solid"
        borderColor={borderColor}
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
        <Text 
          fontWeight="semibold" 
          fontSize="sm"
          letterSpacing="tight"
          color={textColor}
        >
          {data.label}
        </Text>
      </Box>

      {/* Node content with inputs and outputs */}
      <Box 
        p={3} 
        bg={bgColor}
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
                isConnected={isSocketConnected(socket.id, socket.direction)}
                onValueChange={handleSocketValueChange}
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
                isConnected={isSocketConnected(socket.id, socket.direction)}
              />
            ))}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
});

export default BaseNode; 