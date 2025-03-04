import React, { useState, useEffect } from 'react';
import { Box, Text, Textarea, Stack } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';

/**
 * PropertiesPanel component - displays description and comments of the selected node
 */
export const PropertiesPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNodeProperty } = useGraphStore();
  const [isDark, setIsDark] = useState(true);
  
  // Effect to track theme changes
  useEffect(() => {
    // Initial theme check
    const theme = document.documentElement.getAttribute('data-theme');
    setIsDark(theme !== 'light');
    
    // Set up theme change observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          setIsDark(newTheme !== 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => observer.disconnect();
  }, []);
  
  // Theme-aware colors
  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const textColor = isDark ? 'white' : 'gray.800';
  const placeholderColor = isDark ? 'gray.500' : 'gray.400';
  const inputBgColor = isDark ? 'gray.700' : 'gray.50';
  const infoBgColor = isDark ? 'blue.800' : 'blue.50';
  const descriptionBgColor = isDark ? 'gray.700' : 'gray.100';
  
  // Find the selected node
  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  
  // If no node is selected, show a message
  if (!selectedNode) {
    return (
      <Box 
        height="100%" 
        p={4}
        borderLeft="1px solid"
        borderColor={borderColor}
        overflowY="auto"
      >
        <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
          Node Details
        </Text>
        <Box 
          p={3} 
          bg={infoBgColor} 
          color={textColor} 
          borderRadius="md"
        >
          Select a node to view and edit its details
        </Box>
      </Box>
    );
  }
  
  // Get the properties of the selected node
  const { properties = {} } = selectedNode.data;
  
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
      borderColor={borderColor}
      overflowY="auto"
      data-testid="node-details-panel"
    >
      <Text fontSize="xl" fontWeight="bold" mb={2} color={textColor}>
        Node Details
      </Text>
      <Text fontSize="md" mb={4} color={textColor}>
        {selectedNode.data.label}
      </Text>
      
      <Stack gap={4}>
        <Box>
          <Text fontSize="sm" mb={1} color={textColor}>Description</Text>
          <Box 
            p={3}
            bg={descriptionBgColor}
            borderRadius="md"
            fontSize="sm"
            color={textColor}
            border="1px solid"
            borderColor={borderColor}
            minHeight="60px"
          >
            {properties.description || 'No description available.'}
          </Box>
        </Box>
        
        <Box>
          <Text fontSize="sm" mb={1} color={textColor}>Comment (will appear in generated code)</Text>
          <Textarea 
            value={properties.comment || ''}
            onChange={(e) => handlePropertyChange('comment', e.target.value)}
            placeholder="Add a comment for this node..."
            size="sm"
            bg={inputBgColor}
            color={textColor}
            _placeholder={{ color: placeholderColor }}
            resize="vertical"
            rows={4}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default PropertiesPanel; 