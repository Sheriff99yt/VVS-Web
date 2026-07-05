import type { PinDefinition, PinType } from '@/types/graph';

const PIN_TYPE_LABEL: Record<PinType, string> = {
  execution: 'Exec',
  data_string: 'Text',
  data_number: 'Number',
  data_boolean: 'Bool',
  data_object: 'Object',
  data_array: 'Array',
  data_any: 'Any',
};

export function pinTypeLabel(type: PinType): string {
  return PIN_TYPE_LABEL[type] ?? type;
}

export function pinRoleHint(pin: PinDefinition, direction: 'input' | 'output'): string {
  if (pin.type === 'execution') {
    return direction === 'input'
      ? 'Single flow in — a new wire replaces the previous upstream link.'
      : 'Single flow out — one next step; use a function for shared logic.';
  }
  if (direction === 'input') {
    return 'Value wired in or set below when nothing is connected.';
  }
  return 'Output passed to downstream data pins.';
}
