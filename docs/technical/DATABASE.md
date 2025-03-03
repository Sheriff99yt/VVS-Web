# VVS Web Database System

## Overview

The VVS Web database system is a core component that stores and manages the syntax definitions, function signatures, and programming patterns used to generate code from visual node graphs. The database is designed to be language-agnostic at its core, with language-specific syntax patterns that can be applied during code generation.

## Database Architecture

The database uses IndexedDB for client-side persistent storage, organized into the following object stores:

```
┌───────────────────────────────────────────────────────────────┐
│                   Syntax Database                             │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────────┐   │
│  │ Languages   │   │ Functions   │   │ SyntaxPatterns     │   │
│  │ - id        │   │ - id        │   │ - id               │   │
│  │ - name      │   │ - name      │   │ - functionId       │   │
│  │ - version   │   │ - category  │   │ - languageId       │   │
│  │ - fileExt   │   │ - params    │   │ - pattern          │   │
│  │ - syntaxRules│   │ - returnType│   │ - patternType      │   │
│  └─────────────┘   └─────────────┘   └────────────────────┘   │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐                            │
│  │ Types       │   │ TypeMappings│                            │
│  │ - id        │   │ - id        │                            │
│  │ - name      │   │ - sourceId  │                            │
│  │ - languageId│   │ - targetId  │                            │
│  │ - baseType  │   │ - conversion│                            │
│  └─────────────┘   └─────────────┘                            │
└───────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Languages**: Defines supported programming languages and their properties
2. **Functions**: Defines functions in a language-agnostic way
3. **SyntaxPatterns**: Maps functions to language-specific syntax
4. **Types**: Defines data types for each language
5. **TypeMappings**: Defines how types are converted between languages

## Data Models

### Language

```typescript
interface Language {
  id: number;
  name: string;            // e.g., "Python", "JavaScript"
  version: string;         // e.g., "3.11", "ES2022"
  fileExtension: string;   // e.g., ".py", ".js"
  syntaxRules: string[];   // Language-specific syntax rules
  isEnabled: boolean;      // Whether the language is available for use
}
```

### Function

```typescript
interface Function {
  id: number;
  name: string;                  // Function name
  category: string;              // Category for organization
  description: string;           // Description for documentation
  parameters: FunctionParameter[]; // Function parameters
  returnType: string;            // Return type
  isPure?: boolean;              // Whether the function has side effects
  isVariadic?: boolean;          // Whether the function accepts variable arguments
  tags?: string[];               // Tags for searching and filtering
}

interface FunctionParameter {
  name: string;             // Parameter name
  type: string;             // Parameter type
  description?: string;     // Parameter description
  isOptional?: boolean;     // Whether the parameter is optional
  defaultValue?: string;    // Default value if optional
}
```

### SyntaxPattern

```typescript
interface SyntaxPattern {
  id?: number;
  functionId: number;         // Reference to function definition
  languageId: number;         // Reference to language
  pattern: string;            // Syntax pattern with placeholders
  patternType: PatternType;   // Expression, Statement, or Block
  additionalImports?: string[]; // Imports required by this pattern
}

enum PatternType {
  EXPRESSION = 'expression',  // Returns a value (e.g., "a + b")
  STATEMENT = 'statement',    // Performs an action (e.g., "print(x)")
  BLOCK = 'block'             // Multi-line code block (e.g., function definition)
}
```

### Type

```typescript
interface Type {
  id: number;
  name: string;              // Type name (e.g., "int", "string")
  languageId: number;        // Reference to language
  baseType?: string;         // Base/parent type if applicable
  isBuiltIn: boolean;        // Whether it's a built-in type
  validationPattern?: string; // Pattern for validation
}
```

### TypeMapping

```typescript
interface TypeMapping {
  id?: number;
  sourceTypeId: number;      // Source type ID
  targetTypeId: number;      // Target type ID
  conversionPattern?: string; // Pattern for conversion
  isImplicit: boolean;       // Whether conversion happens automatically
}
```

## SyntaxDatabaseService

The `SyntaxDatabaseService` provides a high-level API for accessing and managing the syntax database.

```typescript
interface SyntaxDatabaseService {
  // Language operations
  getLanguageById(id: number): Promise<Language | null>;
  getLanguageByName(name: string): Promise<Language | null>;
  getAllLanguages(): Promise<Language[]>;
  createLanguage(language: Omit<Language, 'id'>): Promise<number>;
  updateLanguage(language: Language): Promise<void>;
  deleteLanguage(id: number): Promise<void>;
  
