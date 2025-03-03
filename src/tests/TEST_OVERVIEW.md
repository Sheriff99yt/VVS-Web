# VVS Web Test Overview

This document provides an overview of the test suites in the VVS Web project, what they test, and their current status.

## Test Structure

The testing structure is organized by major system components:

- **`database/`**: Tests for database and function definition services
- **`codeGen/`**: Tests for code generation components 
- **Future**: Testing for UI components and node system will be added as they are developed

## Running Tests

You can run all tests with:

```bash
npm test
```

Or run specific test suites with:

```bash
npx jest src/tests/database
npx jest src/tests/codeGen
```

## Test Coverage Summary

| Component                 | Files | Tests | Coverage | Status |
|---------------------------|-------|-------|----------|--------|
| Function Definition       | 1     | 18    | High     | ✅ Pass |
| Syntax Database           | 1     | 20    | High     | ✅ Pass |
| Code Generation           | 4     | 39    | High     | ✅ Pass |

## Database Tests

The database tests focus on testing the storage and retrieval of syntax data, including languages, functions, syntax patterns, types, and type mappings.

### Function Definition Service

**File:** `database/FunctionDefinitionService.test.ts`

Tests the JSON-based function definition system that replaced the old Python built-ins importer. This service is responsible for loading and managing function definitions from JSON files.

**Status:** ✅ All 18 tests passing

**Key Tests:**
- Singleton pattern implementation
- JSON file loading and parsing
- Function retrieval by ID, category, and language
- Validation of function definition structure
- Error handling for malformed JSON or network errors

### Syntax Database Service

**File:** `database/SyntaxDatabaseService.test.ts`

Tests the core database service that handles storing and retrieving syntax data. Uses a mock implementation for isolated testing.

**Status:** ✅ All 20 tests passing

**Key Tests:**
- Language operations (create, retrieve, update, delete)
- Function operations (create, retrieve, update, delete, search)
- Syntax pattern operations
- Type operations
- Type mapping operations
- Database management (export, import, clear)

## Code Generation Tests

The code generation tests focus on the process of generating executable code from nodes and connections.

### Dependency Resolver

**File:** `codeGen/DependencyResolver.test.ts`

Tests the component that resolves dependencies between nodes and determines the execution order.

**Status:** ✅ All tests passing

**Key Tests:**
- Resolving linear execution flow
- Handling branches and conditionals
- Resolving circular references
- Identifying execution groups

### Execution Based Code Generator

**File:** `codeGen/ExecutionBasedCodeGenerator.test.ts`

Tests the component that generates code based on the execution flow of nodes.

**Status:** ✅ All tests passing

**Key Tests:**
- Basic code generation
- Handling different pattern types
- Circular execution flow
- Missing syntax patterns

### Syntax Pattern Application

**File:** `codeGen/SyntaxPatternApplication.test.ts`

Tests the application of syntax patterns to convert abstract operations into language-specific code.

**Status:** ✅ All tests passing

**Key Tests:**
- Applying patterns for different operations
- Handling parameter substitution
- Error conditions

### Export Service

**File:** `codeGen/ExportService.test.ts`

Tests the service responsible for exporting generated code to Python files.

**Status:** ✅ All 7 tests passing

**Key Tests:**
- File generation and download functionality
- Code formatting options
- Documentation addition
- Filename handling with timestamps
- Error handling during export

## Future Testing Plans

1. **UI Components Testing**:
   - Form components
   - Node editor components
   - Canvas interactions
   - Drag and drop functionality

2. **Node System Testing**:
   - Node creation and management
   - Connection handling
   - Node property editors
   - Validation of node configurations

3. **End-to-End Testing**:
   - Complete workflow from node creation to code execution
   - Project saving and loading
   - Export functionality 