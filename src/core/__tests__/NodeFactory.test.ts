import { NodeFactory } from '../NodeFactory';
import { NodeTypes, INodeTemplate } from '../NodeSystem';
import { PortFactory } from '../PortFactory';

describe('NodeFactory', () => {
    let nodeFactory: NodeFactory;
    let portFactory: PortFactory;

    beforeEach(() => {
        nodeFactory = new NodeFactory();
        portFactory = new PortFactory();
    });

    const createMockTemplate = (): INodeTemplate => ({
        type: NodeTypes.ADD,
        title: 'Add Numbers',
        description: 'Add two numbers together',
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

    describe('Template Management', () => {
        it('should register a valid template', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            expect(nodeFactory.hasTemplate(template.type)).toBe(true);
        });

        it('should throw on duplicate template registration', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            expect(() => nodeFactory.registerTemplate(template)).toThrow();
        });

        it('should retrieve template by type', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const retrieved = nodeFactory.getTemplate(template.type);
            expect(retrieved).toEqual(template);
        });

        it('should retrieve templates by category', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const templates = nodeFactory.getTemplatesByCategory('math');
            expect(templates).toHaveLength(1);
            expect(templates[0]).toEqual(template);
        });

        it('should remove template', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            expect(nodeFactory.removeTemplate(template.type)).toBe(true);
            expect(nodeFactory.hasTemplate(template.type)).toBe(false);
        });

        it('should clear all templates', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            nodeFactory.clearTemplates();
            expect(nodeFactory.getAllTemplates()).toHaveLength(0);
        });
    });

    describe('Node Creation', () => {
        it('should create node from template', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const node = nodeFactory.createNode(template);

            expect(node).toMatchObject({
                type: template.type,
                title: template.title,
                category: template.category,
                inputs: template.defaultInputs,
                outputs: template.defaultOutputs
            });
            expect(node.id).toBeDefined();
        });

        it('should throw when creating node from unregistered template', () => {
            const template = createMockTemplate();
            expect(() => nodeFactory.createNode(template)).toThrow();
        });

        it('should create unique IDs for each node', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const node1 = nodeFactory.createNode(template);
            const node2 = nodeFactory.createNode(template);
            expect(node1.id).not.toEqual(node2.id);
        });
    });

    describe('Template Search', () => {
        it('should find templates by title', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const results = nodeFactory.searchTemplates('Add');
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual(template);
        });

        it('should find templates by description', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const results = nodeFactory.searchTemplates('numbers');
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual(template);
        });

        it('should find templates by tags', () => {
            const template = {
                ...createMockTemplate(),
                metadata: { tags: ['arithmetic', 'math'] }
            };
            nodeFactory.registerTemplate(template);
            const results = nodeFactory.searchTemplates('arithmetic');
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual(template);
        });

        it('should return empty array for no matches', () => {
            const template = createMockTemplate();
            nodeFactory.registerTemplate(template);
            const results = nodeFactory.searchTemplates('nonexistent');
            expect(results).toHaveLength(0);
        });
    });

    describe('Template Validation', () => {
        it('should throw on missing required fields', () => {
            const template = createMockTemplate();
            delete (template as any).title;
            expect(() => nodeFactory.registerTemplate(template)).toThrow();
        });

        it('should throw on duplicate port IDs', () => {
            const template = createMockTemplate();
            template.defaultInputs.push({
                ...template.defaultInputs[0],
                label: 'Duplicate'
            });
            expect(() => nodeFactory.registerTemplate(template)).toThrow();
        });

        it('should throw on invalid inputs/outputs', () => {
            const template = createMockTemplate();
            (template as any).defaultInputs = null;
            expect(() => nodeFactory.registerTemplate(template)).toThrow();
        });
    });
}); 