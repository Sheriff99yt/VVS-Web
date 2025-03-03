# VVS Web Architecture

## Introduction

VVS Web is a visual programming system that enables users to create programs using a node-based interface, without directly writing code. The core innovation of VVS Web is its syntax database architecture, which maintains language-agnostic function definitions and maps them to specific language syntax, allowing the system to generate clean, idiomatic code across multiple programming languages from a single visual representation.

## System Architecture Overview

The VVS Web system consists of the following core components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────────┐     │
│  │ NodeLibrary │   │ NodeCanvas  │   │ CodePreview        │     │
│  │ (Function   │   │ (React Flow │   │ (Generated Code    │     │
│  │  Browser)   │   │  Canvas)    │   │  Display)          │     │
│  └─────────────┘   └─────────────┘   └────────────────────┘     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Service Layer                              │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────────┐     │
│  │ NodeService │   │ CodeGenSvc  │   │ ProjectService     │     │
│  │ (Node &     │   │ (Code       │   │ (Project           │     │
│  │  Connection │   │  Generation)│   │  Management)       │     │
│  │  Management)│   │             │   │                    │     │
│  └─────────────┘   └─────────────┘   └────────────────────┘     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     Database Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               SyntaxDatabaseService                      │   │
│  │                                                          │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌───────────────┐   │   │
│  │  │ Languages   │   │ Functions   │   │ SyntaxPatterns│   │   │
│  │  └─────────────┘   └─────────────┘   └───────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────┐   ┌─────────────┐                      │   │
│  │  │ Types       │   │ TypeMappings│                      │   │
│  │  └─────────────┘   └─────────────┘                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. UI Layer

The UI Layer provides the visual interface for users to create, edit, and manage visual programs.

#### NodeLibrary Component

The NodeLibrary component displays available functions organized by category, allowing users to drag functions onto the canvas to create nodes.

**Key features:**
- Categorized function browsing
- Search functionality
- Drag-and-drop integration with NodeCanvas
- Function details display

**Implementation details:**
- Uses a tree structure for category navigation
- Integrates with the FunctionDefinitionService to fetch available functions
- Implements virtual scrolling for performance with large function libraries

#### NodeCanvas Component

The NodeCanvas component is the central workspace where users create and connect nodes to build visual programs.

**Key features:**
- Node creation, deletion, and movement
- Connection management with type validation
- Selection and multi-selection
- Pan and zoom controls
- Context menus for node operations

**Implementation details:**
- Built on React Flow library for node graph functionality
- Custom node and edge renderers for specialized behavior
- Performance optimizations including memoization and virtualization
- Implements the execution flow system with visual cues

#### CodePreview Component

The CodePreview component displays the generated code in real-time as users modify the node graph.

**Key features:**
- Syntax highlighting
- Real-time code updates
- Error highlighting
- Export options

**Implementation details:**
- Uses a code editor component with syntax highlighting
- Connects to the CodeGenerationService for real-time code updates
- Includes export functionality for saving generated code

### 2. Service Layer

The Service Layer contains the business logic for managing nodes, generating code, and handling projects.

#### NodeService

The NodeService manages the creation, updating, and deletion of nodes and their connections.

**Key features:**
- Node lifecycle management
- Connection validation based on types
- Layout algorithms
- Undo/redo functionality

**Implementation details:**
- Maintains internal state using React Flow's data structures
- Implements a command pattern for undo/redo
- Validates connections based on type compatibility

#### CodeGenerationService

The CodeGenerationService transforms the node graph into executable code in the target programming language.

**Key components:**
- **DependencyResolver**: Determines execution order and resolves data dependencies
- **ExecutionBasedCodeGenerator**: Generates code following execution flow
- **SyntaxPatternApplicator**: Applies language-specific syntax patterns

**Implementation details:**
- Follows an execution-based approach that mimics program flow
- Uses syntax patterns from the database to generate language-specific code
- Implements robust error handling with the CodeGenerationError system
- Supports code formatting according to language conventions

