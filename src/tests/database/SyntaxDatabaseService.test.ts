import { 
  FunctionDefinition, 
  Language, 
  PatternType, 
  SyntaxPattern, 
  TypeDefinition, 
  TypeMapping 
} from '../../models/syntax';
import { MockSyntaxDatabaseService } from './MockSyntaxDatabaseService';

describe('SyntaxDatabaseService', () => {
  let service: MockSyntaxDatabaseService;

  // Test data
  let pythonLanguage: Omit<Language, 'id'>;
  let javascriptLanguage: Omit<Language, 'id'>;
  let pythonId: number;
  let javascriptId: number;

  let mathAddFunction: Omit<FunctionDefinition, 'id'>;
  let stringConcatFunction: Omit<FunctionDefinition, 'id'>;
  let mathAddId: number;
  let stringConcatId: number;

  let numberType: Omit<TypeDefinition, 'id'>;
  let stringType: Omit<TypeDefinition, 'id'>;
  let numberTypeId: number;
  let stringTypeId: number;

  beforeEach(async () => {
    // Create a fresh service for each test
    service = new MockSyntaxDatabaseService();
    await service.clearDatabase();

    // Set up languages
    pythonLanguage = {
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
          add: '{0} + {1}'
        }
      }
    };

    javascriptLanguage = {
      name: 'JavaScript',
      version: 'ES6',
      fileExtension: '.js',
      isEnabled: true,
      syntaxRules: {
        statementDelimiter: ';',
        blockStart: '{',
        blockEnd: '}',
        commentSingle: '//',
        commentMultiStart: '/*',
        commentMultiEnd: '*/',
        stringDelimiters: ["'", '"', '`'],
        indentationStyle: 'space',
        indentationSize: 2,
        functionDefinitionPattern: 'function {name}({params}) {',
        variableDeclarationPattern: 'let {name} = {value}',
        operatorPatterns: {
          add: '{0} + {1}'
        }
      }
    };

    // Set up functions
    mathAddFunction = {
      name: 'math_add',
      displayName: 'Add',
      description: 'Add two numbers',
      category: 'Math',
      parameters: [
        {
          name: 'a',
          type: 'Number',
          description: 'First number',
          isRequired: true
        },
        {
          name: 'b',
          type: 'Number',
          description: 'Second number',
          isRequired: true
        }
      ],
      returnType: 'Number',
      isBuiltIn: true,
      tags: ['math', 'addition']
    };

    stringConcatFunction = {
      name: 'string_concat',
      displayName: 'Concatenate',
      description: 'Concatenate two strings',
      category: 'String',
      parameters: [
        {
          name: 'a',
          type: 'String',
          description: 'First string',
          isRequired: true
        },
        {
          name: 'b',
          type: 'String',
          description: 'Second string',
          isRequired: true
        }
      ],
      returnType: 'String',
      isBuiltIn: true,
      tags: ['string', 'concatenation']
    };

    // Set up types
    numberType = {
      name: 'Number',
      description: 'Numeric value',
      color: '#4CAF50',
      properties: []
    };

    stringType = {
      name: 'String',
      description: 'Text value',
      color: '#2196F3',
      properties: []
    };

    // Insert the test data
    pythonId = await service.createLanguage(pythonLanguage);
    javascriptId = await service.createLanguage(javascriptLanguage);

    mathAddId = await service.createFunction(mathAddFunction);
    stringConcatId = await service.createFunction(stringConcatFunction);

    numberTypeId = await service.createType(numberType);
    stringTypeId = await service.createType(stringType);
  });

  // Language tests
  describe('Language operations', () => {
    it('should create and retrieve languages', async () => {
      const languages = await service.getLanguages();
      expect(languages).toHaveLength(2);
      
      const python = await service.getLanguageById(pythonId);
      expect(python).not.toBeNull();
      expect(python?.name).toBe('Python');
      
      const javascript = await service.getLanguageById(javascriptId);
      expect(javascript).not.toBeNull();
      expect(javascript?.name).toBe('JavaScript');
    });

    it('should update a language', async () => {
      const python = await service.getLanguageById(pythonId);
      if (!python) {
        fail('Python language not found');
        return;
      }
      
      const updatedPython: Language = {
        ...python,
        version: '3.9',
        syntaxRules: {
          ...python.syntaxRules,
          indentationSize: 2
        }
      };
      
      await service.updateLanguage(updatedPython);
      
      const retrieved = await service.getLanguageById(pythonId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.version).toBe('3.9');
      expect(retrieved?.syntaxRules.indentationSize).toBe(2);
    });

    it('should delete a language', async () => {
      await service.deleteLanguage(pythonId);
      
      const languages = await service.getLanguages();
      expect(languages).toHaveLength(1);
      
      const python = await service.getLanguageById(pythonId);
      expect(python).toBeNull();
    });

    it('should throw an error when updating a non-existent language', async () => {
      const nonExistentLanguage: Language = {
        id: 999,
        name: 'NonExistent',
        version: '1.0',
        fileExtension: '.ne',
        isEnabled: false,
        syntaxRules: {
          statementDelimiter: '',
          blockStart: '',
          blockEnd: '',
          commentSingle: '',
          commentMultiStart: '',
          commentMultiEnd: '',
          stringDelimiters: [],
          indentationStyle: 'space',
          indentationSize: 2,
          functionDefinitionPattern: '',
          variableDeclarationPattern: '',
          operatorPatterns: {}
        }
      };
      
      await expect(service.updateLanguage(nonExistentLanguage)).rejects.toThrow();
    });
  });

  // Function tests
  describe('Function operations', () => {
    it('should create and retrieve functions', async () => {
      const functions = await service.searchFunctions('');
      expect(functions).toHaveLength(2);
      
      const mathAdd = await service.getFunctionById(mathAddId);
      expect(mathAdd).not.toBeNull();
      expect(mathAdd?.name).toBe('math_add');
      
      const stringConcat = await service.getFunctionById(stringConcatId);
      expect(stringConcat).not.toBeNull();
      expect(stringConcat?.name).toBe('string_concat');
    });

    it('should get functions by category', async () => {
      const mathFunctions = await service.getFunctionsByCategory('Math');
      expect(mathFunctions).toHaveLength(1);
      expect(mathFunctions[0].name).toBe('math_add');
      
      const stringFunctions = await service.getFunctionsByCategory('String');
      expect(stringFunctions).toHaveLength(1);
      expect(stringFunctions[0].name).toBe('string_concat');
      
      const nonExistentCategory = await service.getFunctionsByCategory('NonExistent');
      expect(nonExistentCategory).toHaveLength(0);
    });

    it('should search functions by query', async () => {
      const addFunctions = await service.searchFunctions('add');
      expect(addFunctions).toHaveLength(1);
      expect(addFunctions[0].name).toBe('math_add');
      
      const stringFunctions = await service.searchFunctions('string');
      expect(stringFunctions).toHaveLength(1);
      expect(stringFunctions[0].name).toBe('string_concat');
      
      const allFunctions = await service.searchFunctions('');
      expect(allFunctions).toHaveLength(2);
      
      const nonExistentQuery = await service.searchFunctions('nonexistent');
      expect(nonExistentQuery).toHaveLength(0);
    });

    it('should update a function', async () => {
      const mathAdd = await service.getFunctionById(mathAddId);
      if (!mathAdd) {
        fail('Math add function not found');
        return;
      }
      
      const updatedMathAdd: FunctionDefinition = {
        ...mathAdd,
        displayName: 'Addition',
        description: 'Add two numbers together'
      };
      
      await service.updateFunction(updatedMathAdd);
      
      const retrieved = await service.getFunctionById(mathAddId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.displayName).toBe('Addition');
      expect(retrieved?.description).toBe('Add two numbers together');
    });

    it('should delete a function', async () => {
      await service.deleteFunction(mathAddId);
      
      const functions = await service.searchFunctions('');
      expect(functions).toHaveLength(1);
      
      const mathAdd = await service.getFunctionById(mathAddId);
      expect(mathAdd).toBeNull();
    });
  });

  // Syntax pattern tests
  describe('Syntax pattern operations', () => {
    let pythonAddPattern: Omit<SyntaxPattern, 'id'>;
    let jsAddPattern: Omit<SyntaxPattern, 'id'>;
    let pythonAddPatternId: number;
    let jsAddPatternId: number;

    beforeEach(async () => {
      pythonAddPattern = {
        functionId: mathAddId,
        languageId: pythonId,
        pattern: '{0} + {1}',
        patternType: PatternType.EXPRESSION,
        additionalImports: []
      };

      jsAddPattern = {
        functionId: mathAddId,
        languageId: javascriptId,
        pattern: '{0} + {1}',
        patternType: PatternType.EXPRESSION,
        additionalImports: []
      };

      pythonAddPatternId = await service.createSyntaxPattern(pythonAddPattern);
      jsAddPatternId = await service.createSyntaxPattern(jsAddPattern);
    });

    it('should create and retrieve syntax patterns', async () => {
      const pythonPatterns = await service.getSyntaxPatternsByLanguage(pythonId);
      expect(pythonPatterns).toHaveLength(1);
      
      const jsPatterns = await service.getSyntaxPatternsByLanguage(javascriptId);
      expect(jsPatterns).toHaveLength(1);
      
      const mathAddPythonPattern = await service.getSyntaxPattern(mathAddId, pythonId);
      expect(mathAddPythonPattern).not.toBeNull();
      expect(mathAddPythonPattern?.pattern).toBe('{0} + {1}');
      
      const mathAddJsPattern = await service.getSyntaxPattern(mathAddId, javascriptId);
      expect(mathAddJsPattern).not.toBeNull();
      expect(mathAddJsPattern?.pattern).toBe('{0} + {1}');
    });

    it('should update a syntax pattern', async () => {
      const pythonPattern = await service.getSyntaxPattern(mathAddId, pythonId);
      if (!pythonPattern) {
        fail('Python pattern not found');
        return;
      }
      
      const updatedPattern: SyntaxPattern = {
        ...pythonPattern,
        pattern: '({0}) + ({1})',
        notes: 'Using parentheses for clarity'
      };
      
      await service.updateSyntaxPattern(updatedPattern);
      
      const retrieved = await service.getSyntaxPattern(mathAddId, pythonId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.pattern).toBe('({0}) + ({1})');
      expect(retrieved?.notes).toBe('Using parentheses for clarity');
    });

    it('should delete a syntax pattern', async () => {
      await service.deleteSyntaxPattern(pythonAddPatternId);
      
      const pythonPatterns = await service.getSyntaxPatternsByLanguage(pythonId);
      expect(pythonPatterns).toHaveLength(0);
      
      const mathAddPythonPattern = await service.getSyntaxPattern(mathAddId, pythonId);
      expect(mathAddPythonPattern).toBeNull();
    });
  });

  // Type tests
  describe('Type operations', () => {
    it('should create and retrieve types', async () => {
      const types = await service.getTypes();
      expect(types).toHaveLength(2);
      
      const number = await service.getTypeById(numberTypeId);
      expect(number).not.toBeNull();
      expect(number?.name).toBe('Number');
      
      const string = await service.getTypeById(stringTypeId);
      expect(string).not.toBeNull();
      expect(string?.name).toBe('String');
    });

    it('should update a type', async () => {
      const number = await service.getTypeById(numberTypeId);
      if (!number) {
        fail('Number type not found');
        return;
      }
      
      const updatedNumber: TypeDefinition = {
        ...number,
        color: '#FF5722',
        description: 'Updated numeric value'
      };
      
      await service.updateType(updatedNumber);
      
      const retrieved = await service.getTypeById(numberTypeId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.color).toBe('#FF5722');
      expect(retrieved?.description).toBe('Updated numeric value');
    });

    it('should delete a type', async () => {
      await service.deleteType(numberTypeId);
      
      const types = await service.getTypes();
      expect(types).toHaveLength(1);
      
      const number = await service.getTypeById(numberTypeId);
      expect(number).toBeNull();
    });
  });

  // Type mapping tests
  describe('Type mapping operations', () => {
    let pythonNumberMapping: Omit<TypeMapping, 'id'>;
    let jsNumberMapping: Omit<TypeMapping, 'id'>;
    let pythonNumberMappingId: number;
    let jsNumberMappingId: number;

    beforeEach(async () => {
      pythonNumberMapping = {
        abstractTypeId: numberTypeId,
        languageId: pythonId,
        concreteType: 'int',
        imports: []
      };

      jsNumberMapping = {
        abstractTypeId: numberTypeId,
        languageId: javascriptId,
        concreteType: 'number',
        imports: []
      };

      pythonNumberMappingId = await service.createTypeMapping(pythonNumberMapping);
      jsNumberMappingId = await service.createTypeMapping(jsNumberMapping);
    });

    it('should create and retrieve type mappings', async () => {
      const pythonMappings = await service.getTypeMappingsByLanguage(pythonId);
      expect(pythonMappings).toHaveLength(1);
      
      const jsMappings = await service.getTypeMappingsByLanguage(javascriptId);
      expect(jsMappings).toHaveLength(1);
      
      const numberPythonMapping = await service.getTypeMapping(numberTypeId, pythonId);
      expect(numberPythonMapping).not.toBeNull();
      expect(numberPythonMapping?.concreteType).toBe('int');
      
      const numberJsMapping = await service.getTypeMapping(numberTypeId, javascriptId);
      expect(numberJsMapping).not.toBeNull();
      expect(numberJsMapping?.concreteType).toBe('number');
    });

    it('should update a type mapping', async () => {
      const pythonMapping = await service.getTypeMapping(numberTypeId, pythonId);
      if (!pythonMapping) {
        fail('Python number mapping not found');
        return;
      }
      
      const updatedMapping: TypeMapping = {
        ...pythonMapping,
        concreteType: 'float',
        conversionToAbstract: 'float({0})'
      };
      
      await service.updateTypeMapping(updatedMapping);
      
      const retrieved = await service.getTypeMapping(numberTypeId, pythonId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.concreteType).toBe('float');
      expect(retrieved?.conversionToAbstract).toBe('float({0})');
    });

    it('should delete a type mapping', async () => {
      await service.deleteTypeMapping(pythonNumberMappingId);
      
      const pythonMappings = await service.getTypeMappingsByLanguage(pythonId);
      expect(pythonMappings).toHaveLength(0);
      
      const numberPythonMapping = await service.getTypeMapping(numberTypeId, pythonId);
      expect(numberPythonMapping).toBeNull();
    });
  });

  // Database management tests
  describe('Database management operations', () => {
    it('should clear the database', async () => {
      await service.clearDatabase();
      
      const languages = await service.getLanguages();
      expect(languages).toHaveLength(0);
      
      const functions = await service.searchFunctions('');
      expect(functions).toHaveLength(0);
      
      const types = await service.getTypes();
      expect(types).toHaveLength(0);
    });

    it('should export and import the database', async () => {
      // Export the current state
      const exportData = await service.exportDatabase();
      
      // Clear the database
      await service.clearDatabase();
      
      // Verify the database is empty
      const languagesAfterClear = await service.getLanguages();
      expect(languagesAfterClear).toHaveLength(0);
      
      // Import the data back
      await service.importDatabase(exportData);
      
      // Verify the data was imported
      const languages = await service.getLanguages();
      expect(languages).toHaveLength(2);
      
      const functions = await service.searchFunctions('');
      expect(functions).toHaveLength(2);
      
      const types = await service.getTypes();
      expect(types).toHaveLength(2);
      
      // Verify specific entities were correctly imported
      const python = await service.getLanguageById(pythonId);
      expect(python).not.toBeNull();
      expect(python?.name).toBe('Python');
      
      const mathAdd = await service.getFunctionById(mathAddId);
      expect(mathAdd).not.toBeNull();
      expect(mathAdd?.name).toBe('math_add');
    });
  });
}); 