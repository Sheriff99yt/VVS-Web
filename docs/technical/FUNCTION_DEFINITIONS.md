# Function Definition System

## Overview

The Function Definition System is a core component of VVS Web that defines the available functions, their parameters, return types, and language-specific implementations. This system enables the visual programming interface to present users with a library of functions they can use to build their programs, while providing the code generation system with the information needed to produce correct, idiomatic code across multiple programming languages.

## Key Features

- **Language-Agnostic Design**: Core function definitions are language-independent
- **JSON-Based Storage**: Easy to maintain, version control, and extend
- **Multiple Language Support**: Each function can have implementations for multiple programming languages
- **Type System**: Robust type definitions and validation
- **Categorization**: Hierarchical organization of functions
- **Documentation**: Built-in support for function and parameter documentation

## Function Definition Structure

Function definitions are stored in JSON files with the following structure:

```json
{
  "version": "1.0",
  "description": "Core Python functions",
  "functions": [
    {
      "id": "math_add",
      "name": "Add",
      "category": "Math/Basic",
      "description": "Adds two numbers together",
      "parameters": [
        {
          "name": "a",
          "type": "number",
          "description": "First number"
        },
        {
          "name": "b",
          "type": "number",
          "description": "Second number"
        }
      ],
      "returnType": "number",
      "isPure": true,
      "tags": ["arithmetic", "math"],
      "languages": {
        "python": {
          "pattern": "{0} + {1}",
          "patternType": "expression"
        },
        "javascript": {
          "pattern": "{0} + {1}",
          "patternType": "expression"
        }
      }
    }
  ]
}
```

### Core Function Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier for the function |
| `name` | string | Display name in the UI |
| `category` | string | Category path for organization (e.g., "Math/Basic") |
| `description` | string | Human-readable description |
| `parameters` | array | List of parameters the function accepts |
| `returnType` | string | Type of value returned by the function |
| `isPure` | boolean | Whether the function has side effects |
| `isVariadic` | boolean | Whether the function accepts variable arguments |
| `tags` | array | Keywords for searching and filtering |
| `languages` | object | Language-specific implementations |

### Parameter Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Parameter name |
| `type` | string | Data type (e.g., "number", "string", "array") |
| `description` | string | Human-readable description |
| `isOptional` | boolean | Whether the parameter is optional |
| `defaultValue` | any | Default value if parameter is optional |

### Language-Specific Implementation

Each function can have implementations for multiple programming languages:

```json
"languages": {
  "python": {
    "pattern": "math.sqrt({0})",
    "patternType": "expression",
    "additionalImports": ["import math"]
  },
  "javascript": {
    "pattern": "Math.sqrt({0})",
    "patternType": "expression"
  }
}
```

#### Language Implementation Properties

| Property | Type | Description |
|----------|------|-------------|
| `pattern` | string | Syntax pattern with placeholders |
| `patternType` | string | "expression", "statement", or "block" |
| `additionalImports` | array | Import statements required |
| `isAsync` | boolean | Whether the function is asynchronous |
| `constraints` | object | Language-specific constraints |

## Syntax Pattern Types

### 1. Expression Patterns

Generate expressions that return values. Used for operations like math calculations or value transformations.

Examples:
```
{0} + {1}         // Addition
math.sqrt({0})    // Square root
"{0}".format({1}) // String formatting
```

### 2. Statement Patterns

Generate statements that perform actions but don't return values. Used for operations like printing or file operations.

Examples:
```
print({0})            // Print
{variable} = {value}  // Assignment
return {0}            // Return
```

### 3. Block Patterns

Generate multi-line code blocks with proper indentation. Used for control structures and function definitions.

Examples:
```
def {name}({parameters}):
    {body}

for {item} in {collection}:
    {body}

if {condition}:
    {then_body}
else:
    {else_body}
```

## Placeholder Syntax

Syntax patterns use placeholders that are replaced with actual values during code generation:

### Basic Placeholders

- **Numeric placeholders**: `{0}`, `{1}`, etc. - Reference parameters by index
- **Named placeholders**: `{name}`, `{value}`, etc. - Reference parameters by name
- **Special placeholders**: 
  - `{body}` - For the body of a block
  - `{parameters}` - For parameter lists
  - `{indent}` - For indentation

### Advanced Placeholder Features

- **Default values**: `{param:default}` - Use default if parameter is missing
- **Transformations**: `{param|uppercase}` - Apply transformation to parameter
- **Conditional syntax**: `{param?then:else}` - Include different syntax based on condition

## Function Categories

Functions are organized into hierarchical categories for easier browsing and organization:

- **Math**
  - **Basic**: Add, Subtract, Multiply, Divide
  - **Advanced**: Sqrt, Pow, Log, Exp
  - **Statistics**: Mean, Median, StdDev

- **String**
  - **Manipulation**: Concat, Substring, Replace
  - **Formatting**: Format, PadLeft, PadRight
  - **Conversion**: ToUpper, ToLower, Trim

- **Collections**
  - **List**: Append, Insert, Remove
  - **Dictionary**: Get, Set, HasKey
  - **Set**: Union, Intersection, Difference

- **IO**
  - **Console**: Print, Input
  - **File**: ReadFile, WriteFile, AppendFile

- **Control**
  - **Conditionals**: If, Switch
  - **Loops**: ForEach, While, Repeat

## FunctionDefinitionService

The `FunctionDefinitionService` provides a programming interface for loading, validating, and accessing function definitions:

