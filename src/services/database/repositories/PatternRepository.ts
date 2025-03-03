import { SyntaxPattern } from '../../../models/syntax';
import { openDatabase, Repository, StoreIndices, StoreNames } from '../DatabaseSchema';

/**
 * Repository for managing syntax patterns in the database
 */
export class PatternRepository implements Repository<SyntaxPattern> {
  /**
   * Get a syntax pattern by its ID
   * @param id The pattern ID
   * @returns The pattern or null if not found
   */
  async getById(id: number): Promise<SyntaxPattern | null> {
    const db = await openDatabase();
    
    return new Promise<SyntaxPattern | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readonly');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get syntax pattern with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get all syntax patterns in the database
   * @returns Array of all syntax patterns
   */
  async getAll(): Promise<SyntaxPattern[]> {
    const db = await openDatabase();
    
    return new Promise<SyntaxPattern[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readonly');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all syntax patterns: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get syntax pattern by function ID and language ID
   * @param functionId The function ID
   * @param languageId The language ID
   * @returns The syntax pattern or null if not found
   */
  async getByFunctionAndLanguage(functionId: number, languageId: number): Promise<SyntaxPattern | null> {
    const db = await openDatabase();
    
    return new Promise<SyntaxPattern | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readonly');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const index = store.index(StoreIndices[StoreNames.SYNTAX_PATTERNS].FUNCTION_LANGUAGE_INDEX);
      const request = index.get([functionId, languageId]);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get syntax pattern for function ${functionId} and language ${languageId}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get syntax patterns for a specific language
   * @param languageId The language ID
   * @returns Array of syntax patterns for the language
   */
  async getByLanguage(languageId: number): Promise<SyntaxPattern[]> {
    const db = await openDatabase();
    
    return new Promise<SyntaxPattern[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readonly');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const index = store.index(StoreIndices[StoreNames.SYNTAX_PATTERNS].LANGUAGE_INDEX);
      const request = index.getAll(languageId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get syntax patterns for language ${languageId}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Create a new syntax pattern
   * @param pattern The pattern to create (without ID)
   * @returns The ID of the created pattern
   */
  async create(pattern: Omit<SyntaxPattern, 'id'>): Promise<number> {
    const db = await openDatabase();
    
    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readwrite');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const request = store.add(pattern);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to create syntax pattern: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Update an existing syntax pattern
   * @param pattern The pattern to update (with ID)
   */
  async update(pattern: SyntaxPattern): Promise<void> {
    if (pattern.id === undefined) {
      throw new Error('Cannot update syntax pattern without an ID');
    }
    
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readwrite');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const request = store.put(pattern);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to update syntax pattern: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Delete a syntax pattern
   * @param id The ID of the pattern to delete
   */
  async delete(id: number): Promise<void> {
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.SYNTAX_PATTERNS, 'readwrite');
      const store = transaction.objectStore(StoreNames.SYNTAX_PATTERNS);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete syntax pattern with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
} 