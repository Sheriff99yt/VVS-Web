import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Port } from '../../types/node';

interface ConnectionHandleProps {
  port: Port;
  position: 'left' | 'right';
  onStartConnection?: (portId: string) => void;
  onEndConnection?: (portId: string) => void;
  onHover?: (portId: string) => void;
  onHoverEnd?: () => void;
  isHovered?: boolean;
  isValidConnection?: boolean;
}

export const ConnectionHandle: React.FC<ConnectionHandleProps> = ({
  port,
  position,
  onStartConnection,
  onEndConnection,
  onHover,
  onHoverEnd,
  isHovered = false,
  isValidConnection = true
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.(port.id);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEndConnection?.(port.id);
  };

  const handleMouseEnter = () => {
    onHover?.(port.id);
  };

  const handleMouseLeave = () => {
    onHoverEnd?.();
  };

  const getHandleColor = () => {
    if (isHovered) {
      return isValidConnection ? '#4caf50' : '#f44336';
    }
    return 'primary.main';
  };

  return (
    <Tooltip title={`${port.name} (${port.dataType})`} placement={position === 'left' ? 'left' : 'right'}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          [position]: -6,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: getHandleColor(),
          border: '2px solid',
          borderColor: 'background.paper',
          transform: 'translate(0, -50%)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: isValidConnection ? '#4caf50' : '#f44336',
            transform: 'translate(0, -50%) scale(1.2)',
          },
        }}
        className="connection-handle"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </Tooltip>
  );
};

export default ConnectionHandle; 