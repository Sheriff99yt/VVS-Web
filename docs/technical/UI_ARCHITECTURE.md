# UI and Node System Architecture

## Overview

This document provides a comprehensive overview of the UI and node system architecture for VVS Web. It covers the core components of the visual programming interface, including the node system, UI components, and the relationship between the visual representation and code generation.

## Node System

### Core Concepts

#### Nodes
Nodes are visual representations of programming operations (functions, operators, control structures) that users can connect to create programs. Each node references a function definition stored in the syntax database.

#### Connections
Connections between nodes represent data flow, showing how values move from outputs of one node to inputs of another. Connections are validated using the type system.

#### Ports
Ports are connection points on nodes that define inputs and outputs. They correspond to function parameters and return values, with specific types determined by the function definition.

#### Execution Flow
VVS Web implements a unique execution flow system using special port types to represent program control flow:
- **Execution Ports**: Special input/output ports (visually distinct from data ports) that determine the sequence of code execution
- **Explicit Control Flow**: Visual representation of program flow separate from data flow
- **Horizontal Flow**: Execution pins aligned horizontally with flow going from left to right

### Node Types

1. **Function Node**: Represents a function or operation with inputs, outputs, and optional execution ports.
2. **Parameter Node**: Represents an input parameter to the program.
3. **Return Node**: Represents a return value from the program.
4. **Variable Node**: Represents a variable declaration or reference.

### Node Structure

Each node contains:
- **Unique ID**: Identifies the node within the graph
- **Type**: Determines the node's behavior and appearance
- **Position**: X/Y coordinates on the canvas
- **Data**: Contains node-specific data:
  - **Label**: Display name
  - **Inputs**: Data input ports
  - **Outputs**: Data output ports
  - **ExecutionInputs**: Execution input ports (control flow)
  - **ExecutionOutputs**: Execution output ports (control flow)
  - **FunctionId**: Reference to function definition (for Function nodes)

### Node-Database Relationship

The key innovation of VVS Web is the separation between visual representation (nodes) and code generation (syntax database). This allows the same visual program to generate code in multiple languages.

Each node references a function definition in the syntax database by functionId. When generating code, the system looks up the appropriate syntax pattern for the target language.

## UI Components 

### Core UI Components

#### 1. Node Library Panel (`NodeLibrary`)

The Node Library is where users browse, search, and select nodes to add to their visual programs.

**Key Features:**
- **Category Organization**
  - Shows function nodes grouped by categories (Array, Math, Logic, etc.)
  - Category selector buttons for quick filtering
  - Visually distinct categories with color coding
- **Search Functionality**
  - Searches function names, descriptions, and tags
  - Real-time filtering as you type
- **Drag-and-Drop Support**
  - Drag functions onto the canvas to create nodes
- **Function Details**
  - Tooltips with function descriptions
  - Parameter information
  - Return type indication

**Implementation Details:**
- Uses virtualized list for performance with many functions
- Implements collapsible tree structure for categories
- Maintains state for expanded/collapsed categories
- Uses memo and context for performance optimization

#### 2. Graph Canvas (`NodeCanvas`)

The Graph Canvas is the main workspace where users create and connect nodes to build their visual programs.

**Key Features:**
- **Node Management**
  - Adding, removing, and positioning nodes
  - Selecting and multi-selecting nodes
  - Copying and pasting nodes
- **Connection Handling**
  - Creating and deleting connections
  - Type validation for connections
  - Visual feedback for valid/invalid connections
- **Navigation**
  - Pan and zoom controls
  - Minimap for overview
  - Fit to view functionality
- **Context Menus**
  - Node-specific operations
  - Canvas operations

**Implementation Details:**
- Built on React Flow for graph visualization
- Uses custom node and edge renderer components
- Implements undo/redo functionality
- Handles drag-and-drop from Node Library
- Optimized for performance with large node graphs

#### 3. Code Preview (`CodePreview`)

The Code Preview panel shows the generated code based on the current visual program.

**Key Features:**
- **Real-time Updates**
  - Automatic code generation as the graph changes
- **Syntax Highlighting**
  - Language-appropriate highlighting
- **Error Indication**
  - Visual feedback for errors in the graph
- **Export Options**
  - Downloading generated code
  - Clipboard operations

**Implementation Details:**
- Uses a code editor component with syntax highlighting
- Connects to the CodeGenerationService
- Implements debounced updates for performance
- Provides export functionality

### Component Hierarchy

The overall UI structure follows this hierarchy:

```
App
├── Header
│   ├── ProjectControls
│   ├── LanguageSelector
│   └── UserMenu
│
├── Sidebar
│   ├── NodeLibrary
│   │   ├── CategoryTree
│   │   ├── SearchBar
│   │   └── FunctionList
│   └── PropertyPanel
│       ├── NodeProperties
│       └── ConnectionProperties
│
├── MainWorkspace
│   ├── NodeCanvas
│   │   ├── CustomNode
│   │   ├── CustomEdge
│   │   ├── ContextMenu
│   │   └── MiniMap
│   └── CodePreview
│       ├── CodeEditor
│       └── ExportControls
│
└── StatusBar
    ├── ErrorDisplay
    ├── PerformanceMetrics
    └── ZoomControls
```

## Node Components

### CustomNode

The `CustomNode` component renders individual nodes in the graph with their ports, handles, and visual indicators.

**Key Features:**
- Displays the node label and type
- Renders input ports on the left side
- Renders output ports on the right side
- Displays execution ports (top/bottom or left/right depending on configuration)
- Shows node status (error, warning, selected)
- Handles selection and dragging

**Implementation Details:**
- Uses React Flow's custom node API
- Implements drag handlers for connections
- Optimized with memo for performance
- Uses context for shared state
- Adapts visual appearance based on node type and state

### CustomEdge

The `CustomEdge` component visualizes connections between nodes, with different styles for data and execution connections.

**Key Features:**
- Distinct visualization for data vs. execution connections
- Visual feedback for valid/invalid connections
- Interactive selection and deletion
- Path routing to minimize overlap

**Implementation Details:**
- Uses React Flow's custom edge API
- Implements Bezier curves for connections
- Uses color coding for different connection types
- Provides hover and selection effects

## Performance Optimizations

The UI implements several performance optimizations:

1. **Virtualization**
   - Only renders visible nodes and edges
   - Improves performance with large graphs

2. **Memoization**
   - Uses React.memo for expensive components
   - Implements useMemo for complex calculations
   - Optimizes render paths for frequently updated components

3. **Debouncing**
   - Delays expensive operations (like code generation) until user input has stopped
   - Reduces unnecessary renders during continuous interactions

4. **Lazy Loading**
   - Loads components on demand
   - Reduces initial load time

5. **Edge Bundling**
   - Groups parallel edges for cleaner visualization
   - Reduces visual clutter with complex graphs

## Accessibility Considerations

The UI is designed with accessibility in mind:

1. **Keyboard Navigation**
   - All functionality accessible via keyboard
   - Shortcuts for common operations
   - Focus management for modal dialogs

2. **Screen Reader Support**
   - ARIA attributes for screen readers
   - Meaningful element labels
   - Alternative text for visual elements

3. **Visual Design**
   - High contrast mode
   - Adjustable font size
   - Color blind friendly color schemes

## Conclusion

The UI and node system architecture of VVS Web provides a powerful yet intuitive interface for visual programming. The separation between visual representation and code generation enables the same visual program to generate code in multiple languages, while the optimized UI components ensure smooth performance even with complex node graphs. 