# Vision Visual Scripting (VVS) Web - MVP Plan

## 1. MVP Overview

This MVP plan outlines the minimal feature set needed to deliver a functional version of the Vision Visual Scripting (VVS) web application. This first release will focus exclusively on the core visual programming experience, deliberately omitting persistence features to accelerate development and demonstrate the fundamental concept.

## 2. MVP Goals

- Create a functional node-based visual programming interface
- Support basic graph creation and manipulation
- Generate code in multiple languages (Python, TypeScript, C++) from node graphs
- Provide essential node types for basic programming
- Deliver a clean, intuitive user interface
- Demonstrate the core value proposition with minimal development time
- Enable intuitive code nesting through visual node connections

## 3. MVP Core Features

### 3.1 Essential Node Types

**Included in MVP:**
- **Process Flow:** If Statement, For Loop
- **Logic Operations:** AND, OR, Greater Than, Less Than, Equal
- **Math Operations:** Add, Subtract, Multiply, Divide
- **Variables:** Variable definition and retrieval
- **Input/Output:** Print, User Input
- **Function:** Basic function definition and calling

**Key Node Features:**
- Flow-based connections that establish execution order and code nesting structure
- Control structure nodes (If, For Loop) that automatically generate properly nested code blocks
- Function definition nodes that establish proper scoping for contained code

### 3.2 User Interface

**Included in MVP:**
- Three-panel layout (node library, graph editor, code/properties)
- Basic node library with categorization
- Collapsible node categories for better organization
- Node search functionality for quick access
- Graph editor with node placement and connection
- Code preview panel with language selection
- Floating properties panel that appears near selected nodes
- **Side panel tabs system:**
  - VS Code-inspired side panel with collapsible tabs
  - Tabs for Nodes, Library, and Files
  - Ability to collapse the entire side panel by clicking the active tab
- **Node documentation system:**
  - Built-in descriptions for each node type explaining its functionality
  - User-editable comments that appear in the generated code
  - Details panel showing node descriptions and comment fields
  - Clear differentiation between fixed descriptions and user comments
- **Socket input widget system:**
  - Integrated widgets for socket inputs when not connected
  - Default value configuration through input widgets
  - Seamless switching between connected values and default values
  - Common input types (text, number, boolean) with appropriate controls
  - Consistent value propagation to code generation
- **Theme system:**
  - Light and dark theme support with smooth transitions
  - Theme toggle in the toolbar for user preference
  - Consistent color scheme across all components
  - Semantic color tokens for UI elements
  - Automatic theme application to all components
- **Dark theme implementation:**
  - Default dark theme optimized for extended use
  - Reduced eye strain for long coding sessions
  - Consistent with modern IDE aesthetics
- **Socket type based coloring:**
  - Color-coded sockets based on data types (number, string, boolean, flow)
  - Visual indicators for compatible connections
  - Error highlighting for incompatible connections
  - Consistent color scheme across the application
  - Visual distinction between regular data sockets and flow sockets that determine execution order
- **Info panel system:**
  - Toggleable info panel with an info button
  - Socket type legend showing color coding for different data types
  - Expandable to include additional help and information panels
  - Non-intrusive UI that can be hidden when not needed
- **Toolbar system:**
  - Minimal toolbar at the top of the application
  - Light/dark mode toggle for user preference
  - Quick access to common actions
  - Responsive design that adapts to different screen sizes

### 3.3 Code Generation

**Included in MVP:**
- Multi-language code generation (Python, TypeScript, C++)
- Simplified language configuration system for extending language support
- Universal code generator that works with any registered language
- Language selection dropdown in code preview panel
- Real-time code updates as graph changes
- Basic error detection in generated code
- Language-specific syntax highlighting in Monaco Editor
- Language-specific code formatting
- **Code comments generation:**
  - User-added node comments appear as code comments
  - Comments are appropriately formatted for each target language
  - Comments appear above the code generated for each node
  - Enhanced code readability for complex graphs
- **Language Registry System:**
  - Centralized registry for managing supported languages
  - Simple configuration-based language definitions
  - Each language defined by syntax templates, operators, and formatting rules
  - Extensible system allowing easy addition of new languages post-MVP
- **Code Nesting System:**
  - Hierarchical code structure determined by node connections
  - Flow sockets define execution order and nesting relationships
  - Language-specific indentation and block formatting (braces vs. indentation)
  - Proper scope management for variables and functions
  - Automatic handling of nested control structures (if/else, loops)
  - Intelligent traversal of connected nodes to maintain proper nesting depth
  - Context-aware code block generation with appropriate start/end markers
  - Visual representation of code nesting through node connections

### 3.4 Features Explicitly Excluded from MVP

The following features are intentionally excluded from the MVP to focus development efforts:
- Save/load projects functionality
- Export/import project files
- Auto-save functionality
- Undo/redo for graph operations
- Advanced node types
- Project templates
- Version control
- Cloud storage integration

## 4. Technical Scope

### 4.1 Technology Stack for MVP

