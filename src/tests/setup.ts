// Jest setup file for VVS Web tests

// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Import fake-indexeddb modules for mocking
import 'fake-indexeddb/auto';
import { IDBFactory, IDBDatabase } from 'fake-indexeddb';
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

// Mock IndexedDB globally
// This approach ensures that our IndexedDB API is correctly mocked
// using the fake-indexeddb package, which provides an in-memory implementation
class MockIndexedDB {
  private static instance: MockIndexedDB;
  private fakeDb: IDBFactory;

  private constructor() {
    this.fakeDb = new IDBFactory();
    this.setupGlobals();
  }

  public static getInstance(): MockIndexedDB {
    if (!MockIndexedDB.instance) {
      MockIndexedDB.instance = new MockIndexedDB();
    }
    return MockIndexedDB.instance;
  }

  private setupGlobals() {
    // Set up global indexedDB object
    global.indexedDB = this.fakeDb;
    global.IDBKeyRange = IDBKeyRange;
    // Add any other IDB-related globals if needed
  }

  // Helper to reset the database between tests
  public reset() {
    // Create a new instance to reset all data
    this.fakeDb = new IDBFactory();
    this.setupGlobals();
  }
}

// Initialize the mock
const mockDb = MockIndexedDB.getInstance();

// Add reset function to global context for use in tests
(global as any).__resetIndexedDB = () => {
  mockDb.reset();
};

// Export for type checking
export {}; 