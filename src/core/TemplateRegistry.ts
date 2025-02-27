import { INodeTemplate } from './NodeSystem';
import { NodeCategory } from '../components/nodes/types';

/**
 * Template registration hook type
 */
export type TemplateRegistrationHook = () => INodeTemplate[];

/**
 * Registry for managing node template registration hooks.
 * Provides a flexible system for registering and retrieving node templates by category.
 */
export class TemplateRegistry {
    private static hooks: Map<NodeCategory, Set<TemplateRegistrationHook>> = new Map();

    /**
     * Registers a hook for a specific node category.
     * @param category The category to register the hook for
     * @param hook The hook function that returns an array of node templates
     */
    public static registerHook(category: NodeCategory, hook: TemplateRegistrationHook): void {
        if (!this.hooks.has(category)) {
            this.hooks.set(category, new Set());
        }
        this.hooks.get(category)!.add(hook);
    }

    /**
     * Removes a hook for a specific category.
     * @param category The category to remove the hook from
     * @param hook The hook function to remove
     * @returns true if the hook was found and removed, false otherwise
     */
    public static removeHook(category: NodeCategory, hook: TemplateRegistrationHook): boolean {
        const categoryHooks = this.hooks.get(category);
        if (!categoryHooks) return false;
        return categoryHooks.delete(hook);
    }

    /**
     * Clears all registered hooks.
     */
    public static clearHooks(): void {
        this.hooks.clear();
    }

    /**
     * Gets the number of hooks registered for a category.
     * @param category The category to count hooks for
     * @returns The number of hooks registered for the category
     */
    public static getHookCount(category: NodeCategory): number {
        return this.hooks.get(category)?.size ?? 0;
    }

    /**
     * Checks if there are any hooks registered for a category.
     * @param category The category to check
     * @returns true if there are hooks registered for the category, false otherwise
     */
    public static hasHooksForCategory(category: NodeCategory): boolean {
        return this.hooks.has(category) && this.hooks.get(category)!.size > 0;
    }

    /**
     * Gets all templates from all registered hooks.
     * @returns An array of all node templates
     */
    public static getAllTemplates(): INodeTemplate[] {
        const templates: INodeTemplate[] = [];
        for (const [category, hooks] of this.hooks) {
            for (const hook of hooks) {
                try {
                    const hookTemplates = hook();
                    // Filter out templates that don't match their registered category
                    const validTemplates = hookTemplates.filter(template => {
                        if (template.category !== category) {
                            console.warn(`Template category mismatch: expected ${category}, got ${template.category}`);
                            return false;
                        }
                        return true;
                    });
                    templates.push(...validTemplates);
                } catch (error) {
                    console.warn(`Error executing hook for category ${category}:`, error);
                }
            }
        }
        return templates;
    }

    /**
     * Gets all templates for a specific category.
     * @param category The category to get templates for
     * @returns An array of node templates for the specified category
     */
    public static getTemplatesByCategory(category: NodeCategory): INodeTemplate[] {
        const categoryHooks = this.hooks.get(category);
        if (!categoryHooks) return [];

        const templates: INodeTemplate[] = [];
        for (const hook of categoryHooks) {
            try {
                const hookTemplates = hook();
                // Filter out templates that don't match their registered category
                const validTemplates = hookTemplates.filter(template => {
                    if (template.category !== category) {
                        console.warn(`Template category mismatch: expected ${category}, got ${template.category}`);
                        return false;
                    }
                    return true;
                });
                templates.push(...validTemplates);
            } catch (error) {
                console.warn(`Error executing hook for category ${category}:`, error);
            }
        }
        return templates;
    }
} 