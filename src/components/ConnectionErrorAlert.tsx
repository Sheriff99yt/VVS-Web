import React, { useEffect } from 'react';
import { Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Box } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';

/**
 * Component to display connection errors
 * Automatically dismisses after a timeout
 */
export const ConnectionErrorAlert: React.FC = () => {
  const { connectionError, clearConnectionError } = useGraphStore();
  
  // Auto-dismiss the error after 5 seconds
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        clearConnectionError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionError, clearConnectionError]);
  
  if (!connectionError) return null;
  
  return (
    <Box
      position="absolute"
      top="20px"
      right="20px"
      zIndex={1000}
      width="400px"
    >
      <Alert status="error" variant="solid" borderRadius="md">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{connectionError}</AlertDescription>
        </Box>
        <CloseButton 
          position="absolute" 
          right="8px" 
          top="8px" 
          onClick={clearConnectionError}
        />
      </Alert>
    </Box>
  );
}; 