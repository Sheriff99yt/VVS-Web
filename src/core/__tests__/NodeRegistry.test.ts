import { NodeRegistry } from '../NodeRegistry';
import { TemplateRegistry, TemplateRegistrationHook } from '../TemplateRegistry';
import { INodeTemplate, NodeTypes } from '../NodeSystem';
import { PortFactory } from '../PortFactory';

describe('NodeRegistry', () => {
    let registry: NodeRegistry;
    let portFactory: PortFactory;

    beforeEach(() => {
        registry = NodeRegistry.getInstance();
        registry.reset();
        portFactory = new PortFactory();
    });

    const createMockTemplate = (type: string = NodeTypes.ADD): INodeTemplate => ({
        type,
        title: 'Test Node',
        description: 'Test node for testing',
        category: 'math',
        defaultInputs: [
            portFactory.createExecPort('execIn', 'Exec In', true),
            portFactory.createDataPort('a', 'A', 'number', true),
            portFactory.createDataPort('b', 'B', 'number', true)
        ],
        defaultOutputs: [
            portFactory.createExecPort('execOut', 'Exec Out', false),
            portFactory.createDataPort('result', 'Result', 'number', false)
        ]
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = NodeRegistry.getInstance();
            const instance2 = NodeRegistry.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should maintain state between getInstance calls', () => {
            const instance1 = NodeRegistry.getInstance();
            const template = createMockTemplate();
            instance1.registerTemplate(template);

            const instance2 = NodeRegistry.getInstance();
            expect(instance2.getAllTemplates()).toContainEqual(template);
        });
    });

    describe('Template Registration', () => {
        it('should register templates directly', () => {
            const template = createMockTemplate();
            registry.registerTemplate(template);
            expect(registry.getAllTemplates()).toContainEqual(template);
        });

        it('should register multiple templates', () => {
            const templates = [
                createMockTemplate(NodeTypes.ADD),
                createMockTemplate(NodeTypes.SUBTRACT)
            ];
            registry.registerTemplates(templates);
            expect(registry.getAllTemplates()).toHaveLength(2);
            templates.forEach(template => {
                expect(registry.getAllTemplates()).toContainEqual(template);
            });
        });
    });

    describe('Built-in Templates', () => {
        it('should register templates from hooks on initialization', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            registry.registerBuiltInTemplates();
            expect(registry.getAllTemplates()).toHaveLength(1);
        });

        it('should not register built-in templates twice', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            registry.registerBuiltInTemplates();
            registry.registerBuiltInTemplates(); // Second call should be ignored
            expect(registry.getAllTemplates()).toHaveLength(1);
        });

        it('should handle hook errors gracefully', () => {
            const errorHook: TemplateRegistrationHook = () => {
                throw new Error('Hook error');
            };
            TemplateRegistry.registerHook('math', errorHook);
            registry.registerBuiltInTemplates();
            expect(registry.getAllTemplates()).toHaveLength(0);
        });
    });

    describe('Node Creation', () => {
        it('should create nodes from registered templates', () => {
            const template = createMockTemplate();
            registry.registerTemplate(template);
            const node = registry.createNode(template.type);
            expect(node).toBeDefined();
            expect(node.type).toBe(template.type);
        });

        it('should throw error for unknown template types', () => {
            expect(() => registry.createNode('unknown')).toThrow();
        });

        it('should auto-initialize on first node creation', () => {
            const hook: TemplateRegistrationHook = () => [createMockTemplate()];
            TemplateRegistry.registerHook('math', hook);
            const node = registry.createNode(NodeTypes.ADD);
            expect(node).toBeDefined();
            expect(node.type).toBe(NodeTypes.ADD);
        });
    });

    describe('Template Queries', () => {
        beforeEach(() => {
            const templates = [
                createMockTemplate(NodeTypes.ADD),
                createMockTemplate(NodeTypes.SUBTRACT)
            ];
            registry.registerTemplates(templates);
        });

        it('should get templates by category', () => {
            const mathTemplates = registry.getTemplatesByCategory('math');
            expect(mathTemplates).toHaveLength(2);
            mathTemplates.forEach(template => {
                expect(template.category).toBe('math');
            });
        });

        it('should get all templates', () => {
            const allTemplates = registry.getAllTemplates();
            expect(allTemplates).toHaveLength(2);
        });
    });

    describe('Factory Access', () => {
        it('should provide access to the underlying factory', () => {
            const factory = registry.getFactory();
            expect(factory).toBeDefined();
        });
    });
}); 