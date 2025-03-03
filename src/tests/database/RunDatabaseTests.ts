import { runDatabaseTests } from './DatabaseTestSuite';

/**
 * Main entry point for running database tests
 */
async function main() {
  console.log('Starting database test suite...');
  
  try {
    await runDatabaseTests();
    console.log('Database test suite completed.');
  } catch (error) {
    console.error('Error running database tests:', error);
    process.exit(1);
  }
}

// Run the tests
main(); 