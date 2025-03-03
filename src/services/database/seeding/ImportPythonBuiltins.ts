/**
 * ImportPythonBuiltins.ts
 * 
 * Utility functions for importing Python built-in functions into the database.
 * Used by the import script at initialization time.
 */

import { SyntaxDatabaseService } from '../SyntaxDatabaseService';
import { FunctionCategory } from '../../../models/syntax';

/**
 * Import Python built-in functions into the database
 * @param dbService The syntax database service
 */
export async function importPythonBuiltins(dbService: SyntaxDatabaseService): Promise<void> {
  console.log('Importing Python built-in functions...');
  
  // Python language ID is 1 (assuming Python is the first language added)
  const languageId = 1;
  
  // List of Python built-in functions to import
  const builtins = [
    {
      name: 'print',
      displayName: 'Print',
      description: 'Print objects to the text stream file, separated by sep and followed by end.',
      category: FunctionCategory.IO,
      parameters: [
        {
          name: 'objects',
          type: 'any',
          description: 'Objects to print',
          isRequired: false,
          defaultValue: undefined
        },
        {
          name: 'sep',
          type: 'string',
          description: 'String inserted between values, default a space.',
          isRequired: false,
          defaultValue: ' '
        },
        {
          name: 'end',
          type: 'string',
          description: 'String appended after the last value, default a newline.',
          isRequired: false,
          defaultValue: '\\n'
        },
        {
          name: 'file',
          type: 'object',
          description: 'A file-like object (stream); defaults to the current sys.stdout.',
          isRequired: false
        },
        {
          name: 'flush',
          type: 'boolean',
          description: 'Whether to forcibly flush the stream.',
          isRequired: false,
          defaultValue: false
        }
      ],
      returnType: 'None',
      isBuiltIn: true,
      tags: ['print', 'output', 'display']
    },
    {
      name: 'len',
      displayName: 'Length',
      description: 'Return the length (the number of items) of an object.',
      category: FunctionCategory.UTILITY,
      parameters: [
        {
          name: 'obj',
          type: 'any',
          description: 'Object whose length is to be determined',
          isRequired: true
        }
      ],
      returnType: 'int',
      isBuiltIn: true,
      tags: ['length', 'size', 'count']
    },
    {
      name: 'range',
      displayName: 'Range',
      description: 'Returns a sequence of numbers, starting from 0 by default, and increments by 1 by default, and stops before a specified number.',
      category: FunctionCategory.UTILITY,
      parameters: [
        {
          name: 'start',
          type: 'int',
          description: 'Starting number of the sequence',
          isRequired: false,
          defaultValue: 0
        },
        {
          name: 'stop',
          type: 'int',
          description: 'End of the sequence (excluded)',
          isRequired: true
        },
        {
          name: 'step',
          type: 'int',
          description: 'Step of the sequence',
          isRequired: false,
          defaultValue: 1
        }
      ],
      returnType: 'range',
      isBuiltIn: true,
      tags: ['range', 'sequence', 'loop']
    }
  ];
  
  // Import each built-in function
  for (const func of builtins) {
    try {
      await dbService.createFunction({
        name: func.name,
        displayName: func.displayName,
        description: func.description,
        category: func.category,
        parameters: func.parameters,
        returnType: func.returnType,
        isBuiltIn: func.isBuiltIn,
        tags: func.tags
      });
      console.log(`Imported ${func.name}`);
    } catch (error) {
      console.error(`Error importing ${func.name}:`, error);
    }
  }
  
  console.log('Python built-in functions import completed');
} 