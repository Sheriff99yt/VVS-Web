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

## 3. MVP Core Features

### 3.1 Essential Node Types

**Included in MVP:**
- **Process Flow:** If Statement, For Loop
- **Logic Operations:** AND, OR, Greater Than, Less Than, Equal
- **Math Operations:** Add, Subtract, Multiply, Divide
- **Variables:** Variable definition and retrieval
- **Input/Output:** Print, User Input
- **Function:** Basic function definition and calling

### 3.2 User Interface

**Included in MVP:**
- Three-panel layout (node library, graph editor, code/properties)
- Basic node library with categorization
- Collapsible node categories for better organization
- Node search functionality for quick access
- Graph editor with node placement and connection
- Code preview panel with language selection
- Floating properties panel that appears near selected nodes
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
- Language selection dropdown in code preview panel
- Real-time code updates as graph changes
- Basic error detection in generated code
- Language-specific syntax highlighting in Monaco Editor
- Language-specific code formatting

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
4. **Code Generation:** Multi-language support with language-specific formatting
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

### Phase 3: Essential Features (Weeks 5-6)
- Complete essential node library
- Implement properties panel
- Finalize basic node interactions
- Add socket connection validation
- Refine socket type coloring and connection feedback
- Implement multi-language code generation architecture

### Phase 4: Polish & Testing (Weeks 7-8)
- Refine UI and interactions
- Fix bugs and issues
- Optimize performance for basic operations
- Complete language-specific code generators
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

### 6.3 Remaining Test Goals
- Implement tests for main UI components (NodeLibrary, GraphEditor, PropertiesPanel)
- Create integration tests for component interactions
- Test cross-browser compatibility for essential features
- Develop test cases for different node combinations
- Validate complete workflow from node creation to code generation
- Test socket type coloring and connection validation
- Test language-specific code generation

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

## 8. Post-MVP Priorities

After releasing the MVP, the following features will be prioritized:
1. Save/load functionality with IndexedDB
2. Undo/redo system
3. Export/import capabilities
4. Auto-save functionality
5. Additional node types for more complex programming
6. Support for additional programming languages
7. Enhanced socket type system with custom types

## 9. User Guidance for MVP

Since the MVP operates as a runtime-only experience, we will implement:
- Clear notifications about session-only usage
- Instructions for manually copying generated code
- Visual indicators that work will be lost on page refresh
- A banner indicating this is an experimental version
- Visual guide for socket type color meanings
- Language selection guidance for code generation

## 10. Conclusion

This MVP plan creates an ultra-focused first version that delivers just the core value of VVS Web - the visual programming experience itself with multi-language support. By removing all persistence features, development can move much faster to demonstrate the fundamental concept, with persistence and project management features to follow in subsequent releases. 