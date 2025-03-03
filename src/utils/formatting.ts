/**
 * Formatting utilities for code generation and export
 */

/**
 * Format Python code to follow PEP 8 style guidelines
 * 
 * @param code The Python code to format
 * @returns Formatted Python code
 */
export function formatPythonCode(code: string): string {
  // Split the code into lines
  const lines = code.split('\n');
  const formattedLines: string[] = [];
  
  let indentLevel = 0;
  const indentSize = 4;
  
  // Track if we're inside a multiline string/docstring
  let inMultilineString = false;
  
  // Process each line
  for (let line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (trimmedLine === '') {
      formattedLines.push('');
      continue;
    }
    
    // Count triple quotes to track multiline strings
    const tripleQuotesCount = (trimmedLine.match(/"""/g) || []).length;
    if (tripleQuotesCount % 2 !== 0) {
      inMultilineString = !inMultilineString;
    }
    
    // Don't mess with indentation inside multiline strings
    if (inMultilineString) {
      formattedLines.push(line);
      continue;
    }
    
    // Decrease indent for lines ending a block (else, except, finally)
    if (
      trimmedLine.startsWith('else:') || 
      trimmedLine.startsWith('elif ') || 
      trimmedLine.startsWith('except') || 
      trimmedLine.startsWith('finally:')
    ) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    // Add appropriate indentation
    const indent = ' '.repeat(indentLevel * indentSize);
    
    // Apply proper spacing to function parameters and around operators (PEP 8 recommendation)
    let formattedLine = formatFunctionParameters(trimmedLine);
    formattedLine = applyOperatorSpacing(formattedLine);
    
    // Break long lines (PEP 8 recommends max 79 characters)
    formattedLine = breakLongLines(formattedLine, indent, 79);
    
    formattedLines.push(indent + formattedLine);
    
    // Increase indent for lines starting a new block
    if (trimmedLine.endsWith(':')) {
      indentLevel += 1;
    }
    
    // Decrease indent for lines ending a block
    if (trimmedLine.startsWith('return ') || trimmedLine.startsWith('break') || trimmedLine.startsWith('continue')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
  }
  
  // Apply additional PEP 8 formatting rules
  const formattedCode = formatImports(formattedLines.join('\n'));
  
  // Apply proper spacing between top-level functions and classes (PEP 8 requires 2 blank lines)
  return addBlankLinesBetweenDefinitions(formattedCode);
}

/**
 * Format function parameters according to PEP 8
 * e.g. "def func( x,y )" -> "def func(x, y)"
 */
function formatFunctionParameters(line: string): string {
  // Match function definitions and parameter lists
  const funcDefMatch = line.match(/^(def\s+\w+)\s*\(\s*(.*)\s*\):/);
  if (funcDefMatch) {
    const funcName = funcDefMatch[1];
    const params = funcDefMatch[2];
    
    // Format parameters: remove extra spaces and add a space after each comma
    const formattedParams = params
      .split(',')
      .map((param: string) => param.trim())
      .join(', ');
    
    return `${funcName}(${formattedParams}):`;
  }
  
  // For function calls, not just definitions
  return line.replace(/(\w+)\s*\(\s*(.*?)\s*\)/g, (match, funcName, params) => {
    const formattedParams = params
      .split(',')
      .map((param: string) => param.trim())
      .join(', ');
    
    return `${funcName}(${formattedParams})`;
  });
}

/**
 * Add proper spacing around operators according to PEP 8
 */
function applyOperatorSpacing(line: string): string {
  // First, fix the double equal problem directly
  let result = line.replace(/([^\s=!<>])={2}([^\s=])/g, '$1 == $2');  // x==y → x == y
  result = result.replace(/([^\s=!<>])\s+={2}\s+([^\s=])/g, '$1 == $2'); // x  ==  y → x == y
  
  // Fix the case where = = gets mistakenly created
  result = result.replace(/([^\s])\s+=\s+=\s+([^\s])/g, '$1 == $2');
  result = result.replace(/=\s+=/g, '==');
  
  // Handle 'or', 'and', 'not' keywords
  result = result.replace(/\b(and|or|not)\b/g, ' $1 ').replace(/\s{2,}/g, ' ');
  
  return result
    // Binary operators (+, -, *, /, %, **, //)
    .replace(/([^\s=!<>])([+\-*/%]|\/\/|\*\*)([^\s=])/g, '$1 $2 $3')
    // Fix multiplication and division specifically
    .replace(/([^\s])\s*\*\s*([^\s])/g, '$1 * $2')
    .replace(/([^\s])\s*\/\s*([^\s])/g, '$1 / $2')
    // Assignment (=, +=, -=, *=, /=, %=, **=, //=)
    .replace(/([^\s=!<>])([+\-*/%]|\/\/|\*\*)?=([^\s=])/g, '$1 $2= $3')
    // Comparison (==, !=, >, <, >=, <=)
    .replace(/([^\s=!<>])([=!><][=]?)([^\s])/g, '$1 $2 $3')
    // Fix specific comparison operators
    .replace(/([^\s])\s*>\s*([^\s])/g, '$1 > $2')
    .replace(/([^\s])\s*<\s*([^\s])/g, '$1 < $2')
    .replace(/([^\s])\s*>=\s*([^\s])/g, '$1 >= $2')
    .replace(/([^\s])\s*<=\s*([^\s])/g, '$1 <= $2')
    .replace(/([^\s])\s*==\s*([^\s])/g, '$1 == $2')
    .replace(/([^\s])\s*!=\s*([^\s])/g, '$1 != $2')
    // Assignment specifically
    .replace(/([^\s])\s*=\s*([^\s])/g, '$1 = $2')
    // Don't add space after a function name before parentheses
    .replace(/(\w+)\s\(/g, '$1(');
}

/**
 * Break long lines according to PEP 8 (max 79 chars)
 */
function breakLongLines(line: string, indent: string, maxLength: number): string {
  if (line.length <= maxLength - indent.length) {
    return line;
  }
  
  // Don't try to break strings or comments
  if (line.includes("'''") || line.includes('"""') || line.startsWith('#')) {
    return line;
  }
  
  // Simple logic: try to break at operators
  const breakPoints = [
    ' + ', ' - ', ' * ', ' / ', ' // ', ' % ', ' ** ', 
    ' == ', ' != ', ' > ', ' < ', ' >= ', ' <= ',
    ' and ', ' or ', ' not ', ', '
  ];
  
  for (const breakPoint of breakPoints) {
    const index = line.lastIndexOf(breakPoint, maxLength - indent.length);
    if (index > 0) {
      const firstLine = line.substring(0, index + breakPoint.length - 1);
      const continuationIndent = indent + ' '.repeat(4);  // Extra indentation for continued line
      const secondLine = continuationIndent + line.substring(index + breakPoint.length).trim();
      
      // Recursively handle the second line if it's still too long
      if (secondLine.length > maxLength) {
        return firstLine + '\\\n' + breakLongLines(secondLine.trim(), continuationIndent, maxLength);
      }
      
      return firstLine + '\\\n' + secondLine;
    }
  }
  
  // If no good break point found, don't modify the line
  return line;
}

/**
 * Format import statements according to PEP 8
 * 
 * @param code The Python code to format imports for
 * @returns Code with properly formatted imports
 */
function formatImports(code: string): string {
  // Simple import formatting for now - group imports at the top
  const lines = code.split('\n');
  const importLines: string[] = [];
  const fromImportLines: string[] = [];
  const nonImportLines: string[] = [];
  
  let inDocstring = false;
  let inComment = false;
  
  for (const line of lines) {
    // Handle docstrings
    if (line.includes('"""') && !inDocstring) {
      inDocstring = true;
      nonImportLines.push(line);
      continue;
    } else if (line.includes('"""') && inDocstring) {
      inDocstring = false;
      nonImportLines.push(line);
      continue;
    }
    
    if (inDocstring) {
      nonImportLines.push(line);
      continue;
    }
    
    // Collect import statements
    if (line.trim().startsWith('import ')) {
      importLines.push(line);
    } else if (line.trim().startsWith('from ')) {
      fromImportLines.push(line);
    } else {
      nonImportLines.push(line);
    }
  }
  
  // Sort imports: standard library first, then third party, then local
  const standardLibImports: string[] = [];
  const thirdPartyImports: string[] = [];
  const localImports: string[] = [];
  
  // Standard library modules (common ones, not comprehensive)
  const stdLibModules = [
    'abc', 'argparse', 'array', 'asyncio', 'base64', 'collections', 'copy',
    'csv', 'datetime', 'decimal', 'enum', 'functools', 'glob', 'hashlib',
    'io', 'itertools', 'json', 'logging', 'math', 'os', 'pathlib', 're',
    'random', 'string', 'subprocess', 'sys', 'tempfile', 'time', 'typing',
    'uuid', 'xml', 'zipfile'
  ];
  
  // Categorize imports
  for (const importLine of importLines) {
    const moduleName = importLine.trim().replace('import ', '').split(' as ')[0].trim();
    
    if (stdLibModules.includes(moduleName)) {
      standardLibImports.push(importLine);
    } else if (moduleName.includes('.')) {
      localImports.push(importLine);
    } else {
      thirdPartyImports.push(importLine);
    }
  }
  
  // Categorize from imports
  for (const fromImportLine of fromImportLines) {
    const match = fromImportLine.match(/from\s+([^\s]+)\s+import/);
    if (match) {
      const moduleName = match[1];
      
      if (stdLibModules.includes(moduleName.split('.')[0])) {
        standardLibImports.push(fromImportLine);
      } else if (moduleName.includes('.')) {
        localImports.push(fromImportLine);
      } else {
        thirdPartyImports.push(fromImportLine);
      }
    } else {
      // If we can't parse it, just add to third party
      thirdPartyImports.push(fromImportLine);
    }
  }
  
  // Sort each group alphabetically
  standardLibImports.sort();
  thirdPartyImports.sort();
  localImports.sort();
  
  // Combine with proper spacing between groups
  const sortedImports = [
    ...standardLibImports,
    standardLibImports.length > 0 && thirdPartyImports.length > 0 ? '' : '',
    ...thirdPartyImports,
    thirdPartyImports.length > 0 && localImports.length > 0 ? '' : '',
    ...localImports,
    importLines.length > 0 || fromImportLines.length > 0 ? '' : '' // Add a blank line after imports
  ].filter(line => line !== '');
  
  return [...sortedImports, ...nonImportLines].join('\n');
}

/**
 * Add blank lines between top-level function/class definitions per PEP 8
 */
function addBlankLinesBetweenDefinitions(code: string): string {
  const lines = code.split('\n');
  const formattedLines: string[] = [];
  
  let prevLineIsTopLevelDef = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this is a top-level definition
    const isTopLevelDef = (
      !line.startsWith(' ') && 
      (trimmedLine.startsWith('def ') || trimmedLine.startsWith('class '))
    );
    
    // Add blank lines before top-level definitions
    if (isTopLevelDef && i > 0 && !prevLineIsTopLevelDef) {
      // If previous line isn't already blank, add two blank lines
      if (lines[i-1].trim() !== '') {
        formattedLines.push('');
        formattedLines.push('');
      } else if (i > 1 && lines[i-2].trim() !== '') {
        // If we have just one blank line, add another
        formattedLines.push('');
      }
    }
    
    formattedLines.push(line);
    prevLineIsTopLevelDef = isTopLevelDef;
  }
  
  return formattedLines.join('\n');
}

/**
 * Ensure proper indentation for code blocks
 * 
 * @param code The code to adjust indentation for
 * @param indentSize Number of spaces per indentation level
 * @returns Properly indented code
 */
export function adjustIndentation(code: string, indentSize: number = 4): string {
  const lines = code.split('\n');
  const result: string[] = [];
  
  let currentIndent = 0;
  
  // First pass: analyze the code structure
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') {
      result.push('');
      continue;
    }
    
    // Handle block start (increase indent for next line)
    if (line.endsWith(':') || line.endsWith('{')) {
      result.push(' '.repeat(currentIndent) + line);
      currentIndent += indentSize;
      continue;
    }
    
    // Handle block end keywords (decrease indent for this line)
    if (line === '}' || line.startsWith('else:') || line.startsWith('elif ') || 
        line.startsWith('except') || line.startsWith('finally:')) {
      currentIndent = Math.max(0, currentIndent - indentSize);
      result.push(' '.repeat(currentIndent) + line);
      
      // But for else/elif/except/finally, we need to increase indent again for the next line
      if (line.endsWith(':')) {
        currentIndent += indentSize;
      }
      continue;
    }
    
    // Handle lines that should reset indentation
    // These are lines that don't end with a colon or brace,
    // and the next non-empty line starts at the same or lower indentation level
    let shouldResetIndent = false;
    
    if (i < lines.length - 1 && !line.endsWith(':') && !line.endsWith('{')) {
      // Find the next non-empty line
      let nextNonEmptyIdx = i + 1;
      while (nextNonEmptyIdx < lines.length && lines[nextNonEmptyIdx].trim() === '') {
        nextNonEmptyIdx++;
      }
      
      if (nextNonEmptyIdx < lines.length) {
        const nextLine = lines[nextNonEmptyIdx];
        const nextLineIndent = nextLine.search(/\S|$/);
        
        // If next line has less or equal indentation, and isn't part of a new block
        // and current line looks like a standalone statement (like "done()")
        if (
          nextLineIndent <= currentIndent && 
          !line.match(/^(if|for|while|def|class)\b.*:$/) &&
          line.match(/^[a-zA-Z_]\w*\(\)$/)
        ) {
          shouldResetIndent = true;
        }
      }
    }
    
    result.push(' '.repeat(currentIndent) + line);
    
    // Reset indentation if necessary
    if (shouldResetIndent) {
      currentIndent = 0;
    }
  }
  
  return result.join('\n');
} 