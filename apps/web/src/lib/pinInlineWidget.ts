import type { PinDefinition, PinType } from '@/types/graph';

export type PinInlineWidgetKind = 'checkbox' | 'number' | 'text';

/** Maps logical pin types to on-node inline editor widgets. */
export function pinInlineWidgetKind(pin: PinDefinition): PinInlineWidgetKind {
  switch (pin.type) {
    case 'data_boolean':
      return 'checkbox';
    case 'data_number':
      return 'number';
    case 'data_string':
    case 'data_any':
    case 'data_object':
    case 'data_array':
      return 'text';
    default:
      return 'text';
  }
}

export function defaultInlineValueForPinType(
  pinType: PinType
): string | number | boolean | undefined {
  switch (pinType) {
    case 'data_string':
    case 'data_any':
    case 'data_object':
    case 'data_array':
      return '';
    case 'data_number':
      return 0;
    case 'data_boolean':
      return false;
    default:
      return undefined;
  }
}

export function coerceInlineValue(
  pin: PinDefinition,
  raw: string | number | boolean
): string | number | boolean {
  const kind = pinInlineWidgetKind(pin);
  if (kind === 'checkbox') return Boolean(raw);
  if (kind === 'number') {
    if (typeof raw === 'number') return raw;
    const parsed = parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return String(raw);
}

export function inlineValueForDisplay(
  pin: PinDefinition,
  value: string | number | boolean | undefined
): string | number | boolean {
  if (value !== undefined && value !== null) return value;
  return defaultInlineValueForPinType(pin.type) ?? '';
}
