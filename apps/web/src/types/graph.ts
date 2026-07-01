import { Node, Edge } from '@xyflow/react';

// The strictly typed pins (connection points) for nodes
export type PinType =
  | 'execution'
  | 'data_string'
  | 'data_number'
  | 'data_boolean'
  | 'data_object'
  | 'data_array'
  | 'data_any';

export interface PinDefinition {
  id: string;          // e.g., 'in_exec', 'in_val_1'
  label: string;       // e.g., 'Execute', 'A'
  type: PinType;
  required?: boolean;
}

// The internal data payload for every node in the graph
export interface VVSNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  category: string;    // e.g., 'Events', 'Math', 'Flow Control'
  
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  
  // Stores inline values provided by the user if an input pin has no incoming edge connected.
  inlineValues: Record<string, string | number | boolean>;

  /** Reroute nodes: pin type carried through the wire */
  pinType?: PinType;
  /** Simulation highlight (mock stepping UI) */
  isSimulating?: boolean;
  /** Comment box accent color (hex) */
  commentColor?: string;

  /** Target graph for call/import nodes */
  linkedGraphId?: string;
  /** How this node links to another graph */
  linkKind?: 'call_function' | 'use_macro' | 'import_module';
}

export interface VVSEdgeData extends Record<string, unknown> {
  // Useful for styling the edge curve (e.g. white for execution, green for numbers)
  pinType: PinType;
}

// Concrete types mapped to Xyflow
export type VVSNode =
  | Node<VVSNodeData, 'vvs_standard_node'>
  | Node<VVSNodeData, 'vvs_comment_node'>
  | Node<VVSNodeData, 'vvs_reroute_node'>;
export type VVSEdge = Edge<VVSEdgeData>;

export interface GraphVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  defaultValue?: unknown;
}
