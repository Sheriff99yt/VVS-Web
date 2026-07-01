import { GraphVariable } from '@/types/graph';

export type VariableType = GraphVariable['type'];

export function defaultValueForVariableType(type: VariableType): GraphVariable['defaultValue'] {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    default:
      return '';
  }
}

export function coerceVariableDefaultValue(
  type: VariableType,
  value: GraphVariable['defaultValue']
): GraphVariable['defaultValue'] {
  if (type === 'object') {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }
  return defaultValueForVariableType(type);
}
