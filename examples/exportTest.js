/**
 * Export Test Script
 * 
 * This script tests the functionality of the ExportService by generating
 * and exporting sample Python code from our example flows.
 */

// Mock browser environment for testing outside the browser
if (typeof window === 'undefined') {
  global.document = {
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    createElement: () => ({
      href: '',
      download: '',
      style: {},
      click: () => {}
    })
  };
  global.URL = {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {}
  };
  global.Blob = class Blob {
    constructor() {}
  };
}

// Import ExportService
const { ExportService } = require('../src/services/codeGen/ExportService');

// Sample code from calculator example
const calculatorCode = `# Simple Calculator Example

# Inputs
number1 = 10
number2 = 5

# Calculations
result_add = number1 + number2
result_subtract = number1 - number2
result_multiply = number1 * number2
result_divide = number1 / number2

# Output
print(f"Addition: {result_add}")
print(f"Subtraction: {result_subtract}")
print(f"Multiplication: {result_multiply}")
print(f"Division: {result_divide}")`;

// Sample code from string formatter example
const stringFormatterCode = `# String Formatter Example

# Inputs
first_name = "John"
last_name = "Doe"
age = 30
space = " "
age_text = ", age: "

# String operations
full_name = first_name + last_name
full_name_with_space = space + full_name
age_str = str(age)
formatted_age = age_text + age_str
formatted_string = full_name_with_space + formatted_age

# Output
print(formatted_string)`;

// Test exporting calculator code
async function testCalculatorExport() {
  const exportService = ExportService.getInstance();
  
  try {
    console.log('Testing calculator code export...');
    await exportService.exportPythonFile(calculatorCode, {
      fileName: 'calculator',
      includeTimestamp: true,
      addDocumentation: true,
      formatCode: true
    });
    console.log('Calculator code export successful!');
  } catch (error) {
    console.error('Calculator code export failed:', error);
  }
}

// Test exporting string formatter code
async function testStringFormatterExport() {
  const exportService = ExportService.getInstance();
  
  try {
    console.log('Testing string formatter code export...');
    await exportService.exportPythonFile(stringFormatterCode, {
      fileName: 'string_formatter',
      includeTimestamp: true,
      addDocumentation: true,
      formatCode: true
    });
    console.log('String formatter code export successful!');
  } catch (error) {
    console.error('String formatter code export failed:', error);
  }
}

// Run both tests
async function runTests() {
  await testCalculatorExport();
  await testStringFormatterExport();
  console.log('All export tests completed!');
}

// Export for use in other scripts
module.exports = {
  testCalculatorExport,
  testStringFormatterExport,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
} 