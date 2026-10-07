import { describe, expect, test } from 'bun:test';
import { resolve } from './registry';
import {
  defaultPropertiesFromSchema,
  isPropertyFieldVisible,
  mergePropertyDefaults,
  type PropertyFieldDefinition,
} from './propertySchema';

const SAMPLE_SCHEMA: PropertyFieldDefinition[] = [
  {
    key: 'inputKind',
    label: 'Input type',
    type: 'enum',
    enumValues: ['text', 'number'],
    default: 'text',
  },
  {
    key: 'hint',
    label: 'Hint',
    type: 'string',
    default: '',
    when: { inputKind: ['text'] },
  },
];

describe('propertySchema', () => {
  test('Set prefix field uses the Boolean inspector contract and preserves true edits', () => {
    const fields = resolve('variable_set')!.propertySchema!;
    expect(fields.find(field => field.key === 'prefix')?.type).toBe('boolean');
    expect(defaultPropertiesFromSchema(fields).prefix).toBe(false);
    expect(mergePropertyDefaults(fields, { prefix: true }).prefix).toBe(true);
  });
  test('defaultPropertiesFromSchema fills enum and string defaults', () => {
    expect(defaultPropertiesFromSchema(SAMPLE_SCHEMA)).toEqual({
      inputKind: 'text',
      hint: '',
    });
  });

  test('mergePropertyDefaults preserves user overrides', () => {
    expect(
      mergePropertyDefaults(SAMPLE_SCHEMA, { inputKind: 'number', hint: 'x' })
    ).toEqual({
      inputKind: 'number',
      hint: 'x',
    });
  });

  test('defaultPropertiesFromSchema tolerates non-array schema', () => {
    expect(defaultPropertiesFromSchema(undefined)).toEqual({});
    expect(defaultPropertiesFromSchema(null)).toEqual({});
    expect(
      mergePropertyDefaults({ targetClassId: { type: 'string' } } as unknown as PropertyFieldDefinition[], {
        alias: 'X',
      })
    ).toEqual({ alias: 'X' });
  });
});
