import { BaseNodeBuilder } from '../NodeBuilder';
import { IPort, DataType } from '../../NodeSystem';
import { NodeCategory } from '../../../components/nodes/types';

// Concrete implementation for testing
class TestNodeBuilder extends BaseNodeBuilder {
    constructor() {
        super();
    }
}

describe('BaseNodeBuilder', () => {
    let builder: TestNodeBuilder;

    beforeEach(() => {
        builder = new TestNodeBuilder();
    });

    describe('Basic Properties', () => {
        it('should set type', () => {
            const type = 'test-type';
            builder.withType(type);
            expect(builder['type']).toBe(type);
        });

        it('should set title', () => {
            const title = 'Test Title';
            builder.withTitle(title);
            expect(builder['title']).toBe(title);
        });

        it('should set description', () => {
            const description = 'Test description';
            builder.withDescription(description);
            expect(builder['description']).toBe(description);
        });

        it('should set category', () => {
            const category: NodeCategory = 'string';
            builder.withCategory(category);
            expect(builder['category']).toBe(category);
        });
    });

    describe('Port Management', () => {
        const mockPort: IPort = {
            id: 'test',
            label: 'Test Port',
            dataType: 'string',
            isInput: true,
            isOptional: false,
            validation: {
                required: true,
                allowedTypes: ['string']
            }
        };

        it('should add input port', () => {
            builder.addInput(mockPort);
            expect(builder['inputs']).toContainEqual(mockPort);
        });

        it('should add output port', () => {
            const outputPort: IPort = { ...mockPort, isInput: false };
            builder.addOutput(outputPort);
            expect(builder['outputs']).toContainEqual(outputPort);
        });

        it('should maintain port order', () => {
            const port1: IPort = { ...mockPort, id: 'port1' };
            const port2: IPort = { ...mockPort, id: 'port2' };
            const port3: IPort = { ...mockPort, id: 'port3' };

            builder.addInput(port1).addInput(port2).addInput(port3);
            expect(builder['inputs']).toEqual([port1, port2, port3]);
        });
    });

    describe('Build Process', () => {
        it('should build complete template', () => {
            const template = builder
                .withType('test')
                .withTitle('Test Node')
                .withDescription('Test description')
                .withCategory('math')
                .addInput({
                    id: 'input1',
                    label: 'Input 1',
                    dataType: 'number',
                    isInput: true,
                    isOptional: false,
                    validation: {
                        required: true,
                        allowedTypes: ['number']
                    }
                })
                .addOutput({
                    id: 'output1',
                    label: 'Output 1',
                    dataType: 'number',
                    isInput: false,
                    isOptional: false,
                    validation: {
                        required: true,
                        allowedTypes: ['number']
                    }
                })
                .build();

            expect(template).toEqual({
                type: 'test',
                title: 'Test Node',
                description: 'Test description',
                category: 'math',
                defaultInputs: [{
                    id: 'input1',
                    label: 'Input 1',
                    dataType: 'number',
                    isInput: true,
                    isOptional: false,
                    validation: {
                        required: true,
                        allowedTypes: ['number']
                    }
                }],
                defaultOutputs: [{
                    id: 'output1',
                    label: 'Output 1',
                    dataType: 'number',
                    isInput: false,
                    isOptional: false,
                    validation: {
                        required: true,
                        allowedTypes: ['number']
                    }
                }]
            });
        });

        it('should throw error for missing type', () => {
            expect(() => builder
                .withTitle('Test')
                .withDescription('Test')
                .build()
            ).toThrow('Node type is required');
        });

        it('should throw error for missing title', () => {
            expect(() => builder
                .withType('test')
                .withDescription('Test')
                .build()
            ).toThrow('Node title is required');
        });

        it('should throw error for missing description', () => {
            expect(() => builder
                .withType('test')
                .withTitle('Test')
                .build()
            ).toThrow('Node description is required');
        });
    });

    describe('Method Chaining', () => {
        it('should support method chaining', () => {
            const result = builder
                .withType('test')
                .withTitle('Test')
                .withDescription('Test')
                .withCategory('math')
                .addInput({
                    id: 'input',
                    label: 'Input',
                    dataType: 'number',
                    isInput: true,
                    isOptional: false,
                    validation: {
                        required: true,
                        allowedTypes: ['number']
                    }
                })
                .addOutput({
                    id: 'output',
                    label: 'Output',
                    dataType: 'number',
                    isInput: false,
                    isOptional: false,
                    validation: {
                        required: true,
                        allowedTypes: ['number']
                    }
                });

            expect(result).toBe(builder);
        });
    });

    describe('Default Values', () => {
        it('should have default category', () => {
            expect(builder['category']).toBe('math');
        });

        it('should have empty inputs by default', () => {
            expect(builder['inputs']).toEqual([]);
        });

        it('should have empty outputs by default', () => {
            expect(builder['outputs']).toEqual([]);
        });
    });
}); 