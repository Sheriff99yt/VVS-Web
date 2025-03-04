/**
 * Socket types for the node system
 * Each socket has a specific type that determines what connections are valid
 */

// Base socket types available in the system
export enum SocketType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  ANY = 'any',
  FLOW = 'flow',
}

// Socket direction (input or output)
export enum SocketDirection {
  INPUT = 'input',
  OUTPUT = 'output',
}

// Socket definition interface
export interface SocketDefinition {
  id: string;
  name: string;
  type: SocketType;
  direction: SocketDirection;
  defaultValue?: any;
}

// Function to check if two sockets are compatible for connection
export const areSocketsCompatible = (
  source: SocketDefinition,
  target: SocketDefinition
): boolean => {
  // Socket direction must be different (output to input)
  if (source.direction === target.direction) {
    return false;
  }

  // If either socket is of type ANY, the connection is valid
  if (source.type === SocketType.ANY || target.type === SocketType.ANY) {
    return true;
  }

  // Otherwise, the types must match
  return source.type === target.type;
};

// Helper function to create a socket definition
export const createSocketDefinition = (
  id: string,
  name: string,
  type: SocketType,
  direction: SocketDirection,
  defaultValue?: any
): SocketDefinition => {
  return {
    id,
    name,
    type,
    direction,
    defaultValue,
  };
}; 