import type { VariableDataType, VariableSymbol } from '@vvs/graph-types';
import {
  defaultValueForDataType,
  legacyVariableTypeToDataType,
} from '@vvs/graph-types';

export type VariableType = VariableDataType;

export function defaultValueForVariableType(type: VariableType): VariableSymbol['defaultValue'] {
  return defaultValueForDataType(type);
}

export function coerceVariableDefaultValue(
  type: VariableType,
  value: VariableSymbol['defaultValue']
): VariableSymbol['defaultValue'] {
  if (type === 'data_object') {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }
  if (type === 'data_array') {
    return Array.isArray(value) ? value : [];
  }
  if (type === 'data_any') {
    return value ?? null;
  }
  return defaultValueForDataType(type);
}

/** @deprecated legacy snapshot values */
export function normalizeVariableTypeInput(value: string): VariableDataType {
  return legacyVariableTypeToDataType(value);
}
