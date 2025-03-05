import React, { memo, useCallback, useMemo } from 'react';
import { NodeProps, Position, useEdges, useReactFlow } from 'reactflow';
import { Box, Text } from '@chakra-ui/react';
import { BaseNodeData, NodeType } from './types';
import Socket from '../sockets/Socket';
import { SocketDefinition, SocketDirection, SocketType } from '../sockets/types';

/**
 * Simplified BaseNode component with only essential elements
 */
export const BaseNode: React.FC<NodeProps<BaseNodeData>> = memo(({ id, data, selected }) => {
  // Get all edges to check for connections
  const edges = useEdges();
  
  // Access to ReactFlow instance for updating node data
  const { setNodes } = useReactFlow();
  
  // Check if a socket is connected
  const isSocketConnected = useCallback((socketId: string, direction: SocketDirection) => {
    return edges.some(edge => 
      (direction === SocketDirection.INPUT && edge.target === id && edge.targetHandle === socketId) ||
      (direction === SocketDirection.OUTPUT && edge.source === id && edge.sourceHandle === socketId)
    );
  }, [edges, id]);
  
  // Handle socket value change
  const handleSocketValueChange = useCallback((socketId: string, value: any) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          const newData = { ...node.data };
          newData.inputs = newData.inputs.map((socket: SocketDefinition) => {
            if (socket.id === socketId) {
              return { ...socket, defaultValue: value };
            }
            return socket;
          });
          return { ...node, data: newData };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  // Determine category-specific styling
  const categoryColor = data.category ? 
    `var(--node-category-${data.category.toLowerCase().replace('_', '-')})` : 
    'var(--node-header)';

  // Sort the inputs and outputs to prioritize flow sockets
  const sortedInputs = useMemo(() => {
    return [...data.inputs].sort((a, b) => {
      // Flow sockets should come first
      if (a.type === SocketType.FLOW && b.type !== SocketType.FLOW) {
        return -1;
      } else if (a.type !== SocketType.FLOW && b.type === SocketType.FLOW) {
        return 1;
      }
      // Maintain original order for sockets of the same type
      return 0;
    });
  }, [data.inputs]);

  const sortedOutputs = useMemo(() => {
    return [...data.outputs].sort((a, b) => {
      // Flow sockets should come first
      if (a.type === SocketType.FLOW && b.type !== SocketType.FLOW) {
        return -1;
      } else if (a.type !== SocketType.FLOW && b.type === SocketType.FLOW) {
        return 1;
      }
      // Maintain original order for sockets of the same type
      return 0;
    });
  }, [data.outputs]);

  return (
    <Box
      className={`node-minimal ${selected ? 'selected' : ''}`}
      border="1px solid var(--node-border)"
      width="160px"
    >
      {/* Node header with category-based styling */}
      <Box
        className="node-header"
        bg={categoryColor}
        borderBottomColor="var(--node-border)"
      >
        <Text color="var(--text-color)">
          {data.label}
        </Text>
      </Box>

      {/* Node content - just sockets and inputs */}
      <Box className="node-content" margin="0">
        {/* Input sockets */}
        <Box className="node-inputs">
          {sortedInputs.map((socket: SocketDefinition) => (
            <Socket
              key={socket.id}
              socket={socket}
              position={Position.Left}
              isConnected={isSocketConnected(socket.id, socket.direction)}
              onValueChange={handleSocketValueChange}
            />
          ))}
        </Box>

        {/* Output sockets */}
        <Box className="node-outputs">
          {sortedOutputs.map((socket: SocketDefinition) => (
            <Socket
              key={socket.id}
              socket={socket}
              position={Position.Right}
              isConnected={isSocketConnected(socket.id, socket.direction)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default BaseNode; 