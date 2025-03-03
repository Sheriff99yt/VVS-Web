# VVS Web Documentation

This directory contains the documentation for the VVS Web project. The documentation is organized into several sections to help users and developers understand and use the system effectively.

## Documentation Structure

### User Documentation

Located in the `user/` directory, these documents are intended for end users of VVS Web:

- **[USER_GUIDE.md](user/USER_GUIDE.md)**: Comprehensive guide covering all aspects of using VVS Web, from basic concepts to advanced techniques.
- **[FUNCTION_GUIDE.md](user/FUNCTION_GUIDE.md)**: Reference documentation for all available functions in VVS Web.
- **[EXAMPLES.md](user/EXAMPLES.md)**: Example projects with explanations to help users learn by example.
- **[API.md](user/API.md)**: Technical documentation for developers who want to extend VVS Web or integrate it with other systems.

### Developer Documentation

Located in the `development/` directory, these documents are intended for developers working on the VVS Web codebase:

- **[SIMPLIFIED_MVP_PLAN.md](development/SIMPLIFIED_MVP_PLAN.md)**: Simplified implementation plan for the MVP version with reduced scope.
- **[SIMPLIFIED_IMPLEMENTATION.md](development/SIMPLIFIED_IMPLEMENTATION.md)**: Detailed technical guide for implementing the simplified MVP.
- **[DEVELOPER_GUIDE.md](development/DEVELOPER_GUIDE.md)**: Guide for developers working on the project.
- **[ARCHITECTURE.md](development/ARCHITECTURE.md)**: System design, component interactions, and architectural decisions.
- **[CONTRIBUTING.md](development/CONTRIBUTING.md)**: Guidelines for contributing to the project.
- **[PROGRESS_REPORT.md](development/PROGRESS_REPORT.md)**: Current implementation status.
- **[IDENTIFIED_ISSUES.md](development/IDENTIFIED_ISSUES.md)**: Known issues and limitations.

### Technical Documentation

Located in the `technical/` directory:

- Architecture details and system components specifications

### Testing Documentation

Located in the `testing/` directory:

- Testing approaches, methodologies, and specifications

### Archive

The `archive/` directory contains older documentation that is kept for reference but may not reflect the current state of the project.

## Documentation Conventions

- All documentation is written in Markdown format.
- Code examples use syntax highlighting where appropriate.
- Screenshots and diagrams are stored in the `images/` directory.
- Links between documents use relative paths.

## Updating Documentation

When making changes to the VVS Web system, please ensure that the relevant documentation is updated to reflect those changes. This includes:

1. Updating function references when adding or modifying functions
2. Adding examples for new features
3. Updating the user guide to explain new functionality
4. Keeping the developer documentation in sync with code changes

## Building Documentation

The Markdown documentation can be converted to other formats (HTML, PDF) using standard Markdown tools. For web deployment, the documentation is processed by our documentation pipeline which:

1. Validates all internal links
2. Generates a searchable index
3. Creates a navigation structure
4. Deploys to the documentation website

## Contributing to Documentation

Contributions to improve the documentation are welcome. Please follow these guidelines:

1. Use clear, concise language
2. Include examples where helpful
3. Maintain consistent formatting
4. Test all code examples
5. Verify that links work correctly

For substantial changes to the documentation, please open an issue first to discuss the proposed changes. 