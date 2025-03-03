# Identified Issues for Simplified MVP

This document tracks identified issues and limitations for the simplified MVP implementation of VVS Web.

## Current Limitations

These are known limitations of the simplified MVP approach that are expected and will be addressed in future versions:

1. **Limited Function Set**: Only a small subset of Python functions are implemented initially
2. **No Execution Flow**: The initial version does not implement execution flow, only data flow
3. **Basic Code Generation**: Simple linear code generation only, limited nesting support
4. **No Project Saving**: Export only, no project saving/loading in initial version
5. **Simple UI**: Minimal styling and visual polish

## Known Issues

The following are issues that need to be addressed during the simplified MVP implementation:

### High Priority

1. **Function Definition Loading**: Ensure JSON function definitions load correctly
2. **Connection Validation**: Implement basic type checking for connections
3. **Edge Rendering**: Ensure edges correctly render between nodes
4. **Variable Naming**: Generate unique variable names for code generation
5. **Basic Error Handling**: Handle common errors gracefully

### Medium Priority

1. **Node Positioning**: Improve initial node placement when added to canvas
2. **Code Export**: Ensure the export functionality works properly
3. **Node Appearance**: Improve visual clarity of node ports and connections
4. **Library Organization**: Improve organization of function library
5. **Code Preview**: Ensure code preview updates in real-time

### Low Priority

1. **Visual Styling**: Improve overall visual appearance
2. **Performance**: Test with larger node graphs
3. **Browser Compatibility**: Test in multiple browsers
4. **Documentation**: Create minimal user documentation

## Reporting Issues

During development of the simplified MVP, please report additional issues by adding them to this document with the following information:

- **Issue Description**: Clear description of the problem
- **Component**: Which component is affected (Node Canvas, Code Generation, etc.)
- **Priority**: High, Medium, or Low
- **Steps to Reproduce**: How to reproduce the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens

## Resolution Plan

The immediate focus should be on resolving high-priority issues that prevent the basic end-to-end functionality from working. Medium and low-priority issues can be addressed as time allows during the 4-week development cycle.

After the initial release of the simplified MVP, we will gather user feedback to prioritize enhancements and fixes for subsequent versions. 