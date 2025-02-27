import { IOBuilder } from '../IOBuilder';
import { NodeTypes, DataType, INodeTemplate, IPort } from '../../NodeSystem';

describe('IOBuilder', () => {
    let builder: IOBuilder;

    beforeEach(() => {
        builder = new IOBuilder();
    });

    describe('createPrintNode', () => {
        test('should create print node with default data type', () => {
            const node = builder.createPrintNode().build();
            
            expect(node.type).toBe(NodeTypes.PRINT);
            expect(node.category).toBe('io');
            expect(node.defaultInputs).toHaveLength(2);
            expect(node.defaultOutputs).toHaveLength(1);
            
            const [execIn, value] = node.defaultInputs;
            expect(execIn.id).toBe('exec_in');
            expect(value.id).toBe('value');
            expect(value.dataType).toBe('any');
        });

        test('should create print node with specific data type', () => {
            const node = builder.createPrintNode('number').build();
            
            const valueInput = node.defaultInputs.find((input: IPort) => input.id === 'value');
            expect(valueInput).toBeDefined();
            expect(valueInput?.dataType).toBe('number');
            expect(valueInput?.validation).toEqual({
                required: true,
                allowedTypes: ['number']
            });
        });
    });

    describe('createInputNode', () => {
        test('should create input node with default settings', () => {
            const node = builder.createInputNode().build();
            
            expect(node.type).toBe(NodeTypes.INPUT);
            expect(node.category).toBe('io');
            expect(node.defaultInputs).toHaveLength(2);
            expect(node.defaultOutputs).toHaveLength(2);
            
            const promptInput = node.defaultInputs.find((input: IPort) => input.id === 'prompt');
            const valueOutput = node.defaultOutputs.find((output: IPort) => output.id === 'value');
            
            expect(promptInput?.dataType).toBe('string');
            expect(valueOutput?.dataType).toBe('string');
        });

        test('should create input node with custom data type and prompt', () => {
            const node = builder.createInputNode('number', 'Enter a number:').build();
            
            const valueOutput = node.defaultOutputs.find((output: IPort) => output.id === 'value');
            expect(valueOutput?.dataType).toBe('number');
            expect(node.metadata?.defaultPrompt).toBe('Enter a number:');
        });
    });

    describe('createFileReadNode', () => {
        test('should create file read node with default encoding', () => {
            const node = builder.createFileReadNode().build();
            
            expect(node.type).toBe(NodeTypes.FILE_READ);
            expect(node.defaultInputs).toHaveLength(2);
            expect(node.defaultOutputs).toHaveLength(3);
            
            const pathInput = node.defaultInputs.find((input: IPort) => input.id === 'path');
            const contentOutput = node.defaultOutputs.find((output: IPort) => output.id === 'content');
            const errorOutput = node.defaultOutputs.find((output: IPort) => output.id === 'error');
            
            expect(pathInput?.validation).toEqual({
                required: true,
                allowedTypes: ['string']
            });
            expect(contentOutput?.dataType).toBe('string');
            expect(errorOutput?.dataType).toBe('string');
        });
    });
}); 