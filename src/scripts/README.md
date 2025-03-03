# VVS Scripts

This directory contains utility scripts for the VVS Web application.

## Importing Python Built-in Functions

The `ImportPythonBuiltins.ts` script allows you to import a comprehensive list of Python built-in functions to the VVS database. These functions can then be used in the visual scripting interface.

### Running the Script

To import Python built-in functions:

```bash
# Navigate to the project root
cd /path/to/vvs-web

# Run the script with ts-node
npx ts-node src/scripts/ImportPythonBuiltins.ts
```

### What Gets Imported

The script imports the following categories of Python built-in functions:

1. **Basic Functions**: `print()`, `input()`, `len()`, `range()`, etc.
2. **Mathematical Functions**: `abs()`, `round()`, `sum()`, `max()`, `min()`, etc.
3. **Type Conversion**: `int()`, `float()`, `str()`, `bool()`, `list()`, `dict()`, etc.
4. **String Operations**: String manipulation functions
5. **List Operations**: List manipulation functions
6. **Dictionary Operations**: Dictionary manipulation functions
7. **Utility Functions**: `sorted()`, `filter()`, `map()`, `zip()`, etc.

Each function is imported with:
- Appropriate name and description
- Parameter information (name, type, description, whether required)
- Return type information
- Category classification
- Appropriate syntax pattern for Python

### Adding More Functions

To add more Python built-in functions:

1. Open `src/services/database/seeding/ImportPythonBuiltins.ts`
2. Navigate to the `getAdditionalBuiltinFunctions()` method
3. Add new function definitions following the existing pattern
4. Run the script again to import the new functions

### Troubleshooting

If you encounter issues:

1. Make sure the database is properly initialized
2. Check for any console errors during import
3. Verify that the database service is running correctly
4. Check that the functions aren't already imported (the script skips existing functions) 