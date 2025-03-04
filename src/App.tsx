import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { NodeLibrary } from './components/NodeLibrary';
import { GraphEditor } from './components/GraphEditor';
import { CodePreview } from './components/CodePreview';
import { PropertiesPanel } from './components/PropertiesPanel';
import 'reactflow/dist/style.css';

/**
 * Main App component
 */
function App() {
  return (
    <Flex height="100vh" width="100vw" direction="column">
      {/* Header */}
      <Box 
        p={4} 
        borderBottom="1px solid" 
        borderColor="gray.700"
        bg="gray.800"
      >
        <Text fontSize="2xl" fontWeight="bold">
          Vision Visual Scripting (VVS) Web - MVP
        </Text>
        <Text fontSize="sm" color="yellow.300">
          This is an experimental version. Your work will be lost when you refresh the page.
        </Text>
      </Box>
      
      {/* Main content */}
      <Flex flex="1" overflow="hidden">
        {/* Left panel: Node Library */}
        <Box width="250px" height="100%">
          <NodeLibrary />
        </Box>
        
        {/* Middle panel: Graph Editor */}
        <Box flex="1" height="100%">
          <GraphEditor />
        </Box>
        
        {/* Right panels: Properties and Code Preview */}
        <Flex width="400px" height="100%" direction="column">
          <Box height="50%">
            <PropertiesPanel />
          </Box>
          <Box height="50%">
            <CodePreview />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default App;
