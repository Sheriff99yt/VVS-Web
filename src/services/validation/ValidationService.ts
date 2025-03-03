/**
 * ValidationService.ts
 * 
 * Service for validating various aspects of the application:
 * - Type validation for connections
 * - Node configuration validation
 * - Data type validation
 */

import { TypeSystem } from '../types/TypeSystem';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ValidationService {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Validates if a connection between two types is valid
   * @param sourceType The source data type
   * @param targetType The target data type
   * @returns Validation result
   */
  validateConnection(sourceType: string, targetType: string): ValidationResult {
    const errors: string[] = [];
    
    // Check if types exist
    if (!this.typeSystem.hasType(sourceType)) {
      errors.push(`Source type '${sourceType}' does not exist`);
    }
    
    if (!this.typeSystem.hasType(targetType)) {
      errors.push(`Target type '${targetType}' does not exist`);
    }
    
    // If either type doesn't exist, we can't validate further
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    // Special case: 'any' type can accept any input
    if (targetType === 'any') {
      return { valid: true, errors: [] };
    }
    
    // Check if source type is compatible with target type
    const isCompatible = this.typeSystem.isTypeCompatible(sourceType, targetType);
    
    if (!isCompatible) {
      errors.push(`Type '${sourceType}' is not compatible with '${targetType}'`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates a node configuration against a schema
   * @param config The node configuration
   * @param schema The schema to validate against
   * @returns Validation result
   */
  validateNodeConfiguration(config: Record<string, any>, schema: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    for (const [key, fieldSchema] of Object.entries(schema)) {
      const isRequired = fieldSchema.required === true;
      
      // Check if required field is missing
      if (isRequired && (config[key] === undefined || config[key] === null)) {
        errors.push(`Required field '${key}' is missing`);
        continue;
      }
      
      // Skip validation for optional fields that are not provided
      if (config[key] === undefined || config[key] === null) {
        continue;
      }
      
      // Validate field type
      const expectedType = fieldSchema.type;
      if (expectedType) {
        const actualType = typeof config[key];
        
        // Handle array type specially
        if (expectedType === 'array' && !Array.isArray(config[key])) {
          errors.push(`Field '${key}' should be an array`);
        } 
        // Handle other types
        else if (expectedType !== 'array' && actualType !== expectedType) {
          errors.push(`Field '${key}' should be of type '${expectedType}' but got '${actualType}'`);
        }
      }
      
      // Validate enum values
      if (fieldSchema.enum && !fieldSchema.enum.includes(config[key])) {
        errors.push(`Field '${key}' should be one of [${fieldSchema.enum.join(', ')}]`);
      }
      
      // Validate min/max for numbers
      if (typeof config[key] === 'number') {
        if (fieldSchema.min !== undefined && config[key] < fieldSchema.min) {
          errors.push(`Field '${key}' should be at least ${fieldSchema.min}`);
        }
        
        if (fieldSchema.max !== undefined && config[key] > fieldSchema.max) {
          errors.push(`Field '${key}' should be at most ${fieldSchema.max}`);
        }
      }
      
      // Validate min/max length for strings and arrays
      if (typeof config[key] === 'string' || Array.isArray(config[key])) {
        if (fieldSchema.minLength !== undefined && config[key].length < fieldSchema.minLength) {
          errors.push(`Field '${key}' should have at least ${fieldSchema.minLength} items`);
        }
        
        if (fieldSchema.maxLength !== undefined && config[key].length > fieldSchema.maxLength) {
          errors.push(`Field '${key}' should have at most ${fieldSchema.maxLength} items`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates a data value against a type
   * @param value The value to validate
   * @param type The expected type
   * @returns Validation result
   */
  validateDataType(value: any, type: string): ValidationResult {
    const errors: string[] = [];
    
    // Check if type exists
    if (!this.typeSystem.hasType(type)) {
      errors.push(`Type '${type}' does not exist`);
      return { valid: false, errors };
    }
    
    // Handle nullable types
    if (value === null || value === undefined) {
      // Check if type is nullable
      if (type.endsWith('?')) {
        return { valid: true, errors: [] };
      } else {
        errors.push(`Null value is not allowed for non-nullable type '${type}'`);
        return { valid: false, errors };
      }
    }
    
    // Remove nullable indicator for validation
    const baseType = type.endsWith('?') ? type.slice(0, -1) : type;
    
    // Validate based on type
    switch (baseType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Expected string but got ${typeof value}`);
        }
        break;
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Expected number but got ${typeof value}`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Expected boolean but got ${typeof value}`);
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Expected array but got ${typeof value}`);
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`Expected object but got ${Array.isArray(value) ? 'array' : typeof value}`);
        }
        break;
        
      case 'any':
        // Any type accepts any value
        break;
        
      default:
        // For custom types, check if the value matches the type's structure
        const typeDefinition = this.typeSystem.getTypeDefinition(baseType);
        if (typeDefinition && typeDefinition.validate) {
          const customValidation = typeDefinition.validate(value);
          if (!customValidation.valid) {
            errors.push(...customValidation.errors);
          }
        } else {
          errors.push(`No validation function for type '${baseType}'`);
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
} 