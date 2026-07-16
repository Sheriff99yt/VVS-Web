/** Inspector field schema for per-node settings (stored in node.data.properties). */

export type PropertyFieldType = 'string' | 'number' | 'boolean' | 'enum';

export interface PropertyFieldDefinition {
  key: string;
  label: string;
  type: PropertyFieldType;
  default?: string | number | boolean;
  /** Shown only when properties match (key → expected value or list of values). */
  when?: Record<string, string | number | boolean | Array<string | number | boolean>>;
  enumValues?: string[];
  description?: string;
}

export function isPropertyFieldVisible(
  field: PropertyFieldDefinition,
  properties: Record<string, unknown>
): boolean {
  if (!field.when) return true;
  for (const [key, expected] of Object.entries(field.when)) {
    const actual = properties[key];
    if (Array.isArray(expected)) {
      if (!expected.includes(actual as string | number | boolean)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

export function defaultPropertiesFromSchema(
  fields: PropertyFieldDefinition[] | undefined | null
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  if (!Array.isArray(fields)) return props;
  for (const field of fields) {
    if (field.default !== undefined) {
      props[field.key] = field.default;
    } else if (field.type === 'string') {
      props[field.key] = '';
    } else if (field.type === 'number') {
      props[field.key] = 0;
    } else if (field.type === 'boolean') {
      props[field.key] = false;
    } else if (field.type === 'enum' && field.enumValues?.[0]) {
      props[field.key] = field.enumValues[0];
    }
  }
  return props;
}

export function mergePropertyDefaults(
  fields: PropertyFieldDefinition[] | undefined,
  existing: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!Array.isArray(fields) || fields.length === 0) return { ...(existing ?? {}) };
  const defaults = defaultPropertiesFromSchema(fields);
  return { ...defaults, ...(existing ?? {}) };
}
