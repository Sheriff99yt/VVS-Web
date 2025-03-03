# Getting Started with VVS Web Development

This guide will help you set up your development environment and understand the workflow for contributing to the VVS Web project.

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

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vvs-web.git
   cd vvs-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```
   This will start the application at http://localhost:3000

## Project Status

VVS Web is currently in the testing and polish phase of the Python MVP. The core components have been implemented:

1. **Syntax Database**: Core database structure with IndexedDB
2. **Visual Node System**: Node canvas with React Flow integration
3. **Python Code Generation**: Execution-based code generation with dependency resolution
4. **Function Definitions**: JSON-based function definitions with multi-language support
5. **Testing Framework**: Comprehensive test suite with 48 tests across 7 test suites

Current focus areas are:
- Finalizing the testing phase
- Documenting the implemented features
- Preparing for the project management phase

## Project Structure

The project follows a feature-based organization:

```
vvs-web/
├── docs/             # Project documentation
├── public/           # Static assets
└── src/              # Source code
    ├── components/   # UI components
    ├── hooks/        # Custom React hooks
    ├── services/     # Core services
    │   ├── database/ # Database services
    │   │   ├── syntax/ # Function definition files
    │   │   └── types/  # TypeScript type definitions
    │   └── codeGen/  # Code generation services
    ├── store/        # State management
    ├── styles/       # Global styles
    ├── types/        # TypeScript definitions
    └── utils/        # Utility functions
```

Refer to [System Overview](./system/SYSTEM_OVERVIEW.md) for more detailed code organization.

## Development Workflow

### 1. Understanding the Task
- Review the [Roadmap](../../ROADMAP.md) to understand the current phase
- Check existing issues for related work
- Read relevant documentation for the area you're working on

### 2. Feature Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement the feature**
   - Follow TypeScript guidelines
   - Add necessary tests
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Submit a pull request**
   - Describe changes clearly
   - Reference related issues
   - Add screenshots for UI changes

### 3. Adding New Functions

To add new functions to the system:

1. **Create a function definition file**
   ```json
   {
     "version": "1.0",
     "description": "Your function definitions",
     "functions": [
       {
         "id": "category_function_name",
         "name": "function_name",
         "displayName": "User-friendly name",
         "category": "Category",
         "description": "Function description",
         "parameters": [
           {
             "name": "param_name",
             "type": "Parameter type",
             "description": "Parameter description",
             "isRequired": true
           }
         ],
         "returnType": "Return type",
         "syntaxPatterns": {
           "python": {
             "pattern": "Syntax pattern with {0}, {1}",
             "type": "expression",
             "imports": [],
             "description": "Python-specific description"
           }
         }
       }
     ],
     "metadata": {
       "lastUpdated": "2024-03-03",
       "supportedLanguages": ["python"],
       "categories": ["Your Category"]
     }
   }
   ```

2. **Load the function definitions**
   ```typescript
   import { FunctionDefinitionService } from './services/database/FunctionDefinitionService';

   const service = FunctionDefinitionService.getInstance();
   await service.loadFunctionDefinitions('/path/to/your/functions.json');
   ```

3. **Test the functions**
   - Verify syntax patterns
   - Test with different inputs
   - Check code generation

### 4. Component Development

#### Creating a New Component

1. **Create component files**
   ```
   src/components/YourComponent/
   ├── index.ts                 # Export file
   ├── YourComponent.tsx        # Component implementation
   ├── YourComponent.module.css # Component styles
   └── YourComponent.test.tsx   # Component tests
   ```

2. **Component Template**
   ```tsx
   import React from 'react';
   import styles from './YourComponent.module.css';

   interface YourComponentProps {
     // Define props
   }

   export const YourComponent: React.FC<YourComponentProps> = (props) => {
     return (
       <div className={styles.container}>
         {/* Component JSX */}
       </div>
     );
   };
   ```

3. **Export the component**
   ```tsx
   // index.ts
   export { YourComponent } from './YourComponent';
   ```

4. **Test the component**
   ```tsx
   import { render, screen } from '@testing-library/react';
   import { YourComponent } from './YourComponent';

   describe('YourComponent', () => {
     it('renders correctly', () => {
       render(<YourComponent />);
       // Add assertions
     });
   });
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm test` | Run all tests |
| `npx jest src/tests/codeGen` | Run code generation tests |
| `npx jest src/tests/database/importers` | Run database importer tests |
| `npm run build` | Build for production |
| `npm run lint` | Run linter |
| `npm run format` | Format code with Prettier |

## Testing

The project includes a comprehensive testing framework:

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npx jest src/tests/codeGen
npx jest src/tests/database/importers
```

### Test Structure
- **Code Generation Tests**: Test dependency resolution, code generation, and syntax pattern application
- **Database Tests**: Test repository operations and function definitions
- **Component Tests**: Test UI components (upcoming)

### Adding Tests
When adding new features, corresponding tests should be added:
```bash
# Create test file in the appropriate directory
touch src/tests/your-feature/YourComponent.test.ts
```

## Coding Guidelines

### TypeScript
- Use strict type checking
- Avoid using `any` type
- Define interfaces for object types
- Use explicit return types for functions

```tsx
// Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User {
  // implementation
}

// Avoid
function getUser(id): any {
  // implementation
}
```

### React
- Use functional components with hooks
- Keep components small and focused
- Use proper prop types with TypeScript interfaces
- Memoize callbacks and derived values

```tsx
// Good
const MemoizedComponent = React.memo(({ items }) => {
  const processedItems = useMemo(() => {
    return items.map(item => processItem(item));
  }, [items]);
  
  return (
    // JSX
  );
});
```

### Styling
- Use CSS modules for component styling
- Follow BEM naming convention within modules
- Maintain theme consistency
- Support light and dark modes

## Getting Help

- Check existing documentation in the `docs/` directory
- Ask questions in the GitHub discussions
- Join the community chat

## Next Steps

1. Review the [Project Vision](../../PROJECT_VISION.md)
2. Explore the [System Architecture](./system/SYSTEM_OVERVIEW.md)
3. Choose a task from the [Roadmap](../../ROADMAP.md)
4. Start developing! 