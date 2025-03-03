# VVS Web

VVS Web is a visual programming environment for web development, allowing users to create applications through a node-based interface without writing code directly.

## Features

- **Visual Node-Based Programming**: Create programs by connecting nodes in a visual flow
- **Python Support**: Generate Python code from your visual programs
- **Real-Time Code Generation**: See the generated code as you build your visual program
- **Extensible Node System**: Comprehensive function library with:
  - Mathematical operations
  - String manipulation
  - List processing
  - Dictionary operations
  - File operations
  - Control flow with execution paths
- **Type Validation**: Robust type checking system with:
  - Connection compatibility validation
  - Automatic type conversion
  - Visual error highlighting
  - Validation message panel
- **Example Programs**: Learn from pre-built examples

## Current Status

VVS Web is currently in active development. We have completed the simplified MVP and are working on enhancing the system with more advanced features:

- ✅ Basic node-based editor
- ✅ Data flow connections
- ✅ Comprehensive function library
- ✅ Execution flow with conditional branching
- ✅ Type validation and conversion system
- 🔄 Project management features (current focus)
- 📅 UI enhancements

## Project Structure

```
vvs-web/
├── src/                  # Source code
│   ├── components/       # React components
│   │   ├── flow/         # Flow editor components
│   │   └── validation/   # Validation components
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   │   ├── codeGen/      # Code generation
│   │   ├── database/     # Function definitions
│   │   └── validation/   # Type validation
│   └── utils/            # Utility functions
├── public/               # Static assets
├── examples/             # Example programs
│   ├── calculator/       # Simple calculator
│   ├── string-formatter/ # String formatting
│   ├── list-processor/   # List operations
│   ├── dictionary-operations/ # Dictionary usage
│   ├── file-operations/  # File handling
│   └── execution-flow/   # Control flow examples
├── docs/                 # Documentation
│   ├── user/             # User guides
│   └── development/      # Development docs
└── tests/                # Test suite
```

## Function Library

VVS Web includes a comprehensive function library:

### Mathematical Functions
- Basic operations (add, subtract, multiply, divide)
- Advanced math (min, max, abs, round)

### String Functions
- Manipulation (concat, split, join, replace)
- Formatting (uppercase, lowercase, trim)

### List Functions
- Operations (map, filter, reduce)
- Manipulation (sort, reverse, slice)

### Dictionary Functions
- Creation and manipulation (create, get, set)
- Advanced operations (keys, values, items)

### File Functions
- File handling (open, read, write, close)
- File system operations (exists, delete)

### Control Flow
- Conditional branching (if/else)
- Loops (for, while)
- Execution flow management

## Type Validation System

The type validation system ensures proper data flow between nodes:

- **Real-time Type Checking**: Validates connections between nodes as they are created
- **Visual Feedback**: Highlights incompatible connections with color-coded error indicators
- **Automatic Type Conversion**: Intelligently converts between compatible types when needed
- **Type Conversion Nodes**: Specialized nodes for explicit type conversion
- **Validation Messages**: Displays warnings and errors with detailed information
- **Code Generation Integration**: Automatically inserts necessary type conversions in generated code

## Execution Flow System

The execution flow system allows for more complex program structures with conditional branching and sequential execution:

- **Execution Ports**: Nodes can have execution input and output ports that define the flow of execution
- **Conditional Branching**: If/else nodes allow for different execution paths based on conditions
- **Sequential Execution**: Define the exact order in which operations should be performed
- **Code Generation**: The execution-based code generator produces clean, structured code that follows the defined execution flow

## Available Scripts

- `npm start`: Run the development server
- `npm test`: Run the test suite
- `npm run build`: Build for production
- `npm run lint`: Run linter

## Testing

We use Jest for unit testing and React Testing Library for component tests. Run tests with:

```
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, please open an issue on the GitHub repository or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/vvs-web.git
cd vvs-web
npm install
npm start
```

### Development

1. Start the development server: `npm start`
2. Open your browser to `http://localhost:3000`
3. Begin building your visual program by adding nodes from the library
4. Connect nodes to create your program flow
5. View the generated code in the code panel
