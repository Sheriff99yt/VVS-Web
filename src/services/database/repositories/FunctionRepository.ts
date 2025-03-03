import { FunctionDefinition } from '../../../models/syntax';
import { openDatabase, Repository, StoreIndices, StoreNames } from '../DatabaseSchema';

/**
 * Repository for managing function definitions in the database
 */
export class FunctionRepository implements Repository<FunctionDefinition> {
  /**
   * Get a function definition by its ID
   * @param id The function ID
   * @returns The function or null if not found
   */
  async getById(id: number): Promise<FunctionDefinition | null> {
    const db = await openDatabase();
    
    return new Promise<FunctionDefinition | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readonly');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get function with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get all function definitions in the database
   * @returns Array of all functions
   */
  async getAll(): Promise<FunctionDefinition[]> {
    const db = await openDatabase();
    
    return new Promise<FunctionDefinition[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readonly');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all functions: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get a function by its name
   * @param name The function name
   * @returns The function or null if not found
   */
  async getByName(name: string): Promise<FunctionDefinition | null> {
    const db = await openDatabase();
    
    return new Promise<FunctionDefinition | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readonly');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const index = store.index(StoreIndices[StoreNames.FUNCTIONS].NAME_INDEX);
      const request = index.get(name);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get function with name ${name}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get functions by category
   * @param category The category name
   * @returns Array of functions in the specified category
   */
  async getByCategory(category: string): Promise<FunctionDefinition[]> {
    const db = await openDatabase();
    
    return new Promise<FunctionDefinition[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readonly');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const index = store.index(StoreIndices[StoreNames.FUNCTIONS].CATEGORY_INDEX);
      const request = index.getAll(category);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get functions with category ${category}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get built-in functions
   * @returns Array of built-in functions
   */
  async getBuiltIn(): Promise<FunctionDefinition[]> {
    const db = await openDatabase();
    
    return new Promise<FunctionDefinition[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readonly');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const index = store.index(StoreIndices[StoreNames.FUNCTIONS].BUILT_IN_INDEX);
      
      const functions: FunctionDefinition[] = [];
      const request = index.openCursor(IDBKeyRange.only(1));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          functions.push(cursor.value);
          cursor.continue();
        } else {
          resolve(functions);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get built-in functions: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Search for functions by name, description, or tags
   * @param query The search query
   * @returns Array of matching functions
   */
  async search(query: string): Promise<FunctionDefinition[]> {
    if (!query || query.trim() === '') {
      return this.getAll();
    }
    
    const functions = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return functions.filter(func => 
      func.name.toLowerCase().includes(lowerQuery) ||
      func.displayName.toLowerCase().includes(lowerQuery) ||
      func.description.toLowerCase().includes(lowerQuery) ||
      func.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  /**
   * Create a new function definition
   * @param functionDef The function to create (without ID)
   * @returns The ID of the created function
   */
  async create(functionDef: Omit<FunctionDefinition, 'id'>): Promise<number> {
    const db = await openDatabase();
    
    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readwrite');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const request = store.add(functionDef);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to create function: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Update an existing function definition
   * @param functionDef The function to update (with ID)
   */
  async update(functionDef: FunctionDefinition): Promise<void> {
    if (functionDef.id === undefined) {
      throw new Error('Cannot update function without an ID');
    }
    
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readwrite');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const request = store.put(functionDef);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to update function: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Delete a function definition
   * @param id The ID of the function to delete
   */
  async delete(id: number): Promise<void> {
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.FUNCTIONS, 'readwrite');
      const store = transaction.objectStore(StoreNames.FUNCTIONS);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete function with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
} 