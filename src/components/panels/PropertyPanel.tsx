import React from 'react';
import { Paper, Typography, Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { NodeData, Port } from '../../types/node';

interface PropertyPanelProps {
  selectedNode: NodeData | null;
  onNodeUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onPortValueChange: (nodeId: string, portId: string, value: any) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onNodeUpdate,
  onPortValueChange,
}) => {
  if (!selectedNode) {
    return (
      <Paper sx={{ width: 300, p: 2, height: '100%', bgcolor: 'background.paper' }}>
        <Typography variant="subtitle1" gutterBottom>
          Properties
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a node to view and edit its properties
        </Typography>
      </Paper>
    );
  }

  const handleInputChange = (port: Port, value: any) => {
    onPortValueChange(selectedNode.id, port.id, value);
  };

  const renderPortValue = (port: Port) => {
    switch (port.dataType) {
      case 'number':
        return (
          <TextField
            key={port.id}
            type="number"
            label={port.name}
            value={port.value ?? ''}
            onChange={(e) => handleInputChange(port, Number(e.target.value))}
            size="small"
            fullWidth
            margin="dense"
          />
        );
      case 'string':
        return (
          <TextField
            key={port.id}
            label={port.name}
            value={port.value ?? ''}
            onChange={(e) => handleInputChange(port, e.target.value)}
            size="small"
            fullWidth
            margin="dense"
          />
        );
      case 'boolean':
        return (
          <FormControl key={port.id} fullWidth margin="dense" size="small">
            <InputLabel>{port.name}</InputLabel>
            <Select
              value={port.value ?? false}
              label={port.name}
              onChange={(e) => handleInputChange(port, e.target.value === 'true')}
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ width: 300, p: 2, height: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" gutterBottom>
        {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Node Properties
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Position
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="X"
            type="number"
            value={selectedNode.position.x}
            onChange={(e) => onNodeUpdate(selectedNode.id, {
              position: { ...selectedNode.position, x: Number(e.target.value) }
            })}
            size="small"
          />
          <TextField
            label="Y"
            type="number"
            value={selectedNode.position.y}
            onChange={(e) => onNodeUpdate(selectedNode.id, {
              position: { ...selectedNode.position, y: Number(e.target.value) }
            })}
            size="small"
          />
        </Box>
      </Box>

      {selectedNode.inputs.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Inputs
          </Typography>
          {selectedNode.inputs.map(port => renderPortValue(port))}
        </Box>
      )}

      {selectedNode.outputs.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Outputs
          </Typography>
          {selectedNode.outputs.map(port => (
            <TextField
              key={port.id}
              label={port.name}
              value={port.value ?? ''}
              disabled
              size="small"
              fullWidth
              margin="dense"
            />
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default PropertyPanel; 