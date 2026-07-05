import { describe, expect, test } from 'bun:test';
import {
  defaultPropertiesFromSchema,
  isPropertyFieldVisible,
  mergePropertyDefaults,
  type PropertyFieldDefinition,
} from './propertySchema';

const GET_INPUT_SCHEMA: PropertyFieldDefinition[] = [
  {
    key: 'inputKind',
    label: 'Input type',
    type: 'enum',
    enumValues: ['text', 'number', 'password'],
    default: 'text',
  },
  {
    key: 'placeholder',
    label: 'Placeholder',
    type: 'string',
    default: '',
    when: { inputKind: ['text', 'password'] },
  },
];

describe('propertySchema', () => {
  test('defaultPropertiesFromSchema fills enum and string defaults', () => {
    expect(defaultPropertiesFromSchema(GET_INPUT_SCHEMA)).toEqual({
      inputKind: 'text',
      placeholder: '',
    });
  });

  test('mergePropertyDefaults preserves user overrides', () => {
    expect(
      mergePropertyDefaults(GET_INPUT_SCHEMA, { inputKind: 'number', placeholder: 'x' })
    ).toEqual({
      inputKind: 'number',
      placeholder: 'x',
    });
  });

  test('isPropertyFieldVisible respects when clauses', () => {
    const placeholder = GET_INPUT_SCHEMA[1]!;
    expect(isPropertyFieldVisible(placeholder, { inputKind: 'text' })).toBe(true);
    expect(isPropertyFieldVisible(placeholder, { inputKind: 'number' })).toBe(false);
  });
});
