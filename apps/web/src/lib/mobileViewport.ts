/** Narrow-viewport and coarse-pointer helpers for tablet / phone chrome. */

export const MOBILE_MAX_WIDTH_PX = 768;
export const MOBILE_VIEWPORT_QUERY = `(max-width: ${MOBILE_MAX_WIDTH_PX}px)`;
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

/** React Flow default handle snap radius (fine pointer / mouse). */
export const PIN_CONNECTION_RADIUS_FINE = 20;
/** Magnetic pin snap radius for coarse pointers (touch / stylus). */
export const PIN_CONNECTION_RADIUS_COARSE = 40;

export function isNarrowViewportWidth(width: number): boolean {
  return width <= MOBILE_MAX_WIDTH_PX;
}

/** AI Agent panel stays desktop-only — do not open on narrow viewports. */
export function canOpenAgentPanel(narrowViewport: boolean): boolean {
  return !narrowViewport;
}

export function pinConnectionRadius(coarsePointer: boolean): number {
  return coarsePointer ? PIN_CONNECTION_RADIUS_COARSE : PIN_CONNECTION_RADIUS_FINE;
}
