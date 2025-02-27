import { IPort } from '../types';

export interface PortValidationResult {
    isValid: boolean;
    reason?: string;
}

export interface ConnectionValidationResult {
    canConnect: boolean;
    reason?: string;
    coercion?: (value: any) => any;
}

export interface PortTypeValidator {
    /**
     * Register a type validator function
     * @param type The data type to validate
     * @param validator The validation function
     */
    registerType(type: string, validator: (value: any) => boolean): void;

    /**
     * Validate a port's value
     * @param port The port to validate
     * @param value Optional value to validate against
     */
    validatePort(port: IPort, value?: any): PortValidationResult;

    /**
     * Validate a value against a port's type and validation rules
     * @param port The port to validate against
     * @param value The value to validate
     */
    validatePortValue(port: IPort, value: any): boolean;

    /**
     * Check if two ports can be connected
     * @param sourcePort The source port
     * @param targetPort The target port
     */
    canConnect(sourcePort: IPort, targetPort: IPort): { canConnect: boolean; reason?: string; coercion?: (value: any) => any };

    /**
     * Get list of registered type validators
     */
    getRegisteredTypes(): string[];
}

export class PortTypeValidator implements PortTypeValidator {
    private typeValidators: Map<string, (value: any) => boolean> = new Map();
    private typeCoercions: Map<string, Map<string, (value: any) => any>> = new Map();

    constructor() {
        // Register default type validators
        this.registerType('number', (value) => typeof value === 'number');
        this.registerType('string', (value) => typeof value === 'string');
        this.registerType('boolean', (value) => typeof value === 'boolean');

        // Register default type coercions
        this.registerTypeCoercion('number', 'string', String);
        this.registerTypeCoercion('string', 'number', Number);
        this.registerTypeCoercion('boolean', 'string', String);
    }

    registerType(type: string, validator: (value: any) => boolean): void {
        this.typeValidators.set(type, validator);
    }

    registerTypeCoercion(fromType: string, toType: string, coercion: (value: any) => any): void {
        if (!this.typeCoercions.has(fromType)) {
            this.typeCoercions.set(fromType, new Map());
        }
        this.typeCoercions.get(fromType)!.set(toType, coercion);
    }

    validatePortValue(port: IPort, value: any): boolean {
        const result = this.validatePort(port, value);
        return result.isValid;
    }

    validatePort(port: IPort, value?: any): PortValidationResult {
        // Check if port type has a registered validator
        const validator = this.typeValidators.get(port.dataType);
        if (!validator) {
            return {
                isValid: false,
                reason: `No validator registered for type ${port.dataType}`
            };
        }

        // If no value provided, just validate port structure
        if (value === undefined) {
            return {
                isValid: true
            };
        }

        // Validate value against port type
        if (!validator(value)) {
            return {
                isValid: false,
                reason: `Value does not match type ${port.dataType}`
            };
        }

        // Check custom validation if provided
        if (port.validation?.customValidation && !port.validation.customValidation(value)) {
            return {
                isValid: false,
                reason: 'Custom validation failed'
            };
        }

        // Check type-specific validation if provided
        if (port.validation?.typeCheck && !port.validation.typeCheck(value)) {
            return {
                isValid: false,
                reason: 'Type-specific validation failed'
            };
        }

        return { isValid: true };
    }

    canConnect(source: IPort, target: IPort): ConnectionValidationResult {
        // Check if both ports exist
        if (!source || !target) {
            return {
                canConnect: false,
                reason: 'Source or target port not found'
            };
        }

        // Check if source is an output and target is an input
        if (source.isInput || !target.isInput) {
            return {
                canConnect: false,
                reason: 'Invalid port directions'
            };
        }

        // Check if both ports have valid types
        if (!this.typeValidators.has(source.dataType) || !this.typeValidators.has(target.dataType)) {
            return {
                canConnect: false,
                reason: 'Unknown data type'
            };
        }

        // Check if types match directly
        if (source.dataType === target.dataType) {
            return { canConnect: true };
        }

        // Check if types can be coerced
        const coercion = this.getCoercionFunction(source.dataType, target.dataType);
        if (coercion) {
            return {
                canConnect: true,
                coercion
            };
        }

        return {
            canConnect: false,
            reason: `Type mismatch: ${source.dataType} -> ${target.dataType}`
        };
    }

    private getCoercionFunction(sourceType: string, targetType: string): ((value: any) => any) | undefined {
        // Define coercion rules
        if (sourceType === 'number' && targetType === 'string') {
            return (value: number) => value.toString();
        }
        if (sourceType === 'string' && targetType === 'number') {
            return (value: string) => {
                const num = Number(value);
                return isNaN(num) ? value : num;
            };
        }
        if (sourceType === 'boolean' && targetType === 'string') {
            return (value: boolean) => value.toString();
        }
        return undefined;
    }

    getRegisteredTypes(): string[] {
        return Array.from(this.typeValidators.keys());
    }
} 