/**
 * ValidationService.test.ts
 * 
 * Tests for the validation service.
 * Verifies type validation, connection validation, and node validation.
 */

import { ValidationService } from '../../services/validation/ValidationService';
import { TypeSystem } from '../../services/types/TypeSystem';

describe('ValidationService', () => {
  let validationService: ValidationService;
  let typeSystem: TypeSystem;
  
  beforeEach(() => {
    // Create a new TypeSystem instance for each test
    typeSystem = new TypeSystem();
    
    // Register some basic types for testing
    typeSystem.registerType({ name: 'string', description: 'Text value' });
    typeSystem.registerType({ name: 'number', description: 'Numeric value' });
    typeSystem.registerType({ name: 'boolean', description: 'True/false value' });
    typeSystem.registerType({ name: 'any', description: 'Any type of value' });
    
    // Create a new ValidationService instance for each test
    validationService = new ValidationService(typeSystem);
  });
  
  describe('validateConnection', () => {
    it('validates a connection between compatible types', () => {
      // Define source and target port types
      const sourceType = 'string';
      const targetType = 'string';
      
      // Validate the connection
      const result = validationService.validateConnection(sourceType, targetType);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('rejects a connection between incompatible types', () => {
      // Define incompatible source and target port types
      const sourceType = 'string';
      const targetType = 'number';
      
      // Validate the connection
      const result = validationService.validateConnection(sourceType, targetType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not compatible');
    });
    
    it('allows a connection from any specific type to "any" type', () => {
      // Test string to any
      let result = validationService.validateConnection('string', 'any');
      expect(result.valid).toBe(true);
      
      // Test number to any
      result = validationService.validateConnection('number', 'any');
      expect(result.valid).toBe(true);
      
      // Test boolean to any
      result = validationService.validateConnection('boolean', 'any');
      expect(result.valid).toBe(true);
    });
  });
  
  describe('validateNodeConfiguration', () => {
    it('validates a correctly configured node', () => {
      // Define a sample node configuration
      const nodeConfig = {
        id: 'testNode',
        type: 'function',
        functionId: 'testFunction',
        inputs: {
          input1: { type: 'string', value: 'test value' },
          input2: { type: 'number', value: 42 }
        }
      };
      
      // Define the expected configuration schema
      const schema = {
        functionId: { type: 'string', required: true },
        inputs: { 
          type: 'object', 
          required: true
        }
      };
      
      // Validate the node configuration
      const result = validationService.validateNodeConfiguration(nodeConfig, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('rejects an incorrectly configured node', () => {
      // Define a node configuration with missing required fields
      const nodeConfig = {
        id: 'testNode',
        type: 'function',
        // Missing functionId
        inputs: {
          input1: { type: 'string', value: 'test value' }
        }
      };
      
      // Define the expected configuration schema
      const schema = {
        functionId: { type: 'string', required: true },
        inputs: { 
          type: 'object', 
          required: true
        }
      };
      
      // Validate the node configuration
      const result = validationService.validateNodeConfiguration(nodeConfig, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('validateDataType', () => {
    it('validates data of correct type', () => {
      // Test string validation
      expect(validationService.validateDataType('hello', 'string').valid).toBe(true);
      
      // Test number validation
      expect(validationService.validateDataType(42, 'number').valid).toBe(true);
      
      // Test boolean validation
      expect(validationService.validateDataType(true, 'boolean').valid).toBe(true);
    });
    
    it('rejects data of incorrect type', () => {
      // Test string validation with wrong type
      expect(validationService.validateDataType(42, 'string').valid).toBe(false);
      
      // Test number validation with wrong type
      expect(validationService.validateDataType('hello', 'number').valid).toBe(false);
      
      // Test boolean validation with wrong type
      expect(validationService.validateDataType('true', 'boolean').valid).toBe(false);
    });
    
    it('accepts null or undefined for nullable types', () => {
      // Test with null value for nullable string
      expect(validationService.validateDataType(null, 'string?').valid).toBe(true);
      
      // Test with undefined value for nullable string
      expect(validationService.validateDataType(undefined, 'string?').valid).toBe(true);
      
      // Test with actual string for nullable string
      expect(validationService.validateDataType('hello', 'string?').valid).toBe(true);
    });
  });
}); 