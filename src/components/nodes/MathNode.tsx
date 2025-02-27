import React, { useEffect, useState } from 'react';
import { NodeProps } from '../../types/node';
import { Box, Select, MenuItem, Typography, SelectChangeEvent } from '@mui/material';
import { ConnectionHandle } from '../canvas/ConnectionHandle';

type Operation = 'add' | 'subtract';

export const MathNode: React.FC<NodeProps> = ({ 
  id, 
  inputs = [], 
  outputs = [], 
  onInputChange,
  onOutputChange,
  onStartConnection,
  onEndConnection,
  onPortHover,
  onPortHoverEnd,
  hoveredPortId,
  isValidConnection
}) => {
  const [operation, setOperation] = useState<Operation>('add');
  const [input1, setInput1] = useState<number>(0);
  const [input2, setInput2] = useState<number>(0);

  useEffect(() => {
    // Calculate result based on operation
    const result = operation === 'add' 
      ? input1 + input2 
      : input1 - input2;

    // Update output if available
    if (outputs.length > 0) {
      onOutputChange?.(id, outputs[0].id, result);
    }
  }, [input1, input2, operation, id, outputs, onOutputChange]);

  // Update input values when they change
  const handleInput1Change = (value: number) => {
    setInput1(value);
  };

  const handleInput2Change = (value: number) => {
    setInput2(value);
  };

  const handleOperationChange = (event: SelectChangeEvent<string>) => {
    setOperation(event.target.value as Operation);
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
        Math Node
      </Typography>
      <Select
        value={operation}
        onChange={handleOperationChange}
        size="small"
        fullWidth
        sx={{ mb: 1 }}
      >
        <MenuItem value="add">Add</MenuItem>
        <MenuItem value="subtract">Subtract</MenuItem>
      </Select>
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption">
          Result: {operation === 'add' ? input1 + input2 : input1 - input2}
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

export default MathNode; 