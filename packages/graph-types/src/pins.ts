export type PinType =
  | 'execution'
  | 'data_string'
  | 'data_number'
  | 'data_boolean'
  | 'data_object'
  | 'data_array'
  | 'data_any';

export type LogicalPinType = PinType;

export interface PinDefinition {
  id: string;
  label: string;
  type: PinType;
  required?: boolean;
}
