import { 
  FunctionDefinition, 
  Language, 
  SyntaxPattern, 
  TypeDefinition, 
  TypeMapping 
} from '../../models/syntax';

/**
 * The main service interface for interacting with the syntax database.
 * This service coordinates access to all syntax-related data including
 * languages, functions, patterns, and types.
 */
export interface SyntaxDatabaseService {
  // Language methods
  
  /**
   * Get a language by its ID
   * @param id The language ID
   * @returns The language or null if not found
   */
  getLanguageById(id: number): Promise<Language | null>;
  
  /**
   * Get all available languages
   * @returns Array of languages
   */
  getLanguages(): Promise<Language[]>;
  
  /**
   * Create a new language
   * @param language The language to create (without ID)
   * @returns The ID of the created language
   */
  createLanguage(language: Omit<Language, 'id'>): Promise<number>;
  
  /**
   * Update an existing language
   * @param language The language to update (with ID)
   */
  updateLanguage(language: Language): Promise<void>;
  
  /**
   * Delete a language
   * @param id The ID of the language to delete
   */
  deleteLanguage(id: number): Promise<void>;
  
  // Function methods
  
  /**
   * Get a function definition by its ID
   * @param id The function ID
   * @returns The function or null if not found
   */
  getFunctionById(id: number): Promise<FunctionDefinition | null>;
  
  /**
   * Get functions by category
   * @param category The category name
   * @returns Array of functions in the specified category
   */
  getFunctionsByCategory(category: string): Promise<FunctionDefinition[]>;
  
  /**
   * Search for functions by name, description, or tags
   * @param query The search query
   * @returns Array of matching functions
   */
  searchFunctions(query: string): Promise<FunctionDefinition[]>;
  
  /**
   * Create a new function definition
   * @param functionDef The function to create (without ID)
   * @returns The ID of the created function
   */
  createFunction(functionDef: Omit<FunctionDefinition, 'id'>): Promise<number>;
  
  /**
   * Update an existing function definition
   * @param functionDef The function to update (with ID)
   */
  updateFunction(functionDef: FunctionDefinition): Promise<void>;
  
  /**
   * Delete a function definition
   * @param id The ID of the function to delete
   */
  deleteFunction(id: number): Promise<void>;
  
  // Syntax pattern methods
  
  /**
   * Get a syntax pattern for a specific function and language
   * @param functionId The function ID
   * @param languageId The language ID
   * @returns The syntax pattern or null if not found
   */
  getSyntaxPattern(functionId: number, languageId: number): Promise<SyntaxPattern | null>;
  
  /**
   * Get all syntax patterns for a language
   * @param languageId The language ID
   * @returns Array of syntax patterns
   */
  getSyntaxPatternsByLanguage(languageId: number): Promise<SyntaxPattern[]>;
  
  /**
   * Create a new syntax pattern
   * @param pattern The pattern to create (without ID)
   * @returns The ID of the created pattern
   */
  createSyntaxPattern(pattern: Omit<SyntaxPattern, 'id'>): Promise<number>;
  
  /**
   * Update an existing syntax pattern
   * @param pattern The pattern to update (with ID)
   */
  updateSyntaxPattern(pattern: SyntaxPattern): Promise<void>;
  
  /**
   * Delete a syntax pattern
   * @param id The ID of the pattern to delete
   */
  deleteSyntaxPattern(id: number): Promise<void>;
  
  // Type methods
  
  /**
   * Get a type definition by its ID
   * @param id The type ID
   * @returns The type definition or null if not found
   */
  getTypeById(id: number): Promise<TypeDefinition | null>;
  
  /**
   * Get all available type definitions
   * @returns Array of type definitions
   */
  getTypes(): Promise<TypeDefinition[]>;
  
  /**
   * Create a new type definition
   * @param typeDef The type to create (without ID)
   * @returns The ID of the created type
   */
  createType(typeDef: Omit<TypeDefinition, 'id'>): Promise<number>;
  
  /**
   * Update an existing type definition
   * @param typeDef The type to update (with ID)
   */
  updateType(typeDef: TypeDefinition): Promise<void>;
  
  /**
   * Delete a type definition
   * @param id The ID of the type to delete
   */
  deleteType(id: number): Promise<void>;
  
  // Type mapping methods
  
  /**
   * Get a type mapping for a specific abstract type and language
   * @param abstractTypeId The abstract type ID
   * @param languageId The language ID
   * @returns The type mapping or null if not found
   */
  getTypeMapping(abstractTypeId: number, languageId: number): Promise<TypeMapping | null>;
  
  /**
   * Get all type mappings for a language
   * @param languageId The language ID
   * @returns Array of type mappings
   */
  getTypeMappingsByLanguage(languageId: number): Promise<TypeMapping[]>;
  
  /**
   * Create a new type mapping
   * @param mapping The mapping to create (without ID)
   * @returns The ID of the created mapping
   */
  createTypeMapping(mapping: Omit<TypeMapping, 'id'>): Promise<number>;
  
  /**
   * Update an existing type mapping
   * @param mapping The mapping to update (with ID)
   */
  updateTypeMapping(mapping: TypeMapping): Promise<void>;
  
  /**
   * Delete a type mapping
   * @param id The ID of the mapping to delete
   */
  deleteTypeMapping(id: number): Promise<void>;
  
  // Database management methods
  
  /**
   * Initialize the database schema and seed with initial data if needed
   */
  initDatabase(): Promise<void>;
  
  /**
   * Clear all data from the database
   */
  clearDatabase(): Promise<void>;
  
  /**
   * Export the entire database as a JSON object for backup or sharing
   * @returns JSON representation of the database
   */
  exportDatabase(): Promise<any>;
  
  /**
   * Import data from a JSON object into the database
   * @param data The data to import
   */
  importDatabase(data: any): Promise<void>;
} 