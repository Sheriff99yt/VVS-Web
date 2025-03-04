# Vision Visual Scripting (VVS) Web Rework Plan

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Project Goals](#2-project-goals)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [UI Design](#5-ui-design)
6. [Development Phases](#6-development-phases)
7. [Testing Strategy](#7-testing-strategy)
8. [Implementation Details](#8-implementation-details)
9. [Future Enhancements](#9-future-enhancements)
10. [Conclusion](#10-conclusion)

## 1. Executive Summary

This document outlines the plan to recreate the Vision Visual Scripting (VVS) desktop application as a modern web application. The original VVS is a PyQt5-based visual programming interface that allows users to create programs through a node-based graph system, similar to Unreal Engine's Blueprint, with the ability to generate code in multiple programming languages (Python, C++, and Rust).

The web version will be built entirely from scratch while maintaining the core concepts and functionality of the original application. We'll leverage modern web technologies to improve accessibility, collaboration possibilities, and user experience, taking inspiration from the original VVS but implementing all systems anew.

## 2. Project Goals

- Create a fully-functional web version of Vision Visual Scripting from scratch
- Maintain core functionality and concepts of the original desktop version
- Improve usability and user experience with modern web design principles
- Enable cross-platform access without installation
- Facilitate easier sharing and collaboration
- Establish a foundation for future enhancements
- Address known limitations from the original version
- Reimagine the application with web-native technologies

## 3. Technology Stack

### 3.1 Frontend
- **Framework**: React with TypeScript for type safety and improved developer experience
- **State Management**: Zustand for lightweight, hooks-based state management with easy persistence
- **Node Graph**: React Flow with custom nodes and edges for the visual programming interface
- **Code Editor**: Monaco Editor (react-monaco-editor) for multi-language code display and editing
- **UI Components**: Chakra UI for accessible, themeable interface components
- **Storage**: IndexedDB with Dexie.js for robust offline storage of projects and user data
- **Build Tools**: Vite with TypeScript for fast development and optimized production builds
- **Testing**: Vitest and React Testing Library for component and integration testing
- **Syntax Highlighting**: Monaco Editor's built-in highlighting capabilities
- **PWA Support**: Workbox for offline capabilities and service worker management

### 3.2 Additional Libraries
- **Drag and Drop**: React DnD for enhanced drag-and-drop capabilities beyond React Flow
- **Immutable Updates**: Immer for simplified immutable state management
- **ID Generation**: nanoid for generating unique identifiers for nodes and connections
- **Utility Functions**: lodash-es (ES modules version) for common utility operations
- **Error Handling**: react-error-boundary for graceful error recovery
- **Keyboard Shortcuts**: react-hotkeys-hook for consistent keyboard interaction

### 3.3 Development Tools
- **Code Quality**: ESLint and Prettier for consistent code style and quality
- **Documentation**: Storybook for component documentation and TypeDoc for API docs
- **Version Control**: Git with conventional commits for clear change history
- **CI/CD**: GitHub Actions for automated testing and deployment

### 3.4 Deployment
- **Hosting**: GitHub Pages or Netlify for static site hosting (entirely client-side)
- **Analytics**: Optional Plausible Analytics for privacy-focused usage tracking
- **Monitoring**: Optional Sentry for error tracking with offline capability

## 4. System Architecture

### 4.1 Core Systems

#### 4.1.1 Node System
The foundational system that defines and manages nodes. We'll build a completely new implementation inspired by the original VVS concepts.

**Responsibilities:**
- Define node structure and behavior using modern TypeScript patterns
- Handle node creation, deletion, and modification
- Manage node properties and visual appearance
- Define node categories and types (Process, Logic, Math, Input/Output, Variables, Functions)
- Provide serialization/deserialization for nodes
- Support node-specific attributes and behaviors
- Maintain node state and reactivity to changes
- Provide interfaces for node customization
- Support inheritance hierarchies for specialized node types
- Implement dynamic code generation methods
- Handle multiple input/output connections
- Support custom node appearances based on type
- Manage node validation and error states
- Enable node search and filtering capabilities
- Support node documentation and tooltips
- Implement node resize logic based on content
- Support node grouping and organization
- Maintain extensible plugin system for custom nodes
- Handle node drag-and-drop operations

#### 4.1.2 Socket System
A system for managing the connection points (sockets) on nodes, allowing edges to be created between nodes.

**Responsibilities:**
- Define socket types and compatibility rules
- Create visual representations for different socket types
- Handle socket value propagation between nodes
- Support validation for connection attempts
- Provide serialization/deserialization for connections
- Manage connection creation and deletion events
- Support multiple edge connections from output sockets
- Prevent invalid connections based on type rules
- Implement socket hover and connection preview states
- Handle socket positioning on nodes
- Support socket type inference for improved usability
- Implement wildcard socket types for flexible connections
- Provide visual indicators for compatible sockets
- Support automatic connection routing
- Manage disconnection behavior with default values
- Handle socket value caching for performance
- Enable socket name customization
- Support interactive socket type changes
- Implement intelligent type mapping between languages

#### 4.1.3 Graph Editor System
A system for the visual manipulation and interaction with the node graph.

**Responsibilities:**
- Provide the canvas for node placement and connection
- Handle user interactions (selection, movement, connection)
- Support zooming and panning of the view
- Manage multiple selection and group operations
- Implement snap-to-grid functionality
- Maintain undo/redo history
- Provide grid and alignment guides
- Handle node and edge rendering with optimizations for performance
- Support different edge visualization styles (bezier, direct, square)
- Implement robust context menus for node and edge operations
- Support for node groups and organization features

#### 4.1.4 Code Generation System
A completely reimagined system for translating the visual node graph into code in different programming languages.

**Responsibilities:**
- Analyze node graph to determine execution flow
- Generate code for each node based on its type and connections
- Support multiple programming languages (Python, C++, Rust)
- Format code with proper indentation and syntax
- Display generated code in real-time as the graph changes
- Validate generated code for completeness
- Handle language-specific optimizations and idioms
- Support custom code injection where needed
- Generate well-documented and readable code
- Provide error handling and warnings for problematic node configurations
- Implement language-specific imports and module management
- Provide real-time code preview with syntax highlighting
- Generate appropriate header files for C++ projects
- Implement language-specific type mappings (e.g., float in Python to f32 in Rust)
- Support intelligent import management based on used node types
- Provide extensible code generation templates for each node type
- Handle arrays and complex data structures differently in each language
- Support specialized formatting tools (Indent function for proper code indentation)
- Extend code generation with specific language features (namespaces in C++, fn in Rust)

#### 4.1.5 Scene Management System
A new web-focused system for handling the overall state of the node graph, including saving, loading, and file operations.

**Responsibilities:**
- Manage the collection of nodes and edges using React Flow's data structures
- Handle scene serialization and deserialization to JSON
- Implement IndexedDB storage for projects using Dexie.js
- Support file operations (save, load, export) using the File System Access API where available
- Implement auto-save functionality with configurable intervals
- Maintain scene history in Zustand store for undo/redo operations
- Track scene modifications for change detection
- Provide scene export in various formats (JSON, code files)
- Support scene organization (folders, categories)
- Implement scene validation and error checking
- Manage scene metadata (author, creation date, version)
- Enable project backup and export to local files
- Implement proper file handling for browser environments
- Support import/export via drag-and-drop or file picker
- Maintain scene dimensions and viewport boundaries
- Handle selection events and trigger appropriate UI updates
- Implement safety features (modification tracking, auto-backup)
- Maintain history snapshots with descriptive action names

### 4.2 System Interaction Flow

1. **Node Creation and Connection:**
   - User selects a node from the node library panel
   - Node system creates the node instance and adds it to the scene
   - User creates connections between node sockets
   - Socket system validates connections based on type compatibility
   - Graph editor visually represents the nodes and connections

2. **Node Configuration:**
   - User selects a node in the graph
   - UI system displays node properties in the properties panel
   - User modifies node properties (names, values, types)
   - Node system updates the node based on user input
   - Graph is updated to reflect changes

3. **Code Generation:**
   - As the graph is modified, code generation system analyzes the graph
   - Code is generated for the selected language (Python, C++, or Rust)
   - Generated code is formatted and displayed in the code panel
   - Changes to the graph trigger code regeneration
   - Warnings or errors in the graph are highlighted

4. **Project Management:**
   - User saves the project to browser storage or exports to a file
   - Project can be loaded from storage or imported from a file
   - Scene management system handles serialization and deserialization
   - User can start new projects or work with templates

## 5. UI Design

### 5.1 UI Design Reference

To maintain consistency with the original application, the web version will preserve key UI elements while modernizing the interface. The following reference points from the original application will guide our implementation:

#### 5.1.1 Layout Structure
- Three-panel layout with node library (left), graph editor (center), and multi-purpose panel (right)
- Top menu bar with File, Edit, Node Editor, Library, Node Designer, and Help sections
- Toolbar with essential operations below the menu bar
- Bottom status bar for additional information and controls

#### 5.1.2 Node Library Panel
- Hierarchical categorization (Process, Logic, Math, Input, Output, Lists)
- Expandable/collapsible categories with icons
- Sub-categories for related operations (e.g., Greater Than, Less Than under Logic)
- Secondary tab system for switching between Functions, Variables, and Events
- Add Function button for creating custom functions

#### 5.1.3 Graph Editor 
- Grid-based canvas with adjustable zoom and pan
- Color-coded nodes based on functionality:
  - Red: Function nodes (user_function)
  - Green: Variable nodes (My_Float)
  - Blue/Purple: Logic and control flow nodes (If Statement, Print)
- Clearly visible input/output sockets with connection points
- Visual distinction between different socket types
- Bezier curve connections between nodes
- Graph information header showing name and identifier

#### 5.1.4 Right Multi-Panel
1. **Code Preview:**
   - Language selector dropdown (Python, C++, Rust)
   - Monaco Editor with syntax highlighting
   - Real-time code generation reflecting graph changes
   - Code sections clearly representing node operations
   - Media controls for any run operations

2. **Project Files:**
   - Hierarchical list of project files with icons
   - Date-based sorting with timestamps
   - Type-based grouping (C++, Python, Preferences)
   - Visual indicators for backup files

3. **Properties Panel:**
   - Dynamic controls based on selected node
   - Basic properties (Node Name, Return Type)
   - Delete button for removing nodes
   - Ordering controls for execution sequence
   - Type-specific input fields

#### 5.1.5 Visual Node Design
- Color-coded headers based on node type
- Icon indicators for node functionality
- Input sockets on left side
- Output sockets on right side
- Clear labeling of socket purposes
- Compact design with essential information visible
- Selection highlighting for active nodes

### 5.2 UI System
A modern, responsive UI system built with React and Chakra UI, designed for web use.

**Responsibilities:**
- Implement main application layout using Chakra UI's responsive components
- Provide panels for node library, properties, and file browser using Chakra's drawer and panel components
- Support theme customization (dark/light) using Chakra UI's theme system
- Handle user settings and preferences stored in IndexedDB
- Provide visual feedback for user actions with toast notifications
- Implement keyboard shortcuts using react-hotkeys-hook
- Enable responsive design for different screen sizes using Chakra UI's responsive utilities
- Support accessibility features via Chakra UI's built-in a11y support
- Implement drag-and-drop interactions using React DnD
- Provide customizable layout options with resizable panels
- Include Monaco Editor for code editing and preview
- Support for multiple panels with tab management
- Implement customizable toolbars with icon buttons
- Support welcome screen for first-time users
- Implement offline-first approach with appropriate UI indicators
- Provide automatic backup creation using IndexedDB
- Support working with multiple graphs in tabs
- Implement smart theme switching with icon set adjustments
- Support specialized panels for user-defined functions and libraries
- Provide customizable keyboard shortcuts with preference storage
- Implement loading indicators for asynchronous operations

## 6. Development Phases

### 6.1 Phase 1: Core Framework
- Setup project infrastructure with Vite and TypeScript
- Implement Node base classes and system architecture
- Create basic Socket implementation
- Build fundamental Graph Editor capabilities
- Develop serialization/deserialization for projects
- Implement basic Scene management
- Create minimal UI shell

### 6.2 Phase 2: Essential Node Types
- Implement basic function nodes (Math, Logic, Flow Control)
- Create variable nodes
- Develop input/output nodes
- Implement function definition nodes
- Build code generation for Python
- Create project saving/loading functionality
- Integrate Monaco Editor for code preview

### 6.3 Phase 3: UI Refinement
- Enhance Node appearance and interaction
- Implement theme system
- Refine edge routing and connections
- Create property panels
- Implement node library with categories
- Add context menus and keyboard shortcuts
- Develop undo/redo system

### 6.4 Phase 4: Advanced Features
- Add C++ and Rust code generation
- Create node groups feature
- Implement node search functionality
- Add real-time validation and error checking
- Develop user preferences system
- Implement project templates

### 6.5 Phase 5: Final Polish
- Performance optimizations
- Cross-browser testing
- Accessibility enhancements
- Documentation generation
- Tutorial creation
- Bug fixes and stability improvements
- Progressive Web App implementation

## 7. Testing Strategy

### 7.1 Unit Testing
- Test individual components and utilities in isolation
- Validate core functions like node creation, connection, deletion
- Test serialization/deserialization of nodes and graphs
- Verify code generation logic for different node types
- Ensure socket compatibility rules work correctly
- Test state management functions and reducers

### 7.2 Component Testing
- Test UI components for proper rendering and behavior
- Verify node library panel functionality
- Test property panel interactions
- Validate Monaco Editor integration
- Ensure theme switching works correctly
- Test responsive behavior of panels

### 7.3 Integration Testing
- Verify node connection and interaction on the graph
- Test complete workflows from node creation to code generation
- Validate project saving and loading
- Test undo/redo functionality for various operations
- Verify correct interactions between all systems

### 7.4 User Testing
- Conduct usability sessions with different user groups
- Test with users familiar with the desktop version
- Get feedback from users new to visual programming
- Verify accessibility with assistive technology users
- Test on different devices and screen sizes

### 7.5 Performance Testing
- Benchmark rendering performance with large graphs
- Test serialization/deserialization speed with complex projects
- Measure code generation time for different languages
- Verify smooth interactions during editing operations
- Test offline storage performance

## 8. Implementation Details

### 8.1 Serialization System
The serialization system will handle saving and loading of project files, optimized for browser environments:

1. **Project File Format**:
   - JSON-based project files with optional local file export
   - Structure preserving React Flow node types, positions, connections, and properties
   - Support for embedded custom node definitions
   - Version tracking for backward compatibility

2. **Serialization Process**:
   - Direct serialization of React Flow data structures with custom node metadata
   - Node-specific serialization for custom properties
   - Edge reference preservation using consistent IDs
   - User-defined node library serialization

3. **Storage Mechanism**:
   - Primary storage in IndexedDB using Dexie.js
   - Support for importing/exporting to local files
   - Automatic project versioning with timestamps
   - Migration support for schema updates

4. **Auto-save Implementation**:
   - Interval-based auto-saving to IndexedDB
   - User-configurable auto-save frequency
   - Recovery system for unsaved changes and crash recovery
   - Background saving to avoid UI interruptions

### 8.2 Code Generation System
The code generation system will translate visual graphs into code in multiple languages:

1. **Language Support**:
   - Initial support for Python, C++, and Rust
   - Modular design for adding additional languages
   - Language-specific optimizations and idioms

2. **Generation Process**:
   - Graph traversal starting from output or execution nodes
   - Intelligent dependency resolution
   - Type inference across connections
   - Proper scope management for variables and functions

3. **Code Formatting**:
   - Language-appropriate indentation and spacing
   - Comment generation for improved readability
   - Clear function separation and organization
   - Proper header file generation for C++

4. **Type Mapping**:
   - Consistent type conversion between languages
   - Socket type to language type mapping
   - Complex data structure handling (arrays, dictionaries, etc.)
   - Wildcard type support with inference

5. **Code Analysis**:
   - Static analysis of generated code
   - Error detection and reporting in the UI
   - Suggestions for graph improvements
   - Performance considerations for different languages

### 8.3 Node System Implementation
The Node system will provide the foundation for all node types and their behavior:

1. **Class Hierarchy**:
   - BaseNode abstract class defining core interface
   - CategoryNode classes for different functionality domains
   - SpecializedNode classes for specific operations
   - UserDefinedNode for custom node creation

2. **Node Properties**:
   - Dynamic property system with type validation
   - Property UI binding for automatic interface generation
   - Property serialization
   - Property change event propagation

3. **Visual Appearance**:
   - Customizable node styling based on category and type
   - Custom SVG icons for node identification
   - Size adaptation based on socket count and content
   - Selection and hover state visualization

4. **Code Generation Interface**:
   - Node-specific code snippets for each supported language
   - Context-aware code generation based on connected nodes
   - Type conversion handling between incompatible connections
   - Function import management

5. **Event Handling**:
   - Input value change propagation
   - Connection events (connect, disconnect, validation)
   - Selection and focus events
   - Execution state visualization

### 8.4 Edge and Socket System
The Edge and Socket system will manage connections between nodes with proper type handling:

1. **Socket Types**:
   - Strongly typed sockets with visual indicators
   - Wildcard/any-type sockets with runtime type adaptation
   - Type compatibility validation
   - Socket grouping for array/collection inputs

2. **Edge Rendering**:
   - Multiple edge styles (bezier, straight, step)
   - Interactive edge creation and rerouting
   - Edge state visualization (selected, error, active)
   - Edge intersection handling

3. **Connection Management**:
   - One-to-many connection support for output sockets
   - Many-to-one prevention for input sockets
   - Type compatibility validation during connection attempts
   - Disconnection handling with optional default values

4. **Data Flow**:
   - Value propagation through connected sockets
   - Type conversion when necessary
   - Cycle detection and prevention
   - Update notification system

### 8.5 UI System Components
The UI system will provide a modern, responsive interface for the application:

1. **Layout Components**:
   - Flexible panel system with resizable areas
   - Collapsible sidebars for node library and properties
   - Modal dialogs for settings and confirmations
   - Responsive design for different screen sizes

2. **Node Library**:
   - Categorized node display with search functionality
   - Drag-and-drop node creation
   - Favorites and recently used nodes
   - Custom node category management

3. **Properties Panel**:
   - Dynamic property editors based on property types
   - Multi-selection property editing
   - Property grouping and organization
   - Custom property editors for complex types

4. **Code Viewer**:
   - Monaco Editor integration for syntax highlighting
   - Multiple language display
   - Code folding and navigation
   - Error highlighting linked to node validation

5. **Contextual Tools**:
   - Context-sensitive toolbars and menus
   - Keyboard shortcut management
   - Command palette for quick actions
   - Status indicators for application state

### 8.6 UI Implementation Details

The UI implementation will focus on recreating the essential experience of the original application while leveraging web technologies for better performance and accessibility:

1. **React Component Structure:**
   ```
   - App
     |- MainLayout
        |- TopMenuBar
        |- ToolBar
        |- SplitPanelContainer
           |- NodeLibraryPanel
              |- CategoryTree
              |- NodeList
              |- TabSystem (Functions/Variables/Events)
           |- GraphEditorPanel
              |- ReactFlow
                 |- CustomNodes
                 |- CustomEdges
                 |- Background
                 |- Controls
                 |- MiniMap
           |- RightPanel
              |- TabSystem
                 |- CodePreviewTab
                    |- LanguageSelector
                    |- MonacoEditor
                 |- ProjectFilesTab
                    |- FileTree
                 |- PropertiesTab
                    |- DynamicProperties
        |- StatusBar
   ```

2. **Node Styling Strategy:**
   - Use CSS-in-JS or Chakra UI's styling system for consistent node appearance
   - Implement theming to match the dark UI of the original application
   - Create a component library of standard node elements (headers, sockets, labels)
   - Use SVG icons that scale well at different zoom levels

3. **Interaction Patterns:**
   - Drag from library to canvas for node creation
   - Click and drag between sockets to create connections
   - Double-click nodes to rename or edit core properties
   - Right-click for context menu with operations
   - Keyboard shortcuts matching desktop version where applicable
   - Multi-select with shift-click or drag selection

4. **Responsive Adaptations:**
   - Collapsible panels for smaller screens
   - Panel toggle buttons for mobile view
   - Touch-friendly interaction targets
   - Zoom controls optimized for touch and mouse
   - Adapting multi-panel layout to vertical arrangement on narrow screens

5. **Accessibility Enhancements:**
   - Keyboard navigation throughout the interface
   - ARIA labels for all interactive elements
   - Focus indicators for keyboard users
   - Screen reader support for node operations
   - Color contrast compliance while maintaining visual style

## 9. Future Enhancements

Once the core application is complete, these features could be considered for future releases:

1. **Extended Node Library**:
   - Additional specialized nodes for different domains (web, data science, etc.)
   - Community-contributed node packages
   - Domain-specific node collections

2. **Enhanced Collaboration**:
   - Real-time collaboration features
   - Commenting and annotation tools
   - Version control integration

3. **Advanced Export Options**:
   - Project templates for different frameworks
   - Integration with popular IDEs via export plugins
   - Export to additional languages

4. **User Experience Improvements**:
   - Tutorial system for new users
   - AI assistance for node graph suggestions
   - Advanced search and navigation for large graphs

5. **Performance Optimizations**:
   - Improved rendering for very large graphs
   - Optimized memory usage for complex projects
   - Better handling of graph hierarchies

## 10. Conclusion

This rework plan lays out a comprehensive approach to building the new system, detailing the core architectural components, their responsibilities, and how they interact. By following this plan, we will create a web application that not only matches the capabilities of the original VVS but extends them in ways that take full advantage of the web platform.

The primary goal is to create a modern, accessible visual programming tool that maintains the power and flexibility of the original Vision Visual Scripting application while embracing web standards and best practices. This will result in a tool that is more accessible to users across different platforms and skill levels, while still serving the needs of experienced visual programmers.
