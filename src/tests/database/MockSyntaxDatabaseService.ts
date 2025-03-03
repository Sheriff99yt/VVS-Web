import { 
  FunctionDefinition, 
  Language, 
  SyntaxPattern, 
  TypeDefinition, 
  TypeMapping 
} from '../../models/syntax';
import { SyntaxDatabaseService } from '../../services/database/SyntaxDatabaseService';

/**
 * Mock implementation of SyntaxDatabaseService for testing purposes.
 * Stores data in memory instead of using a real database.
 */
export class MockSyntaxDatabaseService implements SyntaxDatabaseService {
  private languages: Map<number, Language> = new Map();
  private functions: Map<number, FunctionDefinition> = new Map();
  private patterns: Map<number, SyntaxPattern> = new Map();
  private types: Map<number, TypeDefinition> = new Map();
  private typeMappings: Map<number, TypeMapping> = new Map();
  
  private nextLanguageId: number = 1;
  private nextFunctionId: number = 1;
  private nextPatternId: number = 1;
  private nextTypeId: number = 1;
  private nextTypeMappingId: number = 1;

  // Language methods
  
  async getLanguageById(id: number): Promise<Language | null> {
    return this.languages.get(id) || null;
  }
  
  async getLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }
  
  async createLanguage(language: Omit<Language, 'id'>): Promise<number> {
    const id = this.nextLanguageId++;
    const newLanguage = { ...language, id };
    this.languages.set(id, newLanguage);
    return id;
  }
  
  async updateLanguage(language: Language): Promise<void> {
    if (!language.id || !this.languages.has(language.id)) {
      throw new Error(`Language with ID ${language.id} not found`);
    }
    this.languages.set(language.id, language);
  }
  
  async deleteLanguage(id: number): Promise<void> {
    if (!this.languages.has(id)) {
      throw new Error(`Language with ID ${id} not found`);
    }
    this.languages.delete(id);
  }
  
  // Function methods
  
  async getFunctionById(id: number): Promise<FunctionDefinition | null> {
    return this.functions.get(id) || null;
  }
  
  async getFunctionsByCategory(category: string): Promise<FunctionDefinition[]> {
    return Array.from(this.functions.values())
      .filter(func => func.category === category);
  }
  
  async searchFunctions(query: string): Promise<FunctionDefinition[]> {
    if (!query) {
      return Array.from(this.functions.values());
    }
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.functions.values())
      .filter(func => 
        func.name.toLowerCase().includes(lowerQuery) ||
        func.displayName.toLowerCase().includes(lowerQuery) ||
        func.description.toLowerCase().includes(lowerQuery) ||
        func.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
  }
  
  async createFunction(functionDef: Omit<FunctionDefinition, 'id'>): Promise<number> {
    const id = this.nextFunctionId++;
    const newFunction = { ...functionDef, id };
    this.functions.set(id, newFunction);
    return id;
  }
  
  async updateFunction(functionDef: FunctionDefinition): Promise<void> {
    if (!functionDef.id || !this.functions.has(functionDef.id)) {
      throw new Error(`Function with ID ${functionDef.id} not found`);
    }
    this.functions.set(functionDef.id, functionDef);
  }
  
  async deleteFunction(id: number): Promise<void> {
    if (!this.functions.has(id)) {
      throw new Error(`Function with ID ${id} not found`);
    }
    this.functions.delete(id);
  }
  
  // Syntax pattern methods
  
  async getSyntaxPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null> {
    const patterns = Array.from(this.patterns.values())
      .filter(pattern => pattern.functionId === functionId && pattern.languageId === languageId);
    
    return patterns.length > 0 ? patterns[0] : null;
  }
  
  async getSyntaxPatternsByLanguage(languageId: number): Promise<SyntaxPattern[]> {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.languageId === languageId);
  }
  
  async createSyntaxPattern(pattern: Omit<SyntaxPattern, 'id'>): Promise<number> {
    const id = this.nextPatternId++;
    const newPattern = { ...pattern, id };
    this.patterns.set(id, newPattern);
    return id;
  }
  
  async updateSyntaxPattern(pattern: SyntaxPattern): Promise<void> {
    if (!pattern.id || !this.patterns.has(pattern.id)) {
      throw new Error(`Pattern with ID ${pattern.id} not found`);
    }
    this.patterns.set(pattern.id, pattern);
  }
  
  async deleteSyntaxPattern(id: number): Promise<void> {
    if (!this.patterns.has(id)) {
      throw new Error(`Pattern with ID ${id} not found`);
    }
    this.patterns.delete(id);
  }
  
  // Type methods
  
  async getTypeById(id: number): Promise<TypeDefinition | null> {
    return this.types.get(id) || null;
  }
  
  async getTypes(): Promise<TypeDefinition[]> {
    return Array.from(this.types.values());
  }
  
  async createType(typeDef: Omit<TypeDefinition, 'id'>): Promise<number> {
    const id = this.nextTypeId++;
    const newType = { ...typeDef, id };
    this.types.set(id, newType);
    return id;
  }
  
  async updateType(typeDef: TypeDefinition): Promise<void> {
    if (!typeDef.id || !this.types.has(typeDef.id)) {
      throw new Error(`Type with ID ${typeDef.id} not found`);
    }
    this.types.set(typeDef.id, typeDef);
  }
  
  async deleteType(id: number): Promise<void> {
    if (!this.types.has(id)) {
      throw new Error(`Type with ID ${id} not found`);
    }
    this.types.delete(id);
  }
  
  // Type mapping methods
  
  async getTypeMapping(abstractTypeId: number, languageId: number): Promise<TypeMapping | null> {
    const mappings = Array.from(this.typeMappings.values())
      .filter(mapping => mapping.abstractTypeId === abstractTypeId && mapping.languageId === languageId);
    
    return mappings.length > 0 ? mappings[0] : null;
  }
  
  async getTypeMappingsByLanguage(languageId: number): Promise<TypeMapping[]> {
    return Array.from(this.typeMappings.values())
      .filter(mapping => mapping.languageId === languageId);
  }
  
  async createTypeMapping(mapping: Omit<TypeMapping, 'id'>): Promise<number> {
    const id = this.nextTypeMappingId++;
    const newMapping = { ...mapping, id };
    this.typeMappings.set(id, newMapping);
    return id;
  }
  
  async updateTypeMapping(mapping: TypeMapping): Promise<void> {
    if (!mapping.id || !this.typeMappings.has(mapping.id)) {
      throw new Error(`Type mapping with ID ${mapping.id} not found`);
    }
    this.typeMappings.set(mapping.id, mapping);
  }
  
  async deleteTypeMapping(id: number): Promise<void> {
    if (!this.typeMappings.has(id)) {
      throw new Error(`Type mapping with ID ${id} not found`);
    }
    this.typeMappings.delete(id);
  }
  
  // Database management methods
  
  async initDatabase(): Promise<void> {
    // No-op for the mock implementation
  }
  
  async clearDatabase(): Promise<void> {
    this.languages.clear();
    this.functions.clear();
    this.patterns.clear();
    this.types.clear();
    this.typeMappings.clear();
    
    this.nextLanguageId = 1;
    this.nextFunctionId = 1;
    this.nextPatternId = 1;
    this.nextTypeId = 1;
    this.nextTypeMappingId = 1;
  }
  
  async exportDatabase(): Promise<any> {
    return {
      languages: Array.from(this.languages.values()),
      functions: Array.from(this.functions.values()),
      syntaxPatterns: Array.from(this.patterns.values()),
      types: Array.from(this.types.values()),
      typeMappings: Array.from(this.typeMappings.values())
    };
  }
  
  async importDatabase(data: any): Promise<void> {
    await this.clearDatabase();
    
    if (data.languages && Array.isArray(data.languages)) {
      for (const language of data.languages) {
        if (language.id) {
          this.languages.set(language.id, language);
          this.nextLanguageId = Math.max(this.nextLanguageId, language.id + 1);
        }
      }
    }
    
    if (data.functions && Array.isArray(data.functions)) {
      for (const func of data.functions) {
        if (func.id) {
          this.functions.set(func.id, func);
          this.nextFunctionId = Math.max(this.nextFunctionId, func.id + 1);
        }
      }
    }
    
    if (data.syntaxPatterns && Array.isArray(data.syntaxPatterns)) {
      for (const pattern of data.syntaxPatterns) {
        if (pattern.id) {
          this.patterns.set(pattern.id, pattern);
          this.nextPatternId = Math.max(this.nextPatternId, pattern.id + 1);
        }
      }
    }
    
    if (data.types && Array.isArray(data.types)) {
      for (const type of data.types) {
        if (type.id) {
          this.types.set(type.id, type);
          this.nextTypeId = Math.max(this.nextTypeId, type.id + 1);
        }
      }
    }
    
    if (data.typeMappings && Array.isArray(data.typeMappings)) {
      for (const mapping of data.typeMappings) {
        if (mapping.id) {
          this.typeMappings.set(mapping.id, mapping);
          this.nextTypeMappingId = Math.max(this.nextTypeMappingId, mapping.id + 1);
        }
      }
    }
  }
} 