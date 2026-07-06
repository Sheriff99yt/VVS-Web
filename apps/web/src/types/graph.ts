import type {
  PinType,
  PinDefinition,
  VVSNodeData,
  VVSEdgeData,
  GraphVariable,
  VariableSymbol,
  VariableDataType,
  VariableBinding,
  ProjectEventDefinition,
  SymbolParameter,
  FunctionSymbol,
  ClassSymbol,
  SymbolVisibility,
  GraphBinding,
  TargetLanguage,
  GraphTab,
} from '@vvs/graph-types';
import type { Node, Edge } from '@xyflow/react';

export type {
  PinType,
  PinDefinition,
  VVSNodeData,
  VVSEdgeData,
  GraphVariable,
  VariableSymbol,
  VariableDataType,
  VariableBinding,
  ProjectEventDefinition,
  SymbolParameter,
  FunctionSymbol,
  ClassSymbol,
  SymbolVisibility,
  GraphBinding,
  TargetLanguage,
  GraphTab,
};

export type VVSNode =
  | Node<VVSNodeData, 'vvs_standard_node'>
  | Node<VVSNodeData, 'vvs_comment_node'>
  | Node<VVSNodeData, 'vvs_reroute_node'>;
export type VVSEdge = Edge<VVSEdgeData>;

/** @deprecated use SymbolParameter */
export type EventParameter = SymbolParameter;
