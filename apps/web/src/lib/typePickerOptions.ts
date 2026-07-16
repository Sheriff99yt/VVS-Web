import type { ClassSymbol, TypeRef } from '@vvs/graph-types';
import {
  LOGICAL_DATA_TYPE_DESCRIPTORS,
  collectProjectClassTypes,
  collectProjectEnumTypes,
  parseTypeRefPickerValue,
  syncTypeFieldsFromRef,
  typeRefDisplayName,
  typeRefPickerValue,
  defaultValueForTypeRef,
} from '@vvs/graph-types';

export interface TypePickerOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

export function buildTypePickerOptions(input: {
  documents?: Record<string, { nodes: Array<{ data?: { kindId?: string; properties?: Record<string, unknown> } }> }>;
  classes?: ClassSymbol[];
  /** Include class types (Phase 2). Default true when classes provided. */
  includeClasses?: boolean;
  /** Include Array/Map of builtins+enums+classes. Default true. */
  includeContainers?: boolean;
  /** Optional COA label suffix helper. */
  formatBuiltinLabel?: (id: string, label: string) => string;
}): TypePickerOption[] {
  const options: TypePickerOption[] = [];
  const formatBuiltin =
    input.formatBuiltinLabel ?? ((_, label: string) => label);

  for (const descriptor of LOGICAL_DATA_TYPE_DESCRIPTORS) {
    options.push({
      value: descriptor.id,
      label: formatBuiltin(descriptor.id, descriptor.label),
      description: descriptor.description,
      group: 'Built-in',
    });
  }

  const enums = input.documents ? collectProjectEnumTypes(input.documents) : [];
  for (const enm of enums) {
    options.push({
      value: typeRefPickerValue({ kind: 'enum', name: enm.name, enumId: enm.id }),
      label: enm.name,
      description: enm.members.length
        ? `Enum — ${enm.members.join(', ')}`
        : 'Project enum (from Declare Enum on canvas)',
      group: 'Enums',
    });
  }

  const includeClasses = input.includeClasses ?? Boolean(input.classes?.length);
  if (includeClasses && input.classes?.length) {
    for (const cls of collectProjectClassTypes(input.classes)) {
      options.push({
        value: typeRefPickerValue({ kind: 'class', classId: cls.classId, name: cls.name }),
        label: cls.name,
        description: 'Class type (from Declare Class on canvas)',
        group: 'Classes',
      });
    }
  }

  if (input.includeContainers ?? true) {
    // Container templates over builtins + project enums/classes (not nested containers).
    const elementRefs: TypeRef[] = [
      ...LOGICAL_DATA_TYPE_DESCRIPTORS.filter((d) => d.id !== 'data_array' && d.id !== 'data_object').map(
        (d) => ({ kind: 'builtin' as const, id: d.id })
      ),
      ...enums.map((e) => ({ kind: 'enum' as const, name: e.name, enumId: e.id })),
      ...(includeClasses && input.classes
        ? collectProjectClassTypes(input.classes).map((c) => ({
            kind: 'class' as const,
            classId: c.classId,
            name: c.name,
          }))
        : []),
    ];
    for (const of of elementRefs) {
      const arr: TypeRef = { kind: 'array', of };
      options.push({
        value: typeRefPickerValue(arr),
        label: typeRefDisplayName(arr),
        description: 'Typed list / array',
        group: 'Containers',
      });
    }
    for (const key of elementRefs.filter((r) => r.kind === 'builtin')) {
      for (const value of elementRefs) {
        const map: TypeRef = { kind: 'map', key, value };
        options.push({
          value: typeRefPickerValue(map),
          label: typeRefDisplayName(map),
          description: 'Typed map / dictionary',
          group: 'Containers',
        });
      }
    }
  }

  return options;
}

export function applyPickerValueToVariableFields(pickerValue: string): {
  type: ReturnType<typeof syncTypeFieldsFromRef>['type'];
  typeRef: TypeRef;
  enumType: string | undefined;
  defaultValue: unknown;
} | null {
  const typeRef = parseTypeRefPickerValue(pickerValue);
  if (!typeRef) return null;
  const synced = syncTypeFieldsFromRef(typeRef);
  return {
    ...synced,
    defaultValue: defaultValueForTypeRef(typeRef),
  };
}

export function variableTypePickerValue(variable: {
  type: string;
  typeRef?: TypeRef;
  enumType?: string;
}): string {
  if (variable.typeRef) return typeRefPickerValue(variable.typeRef);
  if (variable.enumType?.trim()) {
    return typeRefPickerValue({ kind: 'enum', name: variable.enumType.trim() });
  }
  return variable.type;
}
