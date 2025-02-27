import React, { useState } from 'react';
import { NodeProps } from '../../types/node';
import { Box, TextField, Typography } from '@mui/material';
import { ConnectionHandle } from '../canvas/ConnectionHandle';

export const InputNode: React.FC<NodeProps> = ({ 
  id, 
  outputs = [], 
  onOutputChange,
  onStartConnection,
  onEndConnection,
  onPortHover,
  onPortHoverEnd,
  hoveredPortId,
  isValidConnection
}) => {
  const [value, setValue] = useState<number>(0);

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    setValue(newValue);
    // Update the output port with the new value
    if (outputs && outputs.length > 0) {
      onOutputChange?.(id, outputs[0].id, newValue);
    }
  };

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
        Input Node
      </Typography>
      <TextField
        type="number"
        value={value}
        onChange={handleValueChange}
        size="small"
        fullWidth
        label="Value"
        variant="outlined"
      />
      {outputs.map(output => (
        <ConnectionHandle
          key={output.id}
          port={output}
          position="right"
          onStartConnection={onStartConnection}
          onEndConnection={onEndConnection}
          onHover={onPortHover}
          onHoverEnd={onPortHoverEnd}
          isHovered={hoveredPortId === output.id}
          isValidConnection={isValidConnection}
        />
      ))}
    </Box>
  );
};

export default InputNode; 