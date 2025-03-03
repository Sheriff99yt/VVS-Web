/**
 * TypeConversionService
 * 
 * A service that provides utilities for converting between different data types
 * in the code generator. It works with the TypeValidator to identify necessary
 * conversions and apply them during code generation.
 */

import { TypeValidator, TypeCompatibilityResult } from '../validation/TypeValidator';

export class TypeConversionService {
  private typeValidator: TypeValidator;
  
  constructor() {
    this.typeValidator = new TypeValidator();
  }
  
  /**
   * Get code for converting a value from one type to another
   * @param value The string representation of the value to convert
   * @param sourceType The source type
   * @param targetType The target type
   * @returns Code string for the conversion
   */
  public getConversionCode(
    value: string, 
    sourceType: string, 
    targetType: string
  ): string {
    // Check if conversion is needed
    const compatibility = this.typeValidator.checkTypeCompatibility(sourceType, targetType);
    
    if (compatibility === TypeCompatibilityResult.COMPATIBLE) {
      // No conversion needed
      return value;
    }
    
    if (compatibility === TypeCompatibilityResult.COMPATIBLE_WITH_CONVERSION) {
      // Get the conversion function
      const conversionFunc = this.typeValidator.getConversionFunction(sourceType, targetType);
      
      if (conversionFunc) {
        return `${conversionFunc}(${value})`;
      }
    }
    
    // If no specific conversion is found, try generic approaches
    return this.getGenericConversionCode(value, sourceType, targetType);
  }
  
  /**
   * Generic fallback conversion logic
   */
  private getGenericConversionCode(
    value: string, 
    sourceType: string, 
    targetType: string
  ): string {
    // Normalize types to lowercase
    const source = sourceType.toLowerCase();
    const target = targetType.toLowerCase();
    
    // String to number conversions
    if (source === 'string' && (target === 'number' || target === 'float')) {
      return `float(${value})`;
    }
    
    // String to integer conversions
    if (source === 'string' && target === 'integer' || target === 'int') {
      return `int(${value})`;
    }
    
    // Number to string conversions
    if ((source === 'number' || source === 'integer' || source === 'float' || source === 'int') && 
        target === 'string') {
      return `str(${value})`;
    }
    
    // Boolean to string conversions
    if (source === 'boolean' && target === 'string') {
      return `str(${value})`;
    }
    
    // String to boolean conversions (more complex)
    if (source === 'string' && target === 'boolean') {
      return `bool(${value})`;
    }
    
    // Array/list conversions
    if ((source === 'array' && target === 'list') || 
        (source === 'list' && target === 'array')) {
      return value; // In Python, arrays and lists are the same
    }
    
    // Dictionary/object conversions
    if ((source === 'object' && target === 'dictionary') || 
        (source === 'dictionary' && target === 'object')) {
      return value; // In Python, dictionaries and objects are similar
    }
    
    // Any type conversions - best effort
    if (target === 'any') {
      return value; // No conversion needed for 'any' target
    }
    
    // From 'any' source, use type constructor
    if (source === 'any') {
      switch (target) {
        case 'string': return `str(${value})`;
        case 'number':
        case 'float': return `float(${value})`;
        case 'integer':
        case 'int': return `int(${value})`;
        case 'boolean': return `bool(${value})`;
        case 'array':
        case 'list': return `list(${value})`;
        case 'object':
        case 'dictionary': return `dict(${value})`;
        default: return value;
      }
    }
    
    // If no conversion is found, return the original value
    console.warn(`No conversion found from ${source} to ${target}`);
    return value;
  }
  
  /**
   * Generate a type conversion node for the specified types
   * @param sourceType Source data type
   * @param targetType Target data type
   * @returns A string representing the conversion function
   */
  public getTypeConversionNodeData(sourceType: string, targetType: string): {
    label: string;
    functionCode: string;
  } {
    const normalizedSource = sourceType.toLowerCase();
    const normalizedTarget = targetType.toLowerCase();
    
    // Create a label for the conversion node
    const label = `Convert ${normalizedSource} to ${normalizedTarget}`;
    
    // Get the conversion function
    let functionCode: string;
    const conversionFunc = this.typeValidator.getConversionFunction(normalizedSource, normalizedTarget);
    
    if (conversionFunc) {
      functionCode = `def convert_${normalizedSource}_to_${normalizedTarget}(value):\n    return ${conversionFunc}(value)`;
    } else {
      // Use a generic approach
      functionCode = `def convert_${normalizedSource}_to_${normalizedTarget}(value):\n    # Generic conversion\n    return ${this.getGenericConversionCode('value', normalizedSource, normalizedTarget)}`;
    }
    
    return {
      label,
      functionCode
    };
  }
} 