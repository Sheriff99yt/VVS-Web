/**
 * Database schema definition for the VVS Web syntax database
 * This file contains the configuration for IndexedDB including
 * database name, version, and table schemas
 */

export const DB_NAME = 'vvs_syntax_db';
export const DB_VERSION = 1;

/**
 * Database store (table) names
 */
export enum StoreNames {
  LANGUAGES = 'languages',
  FUNCTIONS = 'functions',
  SYNTAX_PATTERNS = 'syntaxPatterns',
  TYPES = 'types',
  TYPE_MAPPINGS = 'typeMappings'
}

/**
 * Index definitions for each store
 */
export const StoreIndices = {
  [StoreNames.LANGUAGES]: {
    NAME_INDEX: 'name',
  },
  [StoreNames.FUNCTIONS]: {
    NAME_INDEX: 'name',
    CATEGORY_INDEX: 'category',
    BUILT_IN_INDEX: 'isBuiltIn',
  },
  [StoreNames.SYNTAX_PATTERNS]: {
    FUNCTION_LANGUAGE_INDEX: 'functionLanguage',
    LANGUAGE_INDEX: 'languageId',
  },
  [StoreNames.TYPES]: {
    NAME_INDEX: 'name',
  },
  [StoreNames.TYPE_MAPPINGS]: {
    TYPE_LANGUAGE_INDEX: 'typeLanguage',
    LANGUAGE_INDEX: 'languageId',
  }
};

/**
 * Create the database schema during initialization
 * @param db The database instance
 */
export function createSchema(db: IDBDatabase): void {
  // Languages store
  if (!db.objectStoreNames.contains(StoreNames.LANGUAGES)) {
    const languageStore = db.createObjectStore(StoreNames.LANGUAGES, {
      keyPath: 'id',
      autoIncrement: true
    });
    
    // Create indices
    languageStore.createIndex(
      StoreIndices[StoreNames.LANGUAGES].NAME_INDEX,
      'name',
      { unique: true }
    );
  }
  
  // Functions store
  if (!db.objectStoreNames.contains(StoreNames.FUNCTIONS)) {
    const functionStore = db.createObjectStore(StoreNames.FUNCTIONS, {
      keyPath: 'id',
      autoIncrement: true
    });
    
    // Create indices
    functionStore.createIndex(
      StoreIndices[StoreNames.FUNCTIONS].NAME_INDEX,
      'name',
      { unique: true }
    );
    
    functionStore.createIndex(
      StoreIndices[StoreNames.FUNCTIONS].CATEGORY_INDEX,
      'category',
      { unique: false }
    );
    
    functionStore.createIndex(
      StoreIndices[StoreNames.FUNCTIONS].BUILT_IN_INDEX,
      'isBuiltIn',
      { unique: false }
    );
  }
  
  // Syntax patterns store
  if (!db.objectStoreNames.contains(StoreNames.SYNTAX_PATTERNS)) {
    const patternsStore = db.createObjectStore(StoreNames.SYNTAX_PATTERNS, {
      keyPath: 'id',
      autoIncrement: true
    });
    
    // Create compound index for function+language
    patternsStore.createIndex(
      StoreIndices[StoreNames.SYNTAX_PATTERNS].FUNCTION_LANGUAGE_INDEX,
      ['functionId', 'languageId'] as string[],
      { unique: true }
    );
    
    patternsStore.createIndex(
      StoreIndices[StoreNames.SYNTAX_PATTERNS].LANGUAGE_INDEX,
      'languageId',
      { unique: false }
    );
  }
  
  // Types store
  if (!db.objectStoreNames.contains(StoreNames.TYPES)) {
    const typesStore = db.createObjectStore(StoreNames.TYPES, {
      keyPath: 'id',
      autoIncrement: true
    });
    
    // Create indices
    typesStore.createIndex(
      StoreIndices[StoreNames.TYPES].NAME_INDEX,
      'name',
      { unique: true }
    );
  }
  
  // Type mappings store
  if (!db.objectStoreNames.contains(StoreNames.TYPE_MAPPINGS)) {
    const mappingsStore = db.createObjectStore(StoreNames.TYPE_MAPPINGS, {
      keyPath: 'id',
      autoIncrement: true
    });
    
    // Create compound index for abstractType+language
    mappingsStore.createIndex(
      StoreIndices[StoreNames.TYPE_MAPPINGS].TYPE_LANGUAGE_INDEX,
      ['abstractTypeId', 'languageId'] as string[],
      { unique: true }
    );
    
    mappingsStore.createIndex(
      StoreIndices[StoreNames.TYPE_MAPPINGS].LANGUAGE_INDEX,
      'languageId',
      { unique: false }
    );
  }
}

/**
 * Simple utility to open a connection to the database
 * @returns Promise resolving to an open database connection
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      createSchema(db);
    };
  });
}

/**
 * Base interface for repository implementations
 */
export interface Repository<T> {
  getById(id: number): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(item: Omit<T, 'id'>): Promise<number>;
  update(item: T): Promise<void>;
  delete(id: number): Promise<void>;
} 