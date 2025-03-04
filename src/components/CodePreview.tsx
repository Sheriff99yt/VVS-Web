import React, { useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import useGraphStore from '../store/useGraphStore';
import { generateCode, getAvailableCodeLanguages } from '../utils/codeGenerator/index';

/**
 * CodePreview component - displays the generated code
 */
export const CodePreview: React.FC = () => {
  const { 
    nodes, 
    edges, 
    updateGeneratedCode, 
    generatedCode, 
    selectedLanguage, 
    setSelectedLanguage 
  } = useGraphStore();
  
  // Available languages for code generation
  const availableLanguages = getAvailableCodeLanguages();
  
  // Generate code whenever nodes, edges, or selected language changes
  useEffect(() => {
    const code = generateCode(nodes, edges, selectedLanguage);
    updateGeneratedCode(code);
  }, [nodes, edges, selectedLanguage, updateGeneratedCode]);
  
  // Handle language selection change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };
  
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
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Generated Code
          </Text>
          <Box width="150px">
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              style={{
                width: '100%',
                padding: '0.25rem',
                backgroundColor: '#2D3748',
                color: 'white',
                border: '1px solid #4A5568',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              {availableLanguages.map((lang: string) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </Box>
        </Flex>
        <Text fontSize="sm" color="gray.400">
          This code is generated from your node graph in real-time.
        </Text>
      </Box>
      
      <Box flex="1" position="relative">
        <MonacoEditor
          height="100%"
          defaultLanguage="python"
          language={selectedLanguage.toLowerCase()}
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