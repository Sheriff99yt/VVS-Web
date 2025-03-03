/**
 * Script to import Python built-in functions into the database
 * 
 * This script can be run with: npx ts-node src/scripts/ImportPythonBuiltins.ts
 */

import { SyntaxDatabaseServiceImpl } from '../services/database/SyntaxDatabaseServiceImpl';
import { importPythonBuiltins } from '../services/database/seeding/ImportPythonBuiltins';

// Main function to run the import
async function main() {
  console.log('Starting Python built-in functions import script...');
  
  // Create syntax database service
  const syntaxDbService = new SyntaxDatabaseServiceImpl();
  
  // Initialize the database
  console.log('Initializing database...');
  await syntaxDbService.initDatabase();
  
  // Import Python built-in functions
  console.log('Importing Python built-ins...');
  await importPythonBuiltins(syntaxDbService);
  
  console.log('Python built-in functions import completed successfully!');
  console.log('The functions are now available in the database for use in the VVS Web application.');
  
  // Exit the process
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Error importing Python built-in functions:', error);
  process.exit(1);
}); 