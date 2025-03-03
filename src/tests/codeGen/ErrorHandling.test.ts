import { Node, Edge } from 'reactflow';
import { MockSyntaxDatabaseService } from '../mocks/MockSyntaxDatabaseService';
import { ExecutionBasedCodeGenerator, CodeGenerationResult } from '../../services/codeGen/ExecutionBasedCodeGenerator';
import { CodeGenerationError, ErrorSeverity, ErrorSource } from '../../services/codeGen/CodeGenerationError';

// Helper function to create a basic node
function createNode(id: string, label: string, functionId?: number): Node {
  return {
    id,
    type: 'functionNode',
    position: { x: 0, y: 0 },
    data: {
      label,
      hasExecutionPorts: true,
      inputs: [],
      outputs: [],
      executionInputs: [{ id: `exec-in-${id}`, name: 'Execute' }],
      executionOutputs: [{ id: `exec-out-${id}`, name: 'Next' }],
      functionId
    }
  };
}

// Helper function to create an edge
function createEdge(id: string, source: string, target: string, sourceHandle: string, targetHandle: string): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle
  };
}

describe('Code Generation Error Handling', () => {
  let mockSyntaxDbService: MockSyntaxDatabaseService;
  
  beforeEach(() => {
    mockSyntaxDbService = new MockSyntaxDatabaseService();
    mockSyntaxDbService.addMockSyntaxPattern(1, 1, 'print({value})');
    mockSyntaxDbService.addMockSyntaxPattern(2, 1, 'int({value})');
  });

  test('should handle missing syntax patterns', async () => {
    // Create a node with a non-existent function ID
    const node = createNode('1', 'MissingPattern', 999);
    
    // Create the generator
    const generator = new ExecutionBasedCodeGenerator(
      [node],
      [],
      mockSyntaxDbService
    );
    
    // Generate code
    const result = await generator.generateCode();
    
    // Verify warnings were generated for the missing pattern
    expect(result.warnings.length).toBeGreaterThan(0);
    
    // Find the specific warning about missing pattern
    const missingPatternWarning = result.warnings.find(
      w => w.source === ErrorSource.SYNTAX_PATTERN && 
           w.functionId === 999 &&
           w.severity === ErrorSeverity.WARNING
    );
    
    expect(missingPatternWarning).toBeDefined();
    expect(missingPatternWarning?.message).toContain('No syntax pattern found');
    
    // Verify code was still generated
    expect(result.code).toContain('def main');
    expect(result.code).toContain('# MissingPattern');
  });

  test('should handle circular references', async () => {
    // Create two nodes with a circular execution connection
    const node1 = createNode('1', 'Node1', 1);
    const node2 = createNode('2', 'Node2', 2);
    
    // Create circular connections
    const edge1 = createEdge('e1', '1', '2', 'exec-out-1', 'exec-in-2');
    const edge2 = createEdge('e2', '2', '1', 'exec-out-2', 'exec-in-1');
    
    // Create the generator
    const generator = new ExecutionBasedCodeGenerator(
      [node1, node2],
      [edge1, edge2],
      mockSyntaxDbService
    );
    
    // Generate code
    const result = await generator.generateCode();
    
    // Verify code was generated
    expect(result.code).toContain('def main');
    expect(result.code).toContain('# Circular reference detected');
    
    // Verify there are warnings about circular references
    expect(result.warnings.some(w => 
      w.message.includes('Circular reference') && w.source === ErrorSource.DEPENDENCY_RESOLUTION
    )).toBeTruthy();
  });

  test('should handle unresolved placeholders in syntax patterns', async () => {
    // Add a pattern with a placeholder that won't be resolved
    mockSyntaxDbService.addMockSyntaxPattern(3, 1, 'print({value}, {missing})');
    
    // Create a node that uses this pattern
    const node = createNode('1', 'PrintWithMissing', 3);
    
    // Create the generator
    const generator = new ExecutionBasedCodeGenerator(
      [node],
      [],
      mockSyntaxDbService
    );
    
    // Generate code
    const result = await generator.generateCode();
    
    // Verify warnings were generated for the unresolved placeholder
    expect(result.warnings.length).toBeGreaterThan(0);
    
    // Find the specific warning about unresolved placeholders
    const placeholderWarning = result.warnings.find(
      w => w.source === ErrorSource.SYNTAX_PATTERN && 
           w.message.includes('unresolved placeholders')
    );
    
    expect(placeholderWarning).toBeDefined();
    expect(placeholderWarning?.message).toContain('{missing}');
    
    // Verify code was still generated, possibly with the unresolved placeholder
    expect(result.code).toContain('def main');
    expect(result.code).toContain('print(');
  });

  test('should return detailed error messages', async () => {
    // Create a node with a function ID
    const node = createNode('1', 'TestNode', 1);
    
    // Create an error instance
    const error = CodeGenerationError.syntaxPatternError(
      'Test error message',
      {
        nodeId: node.id,
        nodeLabel: node.data.label,
        functionId: node.data.functionId,
        patternType: 'EXPRESSION',
        severity: ErrorSeverity.ERROR
      }
    );
    
    // Verify error properties
    expect(error.message).toBe('Test error message');
    expect(error.nodeId).toBe(node.id);
    expect(error.nodeLabel).toBe(node.data.label);
    expect(error.functionId).toBe(node.data.functionId);
    expect(error.source).toBe(ErrorSource.SYNTAX_PATTERN);
    expect(error.severity).toBe(ErrorSeverity.ERROR);
    
    // Verify detailed message method works
    const detailedMessage = error.getDetailedMessage();
    expect(detailedMessage).toContain('[ERROR] Test error message');
    expect(detailedMessage).toContain(`Node: ${node.data.label}`);
    expect(detailedMessage).toContain(`Function ID: ${node.data.functionId}`);
    expect(detailedMessage).toContain('Error Source: syntax_pattern');
    expect(detailedMessage).toContain('Suggestions:');
  });

  test('should handle errors during initialization', async () => {
    // Create a mocked service that throws an error
    const throwingService = {
      ...mockSyntaxDbService,
      getSyntaxPattern: jest.fn().mockRejectedValue(new Error('Database connection error'))
    };
    
    // Create a node that will trigger an initialization error
    const node = createNode('1', 'ErrorNode', 1);
    
    // Create the generator with the throwing service
    const generator = new ExecutionBasedCodeGenerator(
      [node],
      [],
      throwingService as any
    );
    
    // Generate code
    const result = await generator.generateCode();
    
    // Verify errors were generated
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Find the specific error about initialization
    const initError = result.errors.find(
      e => e.source === ErrorSource.SYNTAX_PATTERN && 
           e.message.includes('Failed to load syntax pattern')
    );
    
    expect(initError).toBeDefined();
    expect(initError?.message).toContain('Database connection error');
  });
}); 