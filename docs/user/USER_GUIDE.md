# VVS Web User Guide

Welcome to VVS Web! This comprehensive guide will help you understand and make the most of the VVS Web visual programming system, from basic concepts to advanced techniques.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Concepts](#basic-concepts)
3. [Getting Started Tutorial](#getting-started-tutorial)
4. [Creating Programs](#creating-programs)
5. [Working with Nodes](#working-with-nodes)
6. [Managing Connections](#managing-connections)
7. [Using Execution Flow](#using-execution-flow)
8. [Code Generation](#code-generation)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Tutorials and Examples](#tutorials-and-examples)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Troubleshooting](#troubleshooting)

## Introduction

### What is VVS Web?

VVS Web is a visual programming environment that allows you to:

- Create programs by connecting nodes in a graph
- Generate clean, readable Python code automatically
- Execute your programs without writing code
- Learn programming concepts visually
- Avoid common syntax errors through a visual interface
- Use execution flow to control program structure and nesting

The system represents programming operations as nodes that you connect to build a program. Each node performs a specific function, like math operations, string manipulation, or input/output tasks.

### Current Status

VVS Web is currently in the final stages of its Python MVP (Minimum Viable Product). The core features implemented include:
- Visual node-based programming interface
- Python code generation
- Function library with common operations
- Real-time code preview
- Export to Python files

## Basic Concepts

### Nodes

Nodes are the building blocks of your visual program. Each node represents a specific operation or function.

- **Function Nodes**: Perform operations like math calculations or string manipulation
- **Control Flow Nodes**: Control the flow of execution (if statements, loops)
- **Input/Output Nodes**: Handle program input and output

Nodes have a label indicating their function, input ports on the left, and output ports on the right.

### Connections

Connections are the lines between nodes that show how data and execution flow:

- **Data Connections**: Transfer data between nodes (shown as solid lines)
- **Execution Connections**: Control the order of operations (shown as dashed lines)

Connections always run from an output port to an input port. The system validates connections to ensure type compatibility.

### Execution Flow

VVS Web uses an execution flow system to control the order of operations:

- Program execution starts at nodes with no incoming execution connections
- Execution follows connected execution ports from left to right
- Control flow nodes (like If statements) can branch the execution flow

Execution ports appear as diamond-shaped connectors, while data ports are circular.

### The VVS Web Interface

The VVS Web interface consists of three main areas:

1. **Node Library** (left panel): Browse and search for available nodes organized by category
2. **Node Canvas** (center area): The main workspace where you create and connect nodes
3. **Code Preview** (right panel): Displays the generated code based on your visual program

## Getting Started Tutorial

### Step 1: Open VVS Web

1. Open your web browser
2. Navigate to the VVS Web application
3. You'll see the main interface with the three panels described above

### Step 2: Create Your First Node

1. In the node library, expand the "Math" category
2. Find the "Add" node and drag it onto the canvas
3. Notice the node has two input ports (a and b) and one output port (result)

### Step 3: Add Input Nodes

1. From the node library, expand the "Input/Output" category
2. Drag two "Number Input" nodes onto the canvas
3. Position them to the left of the Add node

### Step 4: Connect the Nodes

1. Click and drag from the output port of the first Number Input node to the "a" input port of the Add node
2. Click and drag from the output port of the second Number Input node to the "b" input port of the Add node
3. Notice the connections are created, showing the flow of data

### Step 5: Add Output

1. From the "Input/Output" category, drag a "Print" node onto the canvas
2. Position it to the right of the Add node
3. Connect the output port of the Add node to the input port of the Print node
4. Connect the execution ports by clicking and dragging from the execution output of the Add node to the execution input of the Print node

### Step 6: View the Generated Code

1. Look at the code preview panel on the right
2. You'll see Python code that:
   - Gets two number inputs
   - Adds them together
   - Prints the result

### Step 7: Customize Your Nodes

1. Double-click on the first Number Input node
2. Enter a default value (e.g., 5)
3. Double-click on the second Number Input node
4. Enter another default value (e.g., 7)
5. Notice the code preview updates to reflect these values

### Step 8: Run Your Program

1. Click the "Export" button to download the Python file
2. Run the file using Python to see the result

## Tutorials and Examples

VVS Web includes a comprehensive set of tutorials to help you learn the system. These tutorials are organized by difficulty level and topic:

### Tutorial Collections

We have organized our tutorials into several collections to help you find the right learning materials for your needs:

- **[Beginner Tutorials](./tutorials/beginner/FIRST_STEPS.md)**: Start here if you're new to VVS Web
- **[Intermediate Tutorials](./tutorials/intermediate/LIST_PROCESSING.md)**: Once you've mastered the basics
- **[Advanced Tutorials](./tutorials/advanced/DATA_PROCESSOR.md)**: For experienced users looking to do more
- **[Feature-Specific Tutorials](./tutorials/features/KEYBOARD_SHORTCUTS.md)**: Learn specific VVS Web capabilities
- **[Real-World Examples](./tutorials/examples/WEB_SCRAPER.md)**: Practical applications and case studies

### Featured Tutorials

Here are some popular tutorials to get you started:

1. **[First Steps with VVS Web](./tutorials/beginner/FIRST_STEPS.md)**: Create your first "Hello, World!" program
2. **[Building a Simple Calculator](./tutorials/beginner/CALCULATOR_TUTORIAL.md)**: Learn to use mathematical operations
3. **[Using Keyboard Shortcuts](./tutorials/features/KEYBOARD_SHORTCUTS.md)**: Boost your productivity

For a complete list of all available tutorials, see the [Tutorials Index](./tutorials/TUTORIALS_INDEX.md).

## Keyboard Shortcuts

VVS Web provides a comprehensive set of keyboard shortcuts to help you work more efficiently. You can view all available shortcuts by clicking the "⌨️ Shortcuts" button in the top-right corner of the application or by pressing `Shift+?`.

### Common Shortcuts

Here are some of the most commonly used keyboard shortcuts in VVS Web:

| Action | Shortcut | Description |
|--------|----------|-------------|
| New Project | Ctrl+N | Create a new project |
| Save Project | Ctrl+S | Save the current project |
| Delete Selected | Delete | Delete selected nodes |
| Undo | Ctrl+Z | Undo the last action |
| Redo | Ctrl+Y | Redo the previously undone action |
| Select All | Ctrl+A | Select all nodes on the canvas |
| Fit View | Ctrl+1 | Fit all nodes in view |

For a complete guide to using keyboard shortcuts, see the [Keyboard Shortcuts Tutorial](./tutorials/features/KEYBOARD_SHORTCUTS.md).

## Creating Programs

### Building Simple Programs

1. **Start with Input**: Begin with nodes that provide data (Number Input, String Input, etc.)
2. **Add Processing**: Connect these to nodes that process the data (Add, Multiply, etc.)
3. **End with Output**: Finish with nodes that output or store the results (Print, Write File, etc.)
4. **Connect Execution Flow**: Connect execution ports to establish the order of operations

### Using Control Flow

#### If/Else Statements

1. Drag an "If Statement" node from the "Control Flow" category
2. Connect a boolean value to the condition input
3. Connect nodes to the "Then" and "Else" execution outputs to create branches
4. The generated code will create the appropriate if/else structure

#### Loops

1. Drag a "For Loop" or "While Loop" node from the "Control Flow" category
2. For a For Loop, connect a collection to iterate over
3. For a While Loop, connect a boolean condition
4. Connect nodes to the "Body" execution output for code to run each iteration
5. Connect nodes to the "Completed" execution output for code to run after the loop

### Creating Functions

1. Drag a "Define Function" node from the "Control Flow" category
2. Set the function name and parameters
3. Connect nodes to the "Body" execution output to create the function body
4. Connect nodes to the "After" execution output for code to run after the function definition

## Working with Nodes

### Node Management

- **Add Node**: Drag from library or right-click on canvas and select "Add Node"
- **Delete Node**: Select and press Delete, or right-click and select "Delete"
- **Move Node**: Click and drag the node body
- **Copy/Paste**: Ctrl+C to copy, Ctrl+V to paste selected nodes
- **Select Multiple**: Click and drag on empty canvas area, or Ctrl+click nodes

### Node Properties

- **Edit Properties**: Double-click on node to open properties panel
- **Rename Node**: Change the label in the properties panel
- **Set Default Values**: Configure default values for unconnected inputs
- **Enable/Disable**: Toggle node execution without removing it

### Node Types and Colors

Nodes are color-coded by category for easy identification:

- **Math**: Blue
- **String**: Green
- **Collections**: Purple
- **Control Flow**: Orange
- **Input/Output**: Red
- **Variables**: Yellow

## Managing Connections

### Creating Connections

1. Click and drag from an output port to an input port
2. Valid connections will show a green preview
3. Invalid connections (type mismatches) will show a red preview
4. Release to create the connection

### Connection Types

- **Data Connections**: Solid lines, transfer values between nodes
- **Execution Connections**: Dashed lines, control program flow

### Editing Connections

- **Delete Connection**: Click on connection and press Delete, or right-click and select "Delete"
- **Reroute Connection**: Click and drag an existing connection to a different input port

## Using Execution Flow

### Execution Principles

1. **Entry Points**: Nodes with no incoming execution connections are entry points
2. **Sequence**: Execution flows from one node to the next via execution connections
3. **Branching**: Control flow nodes create branches in execution flow
4. **Horizontal Flow**: Execution generally flows from left to right

### Control Structures

1. **If/Else**: Creates conditional branches
   - "Then" output for the true condition
   - "Else" output for the false condition

2. **Loops**: Create repetitive execution
   - "Body" output for code inside the loop
   - "Completed" output for code after the loop

3. **Functions**: Define reusable code blocks
   - "Body" output for the function content
   - "After" output for code following the function

## Code Generation

### How Code is Generated

VVS Web generates code by:
1. Analyzing the execution flow in the node graph
2. Resolving dependencies between nodes
3. Converting nodes to language-specific code using syntax patterns
4. Formatting the code according to language conventions

### Viewing Generated Code

The Code Preview panel shows the generated code in real-time. As you modify the graph, the code updates automatically.

### Exporting Code

1. Click the "Export" button in the Code Preview panel
2. Choose a filename and location
3. Save the file with the appropriate extension (e.g., .py for Python)

## Tips and Best Practices

1. **Organize Your Canvas**: Arrange nodes from left to right to follow the execution flow
2. **Use Clear Names**: Rename nodes to reflect their purpose
3. **Group Related Nodes**: Keep related operations close together
4. **Use Comments**: Add comment nodes to explain complex parts of your program
5. **Start Simple**: Begin with basic programs and gradually add complexity
6. **Verify Connections**: Check that all required connections are made
7. **Test Incrementally**: Build and test your program in small sections

## Troubleshooting

### Common Issues

- **Missing Connections**: Check that all required inputs are connected
- **Type Mismatches**: Ensure output and input types are compatible
- **Execution Flow**: Verify that execution connections form a valid path
- **Circular Dependencies**: Check for circular references in data connections
- **Missing Entry Points**: Ensure there are nodes with no incoming execution connections

### Visual Indicators

- **Red Connections**: Indicate type incompatibility
- **Yellow Warning Icons**: Show nodes with potential issues
- **Red Error Icons**: Indicate nodes with critical errors

### Getting Help

- Hover over nodes and ports to see tooltips with information
- Check the documentation for detailed explanations
- Look for error messages in the code preview panel

## Next Steps

Now that you're familiar with VVS Web, you can:

1. Explore the [Function Reference](./FUNCTION_GUIDE.md) to learn about all available functions
2. Try creating more complex programs with control flow
3. Experiment with different node combinations
4. Export and run your generated code

Happy visual programming with VVS Web! 