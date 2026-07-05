import { useEffect, type RefObject } from 'react';

/** React Flow skips zoom/pan/drag when the event target is inside these classes. */
export const GRAPH_WHEEL_SHIELD_CLASS = 'nowheel nopan nodrag';

/**
 * Non-passive wheel capture — React Flow zoom uses document-level listeners;
 * `onWheel` + preventDefault alone is not always enough.
 */
export function useBlockCanvasWheel(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const blockWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    el.addEventListener('wheel', blockWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', blockWheel, { capture: true });
  }, [ref]);
}
