import { FlowControlBuilder, ISwitchCase } from '../FlowControlBuilder';
import { NodeTypes } from '../../NodeSystem';
import type { NodeCategory } from '../../../components/nodes/types';

describe('FlowControlBuilder', () => {
    let builder: FlowControlBuilder;

    beforeEach(() => {
        builder = new FlowControlBuilder();
    });

    it('should be initialized with flow-control category', () => {
        const node = builder.build();
        expect(node.category).toBe('flow-control' as NodeCategory);
    });

    describe('If Node', () => {
        it('should create an if node with condition input and two execution paths', () => {
            const node = builder.createIfNode().build();

            expect(node.type).toBe(NodeTypes.IF);
            expect(node.title).toBe('If Statement');
            expect(node.description).toBe('Executes one of two paths based on a condition');

            // Check inputs
            expect(node.defaultInputs).toHaveLength(2);
            expect(node.defaultInputs[0].id).toBe('exec_in');
            expect(node.defaultInputs[0].isExec).toBe(true);
            expect(node.defaultInputs[1].id).toBe('condition');
            expect(node.defaultInputs[1].dataType).toBe('boolean');
            expect(node.defaultInputs[1].validation?.required).toBe(true);

            // Check outputs
            expect(node.defaultOutputs).toHaveLength(2);
            expect(node.defaultOutputs[0].id).toBe('then');
            expect(node.defaultOutputs[0].isExec).toBe(true);
            expect(node.defaultOutputs[1].id).toBe('else');
            expect(node.defaultOutputs[1].isExec).toBe(true);
        });
    });

    describe('While Node', () => {
        it('should create a while node with condition and iteration tracking', () => {
            const node = builder.createWhileNode().build();

            expect(node.type).toBe(NodeTypes.WHILE);
            expect(node.title).toBe('While Loop');
            expect(node.description).toBe('Repeatedly executes the body while condition is true');

            // Check inputs
            expect(node.defaultInputs).toHaveLength(2);
            expect(node.defaultInputs[0].id).toBe('exec_in');
            expect(node.defaultInputs[0].isExec).toBe(true);
            expect(node.defaultInputs[1].id).toBe('condition');
            expect(node.defaultInputs[1].dataType).toBe('boolean');
            expect(node.defaultInputs[1].validation?.required).toBe(true);

            // Check outputs
            expect(node.defaultOutputs).toHaveLength(3);
            expect(node.defaultOutputs[0].id).toBe('body');
            expect(node.defaultOutputs[0].isExec).toBe(true);
            expect(node.defaultOutputs[1].id).toBe('completed');
            expect(node.defaultOutputs[1].isExec).toBe(true);
            expect(node.defaultOutputs[2].id).toBe('iteration');
            expect(node.defaultOutputs[2].dataType).toBe('number');
        });
    });

    describe('For Node', () => {
        it('should create a for node with start, end, and step inputs', () => {
            const node = builder.createForNode().build();

            expect(node.type).toBe(NodeTypes.FOR);
            expect(node.title).toBe('For Loop');
            expect(node.description).toBe('Executes the body a specified number of times');

            // Check inputs
            expect(node.defaultInputs).toHaveLength(4);
            expect(node.defaultInputs[0].id).toBe('exec_in');
            expect(node.defaultInputs[0].isExec).toBe(true);
            expect(node.defaultInputs[1].id).toBe('start');
            expect(node.defaultInputs[1].dataType).toBe('number');
            expect(node.defaultInputs[1].validation?.required).toBe(true);
            expect(node.defaultInputs[2].id).toBe('end');
            expect(node.defaultInputs[2].dataType).toBe('number');
            expect(node.defaultInputs[2].validation?.required).toBe(true);
            expect(node.defaultInputs[3].id).toBe('step');
            expect(node.defaultInputs[3].dataType).toBe('number');
            expect(node.defaultInputs[3].validation?.required).toBe(false);

            // Check outputs
            expect(node.defaultOutputs).toHaveLength(3);
            expect(node.defaultOutputs[0].id).toBe('body');
            expect(node.defaultOutputs[0].isExec).toBe(true);
            expect(node.defaultOutputs[1].id).toBe('completed');
            expect(node.defaultOutputs[1].isExec).toBe(true);
            expect(node.defaultOutputs[2].id).toBe('index');
            expect(node.defaultOutputs[2].dataType).toBe('number');
        });
    });

    describe('Switch Node', () => {
        it('should create a switch node with specified cases', () => {
            const cases: ISwitchCase[] = [
                { value: 1, label: 'Case One' },
                { value: 2, label: 'Case Two' },
                { value: 'test', label: 'Case String' }
            ];

            const node = builder.createSwitchNode(cases, 'any').build();

            expect(node.type).toBe(NodeTypes.SWITCH);
            expect(node.title).toBe('Switch Statement');
            expect(node.description).toBe('Executes one of multiple paths based on a value');

            // Check inputs
            expect(node.defaultInputs).toHaveLength(2);
            expect(node.defaultInputs[0].id).toBe('exec_in');
            expect(node.defaultInputs[0].isExec).toBe(true);
            expect(node.defaultInputs[1].id).toBe('value');
            expect(node.defaultInputs[1].dataType).toBe('any');

            // Check outputs (cases + default)
            expect(node.defaultOutputs).toHaveLength(cases.length + 1);
            expect(node.defaultOutputs[0].id).toBe('default');
            expect(node.defaultOutputs[0].isExec).toBe(true);
            expect(node.defaultOutputs[1].id).toBe('case_1');
            expect(node.defaultOutputs[1].label).toBe('Case One');
            expect(node.defaultOutputs[2].id).toBe('case_2');
            expect(node.defaultOutputs[2].label).toBe('Case Two');
            expect(node.defaultOutputs[3].id).toBe('case_test');
            expect(node.defaultOutputs[3].label).toBe('Case String');
        });

        it('should create a switch node with type validation', () => {
            const cases: ISwitchCase[] = [
                { value: 1, label: 'One' },
                { value: 2, label: 'Two' }
            ];

            const node = builder.createSwitchNode(cases, 'number').build();

            expect(node.defaultInputs[1].dataType).toBe('number');
            expect(node.defaultInputs[1].validation?.required).toBe(true);
            expect(node.defaultInputs[1].validation?.allowedTypes).toEqual(['number']);
        });
    });

    describe('Break Node', () => {
        it('should create a break node with execution input', () => {
            const node = builder.createBreakNode().build();

            expect(node.type).toBe(NodeTypes.BREAK);
            expect(node.title).toBe('Break');
            expect(node.description).toBe('Exits the current loop');

            // Check inputs
            expect(node.defaultInputs).toHaveLength(1);
            expect(node.defaultInputs[0].id).toBe('exec_in');
            expect(node.defaultInputs[0].isExec).toBe(true);

            // Check outputs (should have none)
            expect(node.defaultOutputs).toHaveLength(0);
        });
    });

    describe('Continue Node', () => {
        it('should create a continue node with execution input', () => {
            const node = builder.createContinueNode().build();

            expect(node.type).toBe(NodeTypes.CONTINUE);
            expect(node.title).toBe('Continue');
            expect(node.description).toBe('Skips to the next iteration of the loop');

            // Check inputs
            expect(node.defaultInputs).toHaveLength(1);
            expect(node.defaultInputs[0].id).toBe('exec_in');
            expect(node.defaultInputs[0].isExec).toBe(true);

            // Check outputs (should have none)
            expect(node.defaultOutputs).toHaveLength(0);
        });
    });
}); 