```typescript
class FunctionDefinitionService {
  private static instance: FunctionDefinitionService;
  private definitions: Map<string, FunctionDefinition>;
  private categoryTree: CategoryNode;
  
  // Singleton pattern
  public static getInstance(): FunctionDefinitionService {
    if (!this.instance) {
      this.instance = new FunctionDefinitionService();
    }
    return this.instance;
  }
  
  // Load function definitions from a JSON file
  public async loadDefinitions(path: string): Promise<void> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load definitions from ${path}`);
    }
    
    const json = await response.json();
    this.validateSchema(json);
    
    // Process and store definitions
    for (const func of json.functions) {
      this.definitions.set(func.id, func);
      this.addToCategory(func);
    }
  }
  
  // Get a function by ID
  public getFunction(id: string): FunctionDefinition | null {
    return this.definitions.get(id) || null;
  }
  
  // Get functions by category
  public getFunctionsByCategory(category: string): FunctionDefinition[] {
    const categoryNode = this.findCategory(category);
    if (!categoryNode) {
      return [];
    }
    
    return categoryNode.functions;
  }
  
  // Get all categories
  public getCategories(): string[] {
    return this.extractCategories(this.categoryTree);
  }
  
  // Get syntax pattern for a function in a specific language
  public getSyntaxPattern(functionId: string, language: string): SyntaxPattern | null {
    const func = this.getFunction(functionId);
    if (!func || !func.languages || !func.languages[language]) {
      return null;
    }
    
    return func.languages[language];
  }
  
  // Search for functions by name, description, or tags
  public searchFunctions(query: string): FunctionDefinition[] {
    if (!query) {
      return Array.from(this.definitions.values());
    }
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.definitions.values()).filter(func => {
      return (
        func.name.toLowerCase().includes(lowerQuery) ||
        func.description.toLowerCase().includes(lowerQuery) ||
        (func.tags && func.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    });
  }
  
  // Validate function definition schema
  private validateSchema(json: any): void {
    // Schema validation logic
  }
  
  // Add function to category tree
  private addToCategory(func: FunctionDefinition): void {
    // Category management logic
  }
  
  // Find category in tree
  private findCategory(path: string): CategoryNode | null {
    // Category lookup logic
  }
  
  // Extract all category paths
  private extractCategories(node: CategoryNode, prefix = ''): string[] {
    // Category extraction logic
  }
}
```

## Integration with the Node System

The Function Definition System integrates with the Visual Node System in the following ways:

1. **NodeLibrary Population**: The `NodeLibrary` component uses the `FunctionDefinitionService` to populate categories and function entries.

2. **Node Creation**: When a function is dragged from the library, a node is created with ports based on the function's parameters and return type.

3. **Connection Validation**: Type information from function definitions is used to validate connections between nodes.

4. **Code Generation**: The `ExecutionBasedCodeGenerator` uses syntax patterns from function definitions to generate language-specific code.

## Example Function Definitions

### Math Functions

```json
{
  "id": "math_sqrt",
  "name": "Square Root",
  "category": "Math/Advanced",
  "description": "Calculates the square root of a number",
  "parameters": [
    {
      "name": "value",
      "type": "number",
      "description": "The number to calculate the square root of"
    }
  ],
  "returnType": "number",
  "isPure": true,
  "languages": {
    "python": {
      "pattern": "math.sqrt({0})",
      "patternType": "expression",
      "additionalImports": ["import math"]
    },
    "javascript": {
      "pattern": "Math.sqrt({0})",
      "patternType": "expression"
    }
  }
}
```

### String Functions

```json
{
  "id": "string_format",
  "name": "Format String",
  "category": "String/Formatting",
  "description": "Formats a string with the given values",
  "parameters": [
    {
      "name": "template",
      "type": "string",
      "description": "The template string with placeholders"
    },
    {
      "name": "values",
      "type": "object",
      "description": "The values to insert into the template"
    }
  ],
  "returnType": "string",
  "isPure": true,
  "languages": {
    "python": {
      "pattern": "{0}.format({1})",
      "patternType": "expression"
    },
    "javascript": {
      "pattern": "{0}.replace(/\\{([^}]+)\\}/g, (_, key) => {1}[key])",
      "patternType": "expression"
    }
  }
}
```

### Control Flow Functions

```json
{
  "id": "control_if",
  "name": "If Statement",
  "category": "Control/Conditionals",
  "description": "Executes code if a condition is true",
  "parameters": [
    {
      "name": "condition",
      "type": "boolean",
      "description": "The condition to evaluate"
    }
  ],
  "returnType": "void",
  "isPure": false,
  "languages": {
    "python": {
      "pattern": "if {condition}:",
      "patternType": "block"
    },
    "javascript": {
      "pattern": "if ({condition}) {",
      "patternType": "block",
      "blockEnd": "}"
    }
  }
}
```

## Performance Considerations

The Function Definition System implements several optimizations for performance:

1. **Lazy Loading**: Function definitions are loaded on demand
2. **Caching**: Loaded definitions are cached for quick access
3. **Indexed Access**: Functions are indexed by ID and category for fast lookup
4. **Memoization**: Frequently used operations are memoized
5. **Progressive Loading**: Categories are loaded before individual functions

## Future Enhancements

Planned enhancements to the Function Definition System include:

1. **Function Versioning**: Support for different versions of functions
2. **Custom Functions**: User-defined functions with visual editors
3. **Function Composition**: Creating new functions by combining existing ones
4. **Parameter Constraints**: More detailed validation rules for parameters
5. **Metadata Enhancement**: Additional metadata for better documentation and search
6. **Dynamic Loading**: Loading function definitions from remote sources
7. **Localization**: Translating function names and descriptions

## Conclusion

The Function Definition System provides a flexible and extensible framework for defining functions that can be used in the visual programming interface and translated into multiple programming languages. Its language-agnostic design, combined with language-specific syntax patterns, enables VVS Web to generate idiomatic code across different programming languages from a single visual representation. 