import { FunctionBuilder } from '../FunctionBuilder';
import { NodeTypes, DataType } from '../../NodeSystem';
import type { IFunctionParameter } from '../FunctionBuilder';

describe('FunctionBuilder', () => {
    let builder: FunctionBuilder;

    beforeEach(() => {
        builder = new FunctionBuilder();
    });

    describe('Function Node', () => {
        it('should create function node with parameters and return type', () => {
            const parameters: IFunctionParameter[] = [
                { name: 'x', type: 'number' as DataType },
                { name: 'y', type: 'string' as DataType, isOptional: true }
            ];
            const template = builder.createFunctionNode(parameters, 'boolean' as DataType).build();

            expect(template.type).toBe(NodeTypes.FUNCTION);
            expect(template.category).toBe('pure-function');
            expect(template.defaultInputs).toHaveLength(2); // exec + return
            expect(template.defaultOutputs).toHaveLength(4); // next + body + x + y

            // Check inputs
            const [execIn, returnValue] = template.defaultInputs;
            expect(execIn.isExec).toBe(true);
            expect(returnValue.dataType).toBe('boolean');
            expect(returnValue.validation).toEqual({
                required: true,
                allowedTypes: ['boolean']
            });

            // Check outputs
            const [execOut, bodyExec, paramX, paramY] = template.defaultOutputs;
            expect(execOut.isExec).toBe(true);
            expect(bodyExec.isExec).toBe(true);
            expect(paramX.dataType).toBe('number');
            expect(paramX.validation?.required).toBe(true);
            expect(paramY.dataType).toBe('string');
            expect(paramY.isOptional).toBe(true);
        });
    });

    describe('Call Node', () => {
        it('should create call node with parameters and return type', () => {
            const parameters: IFunctionParameter[] = [
                { name: 'x', type: 'number' as DataType },
                { name: 'y', type: 'string' as DataType, isOptional: true }
            ];
            const template = builder.createCallNode(parameters, 'boolean' as DataType).build();

            expect(template.type).toBe(NodeTypes.CALL);
            expect(template.defaultInputs).toHaveLength(3); // exec + x + y
            expect(template.defaultOutputs).toHaveLength(2); // next + return

            // Check inputs
            const [execIn, paramX, paramY] = template.defaultInputs;
            expect(execIn.isExec).toBe(true);
            expect(paramX.dataType).toBe('number');
            expect(paramX.validation?.required).toBe(true);
            expect(paramY.dataType).toBe('string');
            expect(paramY.isOptional).toBe(true);

            // Check outputs
            const [execOut, returnValue] = template.defaultOutputs;
            expect(execOut.isExec).toBe(true);
            expect(returnValue.dataType).toBe('boolean');
        });
    });

    describe('Return Node', () => {
        it('should create return node with value', () => {
            const template = builder.createReturnNode('number' as DataType).build();

            expect(template.type).toBe(NodeTypes.RETURN);
            expect(template.defaultInputs).toHaveLength(2); // exec + value
            expect(template.defaultOutputs).toHaveLength(0);

            // Check inputs
            const [execIn, value] = template.defaultInputs;
            expect(execIn.isExec).toBe(true);
            expect(value.dataType).toBe('number');
            expect(value.validation).toEqual({
                required: true,
                allowedTypes: ['number']
            });
        });

        it('should create return node with any type', () => {
            const template = builder.createReturnNode().build();
            const value = template.defaultInputs[1];
            expect(value.dataType).toBe('any');
            expect(value.validation?.allowedTypes).toBeUndefined();
        });
    });

    describe('Pure Function Node', () => {
        it('should create pure function node with metadata', () => {
            const parameters: IFunctionParameter[] = [
                { name: 'x', type: 'number' as DataType }
            ];
            const template = builder.createPureFunctionNode(parameters, 'number' as DataType).build();

            expect(template.type).toBe(NodeTypes.FUNCTION);
            expect(template.metadata).toBeDefined();
            expect(template.metadata?.isPure).toBe(true);
        });
    });

    describe('Builder Configuration', () => {
        it('should set correct category', () => {
            const template = builder.createFunctionNode([]).build();
            expect(template.category).toBe('pure-function');
        });

        it('should include descriptions', () => {
            const functionTemplate = builder.createFunctionNode([]).build();
            const callTemplate = builder.createCallNode([]).build();
            const returnTemplate = builder.createReturnNode().build();

            expect(functionTemplate.description).toBeDefined();
            expect(callTemplate.description).toBeDefined();
            expect(returnTemplate.description).toBeDefined();
        });
    });
}); 