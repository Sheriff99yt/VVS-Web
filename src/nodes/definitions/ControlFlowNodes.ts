/**
 * Control Flow Nodes
 * 
 * Defines all control flow nodes using the templates
 */

import { NodeType } from '../types';
import { 
  createIfStatementNode, 
  createForLoopNode,
  registerIfStatementNode,
  registerForLoopNode,
  IfStatementNodeConfig as IfNodeConfig,
  ForLoopNodeConfig as ForNodeConfig
} from '../templates/ControlFlowTemplate';

// IF_STATEMENT Node configuration
export const IfStatementNodeConfig: IfNodeConfig = {
  type: NodeType.IF_STATEMENT,
  label: 'If Statement',
  description: 'Conditionally executes one of two branches based on whether the condition is true or false.',
  defaultCondition: false
};

// FOR_LOOP Node configuration
export const ForLoopNodeConfig: ForNodeConfig = {
  type: NodeType.FOR_LOOP,
  label: 'For Loop',
  description: 'Executes a loop from Start to End with the given Step size, providing the current index as output.',
  defaultLoopVariable: 'i',
  defaultStart: 0,
  defaultEnd: 10,
  defaultStep: 1
};

// Create nodes from configurations
export const IfStatementNode = createIfStatementNode(IfStatementNodeConfig);
export const ForLoopNode = createForLoopNode(ForLoopNodeConfig);

/**
 * Register all control flow nodes
 */
export function registerControlFlowNodes(): void {
  registerIfStatementNode(IfStatementNodeConfig);
  registerForLoopNode(ForLoopNodeConfig);
  console.log('Registered Control Flow nodes');
} 