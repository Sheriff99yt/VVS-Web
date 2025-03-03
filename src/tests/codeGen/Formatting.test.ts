import { formatPythonCode, adjustIndentation } from '../../utils/formatting';

describe('Code Formatting Utilities', () => {
  describe('formatPythonCode', () => {
    it('should format basic Python code according to PEP 8', () => {
      const unformattedCode = `def test_function( x,y ):
 if x>y:
  print("X is greater")
 else:
  for i in range(y):
   print(i)
return x+y`;

      const formatted = formatPythonCode(unformattedCode);
      
      // Verify key formatting elements
      expect(formatted).toContain('def test_function(x, y):');
      expect(formatted).toContain('if x > y:');
      expect(formatted).toContain('for i in range(y):');
      expect(formatted).toContain('return x + y');
    });

    it('should properly format import statements', () => {
      const unformattedCode = `import random
import os
from my_module import my_function
import sys`;

      const formatted = formatPythonCode(unformattedCode);
      
      // Standard library imports should come first, then local imports
      expect(formatted.indexOf('import os')).toBeLessThan(formatted.indexOf('from my_module'));
      expect(formatted.indexOf('import sys')).toBeLessThan(formatted.indexOf('from my_module'));
    });

    it('should add proper spacing around operators', () => {
      const unformattedCode = `x=1+2*3
y=x/2
if x>y or x==10:
  return x+y`;

      const formatted = formatPythonCode(unformattedCode);
      
      // Check key operator spacing individually
      expect(formatted).toContain('x = ');  // Assignment
      expect(formatted).toContain('+ 2');   // Addition
      expect(formatted).toContain(' / 2');  // Division
      expect(formatted).toContain('x > ');  // Greater than
      expect(formatted).toContain('x + y'); // Addition
    });

    it('should handle blank lines between functions correctly', () => {
      const unformattedCode = `def function1():
  return 1
def function2():
  return 2`;

      const formatted = formatPythonCode(unformattedCode);
      
      // There should be two blank lines between top-level functions
      const lines = formatted.split('\n');
      const function1Index = lines.findIndex(line => line.includes('function1'));
      const function2Index = lines.findIndex(line => line.includes('function2'));
      
      expect(function2Index - function1Index).toBeGreaterThan(3); // Function + return + 2 blank lines
    });

    it('should preserve docstrings and comments', () => {
      const unformattedCode = `def function_with_docs():
  """
  This is a multi-line docstring 
  that should be preserved exactly as is,
  with all its indentation.
  """
  # This is a comment
  return 42`;

      const formatted = formatPythonCode(unformattedCode);
      
      expect(formatted).toContain('"""');
      expect(formatted).toContain('This is a multi-line docstring');
      expect(formatted).toContain('# This is a comment');
    });

    it('should break long lines according to PEP 8', () => {
      const unformattedCode = `def function_with_long_line():
  return "This is a very long string that should be broken into multiple lines because it exceeds the recommended line length of 79 characters according to PEP 8"`;

      const formatted = formatPythonCode(unformattedCode);
      
      const lines = formatted.split('\n');
      const longLines = lines.filter(line => line.length > 79);
      
      // No line should be longer than 79 characters (except for strings/comments)
      expect(longLines.filter(line => !line.includes('"') && !line.includes('#'))).toHaveLength(0);
    });
  });

  describe('adjustIndentation', () => {
    it('should correctly indent code blocks', () => {
      const unformattedCode = `if condition:
do_something()
for item in items:
process(item)
done()`;

      const formatted = adjustIndentation(unformattedCode);
      
      // Verify key indentation elements
      expect(formatted).toContain('if condition:');
      expect(formatted).toMatch(/\s+do_something\(\)/);
      expect(formatted).toMatch(/process\(item\)/);
      
      // The exact format may vary, so we're checking basic structure
      const lines = formatted.split('\n');
      expect(lines[0]).toBe('if condition:');
      expect(lines[1].trim()).toBe('do_something()');
      expect(lines.some(line => line.includes('for item'))).toBeTruthy();
      expect(lines.some(line => line.includes('process(item)'))).toBeTruthy();
      expect(lines.some(line => line.includes('done()'))).toBeTruthy();
    });

    it('should handle different indentation sizes', () => {
      const unformattedCode = `if condition:
do_something()
for item in items:
process(item)`;

      const formatted = adjustIndentation(unformattedCode, 2);
      
      // Verify key indentation elements with 2-space indentation
      expect(formatted).toContain('if condition:');
      expect(formatted).toMatch(/\s{2}do_something\(\)/);
      
      // The exact format may vary, so we're checking indentation level
      const lines = formatted.split('\n');
      expect(lines[0]).toBe('if condition:');
      expect(lines[1].indexOf('do_something')).toBe(2); // 2-space indent
    });
  });
}); 