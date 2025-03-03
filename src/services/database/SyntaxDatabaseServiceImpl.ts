import { 
  FunctionDefinition, 
  Language, 
  SyntaxPattern, 
  TypeDefinition, 
  TypeMapping 
} from '../../models/syntax';
import { DatabaseInitializer } from './DatabaseInitializer';
import { SyntaxDatabaseService } from './SyntaxDatabaseService';
import { FunctionRepository } from './repositories/FunctionRepository';
import { LanguageRepository } from './repositories/LanguageRepository';
import { PatternRepository } from './repositories/PatternRepository';
import { TypeMappingRepository } from './repositories/TypeMappingRepository';
import { TypeRepository } from './repositories/TypeRepository';

/**
 * Implementation of the SyntaxDatabaseService interface.
 * This service provides access to all syntax-related data in the database.
 */
export class SyntaxDatabaseServiceImpl implements SyntaxDatabaseService {
  private initialized: boolean = false;
  private initializing: Promise<void> | null = null;
  
  private readonly languageRepository: LanguageRepository;
  private readonly functionRepository: FunctionRepository;
  private readonly patternRepository: PatternRepository;
  private readonly typeRepository: TypeRepository;
  private readonly typeMappingRepository: TypeMappingRepository;
  private readonly databaseInitializer: DatabaseInitializer;
  
  constructor() {
    this.languageRepository = new LanguageRepository();
    this.functionRepository = new FunctionRepository();
    this.patternRepository = new PatternRepository();
    this.typeRepository = new TypeRepository();
    this.typeMappingRepository = new TypeMappingRepository();
    this.databaseInitializer = new DatabaseInitializer();
  }
  
