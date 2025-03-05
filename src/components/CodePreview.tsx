import React, { useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import useGraphStore from '../store/useGraphStore';
import { generateCode, getAvailableCodeLanguages } from '../utils/codeGenerator/index';
import { colorModeManager } from '../themes/theme';

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
        
        <Box width="120px">
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="language-select"
            style={{
              width: '100%',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem'
            }}
          >
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </Box>
      </Flex>
      
      <Box flex="1" overflow="hidden">
        <MonacoEditor
          height="100%"
          language={selectedLanguage.toLowerCase()}
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