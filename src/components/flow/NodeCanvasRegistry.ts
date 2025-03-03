import { ReactNode } from 'react';
import { NodeTypes } from 'reactflow';

// Import node components
import FunctionNode from './nodes/FunctionNode';
import IfNode from '../nodes/control/IfNode';
import ForLoopNode from '../nodes/control/ForLoopNode';

// Create and export node types registry
export const nodeTypes: NodeTypes = {
  functionNode: FunctionNode,
  ifNode: IfNode,
  forLoopNode: ForLoopNode,
};

// Node category definitions for the library
export interface NodeCategory {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

export const nodeCategories: NodeCategory[] = [
  {
    id: 'control',
    label: 'Control Flow',
    description: 'Nodes that control program execution flow',
    color: '#f59e0b'
  },
  {
    id: 'math',
    label: 'Math',
    description: 'Mathematical operations',
    color: '#3b82f6'
  },
  {
    id: 'string',
    label: 'String',
    description: 'String manipulation',
    color: '#10b981'
  },
  {
    id: 'io',
    label: 'Input/Output',
    description: 'File and console operations',
    color: '#8b5cf6'
  },
];

// Definition for node templates to be used in the library
export interface NodeTemplate {
  id: string;
  type: string;
  category: string;
  label: string;
  description?: string;
  inputs?: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    required?: boolean;
  }>;
  outputs?: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
  }>;
  hasExecutionPorts?: boolean;
  executionInputs?: Array<{
    id: string;
    name: string;
  }>;
  executionOutputs?: Array<{
    id: string;
    name: string;
  }>;
}

// Control flow node templates
export const controlFlowNodes: NodeTemplate[] = [
  {
    id: 'if-node',
    type: 'ifNode',
    category: 'control',
    label: 'If Condition',
    description: 'Conditional branching based on a boolean condition',
    inputs: [
      {
        id: 'condition',
        name: 'Condition',
        type: 'boolean',
        description: 'The condition to evaluate',
        required: true
      }
    ],
    hasExecutionPorts: true,
    executionInputs: [
      {
        id: 'entry',
        name: 'In'
      }
    ],
    executionOutputs: [
      {
        id: 'then',
        name: 'Then'
      },
      {
        id: 'else',
        name: 'Else'
      }
    ]
  },
  {
    id: 'for-loop-node',
    type: 'forLoopNode',
    category: 'control',
    label: 'For Loop',
    description: 'Loop over a range of values',
    inputs: [
      {
        id: 'start',
        name: 'Start',
        type: 'number',
        description: 'Starting value (inclusive)',
        required: true
      },
      {
        id: 'end',
        name: 'End',
        type: 'number',
        description: 'Ending value (exclusive)',
        required: true
      },
      {
        id: 'step',
        name: 'Step',
        type: 'number',
        description: 'Increment value',
        required: false
      }
    ],
    outputs: [
      {
        id: 'index',
        name: 'Index',
        type: 'number',
        description: 'Current loop index'
      }
    ],
    hasExecutionPorts: true,
    executionInputs: [
      {
        id: 'entry',
        name: 'In'
      }
    ],
    executionOutputs: [
      {
        id: 'body',
        name: 'Body'
      },
      {
        id: 'completed',
        name: 'Completed'
      }
    ]
  }
]; 