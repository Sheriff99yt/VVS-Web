# VVS Web Simplified MVP Plan

This document outlines a simplified implementation plan for the Minimum Viable Product (MVP) version of VVS Web. This reduced scope focuses on delivering the most essential features to create a working version quickly.

## Simplified MVP Scope

The simplified MVP includes only the essential features needed to create basic visual programs that generate Python code:

- **Language Support**: Python only (version 3.11+) with limited built-in functions
- **Node System**: Basic node creation and connection with simplified visuals
- **Function Definitions**: Small set of essential Python function definitions 
- **Code Generation**: Basic Python code generation
- **Export**: Export to Python (.py) files

## Implementation Timeline (4 weeks)

### Phase 1: Core Foundation (2 weeks)

#### Week 1: Basic Framework
- [ ] Set up simplified JSON-based function definitions (10-15 essential functions)
- [ ] Create `FunctionDefinitionService` for loading and retrieving definitions
- [ ] Implement basic node canvas with React Flow
- [ ] Create minimal `FunctionNode` component

#### Week 2: Essential Connections
- [ ] Implement basic connections between nodes
- [ ] Add simplified data flow validation
- [ ] Create basic `NodeLibrary` component with essential functions
- [ ] Implement drag-and-drop for node creation

### Phase 2: Code Generation (2 weeks)

#### Week 3: Basic Code Generator
- [ ] Implement minimal code generator that follows connections
- [ ] Create simple `CodePreview` component
- [ ] Add export functionality for Python files

#### Week 4: Essential Polish
- [ ] Fix critical visual issues
- [ ] Ensure basic functionality works end-to-end
- [ ] Create simple example programs
- [ ] Write minimal usage documentation

## Essential Features

### Limited Function Set
- Only include 10-15 most essential Python functions:
  - Basic math operations (add, subtract, multiply, divide)
  - String handling (concatenate, format)
  - Control flow (if statement, for loop)
  - Input/output (print, input)
  - Simple data structures (list creation, manipulation)

### Simplified Node System
- Basic node creation and deletion
- Simple connections with minimal validation
- No execution flow system in initial version
- Simplified visual appearance

### Basic Code Generation
- Generate simple, linear Python code
- No complex nesting or dependency resolution
- Focus on generating working code for simple examples
- Skip code formatting and styling initially

### Export Only
- Export to Python (.py) files
- No project saving/loading in initial version

## Success Criteria

1. **Functional**: Users can create simple visual programs and generate working Python code
2. **Usable**: First-time users can create a basic program (e.g., calculator, string formatter)
3. **Exportable**: Generated code can be exported and run with Python

## Next Steps After Simplified MVP

After the simplified MVP is complete, focus on incremental improvements:

1. **Expand Function Library**: Add more Python functions
2. **Add Execution Flow**: Implement the execution flow system
3. **Improve Validation**: Enhance type checking and connection validation
4. **Add Project Management**: Implement saving and loading projects
5. **Polish UI**: Improve visual appearance and usability

This simplified plan focuses on creating a working end-to-end solution quickly, providing a foundation for future enhancements while delivering immediate value. 