  // Function operations
  getFunctionById(id: number): Promise<Function | null>;
  getFunctionsByCategory(category: string): Promise<Function[]>;
  getAllFunctions(): Promise<Function[]>;
  createFunction(func: Omit<Function, 'id'>): Promise<number>;
  updateFunction(func: Function): Promise<void>;
  deleteFunction(id: number): Promise<void>;
  
  // Syntax pattern operations
  getSyntaxPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null>;
  createSyntaxPattern(pattern: Omit<SyntaxPattern, 'id'>): Promise<number>;
  updateSyntaxPattern(pattern: SyntaxPattern): Promise<void>;
  deleteSyntaxPattern(id: number): Promise<void>;
  
  // Type operations
  getTypeById(id: number): Promise<Type | null>;
  getTypeByName(name: string, languageId: number): Promise<Type | null>;
  getAllTypes(languageId?: number): Promise<Type[]>;
  createType(type: Omit<Type, 'id'>): Promise<number>;
  updateType(type: Type): Promise<void>;
  deleteType(id: number): Promise<void>;
  
  // Type mapping operations
  getTypeMapping(sourceTypeId: number, targetTypeId: number): Promise<TypeMapping | null>;
  createTypeMapping(mapping: Omit<TypeMapping, 'id'>): Promise<number>;
  updateTypeMapping(mapping: TypeMapping): Promise<void>;
  deleteTypeMapping(id: number): Promise<void>;
  
  // Database management
  exportDatabaseToJson(): Promise<string>;
  importDatabaseFromJson(json: string): Promise<void>;
  clearDatabase(): Promise<void>;
}
```

## Repository Classes

The database layer uses the repository pattern, with one repository class for each object store:

### LanguageRepository

Manages CRUD operations for languages:

```typescript
class LanguageRepository {
  async getById(id: number): Promise<Language | null>;
  async getByName(name: string): Promise<Language | null>;
  async getAll(): Promise<Language[]>;
  async create(language: Omit<Language, 'id'>): Promise<number>;
  async update(language: Language): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

### FunctionRepository

Manages CRUD operations for functions:

```typescript
class FunctionRepository {
  async getById(id: number): Promise<Function | null>;
  async getByCategory(category: string): Promise<Function[]>;
  async getAll(): Promise<Function[]>;
  async create(func: Omit<Function, 'id'>): Promise<number>;
  async update(func: Function): Promise<void>;
  async delete(id: number): Promise<void>;
  async search(query: string): Promise<Function[]>;
}
```

### PatternRepository

Manages CRUD operations for syntax patterns:

```typescript
class PatternRepository {
  async getByFunctionAndLanguage(functionId: number, languageId: number): Promise<SyntaxPattern | null>;
  async getAll(): Promise<SyntaxPattern[]>;
  async create(pattern: Omit<SyntaxPattern, 'id'>): Promise<number>;
  async update(pattern: SyntaxPattern): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

### TypeRepository

Manages CRUD operations for types:

```typescript
class TypeRepository {
  async getById(id: number): Promise<Type | null>;
  async getByName(name: string, languageId: number): Promise<Type | null>;
  async getAll(languageId?: number): Promise<Type[]>;
  async create(type: Omit<Type, 'id'>): Promise<number>;
  async update(type: Type): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

### TypeMappingRepository

Manages CRUD operations for type mappings:

```typescript
class TypeMappingRepository {
  async getBySourceAndTarget(sourceId: number, targetId: number): Promise<TypeMapping | null>;
  async getAll(): Promise<TypeMapping[]>;
  async create(mapping: Omit<TypeMapping, 'id'>): Promise<number>;
  async update(mapping: TypeMapping): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

## Function Definition System

### JSON-Based Function Definitions

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
  "description": "Python built-in functions",
  "functions": [
    {
      "id": "math_add",
      "name": "Add",
      "category": "Math",
      "description": "Adds two numbers",
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

### Function Definition Service

The `FunctionDefinitionService` manages loading and validating function definitions from JSON files:

```typescript
class FunctionDefinitionService {
  // Load a function definition file
  async loadDefinitions(path: string): Promise<void>;
  
