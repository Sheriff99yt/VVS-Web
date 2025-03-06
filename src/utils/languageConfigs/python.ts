import { LanguageConfig } from '../languageConfig';

export const pythonConfig: LanguageConfig = {
  name: 'Python',
  fileExtension: 'py',
  monacoLanguage: 'python',
  syntax: {
    // ... existing code ...
  },
  operators: {
    // ... existing code ...
  },
  formatting: {
    // ... existing code ...
  },
  values: {
    true: 'True',
    false: 'False',
    null: 'None'
  },
  escapeSequences: {
    quote: "\\'",
    doubleQuote: '\\"',
    newline: '\\n',
    tab: '\\t'
  },
  standardImports: [
    // ... existing code ...
  ]
}; 