import type { PinType } from './pins';
import type { PortabilityFeature } from './symbols';

/**
 * Display naming policy (user-facing labels only — internal ids stay `data_*`):
 * 1. Python builtins / typing names first (`str`, `bool`, `list`, `dict`, `Any`, `None`).
 * 2. If Python has no single name for a concept, use a C++-familiar name shared by many languages (`float`).
 * 3. Graph-only concepts use product vocabulary (`flow` for execution wires).
 * 4. Language-unique emitter types stay in Stage C only — never on the canvas.
 */

export interface LogicalTypeDisplay {
  label: string;
  shortLabel: string;
  description: string;
}

const PIN_DISPLAY: Record<PinType, LogicalTypeDisplay> = {
  execution: {
    label: 'flow',
    shortLabel: 'flow',
    description: 'Execution sequence between nodes (visual scripting only — not a Python/C++ value type).',
  },
  data_string: {
    label: 'str',
    shortLabel: 'str',
    description: 'Text — maps to str, string, std::string, Verse string, etc.',
  },
  data_number: {
    label: 'float',
    shortLabel: 'float',
    description:
      'Numeric values (ints and floats). Python has separate int/float; emitter picks int or float per target.',
  },
  data_boolean: {
    label: 'bool',
    shortLabel: 'bool',
    description: 'True/false — maps to bool, boolean, logic (Verse), etc.',
  },
  data_object: {
    label: 'dict',
    shortLabel: 'dict',
    description: 'Key-value data — maps to dict, object literals, std::map-style emit, etc.',
  },
  data_array: {
    label: 'list',
    shortLabel: 'list',
    description: 'Ordered collections — maps to list, Array, std::vector, etc.',
  },
  data_any: {
    label: 'Any',
    shortLabel: 'Any',
    description: 'Loosely typed (typing.Any) — weak or unsupported on strict targets.',
  },
};

export function pinTypeDisplayName(type: PinType): string {
  return PIN_DISPLAY[type]?.label ?? type;
}

export function pinTypeShortLabel(type: PinType): string {
  return PIN_DISPLAY[type]?.shortLabel ?? type;
}

export function pinTypeDescription(type: PinType): string {
  return PIN_DISPLAY[type]?.description ?? '';
}

/** Python `None` — function return / no value. */
export const PYTHON_NONE_LABEL = 'None';

export type DataPinType = Exclude<PinType, 'execution'>;

export const DATA_PIN_TYPE_OPTIONS: { value: DataPinType; label: string }[] = [
  'data_string',
  'data_number',
  'data_boolean',
  'data_object',
  'data_array',
  'data_any',
].map((value) => ({
  value: value as DataPinType,
  label: pinTypeDisplayName(value as PinType),
}));

export const FUNCTION_RETURN_TYPE_OPTIONS: { value: PinType | 'void'; label: string }[] = [
  { value: 'void', label: PYTHON_NONE_LABEL },
  ...DATA_PIN_TYPE_OPTIONS,
];

export function portabilityFeatureForDataPin(
  id: DataPinType
): PortabilityFeature | undefined {
  if (id === 'data_object') return 'type.data_object';
  if (id === 'data_array') return 'type.data_array';
  if (id === 'data_any') return 'type.data_any';
  return undefined;
}

export function logicalDataTypeDescriptor(id: DataPinType): LogicalTypeDisplay & {
  id: DataPinType;
  portabilityFeature?: PortabilityFeature;
} {
  const display = PIN_DISPLAY[id];
  const portabilityFeature = portabilityFeatureForDataPin(id);
  return {
    id,
    ...display,
    portabilityFeature,
  };
}
