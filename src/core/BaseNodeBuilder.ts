import { INodeBuilder, INodeTemplate, IPort } from './NodeSystem';
import { NodeCategory } from '../components/nodes/types';

/**
 * Base implementation of the node builder pattern
 */
export abstract class BaseNodeBuilder implements INodeBuilder {
    protected template: Partial<INodeTemplate>;
    protected inputs: IPort[];
    protected outputs: IPort[];
    
    constructor() {
        this.template = {};
        this.inputs = [];
        this.outputs = [];
    }

    setType(type: string): this {
        if (!type) {
            throw new Error('Node type is required');
        }
        this.template.type = type;
        return this;
    }

    setTitle(title: string): this {
        if (!title) {
            throw new Error('Node title is required');
        }
        this.template.title = title;
        return this;
    }

    setDescription(description: string): this {
        this.template.description = description;
        return this;
    }

    setCategory(category: NodeCategory): this {
        if (!category) {
            throw new Error('Node category is required');
        }
        this.template.category = category;
        return this;
    }

    addInput(port: IPort): this {
        this.validatePort(port);
        this.inputs.push(port);
        return this;
    }

    addOutput(port: IPort): this {
        this.validatePort(port);
        this.outputs.push(port);
        return this;
    }

    setMetadata(metadata: INodeTemplate['metadata']): this {
        this.template.metadata = {
            ...this.template.metadata,
            ...metadata
        };
        return this;
    }

    protected validatePort(port: IPort): void {
        if (!port.id || !port.label || !port.dataType) {
            throw new Error('Invalid port configuration: id, label, and dataType are required');
        }

        if (port.isInput === undefined || port.isOutput === undefined) {
            throw new Error('Invalid port configuration: isInput and isOutput must be specified');
        }

        if (port.isInput === port.isOutput) {
            throw new Error('Invalid port configuration: port must be either input or output');
        }
    }

    build(): INodeTemplate {
        if (!this.template.type || !this.template.title || !this.template.category) {
            throw new Error('Invalid node configuration: type, title, and category are required');
        }

        return {
            ...this.template,
            defaultInputs: [...this.inputs],
            defaultOutputs: [...this.outputs]
        } as INodeTemplate;
    }
} 