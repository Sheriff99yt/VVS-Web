// Export the interface for the SyntaxDatabaseService
export type { SyntaxDatabaseService } from './SyntaxDatabaseService';

// Export the implementation of the SyntaxDatabaseService
export { SyntaxDatabaseServiceImpl } from './SyntaxDatabaseServiceImpl';

// Export the database initializer
export { DatabaseInitializer } from './DatabaseInitializer';

// Export the database schema and utilities
export { 
  openDatabase, 
  StoreNames, 
  StoreIndices
} from './DatabaseSchema';

// Export Repository type
export type { Repository } from './DatabaseSchema';

// Export the repositories for direct access if needed
export { LanguageRepository } from './repositories/LanguageRepository';
export { FunctionRepository } from './repositories/FunctionRepository';
export { PatternRepository } from './repositories/PatternRepository';
export { TypeRepository } from './repositories/TypeRepository';
export { TypeMappingRepository } from './repositories/TypeMappingRepository';

// Export Python language definition
export { pythonLanguageDefinition, pythonSyntaxRules, pythonTypeOperators } from './seeding/PythonLanguageDefinition';

// Create and export a default instance of the SyntaxDatabaseService
import { SyntaxDatabaseServiceImpl } from './SyntaxDatabaseServiceImpl';

/**
 * The default instance of the SyntaxDatabaseService
 * Use this for global access to the syntax database throughout the application
 */
export const syntaxDatabaseService = new SyntaxDatabaseServiceImpl();

// Default export the syntaxDatabaseService for convenience
export default syntaxDatabaseService; 