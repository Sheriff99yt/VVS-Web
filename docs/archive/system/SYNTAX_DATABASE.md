# Syntax Database Implementation

## Overview

The syntax database is a core component of the VVS Web system, designed to store syntax definitions for various programming languages and built-in operations. It enables the system to generate clean, idiomatic code in multiple programming languages from the same visual representation. This document details the design and implementation of the syntax database.

## Core Concepts

### Language Definitions
Language definitions specify the core properties of supported programming languages, including syntax rules, formatting conventions, and type systems.

### Function Definitions
Function definitions describe operations that can be performed in a program, including their parameters, return types, and categories. These are language-agnostic abstractions.

### Syntax Patterns
Syntax patterns provide language-specific templates for code generation, mapping abstract function definitions to concrete code in each supported language.

### Type Mappings
Type mappings connect abstract types used in the visual programming interface to concrete types in each supported language, ensuring type safety across languages.

## Data Sources and Population

The syntax database uses an automated approach to populate and maintain language definitions, built-in functions, and syntax patterns. For detailed information about data sources, extraction methods, and database content examples, see [Syntax Database: Data Sources and Storage](./SYNTAX_DATABASE_DATA.md).

## Database Structure

```
┌───────────────────┐
│  Languages        │
└───────────┬───────┘
            │
            ▼
┌───────────────────┐        ┌───────────────────┐
│  Function         │◄───────┤  Syntax Patterns  │
│  Definitions      │        │                   │
└───────────┬───────┘        └───────────────────┘
            │                        ▲
            ▼                        │
┌───────────────────┐        ┌───────────────────┐
│  Abstract Types   │───────►│  Type Mappings    │
└───────────────────┘        └───────────────────┘
```

## Data Structures

### Language Definition

```typescript
interface Language {
    id: number;                  // Unique language identifier
    name: string;                // Display name (e.g., "JavaScript", "Python")
    version: string;             // Language version (e.g., "ES2020", "3.8")
    fileExtension: string;       // Default file extension (e.g., ".js", ".py")
    syntaxRules: SyntaxRules;    // Language-specific syntax rules
    isEnabled: boolean;          // Whether the language is available for use
}

interface SyntaxRules {
    statementDelimiter: string;     // How statements are terminated (e.g., ";", "\n")
    blockStart: string;             // How blocks begin (e.g., "{", ":")
    blockEnd: string;               // How blocks end (e.g., "}", indentation)
    commentSingle: string;          // Single-line comment prefix (e.g., "//", "#")
    commentMultiStart: string;      // Multi-line comment start (e.g., "/*")
    commentMultiEnd: string;        // Multi-line comment end (e.g., "*/")
    stringDelimiters: string[];     // Valid string delimiters (e.g., ['"', "'", "`"])
    indentationStyle: 'space' | 'tab'; // Preferred indentation style
    indentationSize: number;        // Number of spaces per indent
    functionDefinitionPattern: string; // Template for function definitions
    variableDeclarationPattern: string; // Template for variable declarations
    operatorPatterns: {             // Templates for common operators
        [key: string]: string;      // e.g., { "add": "{0} + {1}" }
    };
}
```

### Function Definition

```typescript
interface FunctionDefinition {
    id: number;                     // Unique function identifier
    name: string;                   // Internal name (e.g., "math_add")
    displayName: string;            // User-visible name (e.g., "Add")
    description: string;            // Description of what the function does
    category: string;               // Function category (e.g., "Math", "String")
    parameters: Parameter[];        // Function parameters
    returnType: string;             // Return type name (abstract type)
    isBuiltIn: boolean;             // Whether this is a built-in function
    tags: string[];                 // Tags for searching and filtering
}

interface Parameter {
    name: string;                   // Parameter name
    type: string;                   // Abstract type name
    description: string;            // Parameter description
    isRequired: boolean;            // Whether parameter is required
    defaultValue?: any;             // Default value if not provided
}
```

### Syntax Pattern

```typescript
interface SyntaxPattern {
    id: number;                     // Unique pattern identifier
    functionId: number;             // Reference to function definition
    languageId: number;             // Reference to language
    pattern: string;                // Code template with placeholders
    patternType: 'expression' | 'statement' | 'block'; // How pattern should be used
    additionalImports?: string[];   // Required imports/includes
    notes?: string;                 // Implementation notes
}
```

### Type Definition

```typescript
interface TypeDefinition {
    id: number;                     // Unique type identifier
    name: string;                   // Abstract type name (e.g., "Number", "String")
    description: string;            // Type description
    baseType?: number;              // Base type for inheritance
    properties?: TypeProperty[];    // For compound types
}

