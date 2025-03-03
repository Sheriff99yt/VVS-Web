// Performance test setup for VVS Web

// Set test timeout to 30 seconds for performance tests (they may take longer)
jest.setTimeout(30000);

// Import fake-indexeddb modules for mocking
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

// Mock IndexedDB globally
class PerformanceIndexedDB {
  private static instance: PerformanceIndexedDB;
  private fakeDb: IDBFactory;

  private constructor() {
    this.fakeDb = new IDBFactory();
    this.setupGlobals();
  }

  public static getInstance(): PerformanceIndexedDB {
    if (!PerformanceIndexedDB.instance) {
      PerformanceIndexedDB.instance = new PerformanceIndexedDB();
    }
    return PerformanceIndexedDB.instance;
  }

  private setupGlobals() {
    // Set up global indexedDB object
    global.indexedDB = this.fakeDb;
    global.IDBKeyRange = IDBKeyRange;
  }

  // Helper to reset the database between tests
  public reset() {
    // Create a new instance to reset all data
    this.fakeDb = new IDBFactory();
    this.setupGlobals();
  }
}

// Initialize the mock
const mockDb = PerformanceIndexedDB.getInstance();

// Add reset function to global context for use in tests
(global as any).__resetIndexedDB = () => {
  mockDb.reset();
  console.log('Performance IndexedDB reset');
};

// Function to warm up the system before performance tests
export async function warmupSystem(): Promise<void> {
  console.log('Warming up the system before performance tests...');
  
  // Perform some operations to warm up the IndexedDB implementation
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('warmup', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('warmup', { keyPath: 'id' });
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  // Add some data to warm up the database
  const tx = db.transaction('warmup', 'readwrite');
  const store = tx.objectStore('warmup');
  
  for (let i = 0; i < 10; i++) {
    store.add({ id: i, value: `warmup-${i}` });
  }
  
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
  
  console.log('Warmup complete');
}

// Export for type checking
export {}; 