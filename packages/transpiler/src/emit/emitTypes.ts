import type { PinType, TargetLanguage, TypeRef, VariableDataType } from '@vvs/graph-types';
import {
  variableDataTypeToLegacyEmitKind,
  isVariableDataType,
  parseTypeRef,
  resolveTypeRef,
} from '@vvs/graph-types';

/**
 * Resolve a language type name from a canvas TypeRef / pin / symbol type.
 * Emit must not invent float/f64 — callers pass the type from the define node or parameter.
 */
export function typeNameForTypeRef(
  typeRef: TypeRef | undefined,
  targetLanguage: TargetLanguage
): string {
  if (!typeRef) return typeNameForPin('data_number', targetLanguage);
  switch (typeRef.kind) {
    case 'enum':
      return typeRef.name;
    case 'class':
      return typeRef.name?.trim() || typeRef.classId;
    case 'array': {
      const elem = typeNameForTypeRef(typeRef.of, targetLanguage);
      if (targetLanguage === 'cpp') return `std::vector<${elem}>`;
      if (targetLanguage === 'csharp') return `List<${elem}>`;
      if (targetLanguage === 'rust') return `Vec<${elem}>`;
      if (targetLanguage === 'python') return `list[${elem}]`;
      if (targetLanguage === 'javascript') return `Array<${elem}>`;
      if (targetLanguage === 'gdscript') return `Array[${elem}]`;
      if (targetLanguage === 'verse') return `[]${elem}`;
      return `list[${elem}]`;
    }
    case 'map': {
      const key = typeNameForTypeRef(typeRef.key, targetLanguage);
      const val = typeNameForTypeRef(typeRef.value, targetLanguage);
      if (targetLanguage === 'cpp') return `std::unordered_map<${key}, ${val}>`;
      if (targetLanguage === 'csharp') return `Dictionary<${key}, ${val}>`;
      if (targetLanguage === 'rust') return `HashMap<${key}, ${val}>`;
      if (targetLanguage === 'python') return `dict[${key}, ${val}]`;
      if (targetLanguage === 'javascript') return `Map<${key}, ${val}>`;
      if (targetLanguage === 'gdscript') return 'Dictionary';
      if (targetLanguage === 'verse') return `[${key}]${val}`;
      return `dict[${key}, ${val}]`;
    }
    case 'builtin':
      return typeNameForPin(typeRef.id, targetLanguage);
  }
}

/**
 * Resolve a language type name from a canvas pin / symbol type.
 * Emit must not invent float/f64 — callers pass the pin type from the define node or parameter.
 */
export function typeNameForPin(
  pinType: PinType | VariableDataType | string | undefined,
  targetLanguage: TargetLanguage
): string {
  const dataType: VariableDataType = isVariableDataType(pinType)
    ? pinType
    : pinType === 'execution'
      ? 'data_any'
      : 'data_number';

  if (dataType === 'data_array') {
    if (targetLanguage === 'cpp') return 'std::vector<float>';
    if (targetLanguage === 'csharp') return 'List<float>';
    if (targetLanguage === 'rust') return 'Vec<f32>';
    if (targetLanguage === 'python') return 'list';
    if (targetLanguage === 'javascript') return 'Array';
    if (targetLanguage === 'gdscript') return 'Array';
    if (targetLanguage === 'verse') return '[]float';
    return 'list';
  }

  const emitKind = variableDataTypeToLegacyEmitKind(dataType);

  if (targetLanguage === 'cpp') {
    return emitKind === 'number'
      ? 'float'
      : emitKind === 'string'
        ? 'std::string'
        : emitKind === 'boolean'
          ? 'bool'
          : 'auto';
  }
  if (targetLanguage === 'csharp') {
    return emitKind === 'number'
      ? 'float'
      : emitKind === 'string'
        ? 'string'
        : emitKind === 'boolean'
          ? 'bool'
          : 'var';
  }
  if (targetLanguage === 'rust') {
    return emitKind === 'number'
      ? 'f32'
      : emitKind === 'string'
        ? 'String'
        : emitKind === 'boolean'
          ? 'bool'
          : 'Any';
  }
  if (targetLanguage === 'gdscript') {
    return emitKind === 'number'
      ? 'float'
      : emitKind === 'string'
        ? 'String'
        : emitKind === 'boolean'
          ? 'bool'
          : 'Variant';
  }
  if (targetLanguage === 'verse') {
    if (emitKind === 'number') return 'float';
    if (emitKind === 'string') return 'string';
    if (emitKind === 'boolean') return 'logic';
    return 'any';
  }
  if (emitKind === 'number') return 'number';
  if (emitKind === 'string') return 'string';
  if (emitKind === 'boolean') return 'boolean';
  return 'any';
}

/** Typed param fragment (`float x`, `x: f32`, `x : float`, or bare `x` for untyped langs). */
export function typedParamFragment(
  name: string,
  pinType: PinType | VariableDataType | string | TypeRef | undefined,
  targetLanguage: TargetLanguage
): string {
  if (
    targetLanguage === 'python' ||
    targetLanguage === 'javascript' ||
    targetLanguage === 'gdscript'
  ) {
    return name;
  }
  const asRef = parseTypeRef(pinType);
  const t = asRef
    ? typeNameForTypeRef(asRef, targetLanguage)
    : typeNameForPin(pinType as PinType | VariableDataType | string | undefined, targetLanguage);
  if (targetLanguage === 'rust') return `${name}: ${t}`;
  if (targetLanguage === 'verse') return `${name} : ${t}`;
  return `${t} ${name}`;
}

/** Prefer TypeRef; fall back to pin/enumType fields. */
export function typeNameFromSymbolFields(
  symbol: { type: VariableDataType; typeRef?: TypeRef; enumType?: string },
  targetLanguage: TargetLanguage
): string {
  return typeNameForTypeRef(resolveTypeRef(symbol), targetLanguage);
}
