import React, { useState, useEffect } from 'react';
import { Box, Text, Textarea, Stack } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';

/**
 * FloatingPropertiesPanel component - displays the description and comments of the selected node
 * in a floating panel in the bottom right corner of the graph
 */
export const FloatingPropertiesPanel: React.FC = () => {
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
  const bgColor = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const textColor = isDark ? 'white' : 'gray.800';
  const placeholderColor = isDark ? 'gray.500' : 'gray.400';
  const inputBgColor = isDark ? 'gray.700' : 'gray.50';
  const descriptionBgColor = isDark ? 'gray.700' : 'gray.100';
  
  // Find the selected node
  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  
  // If no node is selected, don't render anything
  if (!selectedNode) {
    return null;
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
      position="absolute"
      right="20px"
      bottom="20px"
      zIndex={10}
      width="300px"
      bg={bgColor}
      borderRadius="md"
      boxShadow="0 0 10px rgba(0,0,0,0.2)"
      border="1px solid"
      borderColor={borderColor}
      p={3}
      data-testid="node-details-panel"
    >
      <Text fontSize="md" fontWeight="bold" mb={2} color={textColor}>
        {selectedNode.data.label} Details
      </Text>
      
      <Stack gap={3}>
        <Box>
          <Text fontSize="xs" mb={1} color={textColor}>Description</Text>
          <Box 
            p={2}
            bg={descriptionBgColor}
            borderRadius="md"
            fontSize="sm"
            color={textColor}
            border="1px solid"
            borderColor={borderColor}
            minHeight="40px"
          >
            {properties.description || 'No description available.'}
          </Box>
        </Box>
        
        <Box>
          <Text fontSize="xs" mb={1} color={textColor}>Comment (will appear in generated code)</Text>
          <Textarea 
            value={properties.comment || ''}
            onChange={(e) => handlePropertyChange('comment', e.target.value)}
            placeholder="Add a comment for this node..."
            size="sm"
            bg={inputBgColor}
            color={textColor}
            _placeholder={{ color: placeholderColor }}
            resize="vertical"
            rows={3}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default FloatingPropertiesPanel; 