- **Frontend Core:** React with TypeScript
- **State Management:** Zustand (for runtime state only)
- **Node Graph:** React Flow with custom nodes
- **Code Editor:** Monaco Editor (simplified integration)
- **UI Components:** Chakra UI (essential components only)
- **Build:** Vite with TypeScript

### 4.2 System Implementation Priority

1. **Node System:** Basic node structure and functionality
2. **Socket System:** Essential socket types and connections with type-based coloring
3. **Graph Editor:** Fundamental graph manipulation capabilities
4. **Code Generation:** Multi-language support with language-specific formatting and proper nesting
5. **UI System:** Core UI components and layout

## 5. MVP Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup with React, TypeScript, and Vite
- Implement React Flow with basic custom nodes
- Create simple node data structure
- Set up project layout and essential UI components

### Phase 2: Core Functionality (Weeks 3-4)
- Implement basic node types (If, Math, Variables)
- Create socket type system with basic validation
- Implement socket type coloring for visual clarity
- Implement Monaco Editor for code preview
- Add basic Python code generation
- Develop initial code nesting system for control flow structures

### Phase 3: Essential Features (Weeks 5-6)
- Complete essential node library
- Implement properties panel
- Finalize basic node interactions
- Add socket connection validation
- Refine socket type coloring and connection feedback
- Implement multi-language code generation architecture
- Enhance code nesting to support all control structures and language-specific formatting

### Phase 4: Polish & Testing (Weeks 7-8)
- Refine UI and interactions
- Fix bugs and issues
- Optimize performance for basic operations
- Complete language-specific code generators
- Test complex code nesting scenarios across languages
- Prepare for MVP release

## 6. Testing Strategy for MVP

### 6.1 Testing Implementation (Completed)
- **Testing Framework:** Implemented Jest and React Testing Library
- **Test Configuration:** Created Jest configuration and TypeScript setup for tests
- **Mock Strategy:** Developed comprehensive mocking for:
  - Chakra UI components with prop filtering to prevent warnings
  - ReactFlow with provider context and store mocks
  - Monaco Editor with simplified representation
- **UI Framework Migration:** Successfully migrated to Chakra UI v3
  - Updated theme structure to use `createSystem` and `defaultConfig`
  - Replaced legacy props with new value-based system configuration
  - Fixed Provider setup for proper component context

### 6.2 Current Test Coverage
- **Socket System:** Unit tests for socket type definitions and the Socket component
- **Node System:** Unit tests for the BaseNode component
- **State Management:** Unit tests for Zustand store operations (useGraphStore)
- **Code Generation:** Unit tests for the code generators
- **Error Handling:** Unit tests for connection error handling and alerts
- **Code Nesting:** Unit tests for properly nested code generation in various languages

### 6.3 Remaining Test Goals
- Implement tests for main UI components (NodeLibrary, GraphEditor, PropertiesPanel)
- Create integration tests for component interactions
- Test cross-browser compatibility for essential features
- Develop test cases for different node combinations
- Validate complete workflow from node creation to code generation
- Test socket type coloring and connection validation
- Test language-specific code generation
- Test complex code nesting scenarios:
  - Nested if statements and loops
  - Function definitions with nested control structures
  - Variable scope handling in nested code blocks
  - Consistent indentation across different nesting levels

### 6.4 Testing Documentation
- Created dedicated testing documentation (TESTING.md)
- Added testing section to README.md
- Updated progress tracking with testing milestones

## 7. MVP Success Criteria

The MVP will be considered successful if users can:
1. Create a functional node graph with the basic node types
2. Connect nodes with properly validated connections
3. Generate correct code in multiple languages from their graphs
4. Switch between different programming languages for code generation
5. Understand the core value proposition of visual programming
6. Easily identify socket types through consistent color coding
7. View node descriptions to understand node functionality
8. Add comments to nodes that appear in the generated code
9. Create complex logic with properly nested code generation
10. Visually understand how node connections determine code structure and nesting

## 8. Post-MVP Priorities

After releasing the MVP, the following features will be prioritized:
1. Save/load functionality with IndexedDB
2. Undo/redo system
3. Export/import capabilities
4. Auto-save functionality
5. Additional node types for more complex programming
6. Support for additional programming languages:
   - Using the simplified language configuration system
   - Adding configurations for languages like Java, Go, Rust, C#, Ruby, PHP, Swift, Kotlin
   - Optimizing the universal code generator for broader language compatibility
7. Enhanced socket type system with custom types
8. Advanced code nesting features:
   - Custom block structures beyond standard control flow
   - Enhanced visualization of nested code relationships
   - Support for specialized language-specific nesting patterns
   - Optimization of generated code structure for readability

## 9. User Guidance for MVP

Since the MVP operates as a runtime-only experience, we will implement:
- Clear notifications about session-only usage
- Instructions for manually copying generated code
- Visual indicators that work will be lost on page refresh
- A banner indicating this is an experimental version
- Visual guide for socket type color meanings
- Language selection guidance for code generation
- Tool tips explaining how to use node descriptions and comments
- Interactive tutorial highlighting how flow connections determine code structure and nesting

