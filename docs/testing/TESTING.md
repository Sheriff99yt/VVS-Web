# VVS Web Testing Guide

This document provides a comprehensive guide to testing for the VVS Web project, including testing strategy, specifications, and best practices.

## Table of Contents

1. [Testing Goals](#testing-goals)
2. [Testing Levels](#testing-levels)
3. [Test Organization](#test-organization)
4. [Test Coverage Requirements](#test-coverage-requirements)
5. [Testing Approach](#testing-approach)
6. [Component-Specific Test Specifications](#component-specific-test-specifications)
7. [Testing Best Practices](#testing-best-practices)
8. [Test Documentation](#test-documentation)
9. [Continuous Integration](#continuous-integration)
10. [Special Testing Areas](#special-testing-areas)

## Testing Goals

The primary goals of our testing strategy are to:

1. **Ensure Functionality**: Verify that all features work as expected
2. **Prevent Regressions**: Catch issues before they affect users
3. **Maintain Code Quality**: Enforce coding standards and best practices
4. **Document Behavior**: Tests serve as executable documentation
5. **Support Refactoring**: Enable safe code changes and improvements

## Testing Levels

### Unit Tests

Unit tests focus on testing individual components in isolation:

- **Scope**: Individual functions, classes, and methods
- **Tools**: Jest, React Testing Library
- **Location**: `src/tests/` directory, co-located with the code being tested
- **Naming Convention**: `*.test.ts` or `*.test.tsx`

### Integration Tests

Integration tests verify that different components work together correctly:

- **Scope**: Interactions between multiple components or services
- **Focus Areas**: Database operations, code generation pipeline, UI component interactions
- **Location**: `src/tests/integration/` directory

### End-to-End Tests

End-to-end tests validate complete user workflows:

- **Scope**: Full application workflows from UI to code generation
- **Tools**: Cypress
- **Location**: `cypress/` directory
- **Focus**: Critical user journeys and workflows

## Test Organization

Tests are organized by major system components:

```
src/tests/
├── codeGen/              # Code generation tests
│   ├── DependencyResolver.test.ts
│   ├── ExecutionBasedCodeGenerator.test.ts
│   ├── SyntaxPatternApplication.test.ts
│   └── ExportService.test.ts
├── database/             # Database tests
│   ├── SyntaxDatabaseService.test.ts
│   ├── FunctionDefinitionService.test.ts
│   └── ...
├── ui/                   # UI component tests
│   ├── NodeCanvas.test.tsx
│   ├── NodeLibrary.test.tsx
│   └── ...
├── utils/                # Utility function tests
└── mocks/                # Mock implementations for testing
```

## Test Coverage Requirements

| Component | Minimum Coverage | Critical Paths |
|-----------|-----------------|---------------|
| Code Generation | 90% | Dependency resolution, syntax pattern application |
| Database Services | 90% | CRUD operations, transaction handling |
| Function Definition | 90% | Loading, validation, retrieval |
| UI Components | 80% | Node canvas, library, connections |
| Utility Functions | 90% | Formatting, validation, helpers |

## Testing Approach

### Test-Driven Development (TDD)

For critical components, we follow a TDD approach:

1. Write a failing test that defines the expected behavior
2. Implement the minimum code needed to pass the test
3. Refactor the code while keeping tests passing

### Mocking and Test Doubles

We use mocks and test doubles to isolate components:

- **Mock Services**: For database and external services
- **Stub Components**: For UI component dependencies
- **Fake Objects**: For complex data structures

### Test Data Management

We manage test data through:

1. **Fixtures**: Predefined test data stored in JSON files
2. **Factories**: Functions that generate test data
3. **Seeding**: Database seeding for integration tests
4. **Cleanup**: Automatic cleanup after tests

## Component-Specific Test Specifications

### Code Generation Tests

#### DependencyResolver Tests

**Test File**: `src/tests/codeGen/DependencyResolver.test.ts`

**Required Tests**:
- Resolution of linear execution flow
- Handling of branching execution (if/else, loops)
- Detection and handling of circular dependencies
- Proper ordering of data dependencies
- Grouping of related nodes
- Handling of disconnected nodes
- Performance with large node graphs (50+ nodes)

**Example Test Case**:
```typescript
test('should resolve linear execution flow correctly', () => {
  // Arrange: Create a linear chain of nodes
  const nodes = [createNode('1'), createNode('2'), createNode('3')];
  const edges = [
    createEdge('e1', '1', '2', 'exec-out-1', 'exec-in-2'),
    createEdge('e2', '2', '3', 'exec-out-2', 'exec-in-3')
  ];
  
  // Act: Resolve dependencies
  const resolver = new DependencyResolver(nodes, edges);
  resolver.resolve();
  
  // Assert: Check execution order
  const executionOrder = resolver.getExecutionOrder();
  expect(executionOrder).toEqual(['1', '2', '3']);
});
```

#### ExecutionBasedCodeGenerator Tests

**Test File**: `src/tests/codeGen/ExecutionBasedCodeGenerator.test.ts`

**Required Tests**:
- Basic code generation for simple node graphs
- Handling of control structures (if/else, loops)
- Proper indentation and code structure
- Integration with syntax patterns
- Error handling for missing patterns or invalid connections
- Generation of import statements
- Handling of circular execution flow
- Performance with large node graphs

**Example Test Case**:
```typescript
test('should generate properly indented code for nested structures', async () => {
  // Arrange: Create a node graph with nested structures
  const nodes = [
    createIfNode('1'),
    createPrintNode('2'),
    createPrintNode('3')
  ];
  const edges = [
    createEdge('e1', '1', '2', 'then-out', 'exec-in'),
    createEdge('e2', '1', '3', 'else-out', 'exec-in')
  ];
  
  // Act: Generate code
  const generator = new ExecutionBasedCodeGenerator(nodes, edges, mockSyntaxDbService);
  const code = await generator.generateCode();
  
  // Assert: Check indentation and structure
  expect(code.code).toContain('if condition:');
  expect(code.code).toContain('    print(');  // 4-space indent
  expect(code.code).toContain('else:');
  expect(code.code).toContain('    print(');  // 4-space indent
});
```

#### SyntaxPatternApplication Tests

**Test File**: `src/tests/codeGen/SyntaxPatternApplication.test.ts`

**Required Tests**:
- Application of expression patterns
- Application of statement patterns
- Application of block patterns
- Handling of parameter substitution
- Handling of special placeholders
- Error handling for invalid patterns
- Support for different languages

**Example Test Case**:
```typescript
test('should substitute parameters in expression patterns', () => {
  // Arrange: Create a pattern and parameters
  const pattern = {
    pattern: '{0} + {1}',
    patternType: PatternType.EXPRESSION
  };
  const params = ['a', 'b'];
  
  // Act: Apply the pattern
  const result = applySyntaxPattern(pattern, params);
  
  // Assert: Check substitution
  expect(result).toBe('a + b');
});
```

### Database Tests

#### SyntaxDatabaseService Tests

**Test File**: `src/tests/database/SyntaxDatabaseService.test.ts`

**Required Tests**:
- CRUD operations for languages
- CRUD operations for functions
- CRUD operations for syntax patterns
- CRUD operations for types
- Transaction handling
- Error handling for invalid operations
- Performance with large datasets

**Example Test Case**:
```typescript
test('should create and retrieve a language', async () => {
  // Arrange: Prepare language data
  const language = {
    name: 'Python',
    version: '3.11',
    fileExtension: '.py',
    syntaxRules: [],
    isEnabled: true
  };
  
  // Act: Create and retrieve
  const id = await service.createLanguage(language);
  const retrieved = await service.getLanguageById(id);
  
  // Assert: Check retrieved data
  expect(retrieved).toMatchObject({
    id,
    ...language
  });
});
```

#### FunctionDefinitionService Tests

**Test File**: `src/tests/database/FunctionDefinitionService.test.ts`

**Required Tests**:
- Loading function definitions from JSON
- Validation of function definition structure
- Retrieval of functions by ID
- Retrieval of functions by category
- Searching functions by name or tags
- Getting syntax patterns for functions
- Handling of invalid function definitions

**Example Test Case**:
```typescript
test('should load and validate function definitions', async () => {
  // Arrange: Prepare mock JSON data
  const mockData = {
    version: '1.0',
    functions: [
      {
        id: 'test_func',
        name: 'Test Function',
        category: 'Test',
        parameters: [],
        returnType: 'void'
      }
    ]
  };
  
  // Mock fetch to return this data
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockData)
  });
  
  // Act: Load definitions
  await service.loadDefinitions('test.json');
  
  // Assert: Check loaded function
  const func = service.getFunction('test_func');
  expect(func).toBeDefined();
  expect(func?.name).toBe('Test Function');
});
```

### UI Component Tests

#### NodeCanvas Tests

**Test File**: `src/tests/ui/NodeCanvas.test.tsx`

**Required Tests**:
- Rendering of nodes and connections
- Adding and removing nodes
- Creating and deleting connections
- Selection of nodes and connections
- Panning and zooming
- Undo/redo functionality
- Performance with many nodes

**Example Test Case**:
```typescript
test('should add a node to the canvas', () => {
  // Arrange: Render the component
  const { result } = renderHook(() => useNodeCanvas());
  
  // Act: Add a node
  act(() => {
    result.current.addNode({
      type: 'functionNode',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node' }
    });
  });
  
  // Assert: Check node was added
  expect(result.current.nodes.length).toBe(1);
  expect(result.current.nodes[0].data.label).toBe('Test Node');
});
```

#### NodeLibrary Tests

**Test File**: `src/tests/ui/NodeLibrary.test.tsx`

**Required Tests**:
- Rendering of function categories
- Searching for functions
- Dragging functions to canvas
- Filtering functions by category
- Displaying function details
- Performance with many functions

**Example Test Case**:
```typescript
test('should filter functions by search term', () => {
  // Arrange: Render with functions
  const functions = [
    { id: '1', name: 'Add', category: 'Math' },
    { id: '2', name: 'Print', category: 'IO' }
  ];
  
  const { getByPlaceholderText, queryByText } = render(
    <NodeLibrary functions={functions} />
  );
  
  // Act: Search for "Add"
  fireEvent.change(getByPlaceholderText('Search...'), {
    target: { value: 'Add' }
  });
  
  // Assert: Only Add should be visible
  expect(queryByText('Add')).toBeInTheDocument();
  expect(queryByText('Print')).not.toBeInTheDocument();
});
```

### Error Handling Tests

#### Code Generation Error Tests

**Test File**: `src/tests/codeGen/ErrorHandling.test.ts`

**Required Tests**:
- Handling of missing syntax patterns
- Handling of circular dependencies
- Handling of invalid connections
- Detailed error messages with context
- Recovery from errors
- Suggestions for fixing errors

**Example Test Case**:
```typescript
test('should provide detailed error for missing syntax pattern', async () => {
  // Arrange: Create a node with non-existent pattern
  const node = createNode('1', 'MissingPattern', 999);
  
  // Act: Generate code
  const generator = new ExecutionBasedCodeGenerator([node], [], mockSyntaxDbService);
  const result = await generator.generateCode();
  
  // Assert: Check error details
  expect(result.errors.length).toBeGreaterThan(0);
  const error = result.errors[0];
  expect(error.nodeId).toBe('1');
  expect(error.functionId).toBe(999);
  expect(error.suggestions.length).toBeGreaterThan(0);
});
```

### Performance Tests

#### Large Node Graph Tests

**Test File**: `src/tests/performance/LargeNodeGraph.test.ts`

**Required Tests**:
- Rendering performance with 50+ nodes
- Code generation performance with 50+ nodes
- Dependency resolution performance with complex graphs
- UI responsiveness during operations on large graphs

**Example Test Case**:
```typescript
test('should generate code for large node graph within time limit', async () => {
  // Arrange: Create a large node graph
  const { nodes, edges } = createLargeNodeGraph(50);
  
  // Act: Measure time to generate code
  const startTime = performance.now();
  const generator = new ExecutionBasedCodeGenerator(nodes, edges, mockSyntaxDbService);
  await generator.generateCode();
  const endTime = performance.now();
  
  // Assert: Check time is within limit
  const executionTime = endTime - startTime;
  expect(executionTime).toBeLessThan(1000); // Less than 1 second
});
```

## Testing Best Practices

1. **Isolated Tests**: Tests should not depend on each other
2. **Fast Execution**: Tests should run quickly to encourage frequent testing
3. **Readable Tests**: Tests should clearly express intent and expected behavior
4. **Maintainable Tests**: Tests should be easy to update when requirements change
5. **Deterministic Tests**: Tests should produce the same results on each run

## Test Documentation

Each test file should include:

1. **Purpose**: What the tests are verifying
2. **Test Structure**: How the tests are organized
3. **Mock Setup**: How dependencies are mocked
4. **Edge Cases**: Special cases being tested

## Continuous Integration

Tests are automatically run in CI/CD pipelines:

1. **Pull Request Checks**: All tests must pass before merging
2. **Coverage Reports**: Test coverage is reported for each build
3. **Linting**: Code style and quality checks are enforced

## Special Testing Areas

### Accessibility Testing

We test for accessibility compliance:

1. **Keyboard Navigation**: Ensure all features are keyboard accessible
2. **Screen Reader Compatibility**: Test with screen readers
3. **Color Contrast**: Verify sufficient contrast for readability

**Example Test Case**:
```typescript
test('should allow adding a node with keyboard', () => {
  // Arrange: Render the application
  const { getByRole } = render(<App />);
  
  // Act: Use keyboard to add a node
  const addButton = getByRole('button', { name: 'Add Node' });
  fireEvent.keyDown(addButton, { key: 'Enter' });
  
  // Assert: Node should be added
  expect(getByRole('region', { name: 'canvas' })).toContain(
    getByRole('button', { name: 'New Node' })
  );
});
```

### Security Testing

Security testing focuses on:

1. **Input Validation**: Test handling of unexpected inputs
2. **Data Storage**: Verify secure storage of user data
3. **Code Execution**: Ensure safe handling of generated code

### Cross-Browser Testing

Cross-browser testing ensures the application works across different browsers:

1. **Target Browsers**: Chrome, Firefox, Safari, Edge
2. **Responsive Layout**: Test on different screen sizes
3. **Feature Compatibility**: Ensure features work consistently across browsers

## Conclusion

This testing guide provides comprehensive guidelines and specifications for ensuring the quality and reliability of the VVS Web application. By following these testing practices, we can maintain high code quality, prevent regressions, and support ongoing development with confidence. 