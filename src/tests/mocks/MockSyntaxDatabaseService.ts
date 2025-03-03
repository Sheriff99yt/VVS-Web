import { SyntaxDatabaseService } from '../../services/database/SyntaxDatabaseService';
import { 
  SyntaxPattern, 
  PatternType, 
  Language, 
  FunctionDefinition, 
  TypeDefinition, 
  TypeMapping 
} from '../../models/syntax';

/**
 * A mock implementation of SyntaxDatabaseService for testing purposes.
 * This implementation stores data in memory and provides controlled responses.
 */
export class MockSyntaxDatabaseService implements SyntaxDatabaseService {
  private languages: Map<number, Language> = new Map();
  private functions: Map<number, FunctionDefinition> = new Map();
  private syntaxPatterns: Map<string, SyntaxPattern> = new Map();
  private types: Map<number, TypeDefinition> = new Map();
  private typeMappings: Map<string, TypeMapping> = new Map();

  constructor() {
    // Add a default Python language
    this.languages.set(1, {
      id: 1,
      name: 'Python',
      version: '3.11',
      fileExtension: '.py',
      syntaxRules: {
        statementDelimiter: '\n',
        blockStart: ':',
        blockEnd: '',
        commentSingle: '#',
        commentMultiStart: '"""',
        commentMultiEnd: '"""',
        stringDelimiters: ['"', "'"],
        indentationStyle: 'space',
        indentationSize: 4,
        functionDefinitionPattern: 'def {name}({parameters}):\n{body}',
        variableDeclarationPattern: '{name} = {value}',
        operatorPatterns: {}
      },
      isEnabled: true
    });
  }

  // Language methods
  async getLanguageById(id: number): Promise<Language | null> {
    return this.languages.get(id) || null;
  }