interface TypeProperty {
    name: string;                   // Property name
    type: string;                   // Property type
    isRequired: boolean;            // Whether property is required
}
```

### Type Mapping

```typescript
interface TypeMapping {
    id: number;                     // Unique mapping identifier
    abstractTypeId: number;         // Reference to abstract type
    languageId: number;             // Reference to language
    concreteType: string;           // Type name in target language
    imports?: string[];             // Required imports for this type
    conversionToAbstract?: string;  // Code to convert from concrete to abstract
    conversionFromAbstract?: string; // Code to convert from abstract to concrete
}
```

## Core Services

### SyntaxDatabaseService

The central service that coordinates access to all syntax-related data.

```typescript
class SyntaxDatabaseService {
    constructor(
        private functionRepository: FunctionRepository,
        private languageService: LanguageService,
        private patternRepository: PatternRepository,
        private typeService: TypeService
    ) {}

    // Get function definition by ID
    async getFunctionById(id: number): Promise<FunctionDefinition | null> {
        return this.functionRepository.getById(id);
    }

    // Get functions by category
    async getFunctionsByCategory(category: string): Promise<FunctionDefinition[]> {
        return this.functionRepository.getByCategory(category);
    }

    // Search functions
    async searchFunctions(query: string): Promise<FunctionDefinition[]> {
        return this.functionRepository.search(query);
    }

    // Get syntax pattern for a function in a specific language
    async getSyntaxPattern(
        functionId: number,
        languageId: number
    ): Promise<SyntaxPattern | null> {
        return this.patternRepository.getPattern(functionId, languageId);
    }

    // Get language by ID
    async getLanguageById(id: number): Promise<Language | null> {
        return this.languageService.getById(id);
    }

    // Get all available languages
    async getLanguages(): Promise<Language[]> {
        return this.languageService.getAll();
    }

    // Get type mapping
    async getTypeMapping(
        abstractTypeId: number,
        languageId: number
    ): Promise<TypeMapping | null> {
        return this.typeService.getMapping(abstractTypeId, languageId);
    }
}
```

### FunctionRepository

Manages function definitions in the database.

```typescript
class FunctionRepository {
    constructor(private db: Database) {}

    // Get function definition by ID
    async getById(id: number): Promise<FunctionDefinition | null> {
        // Implementation omitted for brevity
    }

    // Get functions by category
    async getByCategory(category: string): Promise<FunctionDefinition[]> {
        // Implementation omitted for brevity
    }

    // Search functions by name, description or tags
    async search(query: string): Promise<FunctionDefinition[]> {
        // Implementation omitted for brevity
    }

    // Create new function definition
    async create(functionDef: Omit<FunctionDefinition, 'id'>): Promise<number> {
        // Implementation omitted for brevity
    }

    // Update function definition
    async update(functionDef: FunctionDefinition): Promise<void> {
        // Implementation omitted for brevity
    }

    // Delete function definition
    async delete(id: number): Promise<void> {
        // Implementation omitted for brevity
    }
}
```

### LanguageService

Manages language definitions in the database.

```typescript
class LanguageService {
    constructor(private db: Database) {}

    // Get language by ID
    async getById(id: number): Promise<Language | null> {
        // Implementation omitted for brevity
    }

    // Get all available languages
    async getAll(): Promise<Language[]> {
        // Implementation omitted for brevity
    }

    // Create new language
    async create(language: Omit<Language, 'id'>): Promise<number> {
        // Implementation omitted for brevity
    }

    // Update language
    async update(language: Language): Promise<void> {
        // Implementation omitted for brevity
    }

    // Delete language
    async delete(id: number): Promise<void> {
        // Implementation omitted for brevity
    }
}
```

### CodeGenerationService

Generates code in a specific language from a node graph.

```typescript
class CodeGenerationService {
    constructor(
        private syntaxDatabaseService: SyntaxDatabaseService
    ) {}

    // Generate code from a node graph
    async generateCode(
        nodes: any[],               // Nodes with their function IDs and data
        connections: any[],         // Connections between nodes
        languageId: number          // Target language
    ): Promise<string> {
        // Get language
        const language = await this.syntaxDatabaseService.getLanguageById(languageId);
        if (!language) throw new Error(`Language with ID ${languageId} not found`);

        // Build dependency graph
        const graph = this.buildDependencyGraph(nodes, connections);
        
        // Generate code for each node in order
        const codeSegments = await this.generateCodeSegments(graph, languageId);
        
        // Compose final code
        const finalCode = this.composeCode(codeSegments, language);
        
        return finalCode;
    }

    // Build a graph representing dependencies between nodes
    private buildDependencyGraph(nodes: any[], connections: any[]): any {
        // Implementation omitted for brevity
        return {};
    }

    // Generate code for each node
    private async generateCodeSegments(graph: any, languageId: number): Promise<Map<string, string>> {
        const codeSegments = new Map<string, string>();
        
        // Process nodes in dependency order
        // Implementation omitted for brevity
        
        return codeSegments;
    }

    // Compose final code from segments
    private composeCode(codeSegments: Map<string, string>, language: Language): string {
        // Implementation omitted for brevity
        return '';
    }

