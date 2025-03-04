import React from 'react';
import { Box, Text, Input, Stack } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';

/**
 * PropertiesPanel component - displays properties of the selected node
 */
export const PropertiesPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNodeProperty } = useGraphStore();
  
  // Find the selected node
  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  
  // If no node is selected, show a message
  if (!selectedNode) {
    return (
      <Box 
        height="100%" 
        p={4}
        borderLeft="1px solid"
        borderColor="gray.700"
        overflowY="auto"
      >
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Properties
        </Text>
        <Box 
          p={3} 
          bg="blue.800" 
          color="white" 
          borderRadius="md"
        >
          Select a node to view and edit its properties
        </Box>
      </Box>
    );
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
      height="100%" 
      p={4}
      borderLeft="1px solid"
      borderColor="gray.700"
      overflowY="auto"
    >
      <Text fontSize="xl" fontWeight="bold" mb={2}>
        Properties
      </Text>
      <Text fontSize="md" mb={4}>
        {selectedNode.data.label}
      </Text>
      
      {propertyEntries.length === 0 ? (
        <Box 
          p={3} 
          bg="blue.800" 
          color="white" 
          borderRadius="md"
        >
          This node has no editable properties
        </Box>
      ) : (
        <Stack gap={4}>
          {propertyEntries.map(([key, value]) => (
            <Box key={key}>
              <Text fontSize="sm" mb={1}>{key}</Text>
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

export default PropertiesPanel; 