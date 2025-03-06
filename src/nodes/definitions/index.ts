/**
 * Node Definitions Index
 * 
 * Export all node definitions and registration functions
 */

// Math Nodes
export * from './MathNodes';

// Logic Nodes
export * from './LogicNodes';

// Control Flow Nodes
export * from './ControlFlowNodes';

// Variable Nodes
export * from './VariableNodes';

// I/O Nodes
export * from './IONodes';

// Import all registration functions
import { registerMathNodes } from './MathNodes';
import { registerLogicNodes } from './LogicNodes';
import { registerControlFlowNodes } from './ControlFlowNodes';
import { registerVariableNodes } from './VariableNodes';
import { registerIONodes } from './IONodes';

/**
 * Register all nodes in the system
 */
export function registerAllNodes(): void {
  registerMathNodes();
  registerLogicNodes();
  registerControlFlowNodes();
  registerVariableNodes();
  registerIONodes();
  
  console.log('All nodes registered successfully');
} 