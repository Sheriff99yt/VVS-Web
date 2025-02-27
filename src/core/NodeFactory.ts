import { INodeFactory, INodeTemplate, INodeData, NodeTypes } from './NodeSystem';
import { NodeCategory } from '../components/nodes/types';
import { v4 as uuidv4 } from 'uuid';
import { NodeData, Port } from '../types/node';

/**
 * Factory for creating and managing nodes
 */
export class NodeFactory implements INodeFactory {
    private static instance: NodeFactory;
    private templates: Map<string, INodeTemplate>;
    private templatesByCategory: Map<NodeCategory, Set<string>>;
    private nodes: Map<string, NodeData> = new Map();

    private constructor() {
        this.templates = new Map();
        this.templatesByCategory = new Map();
    }

    public static getInstance(): NodeFactory {
        if (!NodeFactory.instance) {
            NodeFactory.instance = new NodeFactory();
        }
        return NodeFactory.instance;
    }

    /**
     * Create a new node instance from a template
     */
    createNode(template: INodeTemplate): INodeData {
        // Validate template
        if (!this.templates.has(template.type)) {
            throw new Error(`No template registered for node type: ${template.type}`);
        }

        // Create node with unique ID
        const id = uuidv4();
        const node: NodeData = {
            id,
            type: template.type,
            title: template.title,
            category: template.category,
            position: { x: 0, y: 0 },
            inputs: [...template.defaultInputs],
            outputs: [...template.defaultOutputs],
            data: {
                ...template.metadata,
                description: template.description
            }
        };
        this.nodes.set(id, node);
        return node;
    }

    /**
     * Register a new node template
     */
    registerTemplate(template: INodeTemplate): void {
        // Validate template
        this.validateTemplate(template);

        // Store template
        this.templates.set(template.type, template);

        // Update category index
        if (!this.templatesByCategory.has(template.category)) {
            this.templatesByCategory.set(template.category, new Set());
        }
        this.templatesByCategory.get(template.category)?.add(template.type);
    }

    /**
     * Get a template by type
     */
    getTemplate(type: string): INodeTemplate | undefined {
        return this.templates.get(type);
    }

    /**
     * Get all templates for a category
     */
    getTemplatesByCategory(category: NodeCategory): INodeTemplate[] {
        const templateTypes = this.templatesByCategory.get(category);
        if (!templateTypes) {
            return [];
        }

        return Array.from(templateTypes)
            .map(type => this.templates.get(type))
            .filter((template): template is INodeTemplate => template !== undefined);
    }

    /**
     * Get all registered templates
     */
    getAllTemplates(): INodeTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * Search for templates by query
     */
    searchTemplates(query: string): INodeTemplate[] {
        const searchTerm = query.toLowerCase();
        return Array.from(this.templates.values()).filter(template =>
            template.title.toLowerCase().includes(searchTerm) ||
            template.description.toLowerCase().includes(searchTerm) ||
            template.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Check if a template exists
     */
    hasTemplate(type: string): boolean {
        return this.templates.has(type);
    }

    /**
     * Remove a template
     */
    removeTemplate(type: string): boolean {
        const template = this.templates.get(type);
        if (!template) {
            return false;
        }

        // Remove from templates map
        this.templates.delete(type);

        // Remove from category index
        const categoryTemplates = this.templatesByCategory.get(template.category);
        if (categoryTemplates) {
            categoryTemplates.delete(type);
            if (categoryTemplates.size === 0) {
                this.templatesByCategory.delete(template.category);
            }
        }

        return true;
    }

    /**
     * Clear all templates
     */
    clearTemplates(): void {
        this.templates.clear();
        this.templatesByCategory.clear();
    }

    private validateTemplate(template: INodeTemplate): void {
        // Check required fields
        if (!template.type || !template.title || !template.category) {
            throw new Error('Invalid template: type, title, and category are required');
        }

        // Check for duplicate type
        if (this.templates.has(template.type)) {
            throw new Error(`Template with type '${template.type}' already exists`);
        }

        // Validate inputs and outputs
        if (!Array.isArray(template.defaultInputs) || !Array.isArray(template.defaultOutputs)) {
            throw new Error('Invalid template: defaultInputs and defaultOutputs must be arrays');
        }

        // Validate port IDs are unique within the template
        const portIds = new Set<string>();
        [...template.defaultInputs, ...template.defaultOutputs].forEach(port => {
            if (portIds.has(port.id)) {
                throw new Error(`Invalid template: duplicate port ID '${port.id}'`);
            }
            portIds.add(port.id);
        });
    }

    public createMathNode(position: { x: number; y: number }): NodeData {
        const id = uuidv4();
        const node: NodeData = {
            id,
            type: 'math',
            position,
            inputs: [
                { id: `${id}-in1`, type: 'input', dataType: 'number', name: 'Input 1' },
                { id: `${id}-in2`, type: 'input', dataType: 'number', name: 'Input 2' }
            ],
            outputs: [
                { id: `${id}-out`, type: 'output', dataType: 'number', name: 'Result' }
            ],
            data: { operation: 'add' }
        };
        this.nodes.set(id, node);
        return node;
    }

    public createInputNode(position: { x: number; y: number }): NodeData {
        const id = uuidv4();
        const node: NodeData = {
            id,
            type: 'input',
            position,
            inputs: [],
            outputs: [
                { id: `${id}-out`, type: 'output', dataType: 'number', name: 'Value' }
            ],
            data: { value: 0 }
        };
        this.nodes.set(id, node);
        return node;
    }

    public createOutputNode(position: { x: number; y: number }): NodeData {
        const id = uuidv4();
        const node: NodeData = {
            id,
            type: 'output',
            position,
            inputs: [
                { id: `${id}-in`, type: 'input', dataType: 'number', name: 'Value' }
            ],
            outputs: [],
            data: {}
        };
        this.nodes.set(id, node);
        return node;
    }

    public getNode(id: string): NodeData | undefined {
        return this.nodes.get(id);
    }

    public updateNodeData(id: string, data: Partial<NodeData>): void {
        const node = this.nodes.get(id);
        if (node) {
            this.nodes.set(id, { ...node, ...data });
        }
    }

    public deleteNode(id: string): void {
        this.nodes.delete(id);
    }

    public getAllNodes(): NodeData[] {
        return Array.from(this.nodes.values());
    }
} 