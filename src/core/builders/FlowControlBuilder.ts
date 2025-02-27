import { BaseNodeBuilder } from './NodeBuilder';
import { NodeTypes, DataType, INodeTemplate, IPort } from '../NodeSystem';
import type { NodeCategory } from '../../components/nodes/types';
import { PortFactory } from '../PortFactory';

/**
 * Interface for switch case configuration
 */
export interface ISwitchCase {
    value: string | number | boolean;
    label: string;
}

/**
 * Builder for creating flow control nodes.
 * Handles if statements, loops, and switches.
 */
export class FlowControlBuilder extends BaseNodeBuilder {
    constructor() {
        super();
        this.withCategory('flow-control' as NodeCategory)
            .withType(NodeTypes.SWITCH)
            .withTitle('Switch Statement')
            .withDescription('Executes one of multiple paths based on a value');
    }

    /**
     * Creates an if statement node
     */
    public createIfNode(): this {
        return this
            .withType(NodeTypes.IF)
            .withTitle('If Statement')
            .withDescription('Executes one of two paths based on a condition')
            .addInput(PortFactory.createExecInput('Execute'))
            .addInput(PortFactory.createDataInput('condition', 'Condition', 'boolean', true))
            .addOutput({
                id: 'then',
                label: 'Then',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            })
            .addOutput({
                id: 'else',
                label: 'Else',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            });
    }

    /**
     * Creates a while loop node
     */
    public createWhileNode(): this {
        return this
            .withType(NodeTypes.WHILE)
            .withTitle('While Loop')
            .withDescription('Repeatedly executes the body while condition is true')
            .addInput(PortFactory.createExecInput('Execute'))
            .addInput(PortFactory.createDataInput('condition', 'Condition', 'boolean', true))
            .addOutput({
                id: 'body',
                label: 'Body',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            })
            .addOutput({
                id: 'completed',
                label: 'Done',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            })
            .addOutput(PortFactory.createDataOutput('iteration', 'Iteration', 'number'));
    }

    /**
     * Creates a for loop node
     */
    public createForNode(): this {
        return this
            .withType(NodeTypes.FOR)
            .withTitle('For Loop')
            .withDescription('Executes the body a specified number of times')
            .addInput(PortFactory.createExecInput('Execute'))
            .addInput(PortFactory.createDataInput('start', 'Start', 'number', true))
            .addInput(PortFactory.createDataInput('end', 'End', 'number', true))
            .addInput(PortFactory.createDataInput('step', 'Step', 'number'))
            .addOutput({
                id: 'body',
                label: 'Body',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            })
            .addOutput({
                id: 'completed',
                label: 'Done',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            })
            .addOutput(PortFactory.createDataOutput('index', 'Index', 'number'));
    }

    /**
     * Creates a switch node
     * @param cases Array of case configurations
     * @param dataType Type of the switch value
     */
    public createSwitchNode(cases: ISwitchCase[], dataType: DataType = 'number'): this {
        const builder = this
            .withType(NodeTypes.SWITCH)
            .withTitle('Switch Statement')
            .withDescription('Executes one of multiple paths based on a value')
            .addInput(PortFactory.createExecInput('Execute'))
            .addInput(PortFactory.createDataInput('value', 'Value', dataType, true, [dataType]))
            .addOutput({
                id: 'default',
                label: 'Default',
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            });

        // Add case outputs
        cases.forEach((c, i) => {
            const caseId = typeof c.value === 'string' ? `case_${c.value}` : `case_${i + 1}`;
            builder.addOutput({
                id: caseId,
                label: c.label,
                dataType: 'any',
                isExec: true,
                isInput: false,
                validation: { required: true }
            });
        });

        return builder;
    }

    /**
     * Creates a break node for exiting loops
     */
    public createBreakNode(): this {
        return this
            .withType(NodeTypes.BREAK)
            .withTitle('Break')
            .withDescription('Exits the current loop')
            .addInput(PortFactory.createExecInput('Execute'));
    }

    /**
     * Creates a continue node for skipping loop iterations
     */
    public createContinueNode(): this {
        return this
            .withType(NodeTypes.CONTINUE)
            .withTitle('Continue')
            .withDescription('Skips to the next iteration of the loop')
            .addInput(PortFactory.createExecInput('Execute'));
    }
} 