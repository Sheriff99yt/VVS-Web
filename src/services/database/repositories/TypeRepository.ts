import { TypeDefinition } from '../../../models/syntax';
import { openDatabase, Repository, StoreIndices, StoreNames } from '../DatabaseSchema';

/**
 * Repository for managing type definitions in the database
 */
export class TypeRepository implements Repository<TypeDefinition> {
  /**
   * Get a type definition by its ID
   * @param id The type ID
   * @returns The type definition or null if not found
   */
  async getById(id: number): Promise<TypeDefinition | null> {
    const db = await openDatabase();
    
    return new Promise<TypeDefinition | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPES, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPES);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get type with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get all type definitions in the database
   * @returns Array of all type definitions
   */
  async getAll(): Promise<TypeDefinition[]> {
    const db = await openDatabase();
    
    return new Promise<TypeDefinition[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPES, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPES);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all types: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get a type definition by its name
   * @param name The type name
   * @returns The type definition or null if not found
   */
  async getByName(name: string): Promise<TypeDefinition | null> {
    const db = await openDatabase();
    
    return new Promise<TypeDefinition | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPES, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPES);
      const index = store.index(StoreIndices[StoreNames.TYPES].NAME_INDEX);
      const request = index.get(name);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get type with name ${name}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Create a new type definition
   * @param typeDef The type to create (without ID)
   * @returns The ID of the created type
   */
  async create(typeDef: Omit<TypeDefinition, 'id'>): Promise<number> {
    const db = await openDatabase();
    
    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPES, 'readwrite');
      const store = transaction.objectStore(StoreNames.TYPES);
      const request = store.add(typeDef);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to create type: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Update an existing type definition
   * @param typeDef The type to update (with ID)
   */
  async update(typeDef: TypeDefinition): Promise<void> {
    if (typeDef.id === undefined) {
      throw new Error('Cannot update type without an ID');
    }
    
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPES, 'readwrite');
      const store = transaction.objectStore(StoreNames.TYPES);
      const request = store.put(typeDef);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to update type: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Delete a type definition
   * @param id The ID of the type to delete
   */
  async delete(id: number): Promise<void> {
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPES, 'readwrite');
      const store = transaction.objectStore(StoreNames.TYPES);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete type with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
} 