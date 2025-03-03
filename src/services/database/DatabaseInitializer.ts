import { openDatabase } from './DatabaseSchema';
import { LanguageRepository } from './repositories/LanguageRepository';
import { FunctionRepository } from './repositories/FunctionRepository';
import { PatternRepository } from './repositories/PatternRepository';
import { TypeRepository } from './repositories/TypeRepository';
import { TypeMappingRepository } from './repositories/TypeMappingRepository';
import { SyntaxDatabaseService } from './SyntaxDatabaseService';
import { FunctionDefinitionService } from './FunctionDefinitionService';
import { Language, SyntaxRules, FunctionDefinition } from '../../models/syntax';

/**
 * Service for initializing and seeding the syntax database
 */
export class DatabaseInitializer {
  private languageRepository: LanguageRepository;
  private functionRepository: FunctionRepository;
  private patternRepository: PatternRepository;
  private typeRepository: TypeRepository;
  private typeMappingRepository: TypeMappingRepository;
  private functionDefinitionService: FunctionDefinitionService;
  private syntaxDbService?: SyntaxDatabaseService;
  
  constructor() {
    this.languageRepository = new LanguageRepository();
    this.functionRepository = new FunctionRepository();
    this.patternRepository = new PatternRepository();
    this.typeRepository = new TypeRepository();
    this.typeMappingRepository = new TypeMappingRepository();
    this.functionDefinitionService = FunctionDefinitionService.getInstance();
  }
  
  /**
   * Set the syntax database service reference
   * @param service The syntax database service
   */
  setSyntaxDatabaseService(service: SyntaxDatabaseService): void {
    this.syntaxDbService = service;
  }
  
  /**
   * Initialize the database and seed it with initial data
   */
  async initialize(): Promise<void> {
    try {
      // Open the database to ensure it's created with the correct schema
      const db = await openDatabase();
      db.close();
      
      // Check if we need to seed the database with initial data
      await this.seedIfNeeded();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
  
  /**
   * Check if the database needs seeding and seed if empty
   */
  private async seedIfNeeded(): Promise<void> {
    try {
      // Check if languages table is empty
      const languages = await this.languageRepository.getAll();
      
      if (languages.length === 0) {
        console.log('Database is empty, seeding with initial data...');
        await this.seedPythonLanguage();
      } else {
        console.log('Database already has data, skipping seeding');
      }
    } catch (error) {
      console.error('Error checking if database needs seeding:', error);
      throw error;
    }
  }
  
  /**
   * Seed the database with Python language data
   */
  private async seedPythonLanguage(): Promise<void> {
    if (!this.syntaxDbService) {
      throw new Error('Syntax database service not set');
    }
    
    try {
      console.log('Seeding database with Python language data...');
      
      // Load Python function definitions from JSON
      const pythonFunctions = await this.functionDefinitionService.loadFunctionDefinitions('python');
      
      // Create Python language
      const pythonLanguage: Omit<Language, 'id'> = {
        name: 'Python',
        version: '3.8',
        fileExtension: '.py',
        isEnabled: true,
        syntaxRules: {
          statementDelimiter: '\n',
          blockStart: ':',
          blockEnd: '',
          commentSingle: '#',
          commentMultiStart: '"""',
          commentMultiEnd: '"""',
          stringDelimiters: ["'", '"', '"""'],
          indentationStyle: 'space',
          indentationSize: 4,
          functionDefinitionPattern: 'def {name}({params}):',
          variableDeclarationPattern: '{name} = {value}',
          operatorPatterns: {
            add: '{0} + {1}',
            subtract: '{0} - {1}',
            multiply: '{0} * {1}',
            divide: '{0} / {1}',
            modulo: '{0} % {1}',
            power: '{0} ** {1}',
            floorDivide: '{0} // {1}'
          }
        }
      };
      
      const pythonId = await this.syntaxDbService.createLanguage(pythonLanguage);
      console.log(`Python language created with ID: ${pythonId}`);
      
      // Import function definitions
      if (Array.isArray(pythonFunctions)) {
        for (const func of pythonFunctions) {
          await this.syntaxDbService.createFunction(func);
        }
      }
      
      console.log('Python language data seeded successfully');
    } catch (error) {
      console.error('Error seeding Python language:', error);
      throw error;
    }
  }
  
  /**
   * Clear all data from the database
   */
  async clearDatabase(): Promise<void> {
    try {
      console.log('Clearing database...');
      
      // Open the database
      const db = await openDatabase();
      
      // Get all object store names
      const storeNames = Array.from(db.objectStoreNames);
      
      // Close the database before reopening for transaction
      db.close();
      
      // Open a new connection with readwrite access
      const dbRW = await openDatabase();
      
      // Create a transaction for all stores
      const transaction = dbRW.transaction(storeNames, 'readwrite');
      
      // Clear each store
      for (const storeName of storeNames) {
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      // Wait for transaction to complete
      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          dbRW.close();
          resolve();
        };
      });
      
      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
  
  /**
   * Reset the database by clearing all data and re-seeding
   */
  async resetDatabase(): Promise<void> {
    try {
      // Clear the database
      await this.clearDatabase();
      
      // Re-seed the database
      await this.seedPythonLanguage();
      
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
} 