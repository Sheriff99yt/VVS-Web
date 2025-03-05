import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Button,
  VStack,
  Text, 
  Heading
} from '@chakra-ui/react';
import { NodeLibrary } from './NodeLibrary';

interface SidePanelProps {
  width: number;
  onResize: (e: React.MouseEvent) => void;
  isDraggingLeft?: boolean;
}

/**
 * SidePanel component that displays tabs for Nodes, Library, Files, and AI
 */
export const SidePanel: React.FC<SidePanelProps> = ({ width, onResize, isDraggingLeft = false }) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'library' | 'files' | 'ai'>('nodes');
  const [isExpanded, setIsExpanded] = useState(true);

  // Handle tab click - toggle expansion when clicking the active tab
  const handleTabClick = (tab: 'nodes' | 'library' | 'files' | 'ai') => {
    if (tab === activeTab) {
      setIsExpanded(!isExpanded);
    } else {
      setActiveTab(tab);
      setIsExpanded(true);
    }
  };

  // Memoize content to prevent unnecessary re-renders
  const panelContent = React.useMemo(() => {
    if (!isExpanded) return null;
    
    switch (activeTab) {
      case 'nodes':
        return <NodeLibrary />;
      case 'library':
        return (
          <Box p={4}>
            <Heading size="md" mb={4}>Library</Heading>
            <Text>Library content will go here</Text>
          </Box>
        );
      case 'files':
        return (
          <Box p={4}>
            <Heading size="md" mb={4}>Files</Heading>
            <Text>File explorer will go here</Text>
          </Box>
        );
      case 'ai':
        return (
          <Box p={4}>
            <Heading size="md" mb={4}>AI Assistant</Heading>
            <Text>AI tools and assistance will be available here</Text>
          </Box>
        );
      default:
        return null;
    }
  }, [activeTab, isExpanded]);

  return (
    <Box 
      width={isExpanded ? `${width}px` : '40px'}
      height="100%"
      position="relative"
      className="side-panel"
      transition={isDraggingLeft ? 'none' : undefined}
    >
      <Flex height="100%">
        {/* Side tabs */}
        <VStack 
          width="40px" 
          py={4}
          gap={2}
          align="center"
          className="side-panel-tabs-container"
          transition={isDraggingLeft ? 'none' : undefined}
        >
          <Button
            variant="ghost"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="56px"
            width="100%"
            borderRadius={0}
            className={`side-panel-tab ${activeTab === 'nodes' ? 'active' : ''}`}
            onClick={() => handleTabClick('nodes')}
            aria-label="Nodes"
            title="Nodes"
            transition={isDraggingLeft ? 'none' : undefined}
          >
            <Box as="span" mb={1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Text fontSize="10px" fontWeight="medium" letterSpacing="0.01em">Nodes</Text>
          </Button>
          
          <Button
            variant="ghost"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="56px"
            width="100%"
            borderRadius={0}
            className={`side-panel-tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => handleTabClick('library')}
            aria-label="Library"
            title="Library"
            transition={isDraggingLeft ? 'none' : undefined}
          >
            <Box as="span" mb={1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Text fontSize="10px" fontWeight="medium" letterSpacing="0.01em">Library</Text>
          </Button>
          
          <Button
            variant="ghost"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="56px"
            width="100%"
            borderRadius={0}
            className={`side-panel-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => handleTabClick('files')}
            aria-label="Files"
            title="Files"
            transition={isDraggingLeft ? 'none' : undefined}
          >
            <Box as="span" mb={1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 5C2 3.89543 2.89543 3 4 3H8.17157C8.70201 3 9.21071 3.21071 9.58579 3.58579L11.4142 5.41421C11.7893 5.78929 12.298 6 12.8284 6H20C21.1046 6 22 6.89543 22 8V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Text fontSize="10px" fontWeight="medium" letterSpacing="0.01em">Files</Text>
          </Button>
          
          <Button
            variant="ghost"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="56px"
            width="100%"
            borderRadius={0}
            className={`side-panel-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => handleTabClick('ai')}
            aria-label="AI"
            title="AI Assistant"
            transition={isDraggingLeft ? 'none' : undefined}
          >
            <Box as="span" mb={1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.25 5.25L6.3 6.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.7 17.7L18.75 18.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.5 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.25 18.75L6.3 17.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.7 6.3L18.75 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Text fontSize="10px" fontWeight="medium" letterSpacing="0.01em">AI</Text>
          </Button>
        </VStack>
        
        {/* Content area */}
        {isExpanded && (
          <Box 
            flex="1" 
            height="100%" 
            overflow="auto"
            className="side-panel-content"
            opacity={isExpanded ? 1 : 0}
            style={{ 
              willChange: 'opacity',
              transition: isDraggingLeft ? 'none' : 'opacity 150ms ease-out'
            }}
          >
            {panelContent}
          </Box>
        )}
      </Flex>
      
      {/* Resizer */}
      {isExpanded && (
        <Box
          position="absolute"
          top="0"
          right="0"
          width="4px"
          height="100%"
          cursor="ew-resize"
          className="side-panel-resizer"
          onMouseDown={onResize}
          zIndex="10"
        />
      )}
    </Box>
  );
}; 