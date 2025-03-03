# Syntax Database Implementation

## Overview

This document details the implementation of the syntax database layer for VVS Web. The database stores definitions of programming languages, operations, and syntax patterns, enabling the system to generate code in multiple languages from the same visual node graph.

## Core Features

- **Language Definition Storage**: Storage of syntax rules for multiple programming languages
- **Function Definition Repository**: Abstract representation of operations independent of language
- **Syntax Pattern Templates**: Code generation patterns for each operation in each language
- **Type Mapping System**: Cross-language type conversion and validation
- **Offline Operation**: Complete functionality without internet connection using IndexedDB

## Database Technology

VVS Web uses **IndexedDB** for client-side storage of the syntax database:

- **Benefits**:
  - Structured storage with indexing
  - Asynchronous API for performance
  - Transaction support
  - Offline functionality
  - No server requirements

## Database Schema

The database is organized into the following object stores:

```
┌──────────────┐      ┌───────────────┐      ┌───────────────┐
│ languages    │◄────►│ functions     │◄────►│ syntaxPatterns │
└──────────────┘      └───────────────┘      └───────────────┘
       ▲                     ▲                      ▲
       │                     │                      │
       ▼                     │                      │
┌──────────────┐             │                      │
│ types        │◄────────────┘                      │
└──────────────┘                                    │
       ▲                                            │
       │                                            │
       ▼                                            │
┌──────────────┐                                    │
│ typeMappings │◄───────────────────────────────────┘
└──────────────┘
```

### Object Stores

1. **languages**: Programming language definitions and syntax rules
2. **functions**: Language-agnostic function definitions
3. **syntaxPatterns**: Language-specific code templates for functions
4. **types**: Type definitions for parameter and return types
5. **typeMappings**: Mappings between abstract types and language-specific types

## Repository Layer

The database is accessed through specialized repository classes:

### LanguageRepository

Manages language definitions with syntax rules.

```typescript
class LanguageRepository {
  async getById(id: number): Promise<Language | null>;
  async getAll(): Promise<Language[]>;
  async create(language: Omit<Language, 'id'>): Promise<number>;
  async update(language: Language): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

### FunctionRepository

Handles function definitions with parameters and return types.

```typescript
class FunctionRepository {
  async getById(id: number): Promise<FunctionDefinition | null>;
  async getByCategory(category: string): Promise<FunctionDefinition[]>;
  async search(query: string): Promise<FunctionDefinition[]>;
  async create(func: Omit<FunctionDefinition, 'id'>): Promise<number>;
  async update(func: FunctionDefinition): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

### PatternRepository

Manages syntax patterns for code generation.

```typescript
class PatternRepository {
  async getPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null>;
  async getPatternsByLanguage(languageId: number): Promise<SyntaxPattern[]>;
  async create(pattern: Omit<SyntaxPattern, 'id'>): Promise<number>;
  async update(pattern: SyntaxPattern): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

### TypeRepository and TypeMappingRepository

Handle type definitions and language-specific type mappings.

```typescript
class TypeRepository {
  async getById(id: number): Promise<TypeDefinition | null>;
  async getAll(): Promise<TypeDefinition[]>;
  async create(type: Omit<TypeDefinition, 'id'>): Promise<number>;
  async update(type: TypeDefinition): Promise<void>;
  async delete(id: number): Promise<void>;
}

class TypeMappingRepository {
  async getMapping(abstractTypeId: number, languageId: number): Promise<TypeMapping | null>;
  async getMappingsByLanguage(languageId: number): Promise<TypeMapping[]>;
  async create(mapping: Omit<TypeMapping, 'id'>): Promise<number>;
  async update(mapping: TypeMapping): Promise<void>;
  async delete(id: number): Promise<void>;
}
```

## SyntaxDatabaseService

The `SyntaxDatabaseService` provides a unified API for accessing all syntax-related data:

```typescript
interface SyntaxDatabaseService {
  // Language methods
  getLanguageById(id: number): Promise<Language | null>;
  getLanguages(): Promise<Language[]>;
  
  // Function methods
  getFunctionById(id: number): Promise<FunctionDefinition | null>;
  getFunctionsByCategory(category: string): Promise<FunctionDefinition[]>;
  searchFunctions(query: string): Promise<FunctionDefinition[]>;
  
  // Syntax pattern methods
  getSyntaxPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null>;
  getSyntaxPatternsByLanguage(languageId: number): Promise<SyntaxPattern[]>;
  
  // Type methods
  getTypeById(id: number): Promise<TypeDefinition | null>;
  getTypes(): Promise<TypeDefinition[]>;
  
  // Type mapping methods
  getTypeMapping(abstractTypeId: number, languageId: number): Promise<TypeMapping | null>;
  getTypeMappingsByLanguage(languageId: number): Promise<TypeMapping[]>;
  
  // Database management
  initDatabase(): Promise<void>;
  clearDatabase(): Promise<void>;
}
```

## Database Initialization

The database is initialized through the `DatabaseInitializer` which:

1. Creates the database schema if it doesn't exist
2. Seeds the database with initial language data using the function definition service
3. Ensures all required object stores and indices are properly configured

## Python Data Definition

For the MVP, Python data is defined using:

1. **JSON Function Definitions**: Functions are defined in structured JSON files
2. **FunctionDefinitionService**: Loads and validates function definitions from JSON
3. **Pre-defined TypeDefinitions**: Common types like number, string, boolean, list, etc.
4. **TypeMappings**: Maps abstract types to Python-specific types

## Database Testing

The database implementation is thoroughly tested with isolated tests for:

### Repository Tests
Tests for CRUD operations on all repositories, including:
- Create, read, update, and delete operations
- Query performance
- Transaction handling
- Index usage

### Importer Tests
Isolated tests for database importers, which verify:
- Language handling (finding or creating language definitions)
- Function creation with proper properties
- Syntax pattern generation for different function types
- Parameter handling
- Duplicate detection and skipping

### Performance Tests
Tests that measure and verify performance metrics for:
- Create operations
- Read operations
- Update operations
- Delete operations
- Batch operations
- Query operations

## Data Export and Import

The system now uses a JSON-based approach for function definitions:

1. **JSON Definition Files**: Function definitions are stored in JSON files in the `src/services/database/syntax/` directory
2. **FunctionDefinitionService**: Loads and manages function definitions from these JSON files
3. **Sharing**: Exchange language definitions by sharing JSON definition files

This approach replaces the previous `SyntaxDataExporter` class with a more direct and maintainable file-based system.

## Future Enhancements

Planned database enhancements include:

1. **Custom Functions**: Support for user-defined functions
2. **Version Management**: Track language version changes
3. **Automated Updates**: Detect and apply language updates
4. **Extended Language Support**: Add additional programming languages 