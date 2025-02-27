/**
 * Data types supported by the node system
 */
export type DataType = 
  | 'number'      // Float
  | 'integer'     // Integer
  | 'boolean'     // Binary
  | 'string'      // String
  | 'vector'      // Vector
  | 'transform'   // Transform
  | 'rotator'     // Rotator
  | 'color'       // Linear Color
  | 'struct'      // Structure
  | 'class'       // Class Reference
  | 'array'       // Array type
  | 'function'    // Function type
  | 'any';        // Wildcard

/**
 * Node categories for organization and visual styling
 */
export type NodeCategory = 
  | 'flow-control'    // Control flow nodes
  | 'pure-function'   // Pure functions (green)
  | 'impure-function' // Impure functions (blue)
  | 'variables'       // Variable nodes
  | 'event'          // Event nodes
  | 'comment'        // Comment nodes
  | 'math'           // Mathematics operations
  | 'string'         // String operations
  | 'logical'        // Logical operations
  | 'comparison'     // Comparison operations
  | 'array'          // Array operations
  | 'io';            // Input/Output operations

/**
 * Port interface for node inputs and outputs
 */
export interface Port {
  id: string;
  label: string;
  dataType: DataType;
  isExec?: boolean;     // Is this an execution pin
  isInput?: boolean;    // Is this an input pin
  isOutput?: boolean;   // Is this an output pin
  isOptional?: boolean; // Is this an optional port
} 