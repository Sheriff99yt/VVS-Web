import { useEffect, type RefObject } from 'react';

/** React Flow skips zoom/pan/drag when the event target is inside these classes. */
export const GRAPH_WHEEL_SHIELD_CLASS = 'nowheel nopan nodrag';

export const PANEL_SCROLL_ATTR = 'data-panel-scroll';

function findPanelScrollHost(root: HTMLElement, target: EventTarget | null): HTMLElement | null {
  if (target instanceof HTMLElement) {
    const fromTarget = target.closest(`[${PANEL_SCROLL_ATTR}]`);
    if (fromTarget instanceof HTMLElement && root.contains(fromTarget)) return fromTarget;
  }
  const fallback = root.querySelector(`[${PANEL_SCROLL_ATTR}]`);
  return fallback instanceof HTMLElement ? fallback : null;
}

function canScrollVertically(el: HTMLElement, deltaY: number): boolean {
  if (el.scrollHeight <= el.clientHeight) return false;
  if (deltaY < 0) return el.scrollTop > 0;
  if (deltaY > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  return false;
}

/**
 * Non-passive wheel capture — React Flow zoom uses document-level listeners;
 * scroll the panel's overflow region when hovered instead of zooming the canvas.
 */
export function useBlockCanvasWheel(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const blockWheel = (event: WheelEvent) => {
      const scrollHost = findPanelScrollHost(el, event.target);
      if (scrollHost && canScrollVertically(scrollHost, event.deltaY)) {
        scrollHost.scrollTop += event.deltaY;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    el.addEventListener('wheel', blockWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', blockWheel, { capture: true });
  }, [ref]);
}
