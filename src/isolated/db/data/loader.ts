import { FunctionData, FunctionTemplate, Language, FunctionImplementation } from './types';
import functionData from './functions.json';

export class FunctionLoader {
    private static validateLanguage(lang: string): lang is Language {
        return ['typescript', 'python', 'java', 'rust'].includes(lang);
    }

    private static validateTemplate(template: FunctionTemplate): boolean {
        // Basic validation
        if (!template.id || !template.name || !template.category) {
            console.error('Missing required fields in template:', template);
            return false;
        }

        // Validate implementations
        for (const [lang, impl] of Object.entries(template.implementations)) {
            if (!this.validateLanguage(lang)) {
                console.error('Invalid language in template:', lang);
                return false;
            }

            const implementation = impl as FunctionImplementation;

            // Validate implementation fields
            if (!implementation.parameters || !Array.isArray(implementation.parameters)) {
                console.error('Invalid parameters in implementation:', lang, template.name);
                return false;
            }

            // Validate required fields
            if (!implementation.bodyPrefix || !implementation.bodySuffix || !implementation.implementation) {
                console.error('Missing required implementation fields:', lang, template.name);
                return false;
            }
        }

        return true;
    }

    static loadFunctionData(): FunctionData {
        try {
            // Validate version
            if (!functionData.version || functionData.version < 1) {
                throw new Error('Invalid data version');
            }

            // Validate languages
            if (!functionData.languages || !functionData.languages.every(this.validateLanguage)) {
                throw new Error('Invalid languages list');
            }

            // Validate function templates
            if (!functionData.functions || !functionData.functions.every(this.validateTemplate)) {
                throw new Error('Invalid function templates');
            }

            return functionData as FunctionData;
        } catch (error) {
            console.error('Error loading function data:', error);
            throw error;
        }
    }

    static getFunctionTemplate(id: number): FunctionTemplate | undefined {
        const data = this.loadFunctionData();
        return data.functions.find((f: FunctionTemplate) => f.id === id);
    }

    static getFunctionTemplateByName(name: string): FunctionTemplate | undefined {
        const data = this.loadFunctionData();
        return data.functions.find((f: FunctionTemplate) => f.name === name);
    }

    static getFunctionsByCategory(category: string): FunctionTemplate[] {
        const data = this.loadFunctionData();
        return data.functions.filter((f: FunctionTemplate) => f.category === category);
    }

    static getAllFunctions(): FunctionTemplate[] {
        const data = this.loadFunctionData();
        return data.functions;
    }

    static getSupportedLanguages(): Language[] {
        const data = this.loadFunctionData();
        return data.languages;
    }
} 