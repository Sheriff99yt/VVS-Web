import { PortTypeValidator } from '../PortTypeValidator';
import { IPort } from '../../types';

describe('PortTypeValidator', () => {
    let validator: PortTypeValidator;

    beforeEach(() => {
        validator = new PortTypeValidator();
    });

    function createPort(dataType: string, isInput: boolean = true): IPort {
        return {
            id: 'test-port',
            name: 'Test Port',
            dataType,
            isInput,
            validation: {
                required: true
            }
        };
    }

    describe('registerType', () => {
        it('should register new type validator', () => {
            const typeValidator = jest.fn().mockReturnValue(true);
            validator.registerType('custom', typeValidator);
            
            expect(validator.getRegisteredTypes()).toContain('custom');
        });

        it('should override existing type validator', () => {
            const validator1 = jest.fn().mockReturnValue(true);
            const validator2 = jest.fn().mockReturnValue(false);
            
            validator.registerType('custom', validator1);
            validator.registerType('custom', validator2);
            
            const port = createPort('custom');
            validator.validatePortValue(port, 'test');
            
            expect(validator1).not.toHaveBeenCalled();
            expect(validator2).toHaveBeenCalled();
        });
    });

    describe('canConnect', () => {
        it('should allow connection of same types', () => {
            const source = createPort('number', false);
            const target = createPort('number', true);
            
            const result = validator.canConnect(source, target);
            expect(result.canConnect).toBe(true);
        });

        it('should handle unknown types', () => {
            const source = createPort('unknown', false);
            const target = createPort('number', true);
            
            const result = validator.canConnect(source, target);
            expect(result.canConnect).toBe(false);
            expect(result.reason).toBe('Unknown data type');
        });

        it('should provide coercion for compatible types', () => {
            const source = createPort('number', false);
            const target = createPort('string', true);
            
            const result = validator.canConnect(source, target);
            expect(result.canConnect).toBe(true);
            expect(result.coercion).toBeDefined();
            
            const coerced = result.coercion!(123);
            expect(typeof coerced).toBe('string');
            expect(coerced).toBe('123');
        });

        it('should reject incompatible types', () => {
            validator.registerType('vector2d', (v) => 
                v && typeof v.x === 'number' && typeof v.y === 'number'
            );
            
            const source = createPort('vector2d', false);
            const target = createPort('number', true);
            
            const result = validator.canConnect(source, target);
            expect(result.canConnect).toBe(false);
        });
    });

    describe('validatePortValue', () => {
        it('should validate using custom validation', () => {
            const port: IPort = {
                ...createPort('number'),
                validation: {
                    customValidation: (v) => typeof v === 'number' && v > 0
                }
            };
            
            expect(validator.validatePortValue(port, 5)).toBe(true);
            expect(validator.validatePortValue(port, -1)).toBe(false);
        });

        it('should validate using type check', () => {
            const port: IPort = {
                ...createPort('number'),
                validation: {
                    typeCheck: (v) => typeof v === 'number'
                }
            };
            
            expect(validator.validatePortValue(port, 123)).toBe(true);
            expect(validator.validatePortValue(port, '123')).toBe(false);
        });

        it('should validate using registered type validator', () => {
            validator.registerType('positive', (v) => typeof v === 'number' && v > 0);
            const port = createPort('positive');
            
            expect(validator.validatePortValue(port, 5)).toBe(true);
            expect(validator.validatePortValue(port, -1)).toBe(false);
        });

        it('should validate using all validation methods', () => {
            validator.registerType('positive', (v) => typeof v === 'number' && v > 0);
            const port: IPort = {
                ...createPort('positive'),
                validation: {
                    customValidation: (v) => v < 10,
                    typeCheck: (v) => typeof v === 'number'
                }
            };
            
            expect(validator.validatePortValue(port, 5)).toBe(true);
            expect(validator.validatePortValue(port, 15)).toBe(false);
            expect(validator.validatePortValue(port, -1)).toBe(false);
            expect(validator.validatePortValue(port, '5')).toBe(false);
        });
    });

    describe('type coercion', () => {
        it('should coerce number to string', () => {
            const source = createPort('number', false);
            const target = createPort('string', true);
            const result = validator.canConnect(source, target);
            
            expect(result.coercion!(123)).toBe('123');
            expect(result.coercion!(0)).toBe('0');
        });

        it('should coerce string to number', () => {
            const source = createPort('string', false);
            const target = createPort('number', true);
            const result = validator.canConnect(source, target);
            
            expect(result.coercion!('123')).toBe(123);
            expect(result.coercion!('0')).toBe(0);
        });

        it('should coerce boolean to string', () => {
            const source = createPort('boolean', false);
            const target = createPort('string', true);
            const result = validator.canConnect(source, target);
            
            expect(result.coercion!(true)).toBe('true');
            expect(result.coercion!(false)).toBe('false');
        });

        it('should handle coercion errors gracefully', () => {
            const source = createPort('string', false);
            const target = createPort('number', true);
            const result = validator.canConnect(source, target);
            
            expect(result.coercion!('invalid')).toBe('invalid');
        });
    });
}); 