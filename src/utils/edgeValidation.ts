import { Node, Edge, Connection } from 'reactflow';
import { FunctionNodeData } from '../components/nodes/FunctionNode.types';

export const isValidConnection = (connection: Connection, nodes: Node<FunctionNodeData>[], edges: Edge[] = []): boolean => {
  // Get source and target nodes
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  
  if (!sourceNode || !targetNode) return false;
  
  // Check if this is an execution connection
  const isExecutionFlow = 
    connection.sourceHandle?.startsWith('exec-') || 
    connection.targetHandle?.startsWith('exec-');
    
  if (isExecutionFlow) {
    // For execution connections:
    // 1. Source must be an output
    // 2. Target must be an input
    // 3. Only one connection allowed per execution input
    
    const isValid = 
      connection.sourceHandle?.startsWith('exec-output') && 
      connection.targetHandle?.startsWith('exec-input');
      
    if (!isValid) return false;
    
    // Only one execution input connection per node
    const existingExecutionInputs = edges.filter(
      (e: Edge) => e.target === connection.target && 
           e.targetHandle === connection.targetHandle
    );
    
    // If there's already a connection to this input, reject the new one
    if (existingExecutionInputs.length > 0) return false;
    
    // Ensure execution flow is left to right
    // Get node positions
    const sourcePos = sourceNode.position;
    const targetPos = targetNode.position;
    
    // For horizontal execution flow, target should generally be to the right of source
    // We allow some flexibility (target can be slightly to the left but not too much)
    const horizontalDiff = targetPos.x - sourcePos.x;
    if (horizontalDiff < -200) {
      // Target is too far to the left of source, which would create confusing flow
      // This is a soft validation that can be disabled if needed
      console.warn('Execution flow should generally go from left to right');
      // return false; // Uncomment to enforce strict left-to-right flow
    }
    
    return true;
  }
  
  // For data connections, check type compatibility
  const sourceOutput = sourceNode.data.outputs.find(
    output => output.id === connection.sourceHandle
  );
  
  const targetInput = targetNode.data.inputs.find(
    input => input.id === connection.targetHandle
  );
  
  if (!sourceOutput || !targetInput) return false;
  
  // Check if types are compatible
  return isTypeCompatible(sourceOutput.type, targetInput.type);
};

// Simple type compatibility check
export const isTypeCompatible = (sourceType: string, targetType: string): boolean => {
  // Same types are always compatible
  if (sourceType === targetType) return true;
  
  // Any can receive any type
  if (targetType === 'any') return true;
  
  // Add more specific compatibility rules as needed
  
  return false;
}; 