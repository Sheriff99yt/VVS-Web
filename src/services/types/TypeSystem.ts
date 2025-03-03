/**
 * TypeSystem.ts
 * 
 * Manages data types and their relationships.
 * Provides functionality for type registration, compatibility checking, and validation.
 */

export interface TypeValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TypeDefinition {
  name: string;
  description?: string;
  extends?: string[];
  validate?: (value: any) => TypeValidationResult;
  defaultValue?: any;
}

export class TypeSystem {
  private types: Map<string, TypeDefinition>;
  
  constructor() {
    this.types = new Map<string, TypeDefinition>();
  }
  
  /**
   * Registers a new type in the system
   * @param typeDefinition The type definition to register
   * @returns True if registration was successful, false if type already exists
   */
  registerType(typeDefinition: TypeDefinition): boolean {
    const { name } = typeDefinition;
    
    // Check if type already exists
    if (this.types.has(name)) {
      return false;
    }
    
    // Register the type
    this.types.set(name, typeDefinition);
    return true;
  }
  
  /**
   * Checks if a type exists in the system
   * @param typeName The name of the type to check
   * @returns True if the type exists, false otherwise
   */
  hasType(typeName: string): boolean {
    // Handle nullable types (e.g., "string?")
    const baseType = typeName.endsWith('?') ? typeName.slice(0, -1) : typeName;
    return this.types.has(baseType);
  }
  
  /**
   * Gets a type definition by name
   * @param typeName The name of the type to get
   * @returns The type definition or undefined if not found
   */
  getTypeDefinition(typeName: string): TypeDefinition | undefined {
    // Handle nullable types
    const baseType = typeName.endsWith('?') ? typeName.slice(0, -1) : typeName;
    return this.types.get(baseType);
  }
  
  /**
   * Checks if a source type is compatible with a target type
   * @param sourceType The source type
   * @param targetType The target type
   * @returns True if compatible, false otherwise
   */
  isTypeCompatible(sourceType: string, targetType: string): boolean {
    // Handle nullable types
    const baseSourceType = sourceType.endsWith('?') ? sourceType.slice(0, -1) : sourceType;
    const baseTargetType = targetType.endsWith('?') ? targetType.slice(0, -1) : targetType;
    
    // Any type is compatible with itself
    if (baseSourceType === baseTargetType) {
      return true;
    }
    
    // Any type can be assigned to 'any'
    if (baseTargetType === 'any') {
      return true;
    }
    
    // Check if source type extends target type
    const sourceTypeDefinition = this.types.get(baseSourceType);
    if (!sourceTypeDefinition) {
      return false;
    }
    
    // Check direct inheritance
    if (sourceTypeDefinition.extends && sourceTypeDefinition.extends.includes(baseTargetType)) {
      return true;
    }
    
    // Check transitive inheritance
    if (sourceTypeDefinition.extends) {
      for (const parentType of sourceTypeDefinition.extends) {
        if (this.isTypeCompatible(parentType, baseTargetType)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Gets all registered types
   * @returns Array of type definitions
   */
  getAllTypes(): TypeDefinition[] {
    return Array.from(this.types.values());
  }
  
  /**
   * Gets the default value for a type
   * @param typeName The name of the type
   * @returns The default value or undefined if not specified
   */
  getDefaultValue(typeName: string): any {
    const typeDefinition = this.getTypeDefinition(typeName);
    
    if (!typeDefinition) {
      return undefined;
    }
    
    // If the type has a default value, return it
    if (typeDefinition.defaultValue !== undefined) {
      return typeDefinition.defaultValue;
    }
    
    // Otherwise, provide sensible defaults for built-in types
    switch (typeDefinition.name) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return undefined;
    }
  }
  
  /**
   * Validates a value against a type
   * @param value The value to validate
   * @param typeName The name of the type
   * @returns Validation result
   */
  validateType(value: any, typeName: string): TypeValidationResult {
    // Handle nullable types
    if ((value === null || value === undefined) && typeName.endsWith('?')) {
      return { valid: true, errors: [] };
    }
    
    const baseType = typeName.endsWith('?') ? typeName.slice(0, -1) : typeName;
    const typeDefinition = this.types.get(baseType);
    
    if (!typeDefinition) {
      return {
        valid: false,
        errors: [`Type '${baseType}' does not exist`]
      };
    }
    
    // If the type has a custom validation function, use it
    if (typeDefinition.validate) {
      return typeDefinition.validate(value);
    }
    
    // Otherwise, perform basic type checking
    switch (baseType) {
      case 'string':
        return {
          valid: typeof value === 'string',
          errors: typeof value === 'string' ? [] : [`Expected string but got ${typeof value}`]
        };
        
      case 'number':
        return {
          valid: typeof value === 'number' && !isNaN(value),
          errors: (typeof value === 'number' && !isNaN(value)) ? [] : [`Expected number but got ${typeof value}`]
        };
        
      case 'boolean':
        return {
          valid: typeof value === 'boolean',
          errors: typeof value === 'boolean' ? [] : [`Expected boolean but got ${typeof value}`]
        };
        
      case 'array':
        return {
          valid: Array.isArray(value),
          errors: Array.isArray(value) ? [] : [`Expected array but got ${typeof value}`]
        };
        
      case 'object':
        return {
          valid: typeof value === 'object' && !Array.isArray(value) && value !== null,
          errors: (typeof value === 'object' && !Array.isArray(value) && value !== null) ? [] : [`Expected object but got ${Array.isArray(value) ? 'array' : typeof value}`]
        };
        
      case 'any':
        return { valid: true, errors: [] };
        
      default:
        return {
          valid: false,
          errors: [`No validation logic for type '${baseType}'`]
        };
    }
  }
} 