  /**
   * Initialize the service and ensure the database is ready
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    if (this.initializing) {
      return this.initializing;
    }
    
    this.initializing = this.databaseInitializer.initialize();
    await this.initializing;
    this.initialized = true;
    this.initializing = null;
  }
  
  // Language methods
  
  async getLanguageById(id: number): Promise<Language | null> {
    await this.ensureInitialized();
    return this.languageRepository.getById(id);
  }
  
  async getLanguages(): Promise<Language[]> {
    await this.ensureInitialized();
    return this.languageRepository.getAll();
  }
  
  async createLanguage(language: Omit<Language, 'id'>): Promise<number> {
    await this.ensureInitialized();
    return this.languageRepository.create(language);
  }
  
  async updateLanguage(language: Language): Promise<void> {
    await this.ensureInitialized();
    return this.languageRepository.update(language);
  }
  
  async deleteLanguage(id: number): Promise<void> {
    await this.ensureInitialized();
    return this.languageRepository.delete(id);
  }
  
  // Function methods
  
  async getFunctionById(id: number): Promise<FunctionDefinition | null> {
    await this.ensureInitialized();
    return this.functionRepository.getById(id);
  }
  
  async getFunctionsByCategory(category: string): Promise<FunctionDefinition[]> {
    await this.ensureInitialized();
    return this.functionRepository.getByCategory(category);
  }
  
  async searchFunctions(query: string): Promise<FunctionDefinition[]> {
    await this.ensureInitialized();
    return this.functionRepository.search(query);
  }
  
  async createFunction(functionDef: Omit<FunctionDefinition, 'id'>): Promise<number> {
    await this.ensureInitialized();
    return this.functionRepository.create(functionDef);
  }
  
  async updateFunction(functionDef: FunctionDefinition): Promise<void> {
    await this.ensureInitialized();
    return this.functionRepository.update(functionDef);
  }
  
  async deleteFunction(id: number): Promise<void> {
    await this.ensureInitialized();
    return this.functionRepository.delete(id);
  }
  
  // Syntax pattern methods
  
  async getSyntaxPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null> {
    await this.ensureInitialized();
    return this.patternRepository.getByFunctionAndLanguage(functionId, languageId);
  }
  
  async getSyntaxPatternsByLanguage(languageId: number): Promise<SyntaxPattern[]> {
    await this.ensureInitialized();
    return this.patternRepository.getByLanguage(languageId);
  }
  
  async createSyntaxPattern(pattern: Omit<SyntaxPattern, 'id'>): Promise<number> {
    await this.ensureInitialized();
    return this.patternRepository.create(pattern);
  }
  
  async updateSyntaxPattern(pattern: SyntaxPattern): Promise<void> {
    await this.ensureInitialized();
    return this.patternRepository.update(pattern);
  }
  
  async deleteSyntaxPattern(id: number): Promise<void> {
    await this.ensureInitialized();
    return this.patternRepository.delete(id);
  }
  
  // Type methods
  
  async getTypeById(id: number): Promise<TypeDefinition | null> {
    await this.ensureInitialized();
    return this.typeRepository.getById(id);
  }
  
  async getTypes(): Promise<TypeDefinition[]> {
    await this.ensureInitialized();
    return this.typeRepository.getAll();
  }
  
  async createType(typeDef: Omit<TypeDefinition, 'id'>): Promise<number> {
    await this.ensureInitialized();
    return this.typeRepository.create(typeDef);
  }
  
  async updateType(typeDef: TypeDefinition): Promise<void> {
    await this.ensureInitialized();
    return this.typeRepository.update(typeDef);
  }
  
  async deleteType(id: number): Promise<void> {
    await this.ensureInitialized();
    return this.typeRepository.delete(id);
  }
  
  // Type mapping methods
  
  async getTypeMapping(abstractTypeId: number, languageId: number): Promise<TypeMapping | null> {
    await this.ensureInitialized();
    return this.typeMappingRepository.getByTypeAndLanguage(abstractTypeId, languageId);
  }
  
  async getTypeMappingsByLanguage(languageId: number): Promise<TypeMapping[]> {
    await this.ensureInitialized();
    return this.typeMappingRepository.getByLanguage(languageId);
  }
  
  async createTypeMapping(mapping: Omit<TypeMapping, 'id'>): Promise<number> {
    await this.ensureInitialized();
    return this.typeMappingRepository.create(mapping);
  }
  
  async updateTypeMapping(mapping: TypeMapping): Promise<void> {
    await this.ensureInitialized();
    return this.typeMappingRepository.update(mapping);
  }
  
  async deleteTypeMapping(id: number): Promise<void> {
    await this.ensureInitialized();
    return this.typeMappingRepository.delete(id);
  }
  
  // Database management methods
  
  async initDatabase(): Promise<void> {
    this.initialized = false;
    this.initializing = null;
    await this.ensureInitialized();
  }
  
  async clearDatabase(): Promise<void> {
    await this.databaseInitializer.clearDatabase();
    this.initialized = false;
    this.initializing = null;
  }
  
  async exportDatabase(): Promise<any> {
    await this.ensureInitialized();
    
    const languages = await this.languageRepository.getAll();
    const functions = await this.functionRepository.getAll();
    const patterns = await this.patternRepository.getAll();
    const types = await this.typeRepository.getAll();
    const typeMappings = await this.typeMappingRepository.getAll();
    
    return {
      languages,
      functions,
      patterns,
      types,
      typeMappings
    };
  }
  
  async importDatabase(data: any): Promise<void> {
    await this.clearDatabase();
    await this.ensureInitialized();
    
    // Import languages
    if (data.languages && Array.isArray(data.languages)) {
      for (const language of data.languages) {
        const { id, ...languageData } = language;
        await this.createLanguage(languageData);
      }
    }
    
    // Import functions
    if (data.functions && Array.isArray(data.functions)) {
      for (const func of data.functions) {
        const { id, ...funcData } = func;
        await this.createFunction(funcData);
      }
    }
    
    // Import patterns
    if (data.patterns && Array.isArray(data.patterns)) {
      for (const pattern of data.patterns) {
        const { id, ...patternData } = pattern;
        await this.createSyntaxPattern(patternData);
      }
    }
    
    // Import types
    if (data.types && Array.isArray(data.types)) {
      for (const type of data.types) {
        const { id, ...typeData } = type;
        await this.createType(typeData);
      }
    }
    
    // Import type mappings
    if (data.typeMappings && Array.isArray(data.typeMappings)) {
      for (const mapping of data.typeMappings) {
        const { id, ...mappingData } = mapping;
        await this.createTypeMapping(mappingData);
      }
    }
  }
} 