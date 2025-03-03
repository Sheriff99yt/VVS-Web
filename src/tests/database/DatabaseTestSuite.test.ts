import { openDatabase } from '../../services/database/DatabaseSchema';
import { LanguageRepository } from '../../services/database/repositories/LanguageRepository';
import { FunctionRepository } from '../../services/database/repositories/FunctionRepository';
import { PatternRepository } from '../../services/database/repositories/PatternRepository';
import { TypeRepository } from '../../services/database/repositories/TypeRepository';
import { TypeMappingRepository } from '../../services/database/repositories/TypeMappingRepository';
import { SyntaxDatabaseServiceImpl } from '../../services/database/SyntaxDatabaseServiceImpl';
import { PatternType, SyntaxPattern } from '../../models/syntax';
import { clearDatabase, createTestLanguage, resetMockIndexedDB, waitForDbOperations } from './DatabaseTestHelpers';

// Test suite for database operations
describe('Database Operations Tests', () => {
  // Repositories
  let languageRepo: LanguageRepository;
  let functionRepo: FunctionRepository;
  let patternRepo: PatternRepository;
  let typeRepo: TypeRepository;
  let typeMappingRepo: TypeMappingRepository;
  let dbService: SyntaxDatabaseServiceImpl;
  
  // Setup before tests
  beforeAll(async () => {
    // Reset the mock IndexedDB first
    resetMockIndexedDB();
    
    // Initialize repositories
    languageRepo = new LanguageRepository();
    functionRepo = new FunctionRepository();
    patternRepo = new PatternRepository();
    typeRepo = new TypeRepository();
    typeMappingRepo = new TypeMappingRepository();
    
    // Create the database service
    dbService = new SyntaxDatabaseServiceImpl();
    
    // Clear the database
    await clearDatabase();
  });
  
  // Reset DB before each test
  beforeEach(async () => {
    // Reset the mock IndexedDB to ensure a clean environment for each test
    resetMockIndexedDB();
    
    // Clear all data
    await clearDatabase();
  });
  
  // Clear database after tests
  afterAll(async () => {
    await clearDatabase();
  });

  // Tests for LanguageRepository
  describe('LanguageRepository', () => {
    // Test language creation
    test('can create a language', async () => {
      const testLang = createTestLanguage();
      
      const id = await languageRepo.create(testLang);
      expect(id).toBeGreaterThan(0);
    });
    
    // Test language retrieval
    test('can retrieve a language by ID', async () => {
      const testLang = createTestLanguage();
      const id = await languageRepo.create(testLang);
      
      // Wait for operation to complete
      await waitForDbOperations();
      
      const language = await languageRepo.getById(id);
      
      expect(language).not.toBeNull();
      expect(language?.name).toBe('TestLang');
    });
    
    // Test multiple languages
    test('can create and retrieve multiple languages', async () => {
      const lang1 = createTestLanguage('TestLang1');
      const lang2 = createTestLanguage('TestLang2');
      
      await languageRepo.create(lang1);
      await languageRepo.create(lang2);
      
      // Wait for operations to complete
      await waitForDbOperations();
      
      const languages = await languageRepo.getAll();
      
      expect(languages.length).toBeGreaterThanOrEqual(2);
      expect(languages.some(l => l.name === 'TestLang1')).toBeTruthy();
      expect(languages.some(l => l.name === 'TestLang2')).toBeTruthy();
    });
  });
  
  // Tests for Function & Pattern repositories
  describe('Function and Pattern Integration', () => {
    test('can create functions with patterns', async () => {
      // Create a test language
      const testLang = createTestLanguage();
      const langId = await languageRepo.create(testLang);
      
      // Create a test function
      const testFunc = {
        name: 'test_function',
        displayName: 'Test Function',
        category: 'Test',
        description: 'A test function',
        parameters: [
          {
            name: 'param1',
            type: 'string',
            description: 'Test parameter',
            isRequired: true
          }
        ],
        returnType: 'number',
        isBuiltIn: true,
        tags: ['test']
      };
      
      const funcId = await functionRepo.create(testFunc);
      
      // Create a pattern for the function
      const testPattern = {
        functionId: funcId,
        languageId: langId,
        pattern: 'test_function({0})',
        patternType: PatternType.EXPRESSION
      };
      
      const patternId = await patternRepo.create(testPattern);
      
      // Wait for operations to complete
      await waitForDbOperations();
      
      // Get the pattern using the pattern repository
      const pattern = await patternRepo.getByFunctionAndLanguage(funcId, langId);
      
      // Expect pattern to exist and have the correct properties
      expect(pattern).not.toBeNull();
      expect(pattern?.pattern).toContain('test_function');
    });
  });
  
  // Tests for Type and TypeMapping repositories
  describe('Type and TypeMapping Integration', () => {
    test('can create types with mappings', async () => {
      // Create a test language
      const testLang = createTestLanguage();
      const langId = await languageRepo.create(testLang);
      
      // Create a test type
      const testType = {
        name: 'TestType',
        description: 'A test type',
        color: '#FF5733'
      };
      
      const typeId = await typeRepo.create(testType);
      
      // Create a type mapping
      const testMapping = {
        abstractTypeId: typeId,
        languageId: langId,
        concreteType: 'test_type'
      };
      
      await typeMappingRepo.create(testMapping);
      
      // Wait for operations to complete
      await waitForDbOperations();
      
      // Verify the mapping using the repository directly
      const mapping = await typeMappingRepo.getByTypeAndLanguage(typeId, langId);
      
      expect(mapping).not.toBeNull();
      expect(mapping?.concreteType).toBe('test_type');
    });
  });
}); 