  async getLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }

  async createLanguage(language: Omit<Language, 'id'>): Promise<number> {
    const id = this.languages.size + 1;
    const newLanguage = { ...language, id };
    this.languages.set(id, newLanguage);
    return id;
  }

  async updateLanguage(language: Language): Promise<void> {
    if (language.id !== undefined) {
      this.languages.set(language.id, language);
    }
  }

  async deleteLanguage(id: number): Promise<void> {
    this.languages.delete(id);
  }

  // Function methods
  async getFunctionById(id: number): Promise<FunctionDefinition | null> {
    return this.functions.get(id) || null;
  }

  async getFunctionsByCategory(category: string): Promise<FunctionDefinition[]> {
    return Array.from(this.functions.values()).filter(f => f.category === category);
  }

  async searchFunctions(query: string): Promise<FunctionDefinition[]> {
    return Array.from(this.functions.values()).filter(f => 
      f.name.includes(query) || 
      f.description.includes(query) || 
      (f.tags && f.tags.some(tag => tag.includes(query)))
    );
  }

  async createFunction(func: Omit<FunctionDefinition, 'id'>): Promise<number> {
    const id = this.functions.size + 1;
    const newFunc = { ...func, id };
    this.functions.set(id, newFunc);
    return id;
  }

  async updateFunction(func: FunctionDefinition): Promise<void> {
    if (func.id !== undefined) {
      this.functions.set(func.id, func);
    }
  }

  async deleteFunction(id: number): Promise<void> {
    this.functions.delete(id);
  }

  // Syntax pattern methods
  async getSyntaxPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null> {
    return this.syntaxPatterns.get(`${functionId}-${languageId}`) || null;
  }

  async getSyntaxPatternsByLanguage(languageId: number): Promise<SyntaxPattern[]> {
    return Array.from(this.syntaxPatterns.values()).filter(p => p.languageId === languageId);
  }

  async createSyntaxPattern(pattern: Omit<SyntaxPattern, 'id'>): Promise<number> {
    const id = this.syntaxPatterns.size + 1;
    const newPattern = { ...pattern, id };
    this.syntaxPatterns.set(`${newPattern.functionId}-${newPattern.languageId}`, newPattern);
    return id;
  }

  async updateSyntaxPattern(pattern: SyntaxPattern): Promise<void> {
    if (pattern.id !== undefined) {
      this.syntaxPatterns.set(`${pattern.functionId}-${pattern.languageId}`, pattern);
    }
  }

  async deleteSyntaxPattern(id: number): Promise<void> {
    // Find pattern with this id and remove it
    const pattern = Array.from(this.syntaxPatterns.values()).find(p => p.id === id);
    if (pattern) {
      this.syntaxPatterns.delete(`${pattern.functionId}-${pattern.languageId}`);
    }
  }

  // Type methods
  async getTypeById(id: number): Promise<TypeDefinition | null> {
    return this.types.get(id) || null;
  }

  async getTypes(): Promise<TypeDefinition[]> {
    return Array.from(this.types.values());
  }

  async createType(type: Omit<TypeDefinition, 'id'>): Promise<number> {
    const id = this.types.size + 1;
    const newType = { ...type, id };
    this.types.set(id, newType);
    return id;
  }

  async updateType(type: TypeDefinition): Promise<void> {
    if (type.id !== undefined) {
      this.types.set(type.id, type);
    }
  }

  async deleteType(id: number): Promise<void> {
    this.types.delete(id);
  }

  // Type mapping methods
  async getTypeMapping(abstractTypeId: number, languageId: number): Promise<TypeMapping | null> {
    return this.typeMappings.get(`${abstractTypeId}-${languageId}`) || null;
  }

  async getTypeMappingsByLanguage(languageId: number): Promise<TypeMapping[]> {
    return Array.from(this.typeMappings.values()).filter(m => m.languageId === languageId);
  }

  async createTypeMapping(mapping: Omit<TypeMapping, 'id'>): Promise<number> {
    const id = this.typeMappings.size + 1;
    const newMapping = { ...mapping, id };
    this.typeMappings.set(`${newMapping.abstractTypeId}-${newMapping.languageId}`, newMapping);
    return id;
  }

  async updateTypeMapping(mapping: TypeMapping): Promise<void> {
    if (mapping.id !== undefined) {
      this.typeMappings.set(`${mapping.abstractTypeId}-${mapping.languageId}`, mapping);
    }
  }

  async deleteTypeMapping(id: number): Promise<void> {
    // Find mapping with this id and remove it
    const mapping = Array.from(this.typeMappings.values()).find(m => m.id === id);
    if (mapping) {
      this.typeMappings.delete(`${mapping.abstractTypeId}-${mapping.languageId}`);
    }
  }

  // Database management methods
  async initDatabase(): Promise<void> {
    // Already initialized in constructor
  }

  async clearDatabase(): Promise<void> {
    this.languages.clear();
    this.functions.clear();
    this.syntaxPatterns.clear();
    this.types.clear();
    this.typeMappings.clear();
  }

  async exportDatabase(): Promise<any> {
    return {
      languages: Array.from(this.languages.values()),
      functions: Array.from(this.functions.values()),
      syntaxPatterns: Array.from(this.syntaxPatterns.values()),
      types: Array.from(this.types.values()),
      typeMappings: Array.from(this.typeMappings.values())
    };
  }

  async importDatabase(data: any): Promise<void> {
    if (data.languages) {
      this.languages.clear();
      data.languages.forEach((l: Language) => {
        if (l.id !== undefined) {
          this.languages.set(l.id, l);
        }
      });
    }
    
    if (data.functions) {
      this.functions.clear();
      data.functions.forEach((f: FunctionDefinition) => {
        if (f.id !== undefined) {
          this.functions.set(f.id, f);
        }
      });
    }
    
    if (data.syntaxPatterns) {
      this.syntaxPatterns.clear();
      data.syntaxPatterns.forEach((p: SyntaxPattern) => 
        this.syntaxPatterns.set(`${p.functionId}-${p.languageId}`, p)
      );
    }
    
    if (data.types) {
      this.types.clear();
      data.types.forEach((t: TypeDefinition) => {
        if (t.id !== undefined) {
          this.types.set(t.id, t);
        }
      });
    }
    
    if (data.typeMappings) {
      this.typeMappings.clear();
      data.typeMappings.forEach((m: TypeMapping) => 
        this.typeMappings.set(`${m.abstractTypeId}-${m.languageId}`, m)
      );
    }
  }

  // Additional methods for testing

  /**
   * Add a mock syntax pattern with minimal configuration
   */
  addMockSyntaxPattern(functionId: number, languageId: number, pattern: string): void {
    const id = this.syntaxPatterns.size + 1;
    this.syntaxPatterns.set(`${functionId}-${languageId}`, {
      id,
      functionId,
      languageId,
      pattern,
      patternType: PatternType.EXPRESSION
    });
  }

  /**
   * Add a mock function with minimal configuration
   */
  addMockFunction(id: number, name: string, category: string = 'test'): void {
    this.functions.set(id, {
      id,
      name,
      displayName: name,
      description: `Mock function: ${name}`,
      category,
      parameters: [],
      returnType: 'any',
      isBuiltIn: false,
      tags: []
    });
  }
} 