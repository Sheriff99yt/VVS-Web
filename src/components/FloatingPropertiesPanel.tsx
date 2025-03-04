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
  const [isHiding, setIsHiding] = useState(false);
  
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

  // Effect to handle fade out animation when node is deselected
  useEffect(() => {
    if (!selectedNodeId && !isHiding) {
      setIsHiding(true);
      // Reset hiding state after animation completes
      const timer = setTimeout(() => setIsHiding(false), 200);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId]);
  
  // Theme-aware colors
  const bgColor = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const textColor = isDark ? 'white' : 'gray.800';
  const placeholderColor = isDark ? 'gray.500' : 'gray.400';
  const inputBgColor = isDark ? 'gray.700' : 'gray.50';
  const descriptionBgColor = isDark ? 'gray.700' : 'gray.100';
  
  // Find the selected node
  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  
  // If no node is selected and not in hiding animation, don't render anything
  if (!selectedNode && !isHiding) {
    return null;
  }
  
  // Get the properties of the selected node
  const { properties = {} } = selectedNode?.data || {};
  
  // Handle property change
  const handlePropertyChange = (key: string, value: string) => {
    if (selectedNodeId) {
      updateNodeProperty(selectedNodeId, key, value);
    }
  };
  
  return (
    <Box
      className={`details-panel ${isHiding ? 'hiding' : ''}`}
      position="absolute"
      bottom="20px"
      right="20px"
      width="200px"
      zIndex={1000}
    >
      <Text className="details-panel-description">
        {properties.description || 'No description available'}
      </Text>
      <Textarea
        className="details-panel-comment"
        value={properties.comment || ''}
        onChange={(e) => handlePropertyChange('comment', e.target.value)}
        placeholder="Add a comment..."
      />
    </Box>
  );
};

export default FloatingPropertiesPanel; 