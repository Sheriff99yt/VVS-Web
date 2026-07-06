const VIEWPORT_PADDING = 8;

/** Clamp a viewport menu to stay on screen (matches NodeContextMenu / edge menu behavior). */
export function paneMenuPosition(
  clientX: number,
  clientY: number,
  menuWidth = 256,
  menuHeight = 240
): { x: number; y: number } {
  let x = clientX;
  let y = clientY;

  if (typeof window !== 'undefined') {
    if (x + menuWidth > window.innerWidth - VIEWPORT_PADDING) {
      x = Math.max(VIEWPORT_PADDING, window.innerWidth - menuWidth - VIEWPORT_PADDING);
    }
    if (y + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      y = Math.max(VIEWPORT_PADDING, window.innerHeight - menuHeight - VIEWPORT_PADDING);
    }
  }

  return { x, y };
}
