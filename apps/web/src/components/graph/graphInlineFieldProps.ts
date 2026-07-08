import type { FocusEvent, KeyboardEvent, SyntheticEvent, WheelEvent } from 'react';
import { GRAPH_WHEEL_SHIELD_CLASS } from './useBlockCanvasWheel';

export function stopGraphBubble(event: SyntheticEvent) {
  event.stopPropagation();
}

export function handleInlineFieldWheel(event: WheelEvent<HTMLElement>) {
  event.stopPropagation();
}

export function handleInlineFieldKeyDown(event: KeyboardEvent<HTMLElement>) {
  event.stopPropagation();

  if (event.key === 'Enter') {
    event.currentTarget.blur();
    return;
  }

  if (event.key === 'Escape') {
    event.currentTarget.blur();
  }
}

export function handleInlineFieldFocus(event: FocusEvent<HTMLInputElement>) {
  event.stopPropagation();
  const input = event.currentTarget;
  requestAnimationFrame(() => input.select());
}

export const graphInlineFieldInteractionProps = {
  onPointerDown: stopGraphBubble,
  onPointerUp: stopGraphBubble,
  onClick: stopGraphBubble,
  onDoubleClick: stopGraphBubble,
  onMouseDown: stopGraphBubble,
  onKeyDown: handleInlineFieldKeyDown,
  onFocus: handleInlineFieldFocus,
} as const;

export const graphInlineFieldProps = {
  ...graphInlineFieldInteractionProps,
  onWheel: handleInlineFieldWheel,
} as const;

export { GRAPH_WHEEL_SHIELD_CLASS };
