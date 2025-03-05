import React, { useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import useGraphStore from '../store/useGraphStore';
import { generateCode, getAvailableCodeLanguages } from '../utils/codeGenerator/index';
import { colorModeManager } from '../themes/theme';
import LanguageSelector from './LanguageSelector';

/**
 * CodePreview component - displays the generated code
 * Supports multiple programming languages through language selection
 */
export const CodePreview: React.FC = () => {
  const { 
    nodes, 
    edges, 
    updateGeneratedCode, 
    generatedCode, 
    selectedLanguage
  } = useGraphStore();
  
  // Get current theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  // Generate code whenever nodes, edges, or selected language changes
  useEffect(() => {
    const code = generateCode(nodes, edges, selectedLanguage);
    updateGeneratedCode(code);
  }, [nodes, edges, selectedLanguage, updateGeneratedCode]);
  
  // Apply additional Monaco editor configurations when theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      // Force Monaco editor to redraw with new theme
      const monacoEditors = document.querySelectorAll('.monaco-editor');
      if (monacoEditors.length > 0) {
        window.dispatchEvent(new Event('resize'));
      }
    };
    
    // Listen for theme changes
    window.addEventListener('storage', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);
  
  // Map language name to Monaco editor language identifier
  const getMonacoLanguageId = (language: string): string => {
    const languageMap: Record<string, string> = {
      'Python': 'python',
      'TypeScript': 'typescript',
      'C++': 'cpp',
      'Java': 'java',
      'Go': 'go',
      // Add more mappings as new languages are supported
    };
    
    return languageMap[language] || language.toLowerCase();
  };
  
  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
      borderLeft="1px solid"
      borderColor="border"
      bg="panelBg"
      className="code-preview"
    >
      <Flex 
        py={2} 
        px={3} 
        borderBottom="1px solid"
        borderColor="border"
        alignItems="center"
        justifyContent="space-between"
        bg="panelHeaderBg"
        className="code-header"
      >
        <Text fontSize="sm" fontWeight="medium">Code Preview</Text>
        <LanguageSelector width="140px" />
      </Flex>
      
      <Box flex="1" overflow="hidden">
        <MonacoEditor
          height="100%"
          language={getMonacoLanguageId(selectedLanguage)}
          value={generatedCode}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            wordWrap: 'on',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
            fontLigatures: true,
            renderWhitespace: 'none',
            guides: { indentation: true },
            folding: true,
            glyphMargin: false,
            contextmenu: true,
            smoothScrolling: true,
          }}
          theme={document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'vs-dark'}
        />
      </Box>
    </Box>
  );
};

export default CodePreview; 