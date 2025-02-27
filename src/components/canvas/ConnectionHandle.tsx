import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Port } from '../../types/node';

interface ConnectionHandleProps {
  port: Port;
  position: 'left' | 'right';
  onStartConnection?: (portId: string) => void;
  onEndConnection?: (portId: string) => void;
}

export const ConnectionHandle: React.FC<ConnectionHandleProps> = ({
  port,
  position,
  onStartConnection,
  onEndConnection
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.(port.id);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEndConnection?.(port.id);
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
          backgroundColor: 'primary.main',
          border: '2px solid',
          borderColor: 'background.paper',
          transform: 'translate(0, -50%)',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
        }}
        className="connection-handle"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </Tooltip>
  );
};

export default ConnectionHandle; 