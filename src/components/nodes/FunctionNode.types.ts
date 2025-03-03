import { NodeProps } from 'reactflow';

export interface ExecutionData {
  isControlFlow?: boolean;
  executionInputs?: Array<{
    id: string;
    name: string;
  }>;
  executionOutputs?: Array<{
    id: string;
    name: string;
  }>;
}

export interface FunctionNodeData {
  label: string;
  description?: string;
  category?: string;
  inputs: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    required: boolean;
  }>;
  outputs: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
  }>;
  isSelected?: boolean;
  executionData?: ExecutionData;
}

export type FunctionNodeProps = NodeProps<FunctionNodeData>; 