import { TypeMapping } from '../../../models/syntax';
import { openDatabase, Repository, StoreIndices, StoreNames } from '../DatabaseSchema';

/**
 * Repository for managing type mappings in the database
 */
export class TypeMappingRepository implements Repository<TypeMapping> {
  /**
   * Get a type mapping by its ID
   * @param id The mapping ID
   * @returns The type mapping or null if not found
   */
  async getById(id: number): Promise<TypeMapping | null> {
    const db = await openDatabase();
    
    return new Promise<TypeMapping | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get type mapping with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get all type mappings in the database
   * @returns Array of all type mappings
   */
  async getAll(): Promise<TypeMapping[]> {
    const db = await openDatabase();
    
    return new Promise<TypeMapping[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all type mappings: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get type mapping by abstract type ID and language ID
   * @param abstractTypeId The abstract type ID
   * @param languageId The language ID
   * @returns The type mapping or null if not found
   */
  async getByTypeAndLanguage(abstractTypeId: number, languageId: number): Promise<TypeMapping | null> {
    const db = await openDatabase();
    
    return new Promise<TypeMapping | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const index = store.index(StoreIndices[StoreNames.TYPE_MAPPINGS].TYPE_LANGUAGE_INDEX);
      const request = index.get([abstractTypeId, languageId]);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get type mapping for type ${abstractTypeId} and language ${languageId}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get type mappings for a specific language
   * @param languageId The language ID
   * @returns Array of type mappings for the language
   */
  async getByLanguage(languageId: number): Promise<TypeMapping[]> {
    const db = await openDatabase();
    
    return new Promise<TypeMapping[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readonly');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const index = store.index(StoreIndices[StoreNames.TYPE_MAPPINGS].LANGUAGE_INDEX);
      const request = index.getAll(languageId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get type mappings for language ${languageId}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Create a new type mapping
   * @param mapping The mapping to create (without ID)
   * @returns The ID of the created mapping
   */
  async create(mapping: Omit<TypeMapping, 'id'>): Promise<number> {
    const db = await openDatabase();
    
    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readwrite');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const request = store.add(mapping);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to create type mapping: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Update an existing type mapping
   * @param mapping The mapping to update (with ID)
   */
  async update(mapping: TypeMapping): Promise<void> {
    if (mapping.id === undefined) {
      throw new Error('Cannot update type mapping without an ID');
    }
    
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readwrite');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const request = store.put(mapping);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to update type mapping: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Delete a type mapping
   * @param id The ID of the mapping to delete
   */
  async delete(id: number): Promise<void> {
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.TYPE_MAPPINGS, 'readwrite');
      const store = transaction.objectStore(StoreNames.TYPE_MAPPINGS);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete type mapping with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
} 