# Syntax Database: Data Sources and Storage

## Overview

This document details the data sources, extraction methods, and storage structure for the VVS Web Syntax Database. The syntax database stores language definitions, function signatures, syntax patterns, and type mappings that enable the generation of idiomatic code across multiple programming languages.

## Function Definitions

The VVS Web system uses JSON files to define function syntax and behavior. This approach provides several benefits:

- Easy to maintain and version control
- Human-readable format
- Support for multiple languages
- Extensible structure
- No runtime dependencies

### Function Definition Structure

Function definitions are stored in JSON files with the following structure:

```json
{
  "version": "1.0",
  "description": "Description of the function definitions",
  "functions": [
    {
      "id": "unique_function_id",
      "name": "function_name",
      "displayName": "User-friendly name",
      "category": "Category name",
      "description": "Function description",
      "parameters": [
        {
          "name": "param_name",
          "type": "Parameter type",
          "description": "Parameter description",
          "isRequired": true
        }
      ],
      "returnType": "Return type",
      "syntaxPatterns": {
        "language_name": {
          "pattern": "Syntax pattern with {0}, {1} etc.",
          "type": "expression|statement|block",
          "imports": ["required imports"],
          "description": "Language-specific description"
        }
      }
    }
  ],
  "metadata": {
    "lastUpdated": "Last update date",
    "supportedLanguages": ["list", "of", "languages"],
    "categories": ["list", "of", "categories"]
  }
}
```

### Example Function Definition

```json
{
  "id": "math_add",
  "name": "add",
  "displayName": "Add",
  "category": "Math",
  "description": "Add two numbers together",
  "parameters": [
    {
      "name": "a",
      "type": "Number",
      "description": "First number to add",
      "isRequired": true
    },
    {
      "name": "b",
      "type": "Number",
      "description": "Second number to add",
      "isRequired": true
    }
  ],
  "returnType": "Number",
  "syntaxPatterns": {
    "python": {
      "pattern": "{0} + {1}",
      "type": "expression",
      "imports": [],
      "description": "Python addition operator"
    },
    "javascript": {
      "pattern": "{0} + {1}",
      "type": "expression",
      "imports": [],
      "description": "JavaScript addition operator"
    }
  }
}
```

## Function Definition Service

The `FunctionDefinitionService` manages loading and accessing function definitions:

```typescript
class FunctionDefinitionService {
  // Load definitions from a JSON file
  async loadFunctionDefinitions(filePath: string): Promise<void>;

  // Get a function by ID
  getFunctionById(id: string): FunctionDefinition | undefined;

  // Get all functions in a category
  getFunctionsByCategory(category: string): FunctionDefinition[];

  // Get syntax pattern for a function in a language
  getSyntaxPattern(functionId: string, language: string): SyntaxPattern | undefined;
}
```

## Creating Custom Function Definitions

To add new functions to the system:

1. Create a new JSON file following the template structure
2. Define your functions with appropriate syntax patterns
3. Load the file using the FunctionDefinitionService

Example:
```typescript
const service = FunctionDefinitionService.getInstance();
await service.loadFunctionDefinitions('/path/to/your/functions.json');
```

## Best Practices

1. **Function IDs**
   - Use descriptive, unique IDs
   - Follow the pattern: `category_function_name`
   - Example: `math_add`, `string_concat`

2. **Categories**
   - Group related functions
   - Use consistent category names
   - Common categories: Math, String, Array, Logic, Control Flow

3. **Syntax Patterns**
   - Use {0}, {1}, etc. for parameter placeholders
   - Include all necessary imports
   - Provide language-specific descriptions
   - Test patterns with various inputs

4. **Parameters**
   - Use clear, descriptive names
   - Provide helpful descriptions
   - Mark required parameters
   - Use consistent types

## Implementation Status

The function definition system has been implemented with:

1. **JSON-based Definition Files**
   - Template structure
   - Validation
   - Multiple language support

2. **Function Definition Service**
   - Singleton pattern
   - File loading
   - Function lookup
   - Category management

3. **Type System**
   - TypeScript interfaces
   - Runtime validation
   - Type safety

### Current Focus

The current development focus for function definitions includes:

- Creating comprehensive function libraries
- Adding more language support
- Improving validation
- Documentation and examples
- Testing and verification

## Conclusion

The JSON-based function definition system provides a flexible and maintainable way to define function syntax across multiple programming languages. This approach allows for easy updates, version control, and community contributions while maintaining type safety and validation.

## Initial Data and Bundled Languages

The VVS Web system is distributed with pre-generated data for supported programming languages:

- **Bundled Languages**: The initial release includes Python and C++ language definitions
- **Pre-generated Data**: All language definitions, function definitions, syntax patterns, and type mappings are pre-extracted and bundled with the application
- **Purpose**: This approach reduces client-side processing overhead and ensures immediate usability for first-time users
- **On-demand Regeneration**: Users can manually trigger re-extraction if a language runtime is updated

## Data Sources

The VVS system uses several methods to populate and maintain the syntax database without relying on external services, ensuring offline functionality and maintainability.

### 1. JavaScript Data Sources

JavaScript data is extracted directly from the JavaScript runtime using introspection:

- **Built-in Objects**: Properties and methods are extracted from `Array`, `String`, `Number`, `Math`, and `Object` prototypes
- **Version Detection**: ECMAScript version is determined from runtime capabilities
- **Type Information**: Inferred from method names, parameters, and return values

