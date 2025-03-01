# VVS Web - AI Development Prompt

You are tasked with creating VVS Web, a visual programming system that transforms the way users write code. This system enables users to create programs through an intuitive node-based interface, similar to Unreal Engine's Blueprint system but designed specifically for general-purpose programming.

The core concept is simple yet powerful: Users create programs by connecting nodes in a visual graph, where:
- Each node represents a specific programming operation (function, condition, loop, etc.)
- Connections between nodes represent the flow of data and execution
- The system automatically generates clean, efficient code in the user's chosen programming language

Key Differentiators:
1. **Language Agnostic Design**
   - Users work with visual logic that's independent of any specific programming language
   - The system handles language-specific syntax and patterns
   - Code generation adapts to each language's best practices

2. **Smart Type System**
   - Visual feedback for type compatibility between connections
   - Automatic type conversion when safe and possible
   - Clear error indication for type mismatches

3. **Flow-Based Programming**
   - Execution flow is clearly visible through node connections
   - Data flow and control flow are visually distinct
   - Complex operations are broken down into understandable steps

4. **Real-Time Feedback**
   - Immediate code preview as users connect nodes
   - Visual validation of node connections
   - Clear error messages in both visual and code views

The system aims to:
- Make programming more accessible to visual thinkers
- Reduce syntax-related errors common in text-based programming
- Enable rapid prototyping and experimentation
- Facilitate learning multiple programming languages

## System Overview

VVS Web is a web-based visual programming environment with these core features:
1. A drag-and-drop interface for creating programs using nodes
2. Real-time code generation in multiple programming languages
3. Type-safe connections between nodes
4. Offline-capable with local storage
5. Modern, responsive UI design

## Scope Management

To ensure successful delivery, the implementation must:

1. **Start Minimal**
   - Begin with only three core node types: math operations, if conditions, and loops
   - Support only Python generation initially
   - Implement basic type system with numbers, strings, and booleans only
   - Focus on core UI components without advanced features

2. **Incremental Expansion**
   - Add new node types only after core functionality is stable
   - Introduce additional languages one at a time
   - Expand type system gradually based on user needs
   - Add advanced features only when basics are solid

3. **Feature Priorities**
   - First Phase:
     * Basic node connection and execution
     * Simple code generation
     * Project saving/loading
     * Essential error checking
   - Second Phase:
     * Type validation
     * Multiple language support
     * Node search
   - Third Phase:
     * Templates
     * Advanced node types
     * Auto-layout
   - Fourth Phase:
     * Custom node creation
     * Plugin system
     * Code optimization
     * Multi-user support

4. **Development Focus**
   - Prioritize stability over feature quantity
   - Ensure each feature is fully functional before adding new ones
   - Maintain simple, maintainable codebase
   - Focus on user-critical features first

## Technical Stack

- React 18+ with TypeScript 5+
- ReactFlow for node graph visualization
- CSS Modules for styling
- Vite for development and building
- IndexedDB for storage
- Jest for testing

## Success Metrics

1. **Technical**
   - Zero type-safety violations
   - Sub-second response times
   - 100% offline functionality
   - Cross-browser compatibility

2. **User Experience**
   - < 5 minute learning curve
   - < 3 clicks for common actions
   - Clear error resolution paths
   - Intuitive node connections

For detailed implementation specifics, refer to:
- System Architecture: `docs/development/system/NodeSystemPlan.md`
- Database Design: `docs/development/system/DatabaseImplementationPlan.md`
- UI Components: `docs/development/system/UIComponentsPlan.md`
- Development Guide: `docs/development/GettingStarted.md`