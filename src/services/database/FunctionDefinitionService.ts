import { FunctionDefinition, SyntaxPattern } from '../types/database';

export interface FunctionDefinitionFile {
  version: string;
  description: string;
  functions: FunctionDefinition[];
  metadata: {
    lastUpdated: string;
    supportedLanguages: string[];
    categories: string[];
  };
}

export class FunctionDefinitionService {
  private static instance: FunctionDefinitionService;
  private functionDefinitions: Map<string, FunctionDefinition> = new Map();
  private loadedFiles: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): FunctionDefinitionService {
    if (!FunctionDefinitionService.instance) {
      FunctionDefinitionService.instance = new FunctionDefinitionService();
    }
    return FunctionDefinitionService.instance;
  }

  /**
   * Loads function definitions from a JSON file
   * @param filePath Path to the JSON file
   * @returns Promise<void>
   */
  public async loadFunctionDefinitions(filePath: string): Promise<void> {
    if (this.loadedFiles.has(filePath)) {
      return; // File already loaded
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load function definitions from ${filePath}`);
      }

      const data: FunctionDefinitionFile = await response.json();
      this.validateFunctionDefinitions(data);

      // Add functions to the map
      data.functions.forEach(func => {
        this.functionDefinitions.set(func.id, func);
      });

      this.loadedFiles.add(filePath);
    } catch (error) {
      console.error(`Error loading function definitions from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Validates the structure of function definitions
   * @param data The function definition file data
   */
  private validateFunctionDefinitions(data: FunctionDefinitionFile): void {
    if (!data.version || !data.functions || !Array.isArray(data.functions)) {
      throw new Error('Invalid function definition file structure');
    }

    data.functions.forEach(func => {
      if (!func.id || !func.name || !func.category || !func.syntaxPatterns) {
        throw new Error(`Invalid function definition: ${func.id || 'unknown'}`);
      }
    });
  }

  /**
   * Gets a function definition by ID
   * @param id The function ID
   * @returns The function definition or undefined if not found
   */
  public getFunctionById(id: string): FunctionDefinition | undefined {
    return this.functionDefinitions.get(id);
  }

  /**
   * Gets all functions in a category
   * @param category The category name
   * @returns Array of function definitions
   */
  public getFunctionsByCategory(category: string): FunctionDefinition[] {
    return Array.from(this.functionDefinitions.values())
      .filter(func => func.category === category);
  }

  /**
   * Gets all available categories
   * @returns Array of category names
   */
  public getCategories(): string[] {
    const categories = new Set<string>();
    this.functionDefinitions.forEach(func => {
      categories.add(func.category);
    });
    return Array.from(categories);
  }

  /**
   * Gets the syntax pattern for a function in a specific language
   * @param functionId The function ID
   * @param language The language name
   * @returns The syntax pattern or undefined if not found
   */
  public getSyntaxPattern(functionId: string, language: string): SyntaxPattern | undefined {
    const func = this.getFunctionById(functionId);
    return func?.syntaxPatterns[language];
  }

  /**
   * Gets all functions that support a specific language
   * @param language The language name
   * @returns Array of function definitions
   */
  public getFunctionsByLanguage(language: string): FunctionDefinition[] {
    return Array.from(this.functionDefinitions.values())
      .filter(func => language in func.syntaxPatterns);
  }

  /**
   * Gets all loaded function definitions
   * @returns Array of all function definitions
   */
  public getAllFunctions(): FunctionDefinition[] {
    return Array.from(this.functionDefinitions.values());
  }

  /**
   * Clears all loaded function definitions
   */
  public clear(): void {
    this.functionDefinitions.clear();
    this.loadedFiles.clear();
  }
} 