/**
 * Type validation utilities for port connections
 */

// Define a type hierarchy for connection compatibility
const typeHierarchy: Record<string, string[]> = {
  'any': ['string', 'number', 'boolean', 'array', 'object', 'function'],
  'array': ['string', 'number', 'boolean', 'array', 'object'],
  'object': ['object'],
  'string': ['string'],
  'number': ['number'],
  'boolean': ['boolean'],
  'function': ['function']
};

/**
 * Check if a connection between two port types is valid
 * @param sourceType The type of the source port
 * @param targetType The type of the target port
 * @returns Whether the connection is valid
 */
export const isTypeCompatible = (sourceType: string, targetType: string): boolean => {
  // Same type is always compatible
  if (sourceType === targetType) {
    return true;
  }
  
  // 'any' type can connect to anything
  if (sourceType === 'any') {
    return true;
  }
  
  // Check if target type accepts the source type
  if (typeHierarchy[targetType] && typeHierarchy[targetType].includes(sourceType)) {
    return true;
  }
  
  return false;
};

/**
 * Get a CSS class for a type, used for styling ports by type
 * @param type The port type
 * @returns A CSS class name
 */
export const getTypeClass = (type: string): string => {
  return `port-type-${type.toLowerCase()}`;
};

/**
 * Get all compatible types for a given type
 * @param type The type to check compatibility for
 * @returns Array of compatible types
 */
export const getCompatibleTypes = (type: string): string[] => {
  // If the type exists in our hierarchy, get its compatible types
  if (type in typeHierarchy) {
    // Return the type itself plus compatible types
    return [type, ...typeHierarchy[type]];
  }
  
  // If the type isn't defined in our hierarchy, only exact matches are compatible
  return [type];
};

/**
 * Map common web types to Python types
 * Used for code generation
 * @param webType The web type name
 * @returns The corresponding Python type
 */
export const mapToPythonType = (webType: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'str',
    'number': 'float',
    'boolean': 'bool',
    'array': 'list',
    'object': 'dict',
    'function': 'callable',
    'any': 'Any'
  };
  
  return typeMap[webType] || webType;
};

/**
 * Map common web types to JavaScript types
 * Used for code generation
 * @param webType The web type name
 * @returns The corresponding JavaScript type
 */
export const mapToJavaScriptType = (webType: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'array': 'Array',
    'object': 'object',
    'function': 'Function',
    'any': 'any'
  };
  
  return typeMap[webType] || webType;
}; 