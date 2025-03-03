import { LanguageRepository } from '../../services/database/repositories/LanguageRepository';
import { FunctionRepository } from '../../services/database/repositories/FunctionRepository';
import { PatternRepository } from '../../services/database/repositories/PatternRepository';
import { TypeRepository } from '../../services/database/repositories/TypeRepository';
import { TypeMappingRepository } from '../../services/database/repositories/TypeMappingRepository';
import { PatternType } from '../../models/syntax';
import { clearDatabase, createTestLanguage, resetMockIndexedDB, waitForDbOperations } from './DatabaseTestHelpers';
import { warmupSystem } from '../performance-setup';

// Utility to measure execution time
const measureExecutionTime = async (operation: () => Promise<any>): Promise<number> => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  return endTime - startTime;
};

// Performance test suite
describe('Database Performance Tests', () => {
  // Repositories
  let languageRepo: LanguageRepository;
  let functionRepo: FunctionRepository;
  let patternRepo: PatternRepository;
  let typeRepo: TypeRepository;
  let typeMappingRepo: TypeMappingRepository;
  
  // Performance metrics
  const metrics: Record<string, number[]> = {
    create: [],
    read: [],
    update: [],
    delete: [],
    batch: [],
    query: []
  };
  
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
    
    // Clear the database
    await clearDatabase();
    
    // Warm up the system
    await warmupSystem();
    console.log('System warmed up, beginning performance tests...');
  });
  
  // Reset DB before each test
  beforeEach(async () => {
    resetMockIndexedDB();
    await clearDatabase();
  });
  
  // Clear database after all tests
  afterAll(async () => {
    await clearDatabase();
    
    // Print performance summary
    console.log('\n--- DATABASE PERFORMANCE METRICS (ms) ---');
    Object.entries(metrics).forEach(([operation, times]) => {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      console.log(`${operation.toUpperCase()}: Avg: ${avg.toFixed(2)}, Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}`);
    });
    console.log('---------------------------------------\n');
  });

  // Test create operations performance
  describe('Create Operations', () => {
    test('measures language creation performance', async () => {
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const testLang = createTestLanguage(`TestLang${i}`);
        const time = await measureExecutionTime(async () => {
          await languageRepo.create(testLang);
        });
        metrics.create.push(time);
      }
      
      expect(metrics.create.length).toBe(iterations);
      // Performance threshold: avg should be under 50ms per operation
      const avg = metrics.create.reduce((sum, time) => sum + time, 0) / metrics.create.length;
      expect(avg).toBeLessThan(50);
    });
  });
  
  // Test read operations performance
  describe('Read Operations', () => {
    test('measures language retrieval performance', async () => {
      // Setup: Create languages first
      const iterations = 10;
      const ids: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const testLang = createTestLanguage(`TestLang${i}`);
        const id = await languageRepo.create(testLang);
        ids.push(id);
      }
      
      await waitForDbOperations();
      
      // Measure retrieval performance
      for (const id of ids) {
        const time = await measureExecutionTime(async () => {
          await languageRepo.getById(id);
        });
        metrics.read.push(time);
      }
      
      expect(metrics.read.length).toBe(iterations);
      // Performance threshold: avg should be under 20ms per operation
      const avg = metrics.read.reduce((sum, time) => sum + time, 0) / metrics.read.length;
      expect(avg).toBeLessThan(20);
    });
  });
  
  // Test batch operations performance
  describe('Batch Operations', () => {
    test('measures performance of complex relationships', async () => {
      const batchSize = 5;
      
      for (let batch = 0; batch < batchSize; batch++) {
        const time = await measureExecutionTime(async () => {
          // Create a language
          const testLang = createTestLanguage(`BatchLang${batch}`);
          const langId = await languageRepo.create(testLang);
          
          // Create a type
          const testType = {
            name: `BatchType${batch}`,
            description: 'Performance test type',
            color: '#FF5733'
          };
          const typeId = await typeRepo.create(testType);
          
          // Create a function
          const testFunc = {
            name: `batch_function_${batch}`,
            displayName: `Batch Function ${batch}`,
            category: 'Test',
            description: 'Performance test function',
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
            tags: ['test', 'performance']
          };
          const funcId = await functionRepo.create(testFunc);
          
          // Create a pattern
          const testPattern = {
            functionId: funcId,
            languageId: langId,
            pattern: `batch_function_${batch}({0})`,
            patternType: PatternType.EXPRESSION
          };
          await patternRepo.create(testPattern);
          
          // Create a type mapping
          const testMapping = {
            abstractTypeId: typeId,
            languageId: langId,
            concreteType: `batch_type_${batch}`
          };
          await typeMappingRepo.create(testMapping);
        });
        
        metrics.batch.push(time);
      }
      
      expect(metrics.batch.length).toBe(batchSize);
      // Performance threshold will vary based on complexity
      const avg = metrics.batch.reduce((sum, time) => sum + time, 0) / metrics.batch.length;
      expect(avg).toBeLessThan(200); // 200ms for the whole batch operation
    });
  });
  
  // Test query operations performance
  describe('Query Operations', () => {
    test('measures query performance for patterns by function and language', async () => {
      // Setup: Create prerequisite data
      const testLang = createTestLanguage('QueryLang');
      const langId = await languageRepo.create(testLang);
      
      const iterations = 10;
      const funcIds: number[] = [];
      
      // Create functions and patterns
      for (let i = 0; i < iterations; i++) {
        const testFunc = {
          name: `query_function_${i}`,
          displayName: `Query Function ${i}`,
          category: 'Test',
          description: 'Query test function',
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
          tags: ['test', 'query']
        };
        
        const funcId = await functionRepo.create(testFunc);
        funcIds.push(funcId);
        
        const testPattern = {
          functionId: funcId,
          languageId: langId,
          pattern: `query_function_${i}({0})`,
          patternType: PatternType.EXPRESSION
        };
        
        await patternRepo.create(testPattern);
      }
      
      await waitForDbOperations();
      
      // Measure query performance
      for (const funcId of funcIds) {
        const time = await measureExecutionTime(async () => {
          await patternRepo.getByFunctionAndLanguage(funcId, langId);
        });
        metrics.query.push(time);
      }
      
      expect(metrics.query.length).toBe(iterations);
      // Performance threshold for queries
      const avg = metrics.query.reduce((sum, time) => sum + time, 0) / metrics.query.length;
      expect(avg).toBeLessThan(30); // 30ms per query
    });
  });
}); 