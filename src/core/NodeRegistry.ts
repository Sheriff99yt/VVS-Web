import { INodeTemplate, INodeData } from './NodeSystem';
import { NodeFactory } from './NodeFactory';
import { TemplateRegistry } from './TemplateRegistry';
import { NodeCategory } from '../components/nodes/types';

/**
 * Singleton registry for managing node templates and creation.
 * Provides a centralized system for registering and creating nodes.
 */
export class NodeRegistry {
    private static instance: NodeRegistry | null = null;
    private factory: NodeFactory;
    private initialized: boolean = false;

    private constructor() {
        this.factory = new NodeFactory();
    }

    /**
     * Gets the singleton instance of the NodeRegistry.
     */
    public static getInstance(): NodeRegistry {
        if (!this.instance) {
            this.instance = new NodeRegistry();
        }
        return this.instance;
    }

    /**
     * Resets the registry to its initial state.
     * Useful for testing and state management.
     */
    public reset(): void {
        this.factory = new NodeFactory();
        this.initialized = false;
        TemplateRegistry.clearHooks();
    }

    /**
     * Registers a template with the registry.
     * @param template The node template to register
     */
    public registerTemplate(template: INodeTemplate): void {
        this.factory.registerTemplate(template);
    }

    /**
     * Registers multiple templates with the registry.
     * @param templates Array of node templates to register
     */
    public registerTemplates(templates: INodeTemplate[]): void {
        for (const template of templates) {
            this.registerTemplate(template);
        }
    }

    /**
     * Registers built-in templates from all registered hooks.
     * This method should be called once during initialization.
     */
    public registerBuiltInTemplates(): void {
        if (this.initialized) {
            console.warn('Built-in templates already registered');
            return;
        }

        const templates = TemplateRegistry.getAllTemplates();
        this.registerTemplates(templates);
        this.initialized = true;
    }

    /**
     * Creates a new node instance from a template type.
     * @param type The type identifier of the node template to use
     * @returns A new node instance
     */
    public createNode(type: string): INodeData {
        if (!this.initialized) {
            this.registerBuiltInTemplates();
        }
        const template = this.factory.getTemplate(type);
        if (!template) {
            throw new Error(`No template found for type: ${type}`);
        }
        return this.factory.createNode(template);
    }

    /**
     * Gets all registered templates for a specific category.
     * @param category The category to get templates for
     * @returns Array of templates in the specified category
     */
    public getTemplatesByCategory(category: NodeCategory): INodeTemplate[] {
        return this.factory.getTemplatesByCategory(category);
    }

    /**
     * Gets all registered templates.
     * @returns Array of all registered templates
     */
    public getAllTemplates(): INodeTemplate[] {
        return this.factory.getAllTemplates();
    }

    /**
     * Gets the underlying node factory.
     * @returns The node factory instance
     */
    public getFactory(): NodeFactory {
        return this.factory;
    }
} 