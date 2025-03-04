import React, { useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import useGraphStore from '../store/useGraphStore';
import { generatePythonCode } from '../utils/codeGenerator';

/**
 * CodePreview component - displays the generated Python code
 */
export const CodePreview: React.FC = () => {
  const { nodes, edges, updateGeneratedCode, generatedCode } = useGraphStore();
  
  // Generate code whenever nodes or edges change
  useEffect(() => {
    const code = generatePythonCode(nodes, edges);
    updateGeneratedCode(code);
  }, [nodes, edges, updateGeneratedCode]);
  
  return (
    <Box 
      height="100%" 
      display="flex" 
      flexDirection="column"
      borderLeft="1px solid"
      borderColor="gray.700"
    >
      <Box 
        p={4} 
        borderBottom="1px solid" 
        borderColor="gray.700"
      >
        <Text fontSize="xl" fontWeight="bold">
          Generated Python Code
        </Text>
        <Text fontSize="sm" color="gray.400">
          This code is generated from your node graph in real-time.
        </Text>
      </Box>
      
      <Box flex="1" position="relative">
        <MonacoEditor
          height="100%"
          defaultLanguage="python"
          value={generatedCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </Box>
    </Box>
  );
};

export default CodePreview; 