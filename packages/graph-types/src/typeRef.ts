import type { PinType } from './pins';
import {
  defaultValueForDataType,
  isVariableDataType,
  type VariableDataType,
} from './variableTypes';
import { pinTypeDisplayName } from './typeNaming';

/**
 * Canonical type identity for pins/variables — matches what emit prints.
 * Built-ins come from the type system; enum/class from canvas define nodes.
 */
export type TypeRef =
  | { kind: 'builtin'; id: VariableDataType }
  | { kind: 'enum'; name: string; enumId?: string }
  | { kind: 'class'; classId: string; name?: string }
  | { kind: 'array'; of: TypeRef }
  | { kind: 'map'; key: TypeRef; value: TypeRef };

export interface ProjectEnumType {
  /** Canvas `enum_define` symbolId when present. */
  id: string;
  name: string;
  members: string[];
}

export interface ProjectClassType {
  classId: string;
  name: string;
}

/** Wire pin type for edge compatibility (enums/classes use data_any / data_object). */
export function typeRefToPinType(ref: TypeRef): VariableDataType {
  switch (ref.kind) {
    case 'builtin':
      return ref.id;
    case 'enum':
      return 'data_any';
    case 'class':
      return 'data_object';
    case 'array':
      return 'data_array';
    case 'map':
      return 'data_object';
  }
}

export function typeRefDisplayName(ref: TypeRef, classNameById?: Map<string, string>): string {
  switch (ref.kind) {
    case 'builtin':
      return pinTypeDisplayName(ref.id as PinType);
    case 'enum':
      return ref.name;
    case 'class':
      return ref.name ?? classNameById?.get(ref.classId) ?? ref.classId;
    case 'array':
      return `list[${typeRefDisplayName(ref.of, classNameById)}]`;
    case 'map':
      return `dict[${typeRefDisplayName(ref.key, classNameById)}, ${typeRefDisplayName(ref.value, classNameById)}]`;
  }
}

export function isEnumTypeRef(ref: TypeRef | undefined | null): ref is Extract<TypeRef, { kind: 'enum' }> {
  return ref?.kind === 'enum';
}

export function enumNameFromTypeRef(ref: TypeRef | undefined | null): string | undefined {
  return ref?.kind === 'enum' && ref.name.trim() ? ref.name.trim() : undefined;
}

export function parseTypeRef(raw: unknown): TypeRef | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const item = raw as Record<string, unknown>;
  const kind = item.kind;
  if (kind === 'builtin' && isVariableDataType(item.id)) {
    return { kind: 'builtin', id: item.id };
  }
  if (kind === 'enum' && typeof item.name === 'string' && item.name.trim()) {
    return {
      kind: 'enum',
      name: item.name.trim(),
      ...(typeof item.enumId === 'string' && item.enumId ? { enumId: item.enumId } : {}),
    };
  }
  if (kind === 'class' && typeof item.classId === 'string' && item.classId) {
    return {
      kind: 'class',
      classId: item.classId,
      ...(typeof item.name === 'string' && item.name ? { name: item.name } : {}),
    };
  }
  if (kind === 'array') {
    const of = parseTypeRef(item.of);
    if (of) return { kind: 'array', of };
  }
  if (kind === 'map') {
    const key = parseTypeRef(item.key);
    const value = parseTypeRef(item.value);
    if (key && value) return { kind: 'map', key, value };
  }
  return undefined;
}

/** Encode TypeRef for SearchableSelect string values. */
export function typeRefPickerValue(ref: TypeRef): string {
  switch (ref.kind) {
    case 'builtin':
      return ref.id;
    case 'enum':
      return `enum:${ref.name}`;
    case 'class':
      return `class:${ref.classId}`;
    case 'array':
      return `array:${typeRefPickerValue(ref.of)}`;
    case 'map':
      return `map:${typeRefPickerValue(ref.key)}:${typeRefPickerValue(ref.value)}`;
  }
}

