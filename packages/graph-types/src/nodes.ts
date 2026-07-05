import type { PinDefinition, PinType } from './pins';

export interface GraphBinding {
  kind:
    | 'call_function'
    | 'use_macro'
    | 'import_module'
    | 'variable_ref'
    | 'env_native'
    | 'env_event';
  symbolId: string;
  overloadId?: string;
  /** Manifest method id for env_native / overrideable handlers */
  manifestMethodId?: string;
  /** Manifest event id for env_event handlers */
  manifestEventId?: string;
}

export interface VVSNodeData {
  label: string;
  description?: string;
  category: string;
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  inlineValues: Record<string, string | number | boolean>;
  properties?: Record<string, unknown>;
  pinType?: PinType;
  isSimulating?: boolean;
  commentColor?: string;
  kindId?: string;
  kindVersion?: number;
  /** @deprecated use graphBinding */
  linkedGraphId?: string;
  /** @deprecated use graphBinding */
  linkKind?: GraphBinding['kind'];
  graphBinding?: GraphBinding;
  /** Snapshot of registry ports at spawn time (hybrid resolved ports). */
  resolvedPorts?: { inputs: PinDefinition[]; outputs: PinDefinition[] };
  [key: string]: unknown;
}

export interface VVSEdgeData {
  pinType: PinType;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  type: 'vvs_standard_node' | 'vvs_comment_node' | 'vvs_reroute_node' | string;
  position: { x: number; y: number };
  data: VVSNodeData;
  [key: string]: unknown;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: VVSEdgeData;
  [key: string]: unknown;
}
