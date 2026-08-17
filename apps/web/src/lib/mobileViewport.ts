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

/** Desktop / fine-pointer TopNav icon button (14px icon + p-1.5). */
export const TOPNAV_ICON_BTN_FINE =
  'p-1.5 rounded text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900 transition-colors';

/** Coarse-pointer / mobile TopNav icon button: 44px hit, same chrome. */
export const TOPNAV_ICON_BTN_COARSE =
  'p-2.5 min-w-11 min-h-11 inline-flex items-center justify-center rounded text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900 transition-colors';

export function topNavIconButtonClass(coarseOrMobile: boolean): string {
  return coarseOrMobile ? TOPNAV_ICON_BTN_COARSE : TOPNAV_ICON_BTN_FINE;
}

/** View-tab icon buttons in TopNav (Canvas / Library / Packs). Desktop padding unchanged. */
export function topNavViewTabButtonClass(coarseOrMobile: boolean): string {
  return coarseOrMobile
    ? 'px-3 py-2.5 min-w-11 min-h-11 inline-flex items-center justify-center'
    : 'px-2.5 py-1.5';
}