```typescript
// Sample extraction code (from JavaScriptAnalyzer)
Object.getOwnPropertyNames(Array.prototype)
  .filter(name => typeof Array.prototype[name] === 'function' && name !== 'constructor')
  .forEach(name => {
    // Create function definition
    functions.push({
      name: `array_${name}`,
      displayName: `Array.${name}`,
      parameters: [...],
      returnType: '...',
    });
  });
```

### 2. Python Data Sources

Python data comes from a JSON-based system:

- **JSON Definition Files**: Function definitions are stored in JSON files
- **Type Definitions**: Standard Python types are defined in the system
- **FunctionDefinitionService**: Loads function definitions from JSON files

#### JSON-Based Function Definitions

The function definition system provides a reliable way to define and access Python functions:

```typescript
class FunctionDefinitionService {
  // Singleton instance
  static getInstance(): FunctionDefinitionService;
  
  // Loads function definitions from JSON files
  async loadFunctionDefinitions(language: string): Promise<FunctionDefinition[]>;
  
  // Gets a function by its ID
  getFunctionById(id: string): FunctionDefinition | undefined;
  
  // Gets functions by category
  getFunctionsByCategory(category: string): FunctionDefinition[];
  
  // Gets syntax pattern for a function in a specific language
  getSyntaxPattern(functionId: string, language: string): SyntaxPattern | undefined;
}
```

The service performs the following functions:
1. Loads function definitions from JSON files
2. Validates the structure and content of the definitions
3. Provides access to functions by ID, category, or language
4. Returns syntax patterns for code generation
5. Supports multiple languages in the same definition file

The definition system stores different syntax patterns based on the function type:
- EXPRESSION patterns for utility and math functions (e.g., `len()`, `abs()`)
- STATEMENT patterns for I/O functions (e.g., `print()`)
- BLOCK patterns for control flow functions (e.g., `if`, `for`)

#### Managing Function Definitions

Function definitions are stored in the `src/services/database/syntax/` directory and loaded automatically:

```json
// Example from python_functions.json
{
  "id": "math_add",
  "name": "add",
  "displayName": "Add",
  "category": "Math",
  "description": "Add two numbers together",
  "parameters": [
    {"name": "a", "type": "Number", "description": "First number", "isRequired": true},
    {"name": "b", "type": "Number", "description": "Second number", "isRequired": true}
  ],
  "returnType": "Number",
  "syntaxPatterns": {
    "python": {
      "pattern": "{0} + {1}",
      "type": "expression",
      "imports": []
    }
  }
}
```

## Implementation Status

The syntax database data management has been fully implemented for the Python MVP:

1. **Python Language Definition**: Complete with syntax rules and formatting
2. **Python Function Definitions**: Comprehensive set of functions defined in JSON

### Current Focus

The current development focus for syntax database data is testing and optimization:

- Comprehensive testing of database operations
- Validation of imported Python built-ins
- Documentation of data structures and extraction methods
- Performance optimization for database queries

### 3. Common Function Definitions

Language-agnostic function definitions are manually defined once and then mapped to specific language implementations:

```typescript
// Sample common function (from DatabasePopulator)
{
  id: 1,
  name: 'math_add',
  displayName: 'Add',
  description: 'Add two numbers',
  category: 'Math',
  parameters: [
    {
      name: 'a',
      type: 'Number',
      description: 'First value',
      isRequired: true
    },
    {
      name: 'b',
      type: 'Number',
      description: 'Second value',
      isRequired: true
    }
  ],
  returnType: 'Number',
  isBuiltIn: true
}
```

## Database Content Structure

The syntax database stores the following types of data:

### 1. Language Definitions

```typescript
// Example Language Definition
{
  id: 1,
  name: 'JavaScript',
  version: 'ES2022',
  fileExtension: '.js',
  isEnabled: true
}
```

### 2. Syntax Rules

```typescript
// Example Syntax Rules
{
  languageId: 1,
  statementDelimiter: ';',
  blockStart: '{',
  blockEnd: '}',
  commentSingle: '//',
  commentMultiStart: '/*',
  commentMultiEnd: '*/',
  stringDelimiters: ['"', "'", '`'],
  indentationStyle: 'space',
  indentationSize: 2,
  functionDefinitionPattern: 'function {name}({params}) {body}',
  variableDeclarationPattern: 'let {name} = {value};',
  operatorPatterns: {
    add: '{0} + {1}',
    subtract: '{0} - {1}',
    // Additional operators...
  }
}
```

### 3. Function Definitions

```typescript
// Example Function Definition
{
  id: 101,
  name: 'array_map',
  displayName: 'Array.map',
  description: 'Creates a new array with the results of calling a function on every element',
  category: 'Array',
  parameters: [
    {
      name: 'self',
      type: 'Array',
      description: 'Array instance',
      isRequired: true
    },
    {
      name: 'callback',
      type: 'Function',
      description: 'Function to execute on each element',
      isRequired: true
    }
  ],
  returnType: 'Array',
  isBuiltIn: true,
  tags: ['array', 'map', 'transform']
}
```

### 4. Syntax Patterns

```typescript
// Example Syntax Pattern (JavaScript implementation of array_map)
{
  id: 1010,
  functionId: 101,
  languageId: 1,
  pattern: '{0}.map({1})',
  patternType: 'expression',
  additionalImports: []
}

// Example Syntax Pattern (Python implementation of array_map)
{
  id: 1020,
  functionId: 101,
  languageId: 2,
  pattern: 'list(map({1}, {0}))',
  patternType: 'expression',
  additionalImports: []
}
```

### 5. Type Definitions

```typescript
// Example Type Definition
{
  id: 1,
  name: 'Number',
  description: 'Numeric value',
  color: '#6B8E23'
}
```