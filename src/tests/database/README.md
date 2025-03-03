# Database Testing

This directory contains tests for the database-related components of the VVS Web application.

## Test Files

### Core Database Tests

- **`DatabaseTestSuite.test.ts`**: Integration tests for the database service and repositories
- **`FunctionDefinitionService.test.ts`**: Unit tests for the JSON-based function definition service
- **`PerformanceTests.test.ts`**: Performance measurements for database operations

### Importers

The `importers/` subdirectory contains tests for database data importers:

- **`PythonBuiltinsImporter.test.ts`**: Tests for importing Python built-in functions

## Testing Approach

### Isolated Testing

The database tests use isolated testing techniques to avoid dependencies on the production database:

1. **Mock Implementations**: We create mock implementations of database services and repositories
2. **In-Memory Storage**: Tests use in-memory storage instead of actual IndexedDB
3. **Controlled Test Data**: We use predefined test data to ensure consistent results

### Test Categories

The tests cover several categories:

1. **Unit Tests**: Testing individual services and repositories
2. **Integration Tests**: Testing how multiple components work together
3. **Performance Tests**: Measuring the performance of database operations

## Function Definition Service Testing

The `FunctionDefinitionService.test.ts` file tests the new JSON-based function definition system:

- **Singleton Pattern**: Verifies that the service follows the singleton pattern
- **JSON Loading**: Tests loading function definitions from JSON files
- **Validation**: Verifies validation of function definition structure
- **Query Methods**: Tests methods for retrieving functions by ID, category, and language
- **Error Handling**: Tests error cases such as malformed JSON or network errors

The tests mock the global `fetch` function to simulate loading JSON files without making actual network requests.

## Running Tests

Run all database tests:

```bash
npx jest src/tests/database
```

Run a specific test file:

```bash
npx jest src/tests/database/FunctionDefinitionService.test.ts
```

## Test Coverage

The tests aim to cover:

- All public methods of each service and repository
- Edge cases and error handling
- Performance characteristics for critical operations

## Adding New Tests

When adding new database tests:

1. Follow the established patterns for mocking and isolation
2. Ensure tests don't depend on external state
3. Cover normal usage, edge cases, and error conditions
4. Update this README to document new test files 