/**
 * Language configuration system for code generation
 * Defines syntax templates and formatting rules for different programming languages
 */

/**
 * Language configuration interface
 * Contains all the necessary templates and settings for a specific language
 */
export interface LanguageConfig {
  name: string;
  fileExtension: string;
  monacoLanguage: string;
  syntax: {
    // Flow control
    ifStatement: string;
    elseStatement: string;
    forLoop: string;
    whileLoop: string;
    
    // Function related
    functionDefinition: string;
    functionCall: string;
    returnStatement: string;
    
    // Variable related
    variableDefinition: string;
    
    // Comments
    lineComment: string;
    blockCommentStart: string;
    blockCommentEnd: string;
    
    // I/O
    print: string;
    input: string;
  };
  operators: {
    // Math operators
    add: string;
    subtract: string;
    multiply: string;
    divide: string;
    
    // Logic operators
    and: string;
    or: string;
    not?: string;
    greaterThan: string;
    lessThan: string;
    equal: string;
    notEqual: string;
  };
  // Special formatting rules
  formatting: {
    indentation: string;
    statementEnd: string;
    blockStart: string;    // E.g., { or : or nothing
    blockEnd: string;      // E.g., } or nothing for indentation-based languages
  };
  
  // Special language-specific values for literals
  values?: {
    // Boolean values
    true?: string;
    false?: string;
    null?: string;
    // Other language-specific literals as needed
  };
  
  // Escape sequences for specific character handling
  escapeSequences?: {
    quote?: string;
    doubleQuote?: string;
    newline?: string;
    tab?: string;
    // Other escape sequences as needed
  };
  
  // Common imports or includes needed for the language
  standardImports?: string[];
}

/**
 * Python language configuration
 */
export const pythonConfig: LanguageConfig = {
  name: 'Python',
  fileExtension: 'py',
  monacoLanguage: 'python',
  syntax: {
    ifStatement: 'if $condition:',
    elseStatement: 'else:',
    forLoop: 'for $variable in range($start, $end):',
    whileLoop: 'while $condition:',
    functionDefinition: 'def $name($parameters):',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value',
    variableDefinition: '$name = $value',
    lineComment: '# $comment',
    blockCommentStart: '"""',
    blockCommentEnd: '"""',
    print: 'print($value)',
    input: 'input($prompt)',
  },
  operators: {
    add: '$left + $right',
    subtract: '$left - $right',
    multiply: '$left * $right',
    divide: '$left / $right',
    and: '$left and $right',
    or: '$left or $right',
    not: 'not $value',
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left == $right',
    notEqual: '$left != $right',
  },
  formatting: {
    indentation: '    ',
    statementEnd: '',
    blockStart: ':',
    blockEnd: '',
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
  standardImports: []
};

/**
 * TypeScript language configuration
 */
export const typeScriptConfig: LanguageConfig = {
  name: 'TypeScript',
  fileExtension: 'ts',
  monacoLanguage: 'typescript',
  syntax: {
    ifStatement: 'if ($condition) {',
    elseStatement: '} else {',
    forLoop: 'for (let $variable = $start; $variable < $end; $variable++) {',
    whileLoop: 'while ($condition) {',
    functionDefinition: 'function $name($parameters) {',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value',
    variableDefinition: 'let $name = $value',
    lineComment: '// $comment',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    print: 'console.log($value)',
    input: 'prompt($prompt)',
  },
  operators: {
    add: '$left + $right',
    subtract: '$left - $right',
    multiply: '$left * $right',
    divide: '$left / $right',
    and: '$left && $right',
    or: '$left || $right',
    not: '!$value',
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left === $right',
    notEqual: '$left !== $right',
  },
  formatting: {
    indentation: '  ',
    statementEnd: ';',
    blockStart: '{',
    blockEnd: '}',
  },
  values: {
    true: 'true',
    false: 'false',
    null: 'null'
  },
  escapeSequences: {
    quote: "\\'",
    doubleQuote: '\\"',
    newline: '\\n',
    tab: '\\t'
  },
  standardImports: []
};

/**
 * C++ language configuration
 */
export const cppConfig: LanguageConfig = {
  name: 'C++',
  fileExtension: 'cpp',
  monacoLanguage: 'cpp',
  syntax: {
    ifStatement: 'if ($condition) {',
    elseStatement: '} else {',
    forLoop: 'for (int $variable = $start; $variable < $end; $variable++) {',
    whileLoop: 'while ($condition) {',
    functionDefinition: '$returnType $name($parameters) {',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value',
    variableDefinition: '$type $name = $value',
    lineComment: '// $comment',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    print: 'std::cout << $value << std::endl',
    input: 'std::cin >> $variable',
  },
  operators: {
    add: '$left + $right',
    subtract: '$left - $right',
    multiply: '$left * $right',
    divide: '$left / $right',
    and: '$left && $right',
    or: '$left || $right',
    not: '!$value',
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left == $right',
    notEqual: '$left != $right',
  },
  formatting: {
    indentation: '    ',
    statementEnd: ';',
    blockStart: '{',
    blockEnd: '}',
  },
  values: {
    true: 'true',
    false: 'false',
    null: 'nullptr'
  },
  escapeSequences: {
    quote: "\\'",
    doubleQuote: '\\"',
    newline: '\\n',
    tab: '\\t'
  },
  standardImports: [
    '#include <iostream>',
    '#include <string>',
    '#include <vector>'
  ]
};

/**
 * Map of language configurations by name
 */
export const languageConfigs: Record<string, LanguageConfig> = {
  'Python': pythonConfig,
  'TypeScript': typeScriptConfig,
  'C++': cppConfig,
};

/**
 * Get language configuration by name
 * @param language The language name
 * @returns The language configuration
 */
export const getLanguageConfig = (language: string): LanguageConfig => {
  const normalizedName = language.toLowerCase();
  const config = Object.values(languageConfigs).find(
    (config) => config.name.toLowerCase() === normalizedName
  );
  return config || pythonConfig;
};

/**
 * Get available language names
 * @returns Array of available language names
 */
export const getAvailableLanguages = (): string[] => {
  return Object.values(languageConfigs).map(config => config.name);
}; 