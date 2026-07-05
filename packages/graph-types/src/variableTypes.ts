import type { PinType } from './pins';
import type { PortabilityFeature } from './symbols';
import { logicalDataTypeDescriptor } from './typeNaming';

/** Logical data types for project variables (language-neutral wire types). */
export type VariableDataType = Extract<
  PinType,
  'data_string' | 'data_number' | 'data_boolean' | 'data_object' | 'data_array' | 'data_any'
>;

export const VARIABLE_DATA_TYPES: readonly VariableDataType[] = [
  'data_string',
  'data_number',
  'data_boolean',
  'data_object',
  'data_array',
  'data_any',
] as const;

export interface LogicalDataTypeDescriptor {
  id: VariableDataType;
  label: string;
  shortLabel: string;
  description: string;
  portabilityFeature?: PortabilityFeature;
}

export const LOGICAL_DATA_TYPE_DESCRIPTORS: readonly LogicalDataTypeDescriptor[] =
  VARIABLE_DATA_TYPES.map((id) => logicalDataTypeDescriptor(id));

const LEGACY_TYPE_MAP: Record<string, VariableDataType> = {
  string: 'data_string',
  number: 'data_number',
  boolean: 'data_boolean',
  object: 'data_object',
  array: 'data_array',
  any: 'data_any',
};

export function isVariableDataType(value: unknown): value is VariableDataType {
  return typeof value === 'string' && VARIABLE_DATA_TYPES.includes(value as VariableDataType);
}

export function legacyVariableTypeToDataType(legacy: string): VariableDataType {
  if (isVariableDataType(legacy)) return legacy;
  return LEGACY_TYPE_MAP[legacy] ?? 'data_string';
}

export function variableDataTypeToLegacyEmitKind(
  type: VariableDataType
): 'string' | 'number' | 'boolean' | 'object' {
  switch (type) {
    case 'data_string':
      return 'string';
    case 'data_number':
      return 'number';
    case 'data_boolean':
      return 'boolean';
    default:
      return 'object';
  }
}

export function portabilityFeaturesForDataType(type: VariableDataType): PortabilityFeature[] {
  const descriptor = LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === type);
  return descriptor?.portabilityFeature ? [descriptor.portabilityFeature] : [];
}

export function defaultValueForDataType(type: VariableDataType): unknown {
  switch (type) {
    case 'data_string':
      return '';
    case 'data_number':
      return 0;
    case 'data_boolean':
      return false;
    case 'data_object':
      return {};
    case 'data_array':
      return [];
    case 'data_any':
      return null;
    default:
      return '';
  }
}
