// Simple test runner for VVS Web Python MVP Tests
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define test files
const testFiles = {
  'db': 'src/tests/database/RunDatabaseTests.ts',
  'analyzer': 'src/tests/database/PythonAnalyzerTests.ts',
  'all': 'src/tests/RunAllTests.ts'
};

// Get test type from command line args
const testType = process.argv[2] || 'all';

if (!testFiles[testType]) {
  console.error(`Unknown test type: ${testType}`);
  console.error(`Available test types: ${Object.keys(testFiles).join(', ')}`);
  process.exit(1);
}

// Create temporary directory for transpiled files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Run test
console.log(`Running ${testType} tests...`);
console.log(`Test file: ${testFiles[testType]}`);

try {
  // Step 1: Transpile TypeScript to JavaScript (ignoring type errors)
  console.log('Transpiling TypeScript...');
  
  // Create a simple tsconfig file in the temp directory
  const tsConfigPath = path.join(tempDir, 'tsconfig.json');
  fs.writeFileSync(tsConfigPath, JSON.stringify({
    compilerOptions: {
      target: "es2016",
      module: "commonjs",
      esModuleInterop: true,
      skipLibCheck: true,
      noEmitOnError: false,
      allowJs: true,
      outDir: tempDir
    },
    include: ["src/**/*"]
  }, null, 2));
  
  // First install required packages if they don't exist
  const installResult = spawnSync('npm', ['install', '--no-save', 'typescript', '@types/node'], { 
    stdio: 'inherit',
    shell: true
  });
  
  if (installResult.status !== 0) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }
  
  // Transpile the file - ignoring errors (--noEmit false)
  console.log('Note: Ignoring TypeScript errors for testing purposes...');
  const tscResult = spawnSync('npx', ['tsc', '--project', tsConfigPath], {
    stdio: 'inherit',
    shell: true
  });
  
  // Get the transpiled JS file path
  const tsFilePath = path.resolve(testFiles[testType]);
  const relativeToSrc = path.relative(path.join(__dirname, 'src'), tsFilePath);
  const jsFilePath = path.join(tempDir, 'src', relativeToSrc).replace('.ts', '.js');
  
  if (!fs.existsSync(jsFilePath)) {
    console.error(`Failed to generate JavaScript file at ${jsFilePath}`);
    process.exit(1);
  }
  
  // Step 2: Run the JavaScript file
  console.log('\nRunning tests...');
  
  // Run the test
  const testResult = spawnSync('node', [jsFilePath], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle the result
  console.log(`\nTests completed with exit code: ${testResult.status}`);
  process.exit(testResult.status);
} catch (error) {
  console.error('Error running tests:', error);
  process.exit(1);
} finally {
  // Clean up temporary files
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
} 