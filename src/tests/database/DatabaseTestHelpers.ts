/**
 * Database Test Helpers
 * 
 * This file contains utility functions to assist with testing database operations.
 */

import { openDatabase } from '../../services/database/DatabaseSchema';
import { Language } from '../../models/syntax';

/**
 * Clears all data in the test database
 */
export async function clearDatabase(): Promise<void> {
  try {
    const db = await openDatabase();
    const stores = Array.from(db.objectStoreNames);
    db.close();
    
    const clearDb = await openDatabase();
    const tx = clearDb.transaction(stores, 'readwrite');
    
    for (const store of stores) {
      await new Promise<void>((resolve, reject) => {
        const clearRequest = tx.objectStore(store).clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });
    }
    
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => {
        clearDb.close();
        resolve();
      };
    });
    
    console.log('Database cleared for testing');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Reset the mock IndexedDB for a clean test environment
 */
export function resetMockIndexedDB(): void {
  // Use the global reset function defined in setup.ts
  if (typeof (global as any).__resetIndexedDB === 'function') {
    (global as any).__resetIndexedDB();
    console.log('Mock IndexedDB reset for testing');
  } else {
    console.warn('Mock IndexedDB reset function not found');
  }
}

/**
 * Create a minimal test language definition for testing
 */
export function createTestLanguage(name = 'TestLang'): Omit<Language, 'id'> {
  return {
    name,
    version: '1.0.0',
    fileExtension: '.test',
    syntaxRules: {
      statementDelimiter: ';',
      blockStart: '{',
      blockEnd: '}',
      commentSingle: '//',
      commentMultiStart: '/*',
      commentMultiEnd: '*/',
      stringDelimiters: ['"', "'"],
      indentationStyle: 'space',
      indentationSize: 2,
      functionDefinitionPattern: 'function {name}({params}) {body}',
      variableDeclarationPattern: 'let {name} = {value};',
      operatorPatterns: {
        add: '{0} + {1}',
        subtract: '{0} - {1}',
        multiply: '{0} * {1}',
        divide: '{0} / {1}'
      }
    },
    isEnabled: true
  };
}

/**
 * Wait for database operations to complete
 * Useful for allowing IndexedDB operations to finish before assertions
 */
export async function waitForDbOperations(ms = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 