import { Language } from '../../../models/syntax';
import { openDatabase, Repository, StoreIndices, StoreNames } from '../DatabaseSchema';

/**
 * Repository for managing language definitions in the database
 */
export class LanguageRepository implements Repository<Language> {
  /**
   * Get a language by its ID
   * @param id The language ID
   * @returns The language or null if not found
   */
  async getById(id: number): Promise<Language | null> {
    const db = await openDatabase();
    
    return new Promise<Language | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.LANGUAGES, 'readonly');
      const store = transaction.objectStore(StoreNames.LANGUAGES);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get language with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get all languages in the database
   * @returns Array of all languages
   */
  async getAll(): Promise<Language[]> {
    const db = await openDatabase();
    
    return new Promise<Language[]>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.LANGUAGES, 'readonly');
      const store = transaction.objectStore(StoreNames.LANGUAGES);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all languages: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get a language by its name
   * @param name The language name
   * @returns The language or null if not found
   */
  async getByName(name: string): Promise<Language | null> {
    const db = await openDatabase();
    
    return new Promise<Language | null>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.LANGUAGES, 'readonly');
      const store = transaction.objectStore(StoreNames.LANGUAGES);
      const index = store.index(StoreIndices[StoreNames.LANGUAGES].NAME_INDEX);
      const request = index.get(name);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get language with name ${name}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Get all enabled languages
   * @returns Array of enabled languages
   */
  async getEnabled(): Promise<Language[]> {
    const languages = await this.getAll();
    return languages.filter(language => language.isEnabled);
  }
  
  /**
   * Create a new language
   * @param language The language to create (without ID)
   * @returns The ID of the created language
   */
  async create(language: Omit<Language, 'id'>): Promise<number> {
    const db = await openDatabase();
    
    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.LANGUAGES, 'readwrite');
      const store = transaction.objectStore(StoreNames.LANGUAGES);
      const request = store.add(language);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to create language: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Update an existing language
   * @param language The language to update (with ID)
   */
  async update(language: Language): Promise<void> {
    if (language.id === undefined) {
      throw new Error('Cannot update language without an ID');
    }
    
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.LANGUAGES, 'readwrite');
      const store = transaction.objectStore(StoreNames.LANGUAGES);
      const request = store.put(language);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to update language: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  /**
   * Delete a language
   * @param id The ID of the language to delete
   */
  async delete(id: number): Promise<void> {
    const db = await openDatabase();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(StoreNames.LANGUAGES, 'readwrite');
      const store = transaction.objectStore(StoreNames.LANGUAGES);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to delete language with ID ${id}: ${request.error?.message}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
} 