  // Get a function by ID
  getFunction(id: string): FunctionDefinition | null;
  
  // Get functions by category
  getFunctionsByCategory(category: string): FunctionDefinition[];
  
  // Get all available functions
  getAllFunctions(): FunctionDefinition[];
  
  // Get syntax pattern for a function in a specific language
  getSyntaxPattern(functionId: string, language: string): SyntaxPattern | null;
}
```

## Syntax Patterns

Syntax patterns define how functions are translated into language-specific code.

### Pattern Types

1. **Expression Patterns**: Generate expressions that return values
   ```
   {0} + {1}         // Addition
   math.sqrt({0})    // Square root
   ```

2. **Statement Patterns**: Generate statements that perform actions
   ```
   print({0})        // Print
   return {0}        // Return
   ```

3. **Block Patterns**: Generate multi-line code blocks
   ```
   def {name}({parameters}):
       {body}
   ```

### Placeholder Syntax

Patterns use placeholders that are replaced with actual values:

- **Numeric placeholders**: `{0}`, `{1}`, etc. - Replaced with parameter values by index
- **Named placeholders**: `{name}`, `{value}`, etc. - Replaced with values by parameter name
- **Special placeholders**: 
  - `{body}` - Replaced with the body of a block
  - `{parameters}` - Replaced with parameter list
  - `{indent}` - Replaced with appropriate indentation

### Example Patterns

```json
// Python print function
{
  "id": "io_print",
  "pattern": "print({value})",
  "patternType": "statement",
  "additionalImports": []
}

// Python if statement
{
  "id": "control_if",
  "pattern": "if {condition}:",
  "patternType": "block",
  "additionalImports": []
}

// Python list comprehension
{
  "id": "list_comprehension",
  "pattern": "[{expression} for {iterator} in {collection} if {condition}]",
  "patternType": "expression",
  "additionalImports": []
}
```

## Database Initialization and Seeding

### Initialization Process

The database is initialized when the application first loads:

1. Create database schema if it doesn't exist
2. Check if seeding is required (first run or version upgrade)
3. Seed initial data if needed
4. Verify database integrity

### Function Definition Importing

Function definitions are imported into the database through the following process:

1. Load JSON function definition files
2. Validate function definition structure
3. Import function definitions into the database
4. Create corresponding syntax patterns
5. Set up type mappings as needed

### Built-in Function Handling

For programming languages with many built-in functions (like Python), the system uses a special importing process:

1. Read function definitions from a JSON file that lists built-in functions
2. Process each function definition:
   - Create a function record in the database
   - Create syntax patterns for each language
   - Add required imports if any
3. Cache imported functions for quick access

## Performance Considerations

The database layer includes several optimizations:

1. **Caching**: Frequently accessed data is cached in memory
2. **Transactions**: Database operations use transactions for consistency
3. **Bulk Operations**: Multiple operations are batched where possible
4. **Indexing**: Key fields are indexed for faster queries
5. **Lazy Loading**: Data is loaded only when needed

## Data Export and Import

The database provides functionality to export and import its contents:

### Export

```typescript
// Export the entire database as JSON
async function exportDatabaseToJson(): Promise<string> {
  const languages = await languageRepository.getAll();
  const functions = await functionRepository.getAll();
  const patterns = await patternRepository.getAll();
  const types = await typeRepository.getAll();
  const typeMappings = await typeMappingRepository.getAll();
  
  return JSON.stringify({
    languages,
    functions,
    patterns,
    types,
    typeMappings
  });
}
```

### Import

```typescript
// Import database from JSON
async function importDatabaseFromJson(json: string): Promise<void> {
  const data = JSON.parse(json);
  
  // Clear existing data
  await clearDatabase();
  
  // Import each data type
  for (const language of data.languages) {
    await languageRepository.create(language);
  }
  
  for (const func of data.functions) {
    await functionRepository.create(func);
  }
  
  // Import remaining data...
}
```

## Conclusion

The VVS Web database system provides a flexible and extensible foundation for storing and managing syntax data. Its language-agnostic design, combined with language-specific syntax patterns, enables the generation of idiomatic code in multiple programming languages from a single visual representation. 