#### ProjectService

The ProjectService handles saving, loading, and managing projects.

**Key features:**
- Project saving and loading
- Auto-save functionality
- Project metadata management
- Export capabilities

**Implementation details:**
- Uses IndexedDB for local storage
- Implements serialization of node graph state
- Manages project metadata and version tracking

### 3. Database Layer

The Database Layer handles storage and retrieval of syntax data, including languages, functions, and syntax patterns.

#### SyntaxDatabaseService

The SyntaxDatabaseService provides access to the syntax database, managing language definitions, function signatures, syntax patterns, and type information.

**Key components:**
- **LanguageRepository**: Manages language definitions
- **FunctionRepository**: Manages function definitions
- **PatternRepository**: Manages syntax patterns
- **TypeRepository**: Manages type definitions and mappings

**Implementation details:**
- Uses IndexedDB for persistent storage
- Implements a repository pattern for data access
- Provides transactional operations for data consistency
- Supports importing and exporting database contents

## Node System Architecture

The node system is the core of VVS Web's visual programming interface, allowing users to create and connect nodes to build programs.

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

### Connection Types

1. **Data Connections**: Transfer data between nodes
   - Connect from output port to input port
   - Have type validation to ensure compatibility

2. **Execution Connections**: Determine program flow
   - Connect from execution output port to execution input port
   - Visually distinct from data connections
   - Determine the order of operations in generated code

### Execution Flow System

The execution flow system controls the order of operations in the generated code:

- **Execution Ports**: Special input/output ports that determine sequence
- **Explicit Control Flow**: Visual representation of program flow
- **Code Nesting**: Automatic generation of properly nested code
- **Horizontal Flow**: Left-to-right flow for clarity

### Performance Considerations

The node system implements several optimizations for performance:
- React memo and useMemo for component rendering
- Virtualization for large node graphs
- Edge bundling for complex connections
- Throttled updates for real-time operations

## UI Component Architecture

The UI components in VVS Web provide the interface for users to interact with the system.

### Component Hierarchy

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

### Key UI Components

#### NodeLibrary

- **CategoryTree**: Hierarchical display of function categories
- **SearchBar**: Allows filtering functions by name or description
- **FunctionList**: Displays functions with drag-and-drop support

#### NodeCanvas

- **CustomNode**: Visual representation of a node with ports
- **CustomEdge**: Visual representation of connections between nodes
- **ContextMenu**: Context-sensitive actions for nodes and connections
- **MiniMap**: Overview of the entire node graph

#### CustomNode Component

The CustomNode component is a key element that renders individual nodes in the graph.

**Features:**
- Displays the node label
- Renders input and output ports
- Shows execution ports when applicable
- Provides handles for connections
- Displays node status (error, warning, etc.)

**Implementation details:**
- Uses React Flow's custom node API
- Implements drag-and-drop for connections
- Uses memo and context for performance optimization
- Adapts appearance based on node type and state

#### CustomEdge Component

The CustomEdge component visualizes connections between nodes.

**Features:**
- Different styles for data vs. execution connections
- Visual feedback for valid/invalid connections
- Interactive selection and deletion
- Smart path routing to minimize overlap

**Implementation details:**
- Uses React Flow's custom edge API
- Implements Bezier curves for connections
- Uses color coding for different connection types
- Provides hover and selection effects

## Conclusion

The VVS Web architecture provides a flexible and extensible framework for visual programming with these key advantages:

1. **Separation of Concerns**: Clear separation between UI, service, and database layers
2. **Extensibility**: Modular design allows for easy addition of new languages and functions
3. **Performance**: Optimized for handling complex node graphs and real-time code generation
4. **Language Agnosticism**: Core architecture is language-independent, with specific syntax applied at generation time

This architecture enables VVS Web to provide a powerful visual programming experience that generates clean, idiomatic code in multiple programming languages from a single visual representation. 