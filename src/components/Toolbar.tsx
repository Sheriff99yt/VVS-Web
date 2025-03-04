import React, { useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Button,
  Text,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { colorModeManager } from '../themes/theme';

/**
 * Custom hook to handle color mode
 */
const useColorMode = () => {
  // Get initial color mode from document attribute
  const getInitialColorMode = (): 'light' | 'dark' => {
    return colorModeManager.get();
  };

  const [colorMode, setColorMode] = React.useState<'light' | 'dark'>(getInitialColorMode);
  
  // Effect to sync state with document attribute on mount
  useEffect(() => {
    const currentMode = colorModeManager.get();
    setColorMode(currentMode);

    // Listen for theme changes from other components
    const handleStorageEvent = () => {
      const newMode = colorModeManager.get();
      setColorMode(newMode);
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);
  
  const toggleColorMode = () => {
    const newColorMode = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(newColorMode);
    
    // Use the color mode manager to update the theme
    colorModeManager.set(newColorMode);
    
    // Force a re-render of Chakra UI components
    window.dispatchEvent(new Event('storage'));

    // Update Monaco editor theme if it exists
    const monacoEditors = document.querySelectorAll('.monaco-editor');
    if (monacoEditors.length > 0) {
      // This will trigger a re-render of the Monaco editor with the new theme
      window.dispatchEvent(new Event('resize'));
    }
  };
  
  return { colorMode, toggleColorMode };
};

interface ToolbarProps {
  isInfoOpen: boolean;
  onInfoToggle: () => void;
}

/**
 * Toolbar component for the application
 * Contains controls like theme toggle and other actions
 */
export const Toolbar: React.FC<ToolbarProps> = ({ isInfoOpen, onInfoToggle }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  return (
    <Box 
      width="100%" 
      py={1.5}
      px={4}
      borderBottom="1px solid"
      borderColor="toolbarBorder"
      bg="toolbarBg"
      className="toolbar"
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" gap={2}>
          <Text 
            fontSize="sm" 
            fontWeight="medium"
            bgGradient="linear(to-r, brand.500, purple.500)"
            bgClip="text"
            className="app-title"
          >
            VVS Web
          </Text>
          <Text fontSize="xs" color="textMuted" className="app-version">MVP</Text>
        </Flex>
        
        <Flex alignItems="center" gap={2}>
          <Box>
            <IconButton
              aria-label="Toggle info panel"
              title={isInfoOpen ? "Hide info panel" : "Show info panel"}
              children="ℹ️"
              onClick={onInfoToggle}
              colorScheme={isInfoOpen ? "blue" : "gray"}
              size="sm"
              variant="ghost"
            />
          </Box>
          <Button
            aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
            size="sm"
            variant="ghost"
            onClick={toggleColorMode}
            p={1}
            className="theme-toggle-button"
            data-testid="theme-toggle"
          >
            {colorMode === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 4.93L6.34 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.66 17.66L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.34 17.66L4.93 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.07 4.93L17.66 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Toolbar; 