/** Touch-end has zero active touches. Cancellation/multi-touch must never spawn. */
export function connectionEndPoint(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
  if ('touches' in event) {
    if (event.type === 'touchcancel' || event.touches.length > 0 || event.changedTouches.length !== 1) return null;
    const touch = event.changedTouches[0];
    return touch && Number.isFinite(touch.clientX) && Number.isFinite(touch.clientY) ? { x: touch.clientX, y: touch.clientY } : null;
  }
  return Number.isFinite(event.clientX) && Number.isFinite(event.clientY) ? { x: event.clientX, y: event.clientY } : null;
}
