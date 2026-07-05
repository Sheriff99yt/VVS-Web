import type { PinType, SymbolParameter } from '@vvs/graph-types';

export function jsonSchemaTypeToPinType(schema: unknown): PinType {
  if (!schema || typeof schema !== 'object') return 'data_any';
  const s = schema as Record<string, unknown>;
  const t = s.type;
  if (t === 'string') return 'data_string';
  if (t === 'number' || t === 'integer') return 'data_number';
  if (t === 'boolean') return 'data_boolean';
  if (t === 'array') return 'data_array';
  if (t === 'object') return 'data_object';
  return 'data_any';
}

export function parametersFromJsonSchemaProperties(
  properties: Record<string, unknown> | undefined,
  prefix: string
): SymbolParameter[] {
  if (!properties) return [];
  return Object.entries(properties).map(([name, schema]) => {
    const s = schema as Record<string, unknown>;
    const label =
      typeof s.title === 'string' && s.title.trim()
        ? s.title.trim()
        : name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: `${prefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_'),
      label,
      type: jsonSchemaTypeToPinType(schema),
    };
  });
}

export function slugifyId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
