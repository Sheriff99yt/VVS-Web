import type { FocusEvent, KeyboardEvent, SyntheticEvent } from 'react';

/** Keep inline node fields from fighting canvas zoom, pan, drag, and selection. */
export function stopGraphBubble(event: SyntheticEvent) {
  event.stopPropagation();
}

export function handleInlineFieldWheel(event: React.WheelEvent<HTMLElement>) {
  event.preventDefault();
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
  requestAnimationFrame(() => event.currentTarget.select());
}

export const graphInlineFieldProps = {
  onPointerDown: stopGraphBubble,
  onPointerUp: stopGraphBubble,
  onClick: stopGraphBubble,
  onDoubleClick: stopGraphBubble,
  onMouseDown: stopGraphBubble,
  onWheel: handleInlineFieldWheel,
  onKeyDown: handleInlineFieldKeyDown,
  onFocus: handleInlineFieldFocus,
} as const;