export function parseTypeRefPickerValue(value: string): TypeRef | undefined {
  if (!value) return undefined;
  if (isVariableDataType(value)) return { kind: 'builtin', id: value };
  if (value.startsWith('enum:')) {
    const name = value.slice('enum:'.length).trim();
    return name ? { kind: 'enum', name } : undefined;
  }
  if (value.startsWith('class:')) {
    const classId = value.slice('class:'.length).trim();
    return classId ? { kind: 'class', classId } : undefined;
  }
  if (value.startsWith('array:')) {
    const of = parseTypeRefPickerValue(value.slice('array:'.length));
    return of ? { kind: 'array', of } : undefined;
  }
  if (value.startsWith('map:')) {
    const parts = splitMapPickerParts(value.slice('map:'.length));
    if (!parts) return undefined;
    const key = parseTypeRefPickerValue(parts[0]);
    const val = parseTypeRefPickerValue(parts[1]);
    if (key && val) return { kind: 'map', key, value: val };
  }
  return undefined;
}

/** Split `keyEnc:valueEnc` where encodings may themselves contain `:`. */
function splitMapPickerParts(rest: string): [string, string] | undefined {
  for (const prefix of [
    'data_string',
    'data_number',
    'data_boolean',
    'data_object',
    'data_array',
    'data_any',
  ]) {
    if (rest.startsWith(`${prefix}:`)) {
      return [prefix, rest.slice(prefix.length + 1)];
    }
  }
  for (const p of ['enum:', 'class:']) {
    if (!rest.startsWith(p)) continue;
    const after = rest.slice(p.length);
    const colon = after.indexOf(':');
    if (colon <= 0) continue;
    return [rest.slice(0, p.length + colon), rest.slice(p.length + colon + 1)];
  }
  if (rest.startsWith('array:')) {
    // Nested arrays in map keys are rare; take last top-level split via recursive try.
    for (let i = rest.length - 1; i > 0; i--) {
      if (rest[i] !== ':') continue;
      const left = rest.slice(0, i);
      const right = rest.slice(i + 1);
      if (parseTypeRefPickerValue(left) && parseTypeRefPickerValue(right)) {
        return [left, right];
      }
    }
  }
  return undefined;
}

export function defaultValueForTypeRef(ref: TypeRef): unknown {
  switch (ref.kind) {
    case 'builtin':
      return defaultValueForDataType(ref.id);
    case 'enum':
      return '';
    case 'class':
      return null;
    case 'array':
      return [];
    case 'map':
      return {};
  }
}

export type TypeRefBearing = {
  type: VariableDataType;
  typeRef?: TypeRef;
  enumType?: string;
};

/**
 * Resolve effective TypeRef from symbol fields (typeRef preferred; migrate enumType overlay).
 */
export function resolveTypeRef(symbol: TypeRefBearing): TypeRef {
  const parsed = parseTypeRef(symbol.typeRef);
  if (parsed) return parsed;
  if (typeof symbol.enumType === 'string' && symbol.enumType.trim()) {
    return { kind: 'enum', name: symbol.enumType.trim() };
  }
  return { kind: 'builtin', id: symbol.type };
}

/** Sync `type` / `enumType` mirrors from a TypeRef (legacy dual-write). */
export function syncTypeFieldsFromRef(typeRef: TypeRef): {
  type: VariableDataType;
  typeRef: TypeRef;
  enumType: string | undefined;
} {
  return {
    type: typeRefToPinType(typeRef),
    typeRef,
    enumType: enumNameFromTypeRef(typeRef),
  };
}

export function collectProjectEnumTypes(
  documents: Record<string, { nodes: Array<{ data?: { kindId?: string; properties?: Record<string, unknown> } }> }>
): ProjectEnumType[] {
  const byName = new Map<string, ProjectEnumType>();
  for (const doc of Object.values(documents)) {
    for (const node of doc.nodes) {
      if (node.data?.kindId !== 'enum_define') continue;
      const props = node.data.properties ?? {};
      const name = typeof props.name === 'string' ? props.name.trim() : '';
      if (!name) continue;
      const id =
        typeof props.symbolId === 'string' && props.symbolId.trim()
          ? props.symbolId.trim()
          : `enum-${name}`;
      const members = Array.isArray(props.members)
        ? props.members.filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
        : [];
      byName.set(name, { id, name, members });
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function collectProjectClassTypes(
  classes: Array<{ id: string; name: string }>
): ProjectClassType[] {
  return classes
    .map((c) => ({ classId: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
