import { FunctionDefinitionService, FunctionDefinitionFile } from '../../services/database/FunctionDefinitionService';
import { FunctionDefinition } from '../../services/types/database';

// Mock the global fetch function
global.fetch = jest.fn();

describe('FunctionDefinitionService', () => {
  let service: FunctionDefinitionService;
  let mockFunctionData: FunctionDefinitionFile;

  beforeEach(() => {
    // Reset the service singleton before each test
    jest.resetModules();
    
    // Reset mocks
    (global.fetch as jest.Mock).mockReset();
    
    // Get a fresh instance of the service
    service = FunctionDefinitionService.getInstance();
    service.clear();
    
    // Create mock function definition data
    mockFunctionData = {
      version: '1.0',
      description: 'Test function definitions',
      functions: [
        {
          id: 'test_func1',
          name: 'testFunc1',
          displayName: 'Test Function 1',
          category: 'Test',
          description: 'A test function',
          parameters: [
            {
              name: 'param1',
              type: 'String',
              description: 'Parameter 1',
              isRequired: true
            }
          ],
          returnType: 'String',
          syntaxPatterns: {
            'python': {
              pattern: '{0}',
              type: 'expression',
              imports: []
            }
          }
        },
        {
          id: 'test_func2',
          name: 'testFunc2',
          displayName: 'Test Function 2',
          category: 'Utility',
          description: 'Another test function',
          parameters: [],
          returnType: 'Number',
          syntaxPatterns: {
            'python': {
              pattern: 'utility({0})',
              type: 'expression',
              imports: ['utility']
            },
            'javascript': {
              pattern: 'utility({0})',
              type: 'expression',
              imports: ['utility']
            }
          }
        }
      ],
      metadata: {
        lastUpdated: '2024-03-03',
        supportedLanguages: ['python', 'javascript'],
        categories: ['Test', 'Utility']
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should create a singleton instance', () => {
      const instance1 = FunctionDefinitionService.getInstance();
      const instance2 = FunctionDefinitionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadFunctionDefinitions', () => {
    it('should load function definitions from a JSON file', async () => {
      // Setup the fetch mock to return our test data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });

      await service.loadFunctionDefinitions('test.json');

      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith('test.json');
      
      // Verify the functions were loaded
      const func1 = service.getFunctionById('test_func1');
      expect(func1).toBeDefined();
      expect(func1?.name).toBe('testFunc1');
      
      const func2 = service.getFunctionById('test_func2');
      expect(func2).toBeDefined();
      expect(func2?.category).toBe('Utility');
    });

    it('should not reload already loaded files', async () => {
      // Setup the fetch mock
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockFunctionData
      });

      // Load the file twice
      await service.loadFunctionDefinitions('test.json');
      await service.loadFunctionDefinitions('test.json');

      // Verify fetch was called only once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when fetch fails', async () => {
      // Setup the fetch mock to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      await expect(service.loadFunctionDefinitions('test.json')).rejects.toThrow();
    });

    it('should validate the function definitions structure', async () => {
      // Create invalid data (missing functions array)
      const invalidData = {
        version: '1.0',
        description: 'Invalid data'
      };

      // Setup the fetch mock
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData
      });

      await expect(service.loadFunctionDefinitions('invalid.json')).rejects.toThrow(/Invalid function definition file structure/);
    });

    it('should validate individual function definitions', async () => {
      // Create invalid function data (missing required properties)
      const invalidFunctionData = {
        version: '1.0',
        description: 'Invalid function',
        functions: [
          {
            id: 'invalid',
            // Missing name, category, and syntaxPatterns
            description: 'Invalid function',
            parameters: [],
            returnType: 'Void'
          }
        ],
        metadata: {
          lastUpdated: '2024-03-03',
          supportedLanguages: ['python'],
          categories: ['Test']
        }
      };

      // Setup the fetch mock
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidFunctionData
      });

      await expect(service.loadFunctionDefinitions('invalid.json')).rejects.toThrow(/Invalid function definition/);
    });
  });

  describe('getFunctionById', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should return the function definition by ID', () => {
      const func = service.getFunctionById('test_func1');
      expect(func).toBeDefined();
      expect(func?.id).toBe('test_func1');
      expect(func?.name).toBe('testFunc1');
    });

    it('should return undefined for non-existent function ID', () => {
      const func = service.getFunctionById('non_existent');
      expect(func).toBeUndefined();
    });
  });

  describe('getFunctionsByCategory', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should return functions in the specified category', () => {
      const functions = service.getFunctionsByCategory('Test');
      expect(functions).toHaveLength(1);
      expect(functions[0].id).toBe('test_func1');
    });

    it('should return an empty array for non-existent category', () => {
      const functions = service.getFunctionsByCategory('NonExistent');
      expect(functions).toHaveLength(0);
    });
  });

  describe('getCategories', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should return all unique categories', () => {
      const categories = service.getCategories();
      expect(categories).toContain('Test');
      expect(categories).toContain('Utility');
      expect(categories).toHaveLength(2);
    });
  });

  describe('getSyntaxPattern', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should return the syntax pattern for a function in a specific language', () => {
      const pattern = service.getSyntaxPattern('test_func2', 'javascript');
      expect(pattern).toBeDefined();
      expect(pattern?.pattern).toBe('utility({0})');
      expect(pattern?.imports).toContain('utility');
    });

    it('should return undefined for non-existent function', () => {
      const pattern = service.getSyntaxPattern('non_existent', 'python');
      expect(pattern).toBeUndefined();
    });

    it('should return undefined for non-supported language', () => {
      const pattern = service.getSyntaxPattern('test_func1', 'java');
      expect(pattern).toBeUndefined();
    });
  });

  describe('getFunctionsByLanguage', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should return functions that support the specified language', () => {
      const functions = service.getFunctionsByLanguage('javascript');
      expect(functions).toHaveLength(1);
      expect(functions[0].id).toBe('test_func2');
    });

    it('should return an empty array for non-supported language', () => {
      const functions = service.getFunctionsByLanguage('java');
      expect(functions).toHaveLength(0);
    });
  });

  describe('getAllFunctions', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should return all loaded functions', () => {
      const functions = service.getAllFunctions();
      expect(functions).toHaveLength(2);
      const ids = functions.map(f => f.id);
      expect(ids).toContain('test_func1');
      expect(ids).toContain('test_func2');
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      // Setup the fetch mock and load functions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      await service.loadFunctionDefinitions('test.json');
    });

    it('should clear all loaded functions and files', () => {
      // Verify functions are loaded
      expect(service.getAllFunctions()).toHaveLength(2);
      
      // Clear the service
      service.clear();
      
      // Verify functions are cleared
      expect(service.getAllFunctions()).toHaveLength(0);
      
      // Setup the fetch mock again
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunctionData
      });
      
      // Reload the file
      return service.loadFunctionDefinitions('test.json').then(() => {
        // Verify fetch was called again (loadedFiles was cleared)
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
}); 