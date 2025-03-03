/**
 * Script to import Python built-in functions into the database
 * 
 * Usage:
 *   npm run script -- import-python-builtins
 */
import { SyntaxDatabaseService } from '../src/services/database/SyntaxDatabaseService';
import { SyntaxDatabaseServiceImpl } from '../src/services/database/SyntaxDatabaseServiceImpl';
import { PythonBuiltinsImporter } from '../src/services/database/seeding/ImportPythonBuiltins';

async function importPythonBuiltins() {
  console.log('Starting Python built-in functions import script...');
  
  // Initialize the database service
  const dbService: SyntaxDatabaseService = new SyntaxDatabaseServiceImpl();
  await dbService.initDatabase();
  
  try {
    // Create the importer
    const importer = new PythonBuiltinsImporter(dbService);
    
    // Run the import process
    console.log('Starting import process...');
    await importer.importAllBuiltins();
    
    console.log('Import completed successfully!');
    console.log('You can now use Python built-in functions in your visual programming interface.');
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  } finally {
    // Clean up and exit
    console.log('Import script finished.');
    process.exit(0);
  }
}

// Run the script if executed directly
if (require.main === module) {
  importPythonBuiltins().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

export { importPythonBuiltins }; 