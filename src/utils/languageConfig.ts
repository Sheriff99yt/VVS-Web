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
    greaterThan: string;
    lessThan: string;
    equal: string;
    notEqual: string;
  };
  // Special formatting rules
  formatting: {
    indentation: string;
    statementEnd: string;
  };
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
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left == $right',
    notEqual: '$left != $right',
  },
  formatting: {
    indentation: '    ',
    statementEnd: '',
  },
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
    functionDefinition: 'function $name($parameters) {',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value;',
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
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left === $right',
    notEqual: '$left !== $right',
  },
  formatting: {
    indentation: '  ',
    statementEnd: ';',
  },
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
    functionDefinition: '$returnType $name($parameters) {',
    functionCall: '$name($arguments)',
    returnStatement: 'return $value;',
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
    greaterThan: '$left > $right',
    lessThan: '$left < $right',
    equal: '$left == $right',
    notEqual: '$left != $right',
  },
  formatting: {
    indentation: '    ',
    statementEnd: ';',
  },
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
  return languageConfigs[language] || pythonConfig;
};

/**
 * Get available language names
 * @returns Array of available language names
 */
export const getAvailableLanguages = (): string[] => {
  return Object.keys(languageConfigs);
}; 