import { FunctionDB, NodeFunctionStructure } from '../isolated/db/FunctionDB';
import exampleData from '../received_data/ExampleData.json';

interface Parameter {
    text: string;
    optional?: boolean;
    default?: string;
}

interface Implementation {
    modifiers?: {
        access?: string;
        static?: boolean;
    };
    signature: {
        returnType: string;
    };
    parameters: Parameter[];
    body: {
        validation: string;
        implementation: string;
    };
}

export class DataImportService {
    private static db = new FunctionDB();

    static async importExampleData(): Promise<void> {
        try {
            // Clear existing data
            await this.db.clearFunctionNodes();

            // Import each function
            for (const func of exampleData.functions) {
                // For each language implementation
                for (const [language, impl] of Object.entries<Implementation>(func.implementations)) {
                    const node: NodeFunctionStructure = {
                        id: parseInt(func.id),
                        name: func.name,
                        category: func.category,
                        description: func.description,
                        language,
                        accessModifier: impl.modifiers?.access || '',
                        isStatic: impl.modifiers?.static ? 'static' : '',
                        isAsync: '',
                        returnType: impl.signature.returnType,
                        parameters: impl.parameters.map((p: Parameter) => ({
                            text: p.text,
                            defaultValue: p.default || '',
                            isOptional: p.optional ? '?' : ''
                        })),
                        throws: '',
                        bodyPrefix: '{',
                        bodySuffix: '}',
                        validation: impl.body.validation,
                        implementation: impl.body.implementation,
                        errorHandling: '',
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                    };

                    await this.db.addFunctionNode(node);
                }
            }
        } catch (error) {
            console.error('Failed to import example data:', error);
            throw error;
        }
    }

    static async getNodesByCategory(category: string): Promise<NodeFunctionStructure[]> {
        return this.db.searchFunctionNodesByCategory(category);
    }

    static async getAllNodes(): Promise<NodeFunctionStructure[]> {
        return this.db.getAllFunctionNodes();
    }
} 