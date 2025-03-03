# Contributing to VVS Web

Thank you for your interest in contributing to VVS Web! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We strive to maintain a welcoming and inclusive environment for all contributors.

## Current Development Focus

VVS Web is currently in the testing and polish phase of the Python MVP. The core components have been implemented:

1. **Syntax Database**: Core database structure with IndexedDB
2. **Visual Node System**: Node canvas with React Flow integration
3. **Python Code Generation**: Execution-based code generation with dependency resolution
4. **Python Built-ins**: Importer for Python built-in functions
5. **Testing Framework**: Comprehensive test suite with 48 tests across 7 test suites

Current focus areas for contributions:
- Testing UI components
- Documentation improvements
- Performance optimizations
- Browser compatibility testing
- User experience enhancements

### High-Priority Areas

- Implementing project save/load functionality
- Adding export to file capability
- Creating end-to-end tests
- Improving error handling and user feedback

## How to Contribute

There are many ways to contribute to VVS Web:

- **Code contributions**: Implement new features or fix bugs
- **Documentation**: Improve or add documentation
- **Bug reports**: Report issues you encounter
- **Feature requests**: Suggest new features or improvements
- **UI/UX design**: Contribute designs or design improvements
- **Testing**: Help test the application and find issues

## Development Workflow

### Setting Up the Development Environment

Follow the instructions in the [Getting Started Guide](./GETTING_STARTED.md) to set up your development environment.

### Finding Tasks to Work On

1. Check the [Roadmap](../../ROADMAP.md) to see the current project status
2. Look at open issues labeled with "good first issue" for beginner-friendly tasks
3. Check the project board for tasks in the "To Do" column

### Working on Issues

1. **Claim an issue**: Comment on the issue to let others know you're working on it
2. **Create a branch**: Create a branch for your work with a descriptive name
   ```bash
   git checkout -b feature/descriptive-name
   # or
   git checkout -b fix/issue-description
   ```
3. **Make your changes**: Implement the feature or fix
4. **Test your changes**: Ensure tests pass and add new tests if needed
5. **Commit your changes**: Use clear, descriptive commit messages
   ```bash
   git commit -m "feat: Add new node type for mathematical operations"
   # or
   git commit -m "fix: Resolve type validation issue in connection system"
   ```
6. **Push your changes**: Push your branch to your fork
   ```bash
   git push origin feature/descriptive-name
   ```
7. **Create a pull request**: Submit a pull request with a clear description of your changes

## Pull Request Guidelines

When submitting a pull request:

1. **Link to related issues**: Reference any issues your PR addresses
2. **Describe your changes**: Provide a clear description of what your PR does
3. **Include screenshots**: For UI changes, include before/after screenshots
4. **Update documentation**: If your changes affect documentation, update it
5. **Keep PRs focused**: Each PR should address a single concern
6. **Be responsive**: Respond to feedback and make requested changes

## Code Style and Quality

### Code Style

- Follow the established code style in the project
- Use TypeScript features appropriately
- Write self-documenting code with clear naming
- Add comments for complex logic

### Testing

- Write tests for new features
- Update tests for modified code
- Aim for good test coverage
- Use appropriate testing patterns

### Documentation

- Document public APIs
- Add JSDoc comments to functions and classes
- Update README and other documentation as needed
- Create examples for new features

## Commit Message Convention

We follow a simplified version of the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <description>

[optional body]

[optional footer(s)]
```

Types include:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or updating tests
- **chore**: Changes to the build process, tools, etc.

## Review Process

Once you submit a pull request:

1. Maintainers will review your code
2. Automated tests will run
3. Feedback may be provided for changes
4. Once approved, your PR will be merged

## Release Process

1. Development happens on feature branches
2. Features are merged into the `main` branch
3. Releases are tagged from the `main` branch
4. Release notes are generated from commit messages

## Getting Help

If you need help with contributing:

- Check the [documentation](../../README.md)
- Ask questions in the GitHub Discussions
- Join the community chat

## Testing

Contributing to the project includes writing and maintaining tests:

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npx jest src/tests/codeGen
npx jest src/tests/database/importers
```

### Writing Tests

When implementing new features or fixing bugs, please include appropriate tests:

- **Unit Tests**: For individual functions and components
- **Integration Tests**: For interactions between components
- **End-to-End Tests**: For complete workflows

Example test structure:
```typescript
import { functionToTest } from './path/to/function';

describe('functionToTest', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
  
  it('should handle edge case', () => {
    // Test edge cases
  });
});
```

Thank you for contributing to VVS Web! 