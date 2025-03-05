import React from 'react';
import { Box } from '@chakra-ui/react';
import useGraphStore from '../store/useGraphStore';
import { getAvailableCodeLanguages } from '../utils/codeGenerator/index';

interface LanguageSelectorProps {
  width?: string;
  compact?: boolean;
}

/**
 * LanguageSelector component
 * Provides a dropdown for selecting the code generation language
 * Can be reused across the application for consistent language selection
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  width = '140px',
  compact = false
}) => {
  const { selectedLanguage, setSelectedLanguage } = useGraphStore();
  const availableLanguages = getAvailableCodeLanguages();
  
  // Handle language selection change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };
  
  return (
    <Box width={width}>
      <select
        value={selectedLanguage}
        onChange={handleLanguageChange}
        className="language-select"
        style={{
          width: '100%',
          padding: compact ? '0.25rem 0.4rem' : '0.35rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: compact ? '0.7rem' : '0.75rem',
          backgroundColor: 'var(--language-select-bg)',
          border: '1px solid var(--language-select-border)',
          color: 'var(--text-color)',
          outline: 'none'
        }}
        title="Select programming language"
      >
        {availableLanguages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </Box>
  );
};

export default LanguageSelector; 