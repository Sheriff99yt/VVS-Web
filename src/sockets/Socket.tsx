import * as React from 'react';
import { Handle, Position } from 'reactflow';
import { Box } from '@chakra-ui/react';
import { SocketDefinition, SocketDirection, SocketType } from './types';

/**
 * Socket component props
 * @param {SocketDefinition} socket - The socket definition
 * @param {Position} position - The position of the socket (left or right)
 */
interface SocketProps {
  socket: SocketDefinition;
  position: Position;
}

/**
 * Socket component for node inputs/outputs
 * Provides visual distinction between socket types
 */
export const Socket: React.FC<SocketProps> = ({ socket, position }) => {
  // Maps socket types to their color from theme
  const getSocketColor = (type: SocketType): string => {
    switch (type) {
      case SocketType.BOOLEAN:
        return 'socket.boolean';
      case SocketType.NUMBER:
        return 'socket.number';
      case SocketType.STRING:
        return 'socket.string';
      case SocketType.FLOW:
        return 'socket.flow';
      case SocketType.ANY:
      default:
        return 'socket.any';
    }
  };

  // Determine if this is an input or output socket
  const isConnectable = true;
  const isInput = socket.direction === SocketDirection.INPUT;
  // Using isInput to determine the handle type
  const handleType = isInput ? 'target' : 'source';

  return (
    <Box
      position="relative"
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent={position === Position.Left ? 'flex-start' : 'flex-end'}
      mb={1}
    >
      <Box
        title={`${socket.name} (${socket.type})`} 
        data-testid="socket-wrapper"
      >
        <Handle
          type={handleType}
          position={position}
          id={socket.id}
          isConnectable={isConnectable}
          style={{
            width: '12px',
            height: '12px',
            background: `var(--chakra-colors-${getSocketColor(socket.type)})`,
            border: '2px solid white',
          }}
        />
        <Box 
          as="span"
          ml={position === Position.Left ? 2 : 0}
          mr={position === Position.Right ? 2 : 0}
          fontSize="sm"
        >
          {socket.name}
        </Box>
      </Box>
    </Box>
  );
};

export default Socket; 