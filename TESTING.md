# VVS Web Testing Documentation

This document outlines the testing strategy for the Vision Visual Scripting (VVS) Web application, including what's currently tested, how the tests are structured, and areas for future test coverage.

## Current Test Coverage

The following systems and components have test coverage:

### Socket System
- `src/__tests__/sockets/types.test.ts` - Tests socket type definitions and utilities
- `src/__tests__/sockets/Socket.test.tsx` - Tests the Socket component UI and behavior

### Node System
- `src/__tests__/nodes/BaseNode.test.tsx` - Tests the base node component rendering and interactions

### State Management (Zustand Store)
- `src/__tests__/store/useGraphStore.test.ts` - Tests the graph state management, including node/edge operations

### Utilities
- `src/__tests__/utils/codeGenerator.test.ts` - Tests the Python code generation system

## Testing Architecture

### Mock Strategy

The project uses comprehensive mocking to isolate components during testing:

1. **Chakra UI Mocking**:
   - All Chakra UI components are mocked with simple React elements
   - A filtering system removes Chakra-specific props to prevent warnings
   - Essential components like Box, Text, Tooltip are individually mocked

2. **ReactFlow Mocking**:
   - The ReactFlowProvider is mocked to provide necessary context
   - Nodes, edges, and flow components are simplified
   - The store API is mocked with placeholder data

3. **Monaco Editor Mocking**:
   - Simplified to a basic div element with data-testid

### Test Patterns

Tests generally follow these patterns:

1. **Component Tests**:
   - Render components with test data
   - Verify correct elements are present
   - Test interactive behavior where applicable
   - Use test wrappers to handle context requirements

2. **Hook/State Tests**:
   - Mock external dependencies
   - Initialize with test data
   - Perform state operations
   - Verify state changes correctly

## Areas for Additional Testing

The following areas should be prioritized for additional test coverage:

### Components
- `NodeLibrary.tsx` - Test category display and node selection
- `GraphEditor.tsx` - Test node placement and connection
- `PropertiesPanel.tsx` - Test property display and editing
- `CodePreview.tsx` - Test code display and formatting

### Node Types
- Test specific node type implementations
- Verify correct socket configurations
- Test node-specific property handling

### Integration Testing
- Test the interaction between components
- Verify data flow from node creation to code generation
- Test the complete user workflow

### UI/UX Testing
- Test responsive layouts
- Test accessibility features
- Test keyboard navigation

## How to Add New Tests

When adding new tests:

1. Place test files in the appropriate subfolder of `src/__tests__/`
2. Follow naming convention: `ComponentName.test.tsx`
3. Import required testing utilities and component under test
4. Create test wrapper if component requires context
5. Mock dependencies as needed
6. Write test cases with clear descriptions
7. Use meaningful assertions that verify component behavior

## Test Maintenance

To keep tests maintainable:

1. **Update mocks** when new Chakra UI components are used
2. **Add new filters** to `filterChakraProps` when warnings appear
3. **Update ReactFlow mocks** when using new ReactFlow features
4. **Keep assertions focused** on behavior, not implementation details 