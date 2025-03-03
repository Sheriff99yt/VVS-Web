# VVS Web Test Specifications

This document outlines the test specifications and coverage requirements for the VVS Web project, providing detailed guidance on what should be tested and how.

## Test Coverage Requirements

| Component | Minimum Coverage | Critical Paths |
|-----------|-----------------|---------------|
| Code Generation | 90% | Dependency resolution, syntax pattern application |
| Database Services | 90% | CRUD operations, transaction handling |
| Function Definition | 90% | Loading, validation, retrieval |
| UI Components | 80% | Node canvas, library, connections |
| Utility Functions | 90% | Formatting, validation, helpers |

## Code Generation Tests

### DependencyResolver Tests

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

### ExecutionBasedCodeGenerator Tests

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

### SyntaxPatternApplication Tests

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

## Database Tests

### SyntaxDatabaseService Tests

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

### FunctionDefinitionService Tests

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

## UI Component Tests

### NodeCanvas Tests

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

### NodeLibrary Tests

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

## Performance Tests

### Large Node Graph Tests

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

### Database Performance Tests

**Test File**: `src/tests/performance/DatabasePerformance.test.ts`

**Required Tests**:
- Bulk operations performance
- Query performance with large datasets
- Transaction performance
- Indexing effectiveness

**Example Test Case**:
```typescript
test('should efficiently query functions by category', async () => {
  // Arrange: Create many functions
  await createManyFunctions(100, 'Test');
  
  // Act: Measure query time
  const startTime = performance.now();
  await service.getFunctionsByCategory('Test');
  const endTime = performance.now();
  
  // Assert: Check time is within limit
  const queryTime = endTime - startTime;
  expect(queryTime).toBeLessThan(100); // Less than 100ms
});
```

## Error Handling Tests

### Code Generation Error Tests

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

### Database Error Tests

**Test File**: `src/tests/database/ErrorHandling.test.ts`

**Required Tests**:
- Handling of database connection errors
- Handling of constraint violations
- Handling of transaction failures
- Recovery from errors
- Detailed error messages

**Example Test Case**:
```typescript
test('should handle constraint violation gracefully', async () => {
  // Arrange: Create a language
  const language = {
    name: 'Python',
    version: '3.11',
    fileExtension: '.py',
    syntaxRules: [],
    isEnabled: true
  };
  await service.createLanguage(language);
  
  // Act & Assert: Creating duplicate should not throw but return error
  await expect(service.createLanguage(language)).resolves.toMatchObject({
    success: false,
    error: expect.stringContaining('already exists')
  });
});
```

## Accessibility Tests

### Keyboard Navigation Tests

**Test File**: `src/tests/accessibility/KeyboardNavigation.test.tsx`

**Required Tests**:
- Tab navigation through UI elements
- Keyboard shortcuts for common operations
- Focus management
- ARIA attributes for screen readers

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

## Conclusion

These test specifications provide a comprehensive framework for ensuring the quality and reliability of the VVS Web application. By following these specifications, we can maintain high test coverage, catch issues early, and support ongoing development with confidence. 