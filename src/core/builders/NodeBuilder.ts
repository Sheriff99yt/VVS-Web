import { INodeTemplate, IPort } from '../NodeSystem';
import { NodeCategory } from '../../components/nodes/types';

/**
 * Base interface for all node builders.
 * Provides a fluent interface for constructing node templates.
 */
export interface INodeBuilder {
    /**
     * Sets the type identifier for the node.
     */
    withType(type: string): this;

    /**
     * Sets the display title for the node.
     */
    withTitle(title: string): this;

    /**
     * Sets the description for the node.
     */
    withDescription(description: string): this;

    /**
     * Sets the category for the node.
     */
    withCategory(category: NodeCategory): this;

    /**
     * Sets metadata for the node.
     */
    withMetadata(metadata: INodeTemplate['metadata']): this;

    /**
     * Adds an input port to the node.
     */
    addInput(port: IPort): this;

    /**
     * Adds an output port to the node.
     */
    addOutput(port: IPort): this;

    /**
     * Builds and returns the completed node template.
     */
    build(): INodeTemplate;
}

/**
 * Abstract base class for node builders.
 * Provides common implementation details for all builders.
 */
export abstract class BaseNodeBuilder implements INodeBuilder {
    protected type: string = '';
    protected title: string = '';
    protected description: string = '';
    protected category: NodeCategory = 'math';
    protected inputs: IPort[] = [];
    protected outputs: IPort[] = [];
    protected metadata?: INodeTemplate['metadata'];

    public withType(type: string): this {
        this.type = type;
        return this;
    }

    public withTitle(title: string): this {
        this.title = title;
        return this;
    }

    public withDescription(description: string): this {
        this.description = description;
        return this;
    }

    public withCategory(category: NodeCategory): this {
        this.category = category;
        return this;
    }

    public withMetadata(metadata: INodeTemplate['metadata']): this {
        this.metadata = metadata;
        return this;
    }

    public addInput(port: IPort): this {
        this.inputs.push(port);
        return this;
    }

    public addOutput(port: IPort): this {
        this.outputs.push(port);
        return this;
    }

    public build(): INodeTemplate {
        this.validate();
        return {
            type: this.type,
            title: this.title,
            description: this.description,
            category: this.category,
            defaultInputs: this.inputs,
            defaultOutputs: this.outputs,
            metadata: this.metadata
        };
    }

    /**
     * Validates the builder state before creating a template.
     * @throws Error if the builder state is invalid
     */
    protected validate(): void {
        if (!this.type) {
            throw new Error('Node type is required');
        }
        if (!this.title) {
            throw new Error('Node title is required');
        }
        if (!this.description) {
            throw new Error('Node description is required');
        }
    }
} 