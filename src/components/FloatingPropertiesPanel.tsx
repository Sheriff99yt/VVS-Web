import React from 'react';
import { Box, Text, Input, Stack } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';

/**
 * FloatingPropertiesPanel component - displays properties of the selected node
 * in a floating panel in the bottom right corner of the graph
 */
export const FloatingPropertiesPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNodeProperty } = useGraphStore();
  
  // Find the selected node
  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  
  // If no node is selected, don't render anything
  if (!selectedNode) {
    return null;
  }
  
  // Get the properties of the selected node
  const { properties = {} } = selectedNode.data;
  
  // Map properties to form controls
  const propertyEntries = Object.entries(properties);
  
  // Handle property change
  const handlePropertyChange = (key: string, value: string) => {
    if (selectedNodeId) {
      updateNodeProperty(selectedNodeId, key, value);
    }
  };
  
  return (
    <Box 
      position="absolute"
      right="20px"
      bottom="20px"
      zIndex={10}
      width="250px"
      bg="gray.800"
      borderRadius="md"
      boxShadow="0 0 10px rgba(0,0,0,0.5)"
      border="1px solid"
      borderColor="gray.700"
      p={3}
    >
      <Text fontSize="md" fontWeight="bold" mb={2}>
        {selectedNode.data.label} Properties
      </Text>
      
      {propertyEntries.length === 0 ? (
        <Box 
          p={2} 
          bg="blue.800" 
          color="white" 
          borderRadius="md"
          fontSize="sm"
        >
          This node has no editable properties
        </Box>
      ) : (
        <Stack gap={3}>
          {propertyEntries.map(([key, value]) => (
            <Box key={key}>
              <Text fontSize="xs" mb={1}>{key}</Text>
              <Input 
                value={value}
                onChange={(e) => handlePropertyChange(key, e.target.value)}
                size="sm"
                bg="gray.700"
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default FloatingPropertiesPanel; 