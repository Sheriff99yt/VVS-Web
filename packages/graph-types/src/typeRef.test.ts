import { describe, expect, test } from 'bun:test';
import {
  collectProjectEnumTypes,
  parseTypeRef,
  parseTypeRefPickerValue,
  resolveTypeRef,
  syncTypeFieldsFromRef,
  typeRefDisplayName,
  typeRefPickerValue,
  typeRefToPinType,
} from './typeRef';

describe('TypeRef', () => {
  test('migrates enumType overlay via resolveTypeRef', () => {
    const ref = resolveTypeRef({ type: 'data_any', enumType: 'SensorStatus' });
    expect(ref).toEqual({ kind: 'enum', name: 'SensorStatus' });
    expect(typeRefToPinType(ref)).toBe('data_any');
  });

  test('prefers typeRef over enumType', () => {
    const ref = resolveTypeRef({
      type: 'data_any',
      enumType: 'Old',
      typeRef: { kind: 'enum', name: 'SensorStatus' },
    });
    expect(ref).toEqual({ kind: 'enum', name: 'SensorStatus' });
  });

  test('syncTypeFieldsFromRef sets enumType mirror', () => {
    const fields = syncTypeFieldsFromRef({ kind: 'enum', name: 'SensorStatus' });
    expect(fields.type).toBe('data_any');
    expect(fields.enumType).toBe('SensorStatus');
  });

  test('picker round-trip for builtin and enum', () => {
    const builtin = { kind: 'builtin' as const, id: 'data_number' as const };
    expect(parseTypeRefPickerValue(typeRefPickerValue(builtin))).toEqual(builtin);
    const enm = { kind: 'enum' as const, name: 'SensorStatus' };
    expect(parseTypeRefPickerValue(typeRefPickerValue(enm))).toEqual(enm);
  });

  test('array and map picker values', () => {
    const arr = { kind: 'array' as const, of: { kind: 'enum' as const, name: 'SensorStatus' } };
    expect(typeRefDisplayName(arr)).toBe('list[SensorStatus]');
    expect(parseTypeRefPickerValue(typeRefPickerValue(arr))).toEqual(arr);

    const map = {
      kind: 'map' as const,
      key: { kind: 'builtin' as const, id: 'data_string' as const },
      value: { kind: 'builtin' as const, id: 'data_number' as const },
    };
    expect(parseTypeRefPickerValue(typeRefPickerValue(map))).toEqual(map);
  });

  test('parseTypeRef rejects invalid', () => {
    expect(parseTypeRef(null)).toBeUndefined();
    expect(parseTypeRef({ kind: 'enum', name: '' })).toBeUndefined();
  });

  test('collectProjectEnumTypes from enum_define nodes', () => {
    const enums = collectProjectEnumTypes({
      main: {
        nodes: [
          {
            data: {
              kindId: 'enum_define',
              properties: { name: 'SensorStatus', symbolId: 'enum-SensorStatus', members: ['OK', 'WARN'] },
            },
          },
        ],
      },
    });
    expect(enums).toEqual([
      { id: 'enum-SensorStatus', name: 'SensorStatus', members: ['OK', 'WARN'] },
    ]);
  });
});
