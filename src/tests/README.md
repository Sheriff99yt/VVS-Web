# VVS Web Testing Strategy

This directory contains tests for the VVS Web application. The tests are organized into subdirectories based on the components being tested.

## Directory Structure

- **`codeGen/`**: Tests for code generation components
  - `DependencyResolver.test.ts`: Tests for resolving dependencies between nodes
  - `ExecutionBasedCodeGenerator.test.ts`: Tests for generating code based on execution flow
  - `SyntaxPatternApplication.test.ts`: Tests for applying syntax patterns
  
- **`database/`**: Tests for database-related functionality
  - **`importers/`**: Tests for database seeding and importing
    - `PythonBuiltinsImporter.test.ts`: Tests for importing Python built-in functions

## Testing Approach

### Isolated Testing

We use isolated tests to verify component functionality without relying on the actual production environment. This involves:

1. **Mocking Dependencies**: Creating mock versions of services and components that the tested component depends on
2. **Controlled Test Data**: Using predefined test data to ensure consistent test results
3. **Focused Test Cases**: Testing specific behaviors and edge cases in isolation

### Mock Implementations

For services with external dependencies (like database services), we create mock implementations that:

- Implement the same interface as the production service
- Provide controlled responses to method calls
- Track method calls for verification
- Store test data in memory

### Test Categories

Our tests cover:

1. **Unit Tests**: Testing individual functions and classes in isolation
2. **Integration Tests**: Testing how components work together
3. **Functional Tests**: Testing complete features from a user perspective

## Running Tests

Run all tests:

```bash
npm test
```

Run tests for a specific directory:

```bash
npx jest src/tests/codeGen
npx jest src/tests/database/importers
```

Run a specific test file:

```bash
npx jest src/tests/codeGen/DependencyResolver.test.ts
```

## Test Coverage

To generate a test coverage report:

```bash
npm run test:coverage
```

## Adding New Tests

When adding new tests:

1. Follow the established directory structure
2. Create mock implementations of dependencies
3. Test both normal usage and edge cases
4. Ensure tests are isolated and don't depend on external state
5. Document the testing approach in a README.md file in the relevant directory

## Continuous Integration

Tests are automatically run in CI/CD pipelines to ensure code quality before deployment. 