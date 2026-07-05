import type { PinDefinition, PinType } from '@/types/graph';
import { pinTypeDescription, pinTypeDisplayName } from '@vvs/graph-types';

export function pinTypeLabel(type: PinType): string {
  return pinTypeDisplayName(type);
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
  return `Output (${pinTypeDescription(pin.type) || pinTypeLabel(pin.type)}) passed to downstream pins.`;
}
