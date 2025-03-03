import { useContext } from 'react';
import { SyntaxDatabaseService } from '../services/database/SyntaxDatabaseService';

// This is a placeholder implementation for now.
// In a real application, this would be part of a proper dependency injection system
// or would use React Context to provide the service.

// For now, we'll initialize a singleton service for testing
import { SyntaxDatabaseServiceImpl } from '../services/database/SyntaxDatabaseServiceImpl';

// Singleton instance
let syntaxDbServiceInstance: SyntaxDatabaseService | null = null;

/**
 * Hook to provide access to the SyntaxDatabaseService
 * In a real application, this would ideally come from a context provider or DI system
 */
export function useSyntaxDatabaseService(): SyntaxDatabaseService | undefined {
  // If we haven't initialized the service yet, do so now
  if (!syntaxDbServiceInstance) {
    try {
      // This is a simplistic implementation; ideally this would be done at app startup
      // and provided through context
      syntaxDbServiceInstance = new SyntaxDatabaseServiceImpl();
      
      // Initialize the database
      syntaxDbServiceInstance.initDatabase().catch(error => {
        console.error('Failed to initialize syntax database:', error);
        syntaxDbServiceInstance = null;
      });
    } catch (error) {
      console.error('Failed to create syntax database service:', error);
      return undefined;
    }
  }
  
  return syntaxDbServiceInstance || undefined;
} 