## 10. Conclusion

This MVP plan creates an ultra-focused first version that delivers just the core value of VVS Web - the visual programming experience itself with multi-language support. By removing all persistence features, development can move much faster to demonstrate the fundamental concept, with persistence and project management features to follow in subsequent releases. The implementation of the code nesting system is crucial to the MVP's success as it enables users to create properly structured code through intuitive visual connections, making the relationship between the visual graph and generated code clear and understandable. 

## 11. Node Creation System

To streamline the development process and make it easier to add new nodes to the system, we will implement a comprehensive Node Creation System. This system will significantly reduce the time and effort required to create new nodes, minimize errors, and improve maintainability.

### 11.1 Current Node Creation Process Challenges

The existing process for adding new nodes requires:
1. Updating multiple files (types.ts, NodeLibrary.tsx, UniversalCodeGenerator.ts)
2. Ensuring consistent IDs between node templates and code generators
3. Manually setting up default values and properties
4. Implementing code generation logic for each language
5. Maintaining consistency across all components

This process is error-prone, time-consuming, and creates a high barrier to extending the system.

### 11.2 Node Creation System Architecture

The new system will consist of:

#### 11.2.1 Node Factory Pattern

A centralized node registration system with:
- Single registration point for new nodes
- Automatic integration with node categories
- Automatic template generation
- Code generation handler registration

```typescript
// Example Node Factory usage
registerNode({
  type: NodeType.ADD,
  label: 'Add',
  category: 'Math Operations',
  inputs: [
    { id: 'a', name: 'A', type: SocketType.NUMBER, defaultValue: 0 },
    { id: 'b', name: 'B', type: SocketType.NUMBER, defaultValue: 0 }
  ],
  outputs: [
    { id: 'result', name: 'Result', type: SocketType.NUMBER }
  ],
  properties: {
    description: 'Adds two numbers together',
    a: 0,
    b: 0
  },
  codeGenerationHandler: (node, generator) => {
    // Code generation logic
  }
});
```

#### 11.2.2 Node Template System

Predefined templates for common node patterns:
- Math operation template
- Logic operation template
- Control flow template
- Variable operation template

```typescript
// Example template usage
const AddNode = createMathOperationNode({
  type: NodeType.ADD,
  label: 'Add',
  operator: '+',
  description: 'Adds two numbers together'
});
```

#### 11.2.3 Node Definition File Structure

A structured file organization for better maintainability:
- Separate definition files by node category
- Centralized registration through index files
- Clear separation of node definitions from implementation

```
src/
  nodes/
    definitions/
      MathNodes.ts
      LogicNodes.ts
      ControlFlowNodes.ts
      VariableNodes.ts
      index.ts  # Exports and registers all nodes
    templates/
      MathOperationTemplate.ts
      LogicOperationTemplate.ts
      ControlFlowTemplate.ts
    NodeFactory.ts
```

#### 11.2.4 Language Configuration System

Enhanced language support with:
- Operation-based language configurations
- Simplified syntax templates
- Automatic formatting based on node type
- Easy extension for new languages

```typescript
// Example language configuration
export const mathOperations = {
  add: {
    python: '$a + $b',
    typescript: '$a + $b',
    cpp: '$a + $b',
    java: '$a + $b',
    go: '$a + $b',
  }
};
```

#### 11.2.5 Validation and Documentation

Built-in tools for ensuring correctness:
- Node definition validation
- Socket ID consistency checking
- Default value validation
- Automatic documentation generation
- Test case generation

### 11.3 Implementation Strategy

The Node Creation System will be implemented in phases:

1. **Foundation Phase (Week 1):**
   - Create NodeFactory implementation
   - Define basic node templates
   - Set up node definition file structure

2. **Integration Phase (Week 2):**
   - Refactor existing nodes to use the new system
   - Implement language configuration enhancements
   - Create validation utilities

3. **Enhancement Phase (Week 3):**
   - Develop documentation generators
   - Create testing utilities
   - Implement node creation guidelines

4. **Advanced Features (Post-MVP):**
   - Node creation UI tool
   - Visual node template previews
   - Code generation preview across languages
   - Node export/import system

### 11.4 Expected Benefits

The Node Creation System will provide:
- **Development Speed:** Reduce node creation time from hours to minutes
- **Error Reduction:** Automated validation prevents common mistakes
- **Consistency:** Enforced patterns across node definitions
- **Maintainability:** Centralized definitions for easier updates
- **Documentation:** Auto-generated docs that stay in sync with implementation
- **Onboarding:** Lower learning curve for new developers
- **Extensibility:** Easier path to add new node types and languages
- **Testing:** Built-in testing utilities for node validation

This system will be a critical component in the long-term success of VVS Web, allowing for rapid expansion of capabilities while maintaining quality and consistency. It addresses the core development challenges encountered during MVP implementation and provides a scalable foundation for future growth. 