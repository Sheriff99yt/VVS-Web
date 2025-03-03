# VVS Web User Guide

This guide will help you get started with the VVS Web visual programming system. VVS Web allows you to create Python programs visually by connecting nodes in a graph.

## Getting Started

### Overview of the Interface

When you open VVS Web, you'll see the following main components:

1. **Node Canvas** - The central area where you create and connect nodes
2. **Node Library** - The left panel containing available functions organized by category
3. **Code Preview** - The right panel showing the generated Python code

### Basic Workflow

The basic workflow for creating a program in VVS Web is:

1. Add nodes from the Node Library to the canvas
2. Connect the nodes to create a flow
3. View the generated code in the Code Preview panel
4. Export the code as a Python file

## Working with Nodes

### Adding Nodes

To add a node to the canvas:
1. Browse the Node Library to find the function you want to use
2. Drag the function from the library onto the canvas
3. Position the node where you want it

### Connecting Nodes

To connect nodes:
1. Click and hold on an output port (right side of a node)
2. Drag to an input port (left side of another node)
3. Release to create the connection

The system will validate the connection based on the types. If the connection is valid, it will be created. If not, no connection will be made.

### Moving and Deleting Nodes

- To move a node, click and drag it to a new position
- To delete a node, select it and press the Delete key

## Examples

### Simple Calculator

A basic calculator that performs arithmetic operations:

1. Add two "Number" input nodes
2. Add "Add", "Subtract", "Multiply", and "Divide" function nodes
3. Connect the input nodes to the function nodes
4. Connect one of the function nodes to an output node
5. The Code Preview will show the generated Python code

### String Formatter

A string formatter that concatenates and formats text:

1. Add "String" input nodes for first name and last name
2. Add a "Concatenate" function node
3. Connect the input nodes to the concatenate node
4. Add more string operations as needed
5. Connect to an output node
6. The Code Preview will show the generated Python code

## Exporting Code

To export the generated code:
1. Review the code in the Code Preview panel
2. Click the "Export" button
3. Enter a file name
4. Choose export options (formatting, documentation)
5. Click "Save" to download the Python file

## Limitations in MVP

The current MVP version of VVS Web has the following limitations:

- Supports Python language only
- Limited to a basic set of built-in functions
- No project saving/loading (export only)
- Basic visual appearance
- Simple code generation without complex nesting

## Tips and Tricks

- Keep your node graph organized for easier understanding
- Use meaningful labels for input nodes
- Start with simple flows and gradually build more complex ones
- Check the Code Preview frequently to ensure the code does what you expect
- If you make a mistake, you can always delete nodes and reconnect them

## Troubleshooting

### Common Issues

- **Connections not working**: Ensure you're connecting from an output port to an input port
- **Function not behaving as expected**: Check the Code Preview to understand how the code is generated
- **Visual glitches**: Try refreshing the page if you encounter any visual problems

### Getting Help

If you encounter issues not covered in this guide, please refer to:
- The README file for general information
- The example programs for usage patterns
- The GitHub repository for reporting issues

## Next Steps

After mastering the basics of VVS Web, you can:
- Create more complex programs
- Experiment with different node combinations
- Suggest new features for future versions 