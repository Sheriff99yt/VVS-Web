import { TemplateRegistry, TemplateRegistrationHook } from '../TemplateRegistry';
import { INodeTemplate, NodeTypes } from '../NodeSystem';
import { PortFactory } from '../PortFactory';
import { NodeCategory } from '../../components/nodes/types';

describe('TemplateRegistry', () => {
    let portFactory: PortFactory;

    beforeEach(() => {
        portFactory = new PortFactory();
        TemplateRegistry.clearHooks();
    });

    const createMockTemplate = (category: NodeCategory = 'math'): INodeTemplate => ({
        type: NodeTypes.ADD,
        title: 'Add Numbers',
        description: 'Add two numbers together',
        category,
        defaultInputs: [
            portFactory.createExecPort('exec', 'Exec', true),
            portFactory.createDataPort('a', 'A', 'number', true),
            portFactory.createDataPort('b', 'B', 'number', true)
        ],
        defaultOutputs: [
            portFactory.createExecPort('exec', 'Exec', false),
            portFactory.createDataPort('result', 'Result', 'number', false)
        ]
    });

    describe('Hook Registration', () => {
        it('should register and count hooks', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            expect(TemplateRegistry.getHookCount('math')).toBe(1);
        });

        it('should allow multiple hooks per category', () => {
            const hook1: TemplateRegistrationHook = () => [createMockTemplate()];
            const hook2: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook1);
            TemplateRegistry.registerHook('math', hook2);
            expect(TemplateRegistry.getHookCount('math')).toBe(2);
        });

        it('should remove hooks', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            expect(TemplateRegistry.removeHook('math', hook)).toBe(true);
            expect(TemplateRegistry.getHookCount('math')).toBe(0);
        });

        it('should clear all hooks', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            TemplateRegistry.registerHook('string', hook);
            TemplateRegistry.clearHooks();
            expect(TemplateRegistry.getHookCount('math')).toBe(0);
            expect(TemplateRegistry.getHookCount('string')).toBe(0);
        });
    });

    describe('Template Collection', () => {
        it('should collect templates from all hooks', () => {
            const hook1: TemplateRegistrationHook = () => [createMockTemplate()];
            const hook2: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook1);
            TemplateRegistry.registerHook('math', hook2);
            const templates = TemplateRegistry.getAllTemplates();
            expect(templates).toHaveLength(2);
        });

        it('should collect templates by category', () => {
            const mathHook: TemplateRegistrationHook = () => [createMockTemplate('math')];
            const stringHook: TemplateRegistrationHook = () => [createMockTemplate('string')];
            TemplateRegistry.registerHook('math', mathHook);
            TemplateRegistry.registerHook('string', stringHook);
            const mathTemplates = TemplateRegistry.getTemplatesByCategory('math');
            expect(mathTemplates).toHaveLength(1);
            expect(mathTemplates[0].category).toBe('math');
        });

        it('should handle empty categories', () => {
            const templates = TemplateRegistry.getTemplatesByCategory('math');
            expect(templates).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle hook errors gracefully', () => {
            const errorHook: TemplateRegistrationHook = () => {
                throw new Error('Hook error');
            };
            TemplateRegistry.registerHook('math', errorHook);
            const templates = TemplateRegistry.getAllTemplates();
            expect(templates).toHaveLength(0);
        });

        it('should warn about category mismatches', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const wrongCategoryHook: TemplateRegistrationHook = () => [
                createMockTemplate('string') // Registered under 'math' but returns 'string' category
            ];
            TemplateRegistry.registerHook('math', wrongCategoryHook);
            const templates = TemplateRegistry.getAllTemplates();
            expect(templates).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Hook Management', () => {
        it('should check for category hooks', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            expect(TemplateRegistry.hasHooksForCategory('math')).toBe(false);
            TemplateRegistry.registerHook('math', hook);
            expect(TemplateRegistry.hasHooksForCategory('math')).toBe(true);
        });

        it('should handle duplicate hook registration', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            TemplateRegistry.registerHook('math', hook); // Register same hook twice
            expect(TemplateRegistry.getHookCount('math')).toBe(1); // Should only count once
        });
    });
}); 