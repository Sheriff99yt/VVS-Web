# Vision Visual Scripting (VVS) Web - MVP

A node-based visual programming interface that generates Python code from visual graphs.

## Project Overview

Vision Visual Scripting (VVS) Web is a web-based visual programming environment that allows users to create programs by connecting nodes in a graph. The system automatically generates Python code from the visual representation. This MVP (Minimum Viable Product) focuses on delivering the core node-based programming experience without persistence features.

## Features

- **Node-based Programming**: Create programs by connecting nodes in a graph
- **Real-time Code Generation**: See the generated Python code update as you build your graph
- **Multiple Node Types**: Use a variety of node types for different programming constructs:
  - Process Flow: If Statement, For Loop
  - Logic Operations: AND, OR, Greater Than, Less Than, Equal
  - Math Operations: Add, Subtract, Multiply, Divide
  - Variables: Variable definition and retrieval
  - Input/Output: Print, User Input
  - Function: Function definition and calling

## Project Structure

- `src/components`: UI components
- `src/nodes`: Node implementations
- `src/sockets`: Socket system for node connections
- `src/store`: State management with Zustand
- `src/utils`: Utility functions including code generation
- `src/themes`: Theme customization
- `src/__tests__`: Test files organized by module

## Technology Stack

- React with TypeScript
- React Flow for node graph visualization
- Monaco Editor for code preview
- Chakra UI for user interface
- Zustand for state management
- Jest and React Testing Library for testing

## Development Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Testing

This project uses Jest and React Testing Library for unit and component testing. The tests are organized by module in the `src/__tests__` directory.

### Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To generate test coverage report:

```bash
npm run test:coverage
```

### Testing Configuration

The testing environment is set up with the following:

- `jest.config.cjs`: Jest configuration file
- `tsconfig.jest.json`: TypeScript configuration specifically for tests
- `src/setupTests.ts`: Setup file for test environment and mocks

The testing environment includes special handling for:

1. **Chakra UI Components**: Components are mocked to prevent styling warnings and provide consistent test rendering
2. **ReactFlow**: Flow components and hooks are mocked to prevent context errors
3. **structuredClone** polyfill: For environments where this function is not available
4. **Monaco Editor**: Mocked to provide a simpler representation in tests

### Test Structure

Each test suite follows a standard pattern:

1. Import components and utilities needed for the test
2. Mock any external dependencies
3. Set up any test data or test wrappers
4. Define and run tests with appropriate assertions

## Important Notes

- **Session-Only Usage**: This MVP operates as a runtime-only experience
- **No Persistence**: All work will be lost when the page is refreshed
- **Python-Only**: Only Python code generation is supported in this version

## Post-MVP Plans

After the MVP, the following features will be prioritized:
1. Save/load functionality
2. Undo/redo system
3. Export/import capabilities
4. Auto-save functionality
5. Additional node types
6. Multiple language support (C++, Rust)
