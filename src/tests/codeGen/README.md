# Code Generation Tests

This directory contains isolated tests for the code generation functionality in the VVS Web Python MVP.

## Test Files

- **DependencyResolver.test.ts**: Tests for the `DependencyResolver` class which analyzes the node graph, determines the correct order of operations, and manages dependencies needed for code generation.
  
- **ExecutionBasedCodeGenerator.test.ts**: Tests for the `ExecutionBasedCodeGenerator` class which generates Python code based on nodes and their execution connections, supporting proper control flow nesting.
  
- **SyntaxPatternApplication.test.ts**: Tests for the syntax pattern application functionality, which replaces placeholders in syntax patterns with actual values.

- **RunCodeGenTests.ts**: A test runner that imports and runs all code generation tests.

## Running Tests

To run all the tests in this directory:

```bash
npx jest src/tests/codeGen
```

## Test Coverage

These tests focus on isolated testing of:

1. **Dependency Resolution**
   - Execution order determination
   - Data dependency resolution
   - Execution groups
   - Circular dependency detection
   - Required imports identification

2. **Code Generation**
   - Basic code generation for empty and data flow graphs
   - Execution-based code generation with proper nesting
   - Control flow handling (if/else, loops, functions)
   - Correct variable naming and scoping

3. **Syntax Pattern Application**
   - Basic pattern application for expressions, statements, and blocks
   - Nested indentation handling
   - Parameter replacement in patterns
   - Edge cases and error handling

## Mock Components

The tests use simple mock implementations of the required components to isolate testing:

- `MockSyntaxDatabaseService`: A simplified version of the `SyntaxDatabaseService` with predefined patterns
- Helper functions for creating test nodes, edges, and syntax patterns

## Known Limitations

The tests are designed to be flexible to accommodate implementation changes. They focus on essential behaviors rather than exact implementation details, which allows the tests to remain valid even as the code evolves. 