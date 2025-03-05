import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { SocketDefinition } from '../sockets/types';
import { createPortal } from 'react-dom';

interface SocketTooltipProps {
  socket: SocketDefinition | null;
  position: { x: number; y: number } | null;
}

/**
 * A global tooltip component for displaying socket information
 * This is more performant than having hidden labels for each socket
 */
const SocketTooltip: React.FC<SocketTooltipProps> = ({ socket, position }) => {
  if (!socket || !position) return null;

  return createPortal(
    <Box
      className="socket-global-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <Box className="socket-tooltip-content">
        <Text className="socket-tooltip-name">
          {socket.name}
        </Text>
        <Text className="socket-tooltip-type">
          {socket.type}
        </Text>
      </Box>
    </Box>,
    document.body
  );
};

export default SocketTooltip; 