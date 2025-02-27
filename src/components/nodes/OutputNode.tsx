import React from 'react';
import { NodeProps } from '../../types/node';
import { Box, Typography } from '@mui/material';
import { ConnectionHandle } from '../canvas/ConnectionHandle';

export const OutputNode: React.FC<NodeProps> = ({ 
  id, 
  inputs = [],
  onStartConnection,
  onEndConnection,
  onPortHover,
  onPortHoverEnd,
  hoveredPortId,
  isValidConnection
}) => {
  const inputValue = inputs[0]?.value ?? 'No input';

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 2,
        minWidth: 200,
        boxShadow: 1,
        position: 'relative'
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Output Node
      </Typography>
      <Box
        sx={{
          mt: 1,
          p: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2">
          Value: {inputValue}
        </Typography>
      </Box>
      {inputs.map(input => (
        <ConnectionHandle
          key={input.id}
          port={input}
          position="left"
          onStartConnection={onStartConnection}
          onEndConnection={onEndConnection}
          onHover={onPortHover}
          onHoverEnd={onPortHoverEnd}
          isHovered={hoveredPortId === input.id}
          isValidConnection={isValidConnection}
        />
      ))}
    </Box>
  );
};

export default OutputNode; 