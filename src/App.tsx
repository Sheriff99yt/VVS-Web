import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { NodeLibrary } from './components/NodeLibrary';
import { GraphEditor } from './components/GraphEditor';
import { CodePreview } from './components/CodePreview';
import { Toolbar } from './components/Toolbar';
import InfoPanel from './components/InfoPanel';
import 'reactflow/dist/style.css';

/**
 * Main App component
 */
function App() {
  // State for panel widths and info panel
  const [codePreviewWidth, setCodePreviewWidth] = useState(400);
  const [nodeLibraryWidth, setNodeLibraryWidth] = useState(250);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const dragStartXRef = useRef(0);
  const initialWidthRef = useRef(0);

  // Handle mouse events for right resizer (code panel)
  const handleRightDragStart = (e: React.MouseEvent) => {
    setIsDraggingRight(true);
    dragStartXRef.current = e.clientX;
    initialWidthRef.current = codePreviewWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle mouse events for left resizer (node library)
  const handleLeftDragStart = (e: React.MouseEvent) => {
    setIsDraggingLeft(true);
    dragStartXRef.current = e.clientX;
    initialWidthRef.current = nodeLibraryWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle mouse move and up events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        const deltaX = dragStartXRef.current - e.clientX;
        const newWidth = Math.max(200, Math.min(800, initialWidthRef.current + deltaX));
        setCodePreviewWidth(newWidth);
      } else if (isDraggingLeft) {
        const deltaX = e.clientX - dragStartXRef.current;
        const newWidth = Math.max(150, Math.min(500, initialWidthRef.current + deltaX));
        setNodeLibraryWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      setIsDraggingLeft(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDraggingRight || isDraggingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight, isDraggingLeft]);

  return (
    <Flex height="100vh" width="100vw" direction="column">
      {/* Toolbar */}
      <Toolbar isInfoOpen={isInfoOpen} onInfoToggle={() => setIsInfoOpen(!isInfoOpen)} />
      
      {/* Main content */}
      <Flex flex="1" overflow="hidden" position="relative">
        {/* Left panel: Node Library */}
        <Box width={`${nodeLibraryWidth}px`} height="100%" position="relative">
          <NodeLibrary />
          
          {/* Left resizer */}
          <Box
            position="absolute"
            top="0"
            right="0"
            width="4px"
            height="100%"
            cursor="ew-resize"
            bg="transparent"
            _hover={{ bg: "blue.500", opacity: 0.5 }}
            onMouseDown={handleLeftDragStart}
            zIndex="10"
          />
        </Box>
        
        {/* Middle panel: Graph Editor */}
        <Box flex="1" height="100%">
          <GraphEditor />
        </Box>
        
        {/* Right panel: Code Preview */}
        <Box width={`${codePreviewWidth}px`} height="100%" position="relative">
          <CodePreview />
          
          {/* Right resizer */}
          <Box
            position="absolute"
            top="0"
            left="0"
            width="4px"
            height="100%"
            cursor="ew-resize"
            bg="transparent"
            _hover={{ bg: "blue.500", opacity: 0.5 }}
            onMouseDown={handleRightDragStart}
            zIndex="10"
          />
        </Box>

        {/* Info Panel */}
        <InfoPanel isOpen={isInfoOpen} />
      </Flex>
    </Flex>
  );
}

export default App;
