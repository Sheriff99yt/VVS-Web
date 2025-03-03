# VVS Web Developer Guide

This guide provides comprehensive information for developers working on the VVS Web project, from setting up the development environment to understanding key implementation details.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Key Implementation Details](#key-implementation-details)
   - [Dependency Resolution](#dependency-resolution)
   - [Syntax Pattern Application](#syntax-pattern-application)
   - [Code Generation](#code-generation)
5. [Troubleshooting](#troubleshooting)

## Development Environment Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git
- Code editor (VSCode recommended)

### Recommended VSCode Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Developer Tools

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/vvs-web.git
   cd vvs-web
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

The VVS Web project follows a modular structure:

```
vvs-web/
├── docs/                     # Documentation
├── public/                   # Static assets
├── src/
│   ├── assets/               # Application assets
│   ├── components/           # React components
│   │   ├── flow/             # Node graph components
│   │   ├── ui/               # UI components
│   │   └── ...
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── models/               # TypeScript interfaces and types
│   ├── services/             # Core application services
│   │   ├── codeGen/          # Code generation services
│   │   ├── database/         # Database services
│   │   └── ...
│   ├── tests/                # Tests
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main application component
│   └── index.tsx             # Application entry point
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Development Workflow

### Branching Strategy

We follow a feature-branch workflow:

1. Create a new branch for each feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. Make your changes and commit them with clear messages:
   ```bash
   git commit -m "feat: add new feature description"
   git commit -m "fix: resolve issue with component"
   ```

3. Push your branch and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

We use ESLint and Prettier to maintain code quality and consistency:

- Run the linter:
  ```bash
  npm run lint
  # or
  yarn lint
  ```

- Format your code:
  ```bash
  npm run format
  # or
  yarn format
  ```

### Testing

Tests are written using Jest and React Testing Library:

- Run all tests:
  ```bash
  npm test
  # or
  yarn test
  ```

- Run tests for a specific file:
  ```bash
  npm test -- src/tests/path/to/test
  # or
  yarn test src/tests/path/to/test
  ```

## Key Implementation Details

### Dependency Resolution

The dependency resolution system is a critical component that determines the execution order of nodes in the graph and resolves data dependencies.

#### Key Components

1. **DependencyResolver Class**
   - Tracks both execution and data dependencies
   - Supports execution groups to identify related nodes
   - Handles circular dependency detection and resolution
   - Maps inputs to their source nodes and ports

2. **Execution Groups**
   - Nodes are grouped based on execution flow
   - Each entry point (node with no incoming execution connections) starts a new group
   - Nodes without execution ports are placed in a separate data flow group

3. **Dependency Graph**
   - Built at resolution time to track relationships between nodes
   - Used to determine execution order and validate connections
   - Optimized for performance with large node graphs

#### Algorithm Overview

1. **Execution Dependency Resolution**
   - Start with entry nodes (nodes with no incoming execution connections)
   - Follow execution connections to build execution groups
   - Validate that all execution inputs are connected or optional

2. **Data Dependency Resolution**
   - For each node, identify input data requirements
   - Map inputs to source nodes and outputs
   - Validate type compatibility
   - Handle circular dependencies by inserting placeholder variables

### Syntax Pattern Application

The syntax pattern application system translates abstract operations into language-specific code using patterns stored in the syntax database.

#### Pattern Types

1. **Expression Patterns**
   - Generate expressions that return values
   - Example: `a + b` for addition

2. **Statement Patterns**
   - Generate statements that perform actions
   - Example: `print(value)` for output

3. **Block Patterns**
   - Generate multi-line code blocks
   - Example: Function definitions, loops, etc.

#### Placeholder Substitution

Syntax patterns use placeholders that are replaced with actual values:

- Named placeholders: `{parameter_name}`
- Indexed placeholders: `{0}`, `{1}`, etc.
- Special placeholders: `{body}`, `{indent}`, etc.

#### Pattern Application Process

1. Load the appropriate syntax pattern for the function and language
2. Resolve input values from connected nodes
3. Substitute placeholders with actual values
4. Handle special cases based on pattern type
5. Apply indentation and formatting

### Code Generation

The code generation system transforms the node graph into executable code.

#### Code Generation Components

1. **ExecutionBasedCodeGenerator**
   - Main component responsible for generating code
   - Follows execution flow to generate properly structured code
   - Integrates with the dependency resolver and syntax pattern application

2. **CodeGenerationError System**
   - Provides detailed error handling with context information
   - Includes factory methods for different error types
   - Helps identify and resolve issues in the node graph

3. **Code Formatting**
   - Ensures generated code follows language-specific formatting guidelines
   - Implements PEP 8 compliance for Python code

#### Generation Process

1. Find entry nodes (nodes with no incoming execution connections)
2. Generate a main function that starts from these entry points
3. Follow the execution flow, generating code for each node
4. Handle control structures (if/else, loops) by properly nesting code
5. Manage variable scope and naming
6. Generate required imports
7. Format the final code

## Troubleshooting

### Common Issues

1. **IndexedDB Errors**
   - Solution: Clear browser storage or use Chrome's Application tab to delete IndexedDB databases

2. **React Flow Performance Issues**
   - Solution: Enable performance optimizations in the settings panel

3. **Code Generation Errors**
   - Solution: Check the error console for detailed messages from the CodeGenerationError system

### Debugging Tips

1. Use the built-in logging system:
   ```typescript
   import { logger } from '../utils/logger';
   
   logger.debug('Detailed information', { contextObject });
   logger.info('General information');
   logger.warn('Warning message');
   logger.error('Error message', error);
   ```

2. Enable debug mode in the application settings

3. Use React Developer Tools to inspect component state

4. Set up VS Code debugging:
   - Use the `.vscode/launch.json` configuration
   - Set breakpoints in VS Code
   - Run in debug mode 