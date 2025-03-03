import { SyntaxPattern, PatternType } from '../../models/syntax';

// Mock Functions for Testing
function applyPattern(
  pattern: string,
  params: Record<string, string>,
  indentation: number = 0
): string {
  // Apply parameters to the pattern
  let result = pattern;
  
  // Replace named parameters like {param_name}
  Object.entries(params).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  // Replace indexed parameters like {0}, {1}, etc.
  Object.entries(params).forEach(([key, value]) => {
    if (/^\d+$/.test(key)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  // Apply indentation if needed
  if (indentation > 0) {
    const indent = ' '.repeat(indentation);
    result = result.split('\n').map(line => indent + line).join('\n');
  }
  
  return result;
}

// Helper to create a syntax pattern
const createPattern = (
  id: number,
  functionId: number,
  pattern: string,
  patternType: PatternType,
  additionalImports: string[] = []
): SyntaxPattern => ({
  id,
  functionId,
  languageId: 1, // Default to Python
  pattern,
  patternType,
  additionalImports
});

describe('Syntax Pattern Application', () => {
  describe('Basic pattern application', () => {
    test('should apply expression patterns correctly', () => {
      const pattern = createPattern(
        1,
        1,
        '{a} + {b}',
        PatternType.EXPRESSION
      );
      
      const params = { a: 'x', b: 'y' };
      const result = applyPattern(pattern.pattern, params);
      
      expect(result).toBe('x + y');
    });
    
    test('should apply statement patterns correctly', () => {
      const pattern = createPattern(
        2,
        2,
        'print({value})',
        PatternType.STATEMENT
      );
      
      const params = { value: '"Hello, World!"' };
      const result = applyPattern(pattern.pattern, params);
      
      expect(result).toBe('print("Hello, World!")');
    });
    
    test('should apply block patterns correctly', () => {
      const pattern = createPattern(
        3,
        3,
        'if {condition}:\n    {body}',
        PatternType.BLOCK
      );
      
      const params = { 
        condition: 'x > 0',
        body: 'print(x)'
      };
      const result = applyPattern(pattern.pattern, params);
      
      expect(result).toBe('if x > 0:\n    print(x)');
    });
  });
  
  describe('Complex pattern handling', () => {
    test('should handle nested indentation correctly', () => {
      const outerPattern = createPattern(
        4,
        4,
        'for {item} in {collection}:\n    {body}',
        PatternType.BLOCK
      );
      
      const innerPattern = createPattern(
        5,
        5,
        'if {condition}:\n    {then_body}\nelse:\n    {else_body}',
        PatternType.BLOCK
      );
      
      // First apply the inner pattern
      const innerResult = applyPattern(innerPattern.pattern, {
        condition: 'item > 0',
        then_body: 'print("Positive")',
        else_body: 'print("Non-positive")'
      });
      
      // Then we need to indent the inner result before inserting it into the outer pattern
      const indentedInnerResult = innerResult.split('\n')
        .map(line => (line.trim() ? '    ' + line : line))
        .join('\n');
      
      // Then apply the outer pattern with the indented inner result as the body
      const result = applyPattern(outerPattern.pattern, {
        item: 'item',
        collection: 'items',
        body: indentedInnerResult
      });
      
      expect(result).toContain('for item in items:');
      expect(result).toContain('    if item > 0:');
      expect(result).toContain('        print("Positive")');
      expect(result).toContain('    else:');
      expect(result).toContain('        print("Non-positive")');
    });
    
    test('should handle indexed parameters correctly', () => {
      const pattern = createPattern(
        6,
        6,
        '{0} * {1} + {2}',
        PatternType.EXPRESSION
      );
      
      const params = { 
        '0': 'a',
        '1': 'b',
        '2': 'c'
      };
      const result = applyPattern(pattern.pattern, params);
      
      expect(result).toBe('a * b + c');
    });
    
    test('should apply indentation to multi-line patterns', () => {
      const pattern = createPattern(
        7,
        7,
        'try:\n    {try_body}\nexcept {exception_type} as e:\n    {except_body}',
        PatternType.BLOCK
      );
      
      const params = {
        try_body: 'result = 10 / x',
        exception_type: 'ZeroDivisionError',
        except_body: 'print("Cannot divide by zero")'
      };
      
      // Apply with 4-space indentation
      const result = applyPattern(pattern.pattern, params, 4);
      
      expect(result).toBe(
        '    try:\n' +
        '        result = 10 / x\n' +
        '    except ZeroDivisionError as e:\n' +
        '        print("Cannot divide by zero")'
      );
    });
  });
  
  describe('Edge cases and error handling', () => {
    test('should handle missing parameters by leaving them unreplaced', () => {
      const pattern = createPattern(
        8,
        8,
        'print({value}, {other_value})',
        PatternType.STATEMENT
      );
      
      // Only provide one parameter
      const params = { value: '"Hello"' };
      const result = applyPattern(pattern.pattern, params);
      
      // The other parameter should remain as is
      expect(result).toBe('print("Hello", {other_value})');
    });
    
    test('should handle empty parameters correctly', () => {
      const pattern = createPattern(
        9,
        9,
        'def {name}({params}):\n    {body}',
        PatternType.BLOCK
      );
      
      // Empty parameters
      const params = { 
        name: 'example_function',
        params: '',
        body: 'pass'
      };
      const result = applyPattern(pattern.pattern, params);
      
      expect(result).toBe('def example_function():\n    pass');
    });
    
    test('should preserve special characters in parameters', () => {
      const pattern = createPattern(
        10,
        10,
        'regex = r"{regex_pattern}"',
        PatternType.STATEMENT
      );
      
      // Parameter with special regex characters
      const params = { regex_pattern: '\\d+\\s+\\w+' };
      const result = applyPattern(pattern.pattern, params);
      
      expect(result).toBe('regex = r"\\d+\\s+\\w+"');
    });
  });
}); 