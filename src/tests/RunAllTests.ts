import { spawnSync } from 'child_process';
import path from 'path';

/**
 * Helper function to run a Jest test suite with the provided pattern
 * @param pattern The test pattern to run
 */
function runTests(pattern: string) {
  console.log(`\n=== Running ${pattern} ===\n`);
  
  const result = spawnSync('npx', ['jest', pattern], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status !== 0) {
    console.error(`Tests failed for ${pattern} with status code ${result.status}`);
    process.exit(result.status || 1);
  }
}

/**
 * Main entry point for running all tests
 */
async function runAllTests() {
  console.log('=== VVS Web Test Runner ===');
  console.log('Running all test suites...');

  try {
    // Run Database tests
    runTests('src/tests/database');
    
    // Run Code Generation tests
    runTests('src/tests/codeGen');
    
    // If there are more test suites, add them here
    // runTests('src/tests/ui');
    // runTests('src/tests/nodes');
    
    console.log('\n=== All Tests Completed Successfully ===');
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 