    // Generate code for a single node
    private async generateNodeCode(
        node: any,
        inputs: Map<string, string>,
        languageId: number
    ): Promise<string> {
        // Get function definition
        const functionDef = await this.syntaxDatabaseService.getFunctionById(node.functionId);
        if (!functionDef) throw new Error(`Function with ID ${node.functionId} not found`);
        
        // Get syntax pattern for this function in the target language
        const pattern = await this.syntaxDatabaseService.getSyntaxPattern(
            functionDef.id,
            languageId
        );
        if (!pattern) throw new Error(`Syntax pattern not found for function ${functionDef.name} in language ${languageId}`);
        
        // Apply inputs to pattern
        let code = pattern.pattern;
        functionDef.parameters.forEach((param, index) => {
            const inputCode = inputs.get(param.name) || this.formatDefaultValue(param.defaultValue, languageId);
            code = code.replace(`{${index}}`, inputCode);
        });
        
        return code;
    }

    // Format a default value according to language rules
    private formatDefaultValue(value: any, languageId: number): string {
        // Implementation omitted for brevity
        return '';
    }
}
```

## Database Schema

### Tables

1. **languages**
   - Primary Key: `id`
   - Indexes: `name` (unique)
   - Stores language definitions

2. **functionDefinitions**
   - Primary Key: `id`
   - Indexes: `name` (unique), `category`
   - Stores function definitions

3. **syntaxPatterns**
   - Primary Key: `id`
   - Indexes: `[functionId, languageId]` (unique)
   - Stores syntax patterns for functions in specific languages

4. **typeDefinitions**
   - Primary Key: `id`
   - Indexes: `name` (unique)
   - Stores abstract type definitions

5. **typeMappings**
   - Primary Key: `id`
   - Indexes: `[abstractTypeId, languageId]` (unique)
   - Stores mappings between abstract and concrete types

## Implementation Phases

### Phase 1: Core Structure
1. **Database Setup**
   - Schema definition
   - IndexedDB setup
   - Base repositories

2. **Basic Models**
   - Language definitions
   - Function definitions
   - Type definitions

### Phase 2: Pattern System
1. **Syntax Patterns**
   - Pattern templates
   - Placeholder system
   - Pattern compiler

2. **Type Mappings**
   - Abstract type system
   - Language-specific mappings
   - Type conversion

### Phase 3: Code Generation
1. **Code Generator**
   - Pattern application
   - Dependency resolution
   - Code composition

2. **Multi-language Support**
   - Language-specific formatting
   - Import management
   - Output validation

### Phase 4: Database Population
1. **Automated Extraction**
   - JavaScript runtime introspection
   - Python documentation parsing
   - Language analyzer framework
   - See [Syntax Database: Data Sources and Storage](./SYNTAX_DATABASE_DATA.md)

2. **Data Import/Export**
   - Language package format
   - Version management
   - Update detection

### Phase 5: Advanced Features
1. **Custom Functions**
   - User-defined functions
   - Function composition
   - Reusable components

2. **Extensibility**
   - Plugin system
   - Custom patterns
   - Advanced type mappings

## Data Seeding and Updates

### Initial Database Population
- The system comes pre-populated with generated data for supported languages
- First-time users receive this bundled data automatically
- Initial release includes Python and C++ language definitions
- Users can regenerate data on demand if languages are updated

### Update Management
- System checks for language updates once per week
- User is prompted to update or stay on current version
- Future versions will support multiple versions of the same language
- Update process runs in background to minimize performance impact

### Error Handling
- If pattern generation fails during an update, the system maintains the previous version
- Users receive notifications explaining update failures
- Unsupported language features trigger warnings in the notification window
- Nodes for unsupported syntax are outlined in yellow
- Missing syntax in code preview is highlighted in yellow

## Testing Strategy
- Unit tests verify individual language analyzers and pattern generators
- Integration tests confirm proper database population across languages
- Generated code is reviewed by developers for correctness and idiomaticity
- Automated tests verify that syntax patterns produce valid, compilable code
- Regression testing ensures updates don't break existing functionality

## Best Practices

### Data Consistency
- Maintain referential integrity between related entities
- Validate data before storage
- Use transactions for related updates

### Error Handling
- Provide meaningful error messages
- Gracefully handle missing patterns
- Support fallback mechanisms for unsupported language features
- Notify users of any pattern generation failures
- Maintain previous versions when updates fail

### Performance
- Use appropriate indexes
- Cache frequently accessed data
- Optimize pattern application

### Extensibility
- Design for adding new languages
- Support custom function definitions
- Allow extending syntax patterns

## Success Criteria

1. **Completeness**: Support for all basic operations in each language
2. **Correctness**: Generated code compiles and runs correctly
3. **Idiomaticity**: Generated code follows language conventions
4. **Performance**: Fast code generation for complex graphs
5. **Extensibility**: Easy addition of new languages and functions 