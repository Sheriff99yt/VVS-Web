import * as React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, useToken } from '@chakra-ui/react';
import { SocketDefinition, SocketDirection, SocketType } from './types';

/**
 * Socket component props
 * @param {SocketDefinition} socket - The socket definition
 * @param {Position} position - The position of the socket (left or right)
 * @param {boolean} isValidConnection - Whether this socket can be connected (for highlighting)
 * @param {boolean} isInvalidConnection - Whether this socket has an invalid connection attempt
 */
interface SocketProps {
  socket: SocketDefinition;
  position: Position;
  isValidConnection?: boolean;
  isInvalidConnection?: boolean;
}

/**
 * Socket component for node inputs/outputs
 * Provides visual distinction between socket types with color coding
 */
export const Socket: React.FC<SocketProps> = ({
  socket,
  position,
  isValidConnection = false,
  isInvalidConnection = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Get all socket colors from theme using the global mock
  const [
    booleanColor,
    booleanHoverColor,
    numberColor,
    numberHoverColor,
    stringColor,
    stringHoverColor,
    flowColor,
    flowHoverColor,
    anyColor,
    anyHoverColor,
    errorColor,
    errorHoverColor,
    compatibleColor
  ] = useToken('colors', [
    'socket.boolean',
    'socket.booleanHover',
    'socket.number',
    'socket.numberHover',
    'socket.string',
    'socket.stringHover',
    'socket.flow',
    'socket.flowHover',
    'socket.any',
    'socket.anyHover',
    'socket.error',
    'socket.errorHover',
    'socket.compatible'
  ]);

  // Maps socket types to their color from theme
  const getSocketColor = (type: SocketType, hovered: boolean): string => {
    if (isInvalidConnection) {
      return hovered ? errorHoverColor : errorColor;
    }

    if (isValidConnection) {
      return compatibleColor;
    }

    switch (type) {
      case SocketType.BOOLEAN:
        return hovered ? booleanHoverColor : booleanColor;
      case SocketType.NUMBER:
        return hovered ? numberHoverColor : numberColor;
      case SocketType.STRING:
        return hovered ? stringHoverColor : stringColor;
      case SocketType.FLOW:
        return hovered ? flowHoverColor : flowColor;
      case SocketType.ANY:
      default:
        return hovered ? anyHoverColor : anyColor;
    }
  };

  // Determine if this is an input or output socket
  const isConnectable = true;
  const isInput = socket.direction === SocketDirection.INPUT;
  // Using isInput to determine the handle type
  const handleType = isInput ? 'target' : 'source';

  // Get the socket color
  const socketColor = getSocketColor(socket.type, isHovered);

  // Calculate the glow effect for hover and valid/invalid connections
  let glowColor = 'transparent';
  let glowSize = '0px';

  if (isValidConnection) {
    glowColor = compatibleColor;
    glowSize = '5px';
  } else if (isInvalidConnection) {
    glowColor = errorColor;
    glowSize = '5px';
  } else if (isHovered) {
    glowColor = socketColor;
    glowSize = '4px';
  }

  return (
    <Box
      position="relative"
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent={position === Position.Left ? 'flex-start' : 'flex-end'}
      mb={1.5}
    >
      <Box
        title={`${socket.name} (${socket.type})`}
        data-testid="socket-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        display="flex"
        alignItems="center"
        opacity={isHovered ? 1 : 0.85}
        transition="opacity 0.2s ease"
        position="relative"
      >
        {/* Invisible larger hit area for better selection */}
        <Box
          position="absolute"
          width="24px"
          height="24px"
          left={position === Position.Left ? "-12px" : undefined}
          right={position === Position.Right ? "-12px" : undefined}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          borderRadius="50%"
        />
        
        <Handle
          type={handleType}
          position={position}
          id={socket.id}
          isConnectable={isConnectable}
          style={{
            width: '14px',
            height: '14px',
            background: socketColor,
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: `0 0 ${glowSize} ${glowColor}`,
            transition: 'all 0.2s ease-in-out',
            borderRadius: '50%',
            zIndex: 2,
          }}
        />
        <Box
          as="span"
          ml={position === Position.Left ? 2 : 0}
          mr={position === Position.Right ? 2 : 0}
          fontSize="xs"
          fontWeight="medium"
          color={isInvalidConnection ? errorColor :
                 isValidConnection ? compatibleColor :
                 'gray.300'}
          transition="color 0.2s ease-in-out"
          letterSpacing="tight"
        >
          {socket.name}
        </Box>
      </Box>
    </Box>
  );
};

export default Socket; 