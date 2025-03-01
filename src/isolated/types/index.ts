// Basic data types supported by the system
export type DataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'function'
  | 'any'
  | 'void';

// Node categories
export type NodeCategory =
  | 'function'
  | 'control-flow'
  | 'data'
  | 'math'
  | 'string'
  | 'array'
  | 'logic'
  | 'comparison'
  | 'io';

// Port definition
export interface Port {
  id: string;
  label: string;
  type: DataType;
  isInput: boolean;
  isOptional?: boolean;
  defaultValue?: any;
}

// Base node interface
export interface BaseNode {
  id: string;
  type: string;
  category: NodeCategory;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    description?: string;
    inputs: Port[];
    outputs: Port[];
    error?: string;
  };
}

// Function node specific interface
export interface FunctionNode extends BaseNode {
  type: 'function';
  data: {
    label: string;
    description?: string;
    inputs: Port[];
    outputs: Port[];
    error?: string;
    functionId: string;
    isAsync: boolean;
    language: string;
  };
}

// Node validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Node connection
export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  type: DataType;
} 