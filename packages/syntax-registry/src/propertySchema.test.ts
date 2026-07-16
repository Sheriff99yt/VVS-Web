import { describe, expect, test } from 'bun:test';
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

  test('isPropertyFieldVisible respects when clauses', () => {
    const hint = SAMPLE_SCHEMA[1]!;
    expect(isPropertyFieldVisible(hint, { inputKind: 'text' })).toBe(true);
    expect(isPropertyFieldVisible(hint, { inputKind: 'number' })).toBe(false);
  });
});
