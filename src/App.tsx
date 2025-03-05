import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { GraphEditor } from './components/GraphEditor';
import { CodePreview } from './components/CodePreview';
import { Toolbar } from './components/Toolbar';
import InfoPanel from './components/InfoPanel';
import { SidePanel } from './components/SidePanel';
import { SocketTooltipProvider, useSocketTooltip } from './contexts/SocketTooltipContext';
import SocketTooltip from './components/SocketTooltip';
import 'reactflow/dist/style.css';

/**
 * Main App component
 */
function App() {
  // State for panel widths and info panel
  const [codePreviewWidth, setCodePreviewWidth] = useState(400);
  const [sidePanelWidth, setSidePanelWidth] = useState(250);
  const [sidePanelCollapsedWidth] = useState(40); // Width when collapsed
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const dragStartXRef = useRef(0);
  const initialWidthRef = useRef(0);

  // Handle mouse events for right resizer (code panel)
  const handleRightDragStart = useCallback((e: React.MouseEvent) => {
    setIsDraggingRight(true);
    dragStartXRef.current = e.clientX;
    initialWidthRef.current = codePreviewWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [codePreviewWidth]);

  // Handle mouse events for left resizer (side panel)
  const handleLeftDragStart = useCallback((e: React.MouseEvent) => {
    setIsDraggingLeft(true);
    dragStartXRef.current = e.clientX;
    initialWidthRef.current = sidePanelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [sidePanelWidth]);

  // Handle mouse move and up events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        const deltaX = dragStartXRef.current - e.clientX;
        const newWidth = Math.max(200, Math.min(800, initialWidthRef.current + deltaX));
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          setCodePreviewWidth(newWidth);
        });
      } else if (isDraggingLeft) {
        const deltaX = e.clientX - dragStartXRef.current;
        const newWidth = Math.max(150, Math.min(500, initialWidthRef.current + deltaX));
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          setSidePanelWidth(newWidth);
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      setIsDraggingLeft(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDraggingRight || isDraggingLeft) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight, isDraggingLeft]);

  return (
    <SocketTooltipProvider>
      <Flex height="100vh" width="100vw" direction="column">
        {/* Toolbar */}
        <Toolbar isInfoOpen={isInfoOpen} onInfoToggle={() => setIsInfoOpen(!isInfoOpen)} />
        
        {/* Main content */}
        <Flex flex="1" overflow="hidden" position="relative">
          {/* Left panel: Side Panel with tabs */}
          <SidePanel 
            width={sidePanelWidth} 
            onResize={handleLeftDragStart} 
            isDraggingLeft={isDraggingLeft}
          />
          
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
              className="side-panel-resizer"
              onMouseDown={handleRightDragStart}
              zIndex="10"
            />
          </Box>

          {/* Info Panel */}
          <InfoPanel isOpen={isInfoOpen} />
        </Flex>
        
        {/* Global Socket Tooltip */}
        <SocketTooltipConsumer />
      </Flex>
    </SocketTooltipProvider>
  );
}

// Component to consume the socket tooltip context
const SocketTooltipConsumer = () => {
  const { hoveredSocket } = useSocketTooltip();
  return (
    <SocketTooltip 
      socket={hoveredSocket.socket} 
      position={hoveredSocket.position} 
    />
  );
};

export default App;
